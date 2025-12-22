import { Module } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { ImportsController } from './imports.controller';
import { ExportsService } from './exports.service';
import { ExportsController } from './exports.controller';
import { FinancialMovementsModule } from '../financial-movements/financial-movements.module';
import { CategoriesModule } from '../categories/categories.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    FinancialMovementsModule,
    CategoriesModule,
    ProfilesModule,
    AuditLogsModule,
  ],
  controllers: [ImportsController, ExportsController],
  providers: [ImportsService, ExportsService],
})
export class ImportsModule {}
