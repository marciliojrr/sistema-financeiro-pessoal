import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialMovementsService } from './financial-movements.service';
import { FinancialMovementsController } from './financial-movements.controller';
import { FinancialMovement } from '../database/entities/financial-movement.entity';
import { Profile } from '../database/entities/profile.entity';
import { FinancialCategory } from '../database/entities/financial-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialMovement, Profile, FinancialCategory])
  ],
  providers: [FinancialMovementsService],
  controllers: [FinancialMovementsController],
  exports: [FinancialMovementsService]
})
export class FinancialMovementsModule {}
