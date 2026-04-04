import { Controller, Get, Query } from '@nestjs/common';
import { BusinessDashboardService } from './business-dashboard.service';
import { BusinessDashboardQueryDto } from './dto/business-dashboard-query.dto';
import { BusinessDashboardResponse } from '../../../../../packages/shared/src/business-dashboard';

@Controller('business-dashboard')
export class BusinessDashboardController {
  constructor(private readonly businessDashboardService: BusinessDashboardService) {}

  @Get('hourly-seat-occupancy')
  getHourlySeatOccupancy(
    @Query() query: BusinessDashboardQueryDto,
  ): BusinessDashboardResponse {
    return this.businessDashboardService.getDashboard(query);
  }
}
