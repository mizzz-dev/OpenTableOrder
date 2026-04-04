import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { BusinessDashboardModule } from './modules/business-dashboard/business-dashboard.module';

@Module({
  imports: [PrismaModule, BusinessDashboardModule],
})
export class AppModule {}
