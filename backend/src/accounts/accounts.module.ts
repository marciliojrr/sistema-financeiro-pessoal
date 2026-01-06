import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../database/entities/account.entity';
import { Profile } from '../database/entities/profile.entity';
import { FinancialMovement } from '../database/entities/financial-movement.entity';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Profile, FinancialMovement]),
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
