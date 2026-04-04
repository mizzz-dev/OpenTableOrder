'use client';

import { HourlySeatOccupancy } from '../../../features/business-dashboard/types';

interface BusinessDashboardHourlyOccupancyChartCardProps {
  title: string;
  data: HourlySeatOccupancy[];
}

export function BusinessDashboardHourlyOccupancyChartCard({
  title,
  data,
}: BusinessDashboardHourlyOccupancyChartCardProps): JSX.Element {
  return (
    <section>
      <h2>{title}</h2>
      <ul>
        {data.map((item) => (
          <li key={item.label}>
            <strong>{item.label}</strong> - 稼働分: {item.occupancyMinutes} / 稼働率:{' '}
            {(item.seatOccupancyRate * 100).toFixed(1)}%
          </li>
        ))}
      </ul>
    </section>
  );
}
