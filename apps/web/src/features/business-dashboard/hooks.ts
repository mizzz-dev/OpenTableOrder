import { useMemo, useEffect, useState } from 'react';
import { fetchBusinessDashboard } from './api';
import {
  BusinessDashboardQuery,
  BusinessDashboardResponse,
} from './types';

interface UseBusinessDashboardResult {
  data: BusinessDashboardResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
}

export function useBusinessDashboard(
  query: BusinessDashboardQuery,
): UseBusinessDashboardResult {
  const [data, setData] = useState<BusinessDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        storeId: query.storeId,
        date: query.date,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        days: query.days,
        timezone: query.timezone,
      }),
    [query.date, query.dateFrom, query.dateTo, query.days, query.storeId, query.timezone],
  );

  useEffect(() => {
    let isActive = true;

    async function load(): Promise<void> {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextData = await fetchBusinessDashboard(query);
        if (isActive) {
          setData(nextData);
        }
      } catch (error: unknown) {
        if (isActive) {
          const message =
            error instanceof Error ? error.message : 'Unknown error occurred.';
          setErrorMessage(message);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, [query, queryKey]);

  return { data, isLoading, errorMessage };
}
