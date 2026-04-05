import { Injectable } from '@nestjs/common';
import {
  BusinessDashboardResponse,
  HourlySeatOccupancy,
  OperationsKpi,
} from '../../../../../packages/shared/src/business-dashboard';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessDashboardQueryDto } from './dto/business-dashboard-query.dto';

interface PeriodRange {
  startUtc: Date;
  endUtc: Date;
  dateFrom: string;
  dateTo: string;
  timezone: string;
}

interface SessionRange {
  start: Date;
  end: Date;
}

interface DashboardSession {
  seatedAt: Date | null;
  checkedOutAt: Date | null;
  closedAt: Date | null;
}

@Injectable()
export class BusinessDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(query: BusinessDashboardQueryDto): Promise<BusinessDashboardResponse> {
    const period = this.resolvePeriod(query);
    const [totalSeats, totalTables, sessions] = await Promise.all([
      this.getTotalSeats(query.storeId),
      this.getTotalTables(query.storeId),
      this.prisma.tableSession.findMany({
        where: {
          storeId: query.storeId,
          seatedAt: { not: null, lt: period.endUtc },
          OR: [
            { checkedOutAt: { gt: period.startUtc } },
            { closedAt: { gt: period.startUtc } },
          ],
        },
        select: {
          seatedAt: true,
          checkedOutAt: true,
          closedAt: true,
        },
      }),
    ]);
    const buckets = this.createHourlyBuckets();
    const hourOccurrences = this.createHourlyBuckets(0);

    this.accumulateHourOccurrences(period, hourOccurrences);

    for (const session of sessions) {
      const sessionRange = this.toSessionRange(
        session.seatedAt,
        session.checkedOutAt,
        session.closedAt,
      );
      if (sessionRange === null) {
        continue;
      }

      this.accumulateOccupancyMinutes(sessionRange, period, buckets);
    }

    const hourlySeatOccupancyRate: HourlySeatOccupancy[] = Object.entries(buckets).map(
      ([label, occupancyMinutes]): HourlySeatOccupancy => {
        const hourCount = hourOccurrences[label] ?? 0;
        const denominator = totalSeats * 60 * hourCount;
        const seatOccupancyRate = denominator === 0 ? 0 : (occupancyMinutes / denominator) * 100;

        return {
          label,
          occupancyMinutes: this.roundToTwoDecimals(occupancyMinutes),
          seatOccupancyRate: this.roundToTwoDecimals(seatOccupancyRate),
        };
      },
    );

    return {
      storeId: query.storeId,
      date: period.dateFrom,
      hourlySeatOccupancyRate,
      operationsKpi: this.calculateOperationsKpi(sessions, period, totalTables),
    };
  }

  private async getTotalSeats(storeId: string): Promise<number> {
    const aggregate = await this.prisma.table.aggregate({
      where: { storeId },
      _sum: { seatCapacity: true },
    });

    return aggregate._sum.seatCapacity ?? 0;
  }

  private async getTotalTables(storeId: string): Promise<number> {
    return this.prisma.table.count({
      where: { storeId },
    });
  }

  private calculateOperationsKpi(
    sessions: DashboardSession[],
    period: PeriodRange,
    totalTables: number,
  ): OperationsKpi {
    const completedDurations: number[] = [];

    for (const session of sessions) {
      if (session.seatedAt === null) {
        continue;
      }

      const endAt = this.resolveSessionEndAt(session.checkedOutAt, session.closedAt);
      if (endAt === null || endAt <= session.seatedAt) {
        continue;
      }

      if (endAt < period.startUtc || endAt >= period.endUtc) {
        continue;
      }

      completedDurations.push((endAt.getTime() - session.seatedAt.getTime()) / (60 * 1000));
    }

    const averageStayMinutes =
      completedDurations.length === 0
        ? 0
        : completedDurations.reduce((sum, duration) => sum + duration, 0) /
          completedDurations.length;
    const tableTurnoverRate =
      totalTables === 0 ? 0 : completedDurations.length / totalTables;

    return {
      averageStayMinutes: this.roundToTwoDecimals(averageStayMinutes),
      tableTurnoverRate: this.roundToTwoDecimals(tableTurnoverRate),
    };
  }

  private toSessionRange(
    seatedAt: Date | null,
    checkedOutAt: Date | null,
    closedAt: Date | null,
  ): SessionRange | null {
    if (seatedAt === null) {
      return null;
    }

    const endAt = this.resolveSessionEndAt(checkedOutAt, closedAt);
    if (endAt === null || endAt <= seatedAt) {
      return null;
    }

    return { start: seatedAt, end: endAt };
  }

  private resolveSessionEndAt(
    checkedOutAt: Date | null,
    closedAt: Date | null,
  ): Date | null {
    return checkedOutAt ?? closedAt;
  }

  private resolvePeriod(query: BusinessDashboardQueryDto): PeriodRange {
    const timezone = query.timezone ?? 'UTC';

    if (query.dateFrom !== undefined && query.dateTo !== undefined) {
      const startUtc = this.localDateToUtc(query.dateFrom, timezone);
      const endUtc = this.localDateToUtc(this.addDays(query.dateTo, 1), timezone);
      return {
        startUtc,
        endUtc,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        timezone,
      };
    }

    if (query.dateFrom !== undefined && query.days !== undefined) {
      const days = this.toPositiveInt(query.days);
      const dateTo = this.addDays(query.dateFrom, days - 1);
      return {
        startUtc: this.localDateToUtc(query.dateFrom, timezone),
        endUtc: this.localDateToUtc(this.addDays(dateTo, 1), timezone),
        dateFrom: query.dateFrom,
        dateTo,
        timezone,
      };
    }

    if (query.date !== undefined) {
      return {
        startUtc: this.localDateToUtc(query.date, timezone),
        endUtc: this.localDateToUtc(this.addDays(query.date, 1), timezone),
        dateFrom: query.date,
        dateTo: query.date,
        timezone,
      };
    }

    const today = this.formatLocalDate(new Date(), timezone);
    return {
      startUtc: this.localDateToUtc(today, timezone),
      endUtc: this.localDateToUtc(this.addDays(today, 1), timezone),
      dateFrom: today,
      dateTo: today,
      timezone,
    };
  }

  private accumulateOccupancyMinutes(
    session: SessionRange,
    period: PeriodRange,
    buckets: Record<string, number>,
  ): void {
    const effectiveStart = session.start > period.startUtc ? session.start : period.startUtc;
    const effectiveEnd = session.end < period.endUtc ? session.end : period.endUtc;

    if (effectiveEnd <= effectiveStart) {
      return;
    }

    let cursor = new Date(effectiveStart);

    while (cursor < effectiveEnd) {
      const hourStart = this.floorToUtcHour(cursor);
      const nextHour = new Date(hourStart.getTime() + 60 * 60 * 1000);
      const segmentStart = cursor > hourStart ? cursor : hourStart;
      const segmentEnd = effectiveEnd < nextHour ? effectiveEnd : nextHour;
      const minutes = (segmentEnd.getTime() - segmentStart.getTime()) / (60 * 1000);

      if (minutes > 0) {
        const label = this.getHourLabel(hourStart, period.timezone);
        buckets[label] += minutes;
      }

      cursor = segmentEnd;
    }
  }

  private accumulateHourOccurrences(
    period: PeriodRange,
    hourOccurrences: Record<string, number>,
  ): void {
    let cursor = this.floorToUtcHour(period.startUtc);

    while (cursor < period.endUtc) {
      const nextHour = new Date(cursor.getTime() + 60 * 60 * 1000);
      const segmentStart = period.startUtc > cursor ? period.startUtc : cursor;
      const segmentEnd = period.endUtc < nextHour ? period.endUtc : nextHour;

      if (segmentEnd > segmentStart) {
        const label = this.getHourLabel(cursor, period.timezone);
        hourOccurrences[label] += 1;
      }

      cursor = nextHour;
    }
  }

  private floorToUtcHour(date: Date): Date {
    const floored = new Date(date);
    floored.setUTCMinutes(0, 0, 0);
    return floored;
  }

  private getHourLabel(date: Date, timezone: string): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const hourPart = parts.find((part) => part.type === 'hour');
    const hour = hourPart?.value ?? '00';

    return `${hour}:00`;
  }

  private localDateToUtc(localDate: string, timezone: string): Date {
    const [year, month, day] = localDate.split('-').map((value) => Number(value));
    const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const offsetMs = this.getTimezoneOffsetMs(utcGuess, timezone);

    return new Date(utcGuess.getTime() - offsetMs);
  }

  private getTimezoneOffsetMs(date: Date, timezone: string): number {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const year = Number(parts.find((part) => part.type === 'year')?.value ?? '0');
    const month = Number(parts.find((part) => part.type === 'month')?.value ?? '1');
    const day = Number(parts.find((part) => part.type === 'day')?.value ?? '1');
    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
    const second = Number(parts.find((part) => part.type === 'second')?.value ?? '0');

    const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    return asUtc - date.getTime();
  }

  private formatLocalDate(date: Date, timezone: string): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return formatter.format(date);
  }

  private addDays(baseDate: string, days: number): string {
    const [year, month, day] = baseDate.split('-').map((value) => Number(value));
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + days);

    return date.toISOString().slice(0, 10);
  }

  private toPositiveInt(value: string): number {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 1) {
      return 1;
    }
    return Math.floor(num);
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private createHourlyBuckets(initialValue = 0): Record<string, number> {
    const buckets: Record<string, number> = {};
    for (let hour = 0; hour < 24; hour += 1) {
      const label = `${hour.toString().padStart(2, '0')}:00`;
      buckets[label] = initialValue;
    }
    return buckets;
  }
}
