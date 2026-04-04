import {
  BusinessDashboardQuery,
  BusinessDashboardResponse,
} from './types';

export async function fetchBusinessDashboard(
  query: BusinessDashboardQuery,
): Promise<BusinessDashboardResponse> {
  const params = new URLSearchParams({
    storeId: query.storeId,
  });

  if (query.date !== undefined) {
    params.set('date', query.date);
  }

  if (query.dateFrom !== undefined) {
    params.set('dateFrom', query.dateFrom);
  }

  if (query.dateTo !== undefined) {
    params.set('dateTo', query.dateTo);
  }

  if (query.days !== undefined) {
    params.set('days', String(query.days));
  }

  if (query.timezone !== undefined) {
    params.set('timezone', query.timezone);
  }

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
