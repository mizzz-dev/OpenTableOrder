'use client';

import { BusinessDashboardHourlyOccupancyChartCard } from '../../../components/admin/business-dashboard/business-dashboard-hourly-occupancy-chart-card';
import { useBusinessDashboard } from '../../../features/business-dashboard/hooks';

export default function BusinessDashboardPage(): JSX.Element {
  const { data, isLoading, errorMessage } = useBusinessDashboard({
    storeId: 'store-001',
    date: '2026-04-04',
  });

  if (isLoading) {
    return <main>Loading...</main>;
  }

  if (errorMessage !== null) {
    return <main>Error: {errorMessage}</main>;
  }

  return (
    <main>
      <h1>Business Dashboard</h1>
      <BusinessDashboardHourlyOccupancyChartCard
        title="時間帯別客席稼働率"
        data={data?.hourlySeatOccupancyRate ?? []}
      />
    </main>
  );
}
