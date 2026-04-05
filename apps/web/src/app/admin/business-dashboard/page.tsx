'use client';

import { BusinessDashboardHourlyOccupancyChartCard } from '../../../components/admin/business-dashboard/business-dashboard-hourly-occupancy-chart-card';
import { BusinessDashboardHourlyAverageTicketSizeChartCard } from '../../../components/admin/business-dashboard/business-dashboard-hourly-average-ticket-size-chart-card';
import { BusinessDashboardOperationsKpiCard } from '../../../components/admin/business-dashboard/business-dashboard-operations-kpi-card';
import { useBusinessDashboard } from '../../../features/business-dashboard/hooks';

export default function BusinessDashboardPage(): JSX.Element {
  const { data, isLoading, errorMessage } = useBusinessDashboard({
    storeId: 'store-001',
    date: '2026-04-04',
    timezone: 'Asia/Tokyo',
  });

  if (isLoading) {
    return <main>読み込み中...</main>;
  }

  if (errorMessage !== null) {
    return <main>エラー: {errorMessage}</main>;
  }

  return (
    <main>
      <h1>ビジネスダッシュボード</h1>
      <BusinessDashboardOperationsKpiCard
        title="運営KPI"
        data={
          data?.operationsKpi ?? { averageStayMinutes: 0, tableTurnoverRate: 0 }
        }
      />
      <BusinessDashboardHourlyOccupancyChartCard
        title="時間帯別客席稼働率"
        data={data?.hourlySeatOccupancyRate ?? []}
      />
      <BusinessDashboardHourlyAverageTicketSizeChartCard
        title="時間帯別平均客単価"
        description="実来店人数と売上から算出した時間帯別の客単価です"
        data={data?.hourlyAverageTicketSize ?? []}
      />
    </main>
  );
}
