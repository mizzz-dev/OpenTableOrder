import { Module } from '@nestjs/common';
import { BusinessDashboardModule } from './modules/business-dashboard/business-dashboard.module';

@Module({
  imports: [BusinessDashboardModule],
})
export class AppModule {}
