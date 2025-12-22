import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebtsService } from './debts.service';
import { DebtsController } from './debts.controller';
import { Debt } from '../database/entities/debt.entity';
import { Profile } from '../database/entities/profile.entity';
import { FinancialCategory } from '../database/entities/financial-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Debt, Profile, FinancialCategory])],
  controllers: [DebtsController],
  providers: [DebtsService],
  exports: [DebtsService],
})
export class DebtsModule {}
