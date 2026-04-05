'use client';

import { OperationsKpi } from '../../../features/business-dashboard/types';

interface BusinessDashboardOperationsKpiCardProps {
  title: string;
  data: OperationsKpi;
}

export function BusinessDashboardOperationsKpiCard({
  title,
  data,
}: BusinessDashboardOperationsKpiCardProps): JSX.Element {
  return (
    <section>
      <h2>{title}</h2>
      <ul>
        <li>平均滞在時間: {Math.round(data.averageStayMinutes)}分</li>
        <li>テーブル回転率: {data.tableTurnoverRate.toFixed(1)}回</li>
      </ul>
    </section>
  );
}
