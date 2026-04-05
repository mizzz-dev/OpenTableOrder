'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { HourlyAverageTicketSize } from '../../../features/business-dashboard/types';

interface BusinessDashboardHourlyAverageTicketSizeChartCardProps {
  title: string;
  description: string;
  data: HourlyAverageTicketSize[];
}

function formatYen(value: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value);
}

export function BusinessDashboardHourlyAverageTicketSizeChartCard({
  title,
  description,
  data,
}: BusinessDashboardHourlyAverageTicketSizeChartCardProps): JSX.Element {
  return (
    <section>
      <h2>{title}</h2>
      <p>{description}</p>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={formatYen} width={90} />
            <Tooltip
              formatter={(value: number | string): string => {
                const numericValue =
                  typeof value === 'number' ? value : Number(value);
                return formatYen(Number.isFinite(numericValue) ? numericValue : 0);
              }}
              labelFormatter={(label: string): string => `${label}`}
            />
            <Bar dataKey="averageTicketSize" fill="#8884d8" name="平均客単価" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
