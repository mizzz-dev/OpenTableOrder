# business-dashboard: 時間帯別客席稼働率 追加提案

> 現在のリポジトリには `business-dashboard.service.ts` やフロントエンド実装ファイルが存在しないため、
> そのまま適用可能な「差分形式」ではなく、既存プロジェクトに移植できる実装コード案をまとめます。

## 1) バックエンド実装方針

- `TableSession` の実滞在区間 `[seatedAt, checkedOutAt ?? closedAt ?? now]` を有効区間として採用
- 店舗 timezone で時間帯（00:00〜23:00）ごとに滞在分を分配
- 1時間バケットの seat-minutes を合算
- `seatOccupancyRate = occupancyMinutes / (totalSeats * 60)` で算出（0〜1）
- `operationsKpi.hourlySeatOccupancyRate` に格納

### 追加型（バックエンド）

```ts
export interface HourlySeatOccupancyRateItem {
  label: string; // "00:00"〜"23:00"
  occupancyMinutes: number;
  seatOccupancyRate: number; // 0〜1
}
```

### 主要ロジック例（business-dashboard.service.ts）

```ts
import { DateTime } from 'luxon';

interface TableSessionLike {
  seatedAt: Date;
  checkedOutAt: Date | null;
  closedAt: Date | null;
  guestCount?: number | null;
}

interface HourlySeatOccupancyRateItem {
  label: string;
  occupancyMinutes: number;
  seatOccupancyRate: number;
}

private buildHourlySeatOccupancyRate(params: {
  sessions: TableSessionLike[];
  timezone: string;
  totalSeats: number;
  periodStart: Date;
  periodEnd: Date;
}): HourlySeatOccupancyRateItem[] {
  const { sessions, timezone, totalSeats, periodStart, periodEnd } = params;

  const buckets = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    occupancyMinutes: 0,
  }));

  const periodStartTz = DateTime.fromJSDate(periodStart, { zone: timezone });
  const periodEndTz = DateTime.fromJSDate(periodEnd, { zone: timezone });

  for (const session of sessions) {
    const rawStart = DateTime.fromJSDate(session.seatedAt, { zone: timezone });
    const rawEnd = DateTime.fromJSDate(
      session.checkedOutAt ?? session.closedAt ?? new Date(),
      { zone: timezone },
    );

    const start = rawStart < periodStartTz ? periodStartTz : rawStart;
    const end = rawEnd > periodEndTz ? periodEndTz : rawEnd;

    if (end <= start) continue;

    let cursor = start;
    while (cursor < end) {
      const hourStart = cursor.startOf('hour');
      const nextHour = hourStart.plus({ hours: 1 });
      const segmentEnd = end < nextHour ? end : nextHour;

      const minutes = segmentEnd.diff(cursor, 'minutes').minutes;
      if (minutes > 0) {
        buckets[cursor.hour].occupancyMinutes += minutes;
      }

      cursor = segmentEnd;
    }
  }

  const denominator = totalSeats * 60;

  return buckets.map((b) => {
    const rate = denominator > 0 ? b.occupancyMinutes / denominator : 0;
    return {
      label: `${String(b.hour).padStart(2, '0')}:00`,
      occupancyMinutes: Math.round(b.occupancyMinutes),
      seatOccupancyRate: Number(rate.toFixed(4)),
    };
  });
}
```

### operationsKpi への追加例

```ts
const hourlySeatOccupancyRate = this.buildHourlySeatOccupancyRate({
  sessions: tableSessions,
  timezone,
  totalSeats,
  periodStart,
  periodEnd,
});

return {
  ...existingOperationsKpi,
  hourlySeatOccupancyRate,
};
```

---

## 2) フロントエンド実装方針

- `types.ts` に `hourlySeatOccupancyRate` を追加
- `useBusinessDashboard` は既存流用（APIレスポンス型だけ更新）
- `business-dashboard-hourly-occupancy-chart-card.tsx` を新規追加
- `recharts` の `BarChart` で `seatOccupancyRate` を `%` 表示
- 管理画面ダッシュボードにカード配置

### types.ts 追加例

```ts
export interface HourlySeatOccupancyRateItem {
  label: string;
  occupancyMinutes: number;
  seatOccupancyRate: number;
}

export interface OperationsKpi {
  // ...existing fields
  hourlySeatOccupancyRate: HourlySeatOccupancyRateItem[];
}
```

### 新規コンポーネント例

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HourlySeatOccupancyRateItem } from '../types';

type Props = {
  data: HourlySeatOccupancyRateItem[];
};

const percent = (value: number): string => `${(value * 100).toFixed(1)}%`;

export function BusinessDashboardHourlyOccupancyChartCard({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>時間帯別客席稼働率</CardTitle>
        <CardDescription>実滞在時間から算出した時間帯ごとの稼働率です。</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={percent} domain={[0, 1]} />
              <Tooltip
                formatter={(value: number) => [percent(value), '客席稼働率']}
                labelFormatter={(label: string) => `時間帯: ${label}`}
              />
              <Bar dataKey="seatOccupancyRate" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

### ダッシュボード画面組み込み例

```tsx
<BusinessDashboardHourlyOccupancyChartCard
  data={dashboard.operationsKpi.hourlySeatOccupancyRate}
/>
```

---

## 3) 注意点

- `seatedAt` が null のセッションは除外
- 複数日集計時、この実装は「日をまたいだ滞在」を正しく各時間帯へ分配
- `occupancyMinutes` は「座席分」で算出する前提。もし 1 セッション=1卓 で座席数反映が必要なら `minutes * tableSeatCount` に変更
- timezone は DB UTC 保存前提で表示側 timezone に変換して集計する
