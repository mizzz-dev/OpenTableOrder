'use client';

import { BusinessDashboardHourlyOccupancyChartCard } from '../../../components/admin/business-dashboard/business-dashboard-hourly-occupancy-chart-card';
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
    </main>
  );
}
