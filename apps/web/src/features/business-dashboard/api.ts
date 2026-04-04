import {
  BusinessDashboardQuery,
  BusinessDashboardResponse,
} from './types';

export async function fetchBusinessDashboard(
  query: BusinessDashboardQuery,
): Promise<BusinessDashboardResponse> {
  const params = new URLSearchParams({
    storeId: query.storeId,
    date: query.date,
  });

  const response = await fetch(
    `http://localhost:3001/api/business-dashboard/hourly-seat-occupancy?${params.toString()}`,
    {
      method: 'GET',
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to fetch business dashboard data.');
  }

  return (await response.json()) as BusinessDashboardResponse;
}
