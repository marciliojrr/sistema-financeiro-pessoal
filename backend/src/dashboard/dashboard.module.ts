import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialMovement } from '../database/entities/financial-movement.entity';
import { Budget } from '../database/entities/budget.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FinancialMovement, Budget])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
