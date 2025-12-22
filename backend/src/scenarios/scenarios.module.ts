import { Module } from '@nestjs/common';
import { ScenariosService } from './scenarios.service';
import { ScenariosController } from './scenarios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialScenario } from '../database/entities/financial-scenario.entity';
import { Profile } from '../database/entities/profile.entity';
import { FinancialMovement } from '../database/entities/financial-movement.entity';

import { RecurringTransaction } from '../database/entities/recurring-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinancialScenario,
      Profile,
      FinancialMovement,
      RecurringTransaction,
    ]),
  ],
  controllers: [ScenariosController],
  providers: [ScenariosService],
  exports: [ScenariosService],
})
export class ScenariosModule {}
