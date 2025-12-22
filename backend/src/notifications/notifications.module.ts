import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from '../database/entities/notification.entity';
import { Profile } from '../database/entities/profile.entity';
import { Budget } from '../database/entities/budget.entity';
import { FinancialMovement } from '../database/entities/financial-movement.entity';
import { Reserve } from '../database/entities/reserve.entity';
import { Debt } from '../database/entities/debt.entity';
import { CronService } from './cron.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      Profile,
      Budget,
      FinancialMovement,
      Reserve,
      Debt,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, CronService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
