import { Injectable } from '@nestjs/common';
import {
  BusinessDashboardResponse,
  HourlySeatOccupancy,
} from '../../../../../packages/shared/src/business-dashboard';
import { BusinessDashboardQueryDto } from './dto/business-dashboard-query.dto';

@Injectable()
export class BusinessDashboardService {
  getDashboard(query: BusinessDashboardQueryDto): BusinessDashboardResponse {
    const hourlySeatOccupancyRate: HourlySeatOccupancy[] = [
      { label: '10:00', occupancyMinutes: 120, seatOccupancyRate: 0.25 },
      { label: '11:00', occupancyMinutes: 200, seatOccupancyRate: 0.42 },
      { label: '12:00', occupancyMinutes: 330, seatOccupancyRate: 0.69 },
      { label: '13:00', occupancyMinutes: 280, seatOccupancyRate: 0.58 },
    ];

    return {
      storeId: query.storeId,
      date: query.date,
      hourlySeatOccupancyRate,
    };
  }
}
