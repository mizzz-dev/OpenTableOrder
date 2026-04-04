import { Module } from '@nestjs/common';
import { BusinessDashboardController } from './business-dashboard.controller';
import { BusinessDashboardService } from './business-dashboard.service';

@Module({
  controllers: [BusinessDashboardController],
  providers: [BusinessDashboardService],
})
export class BusinessDashboardModule {}
