import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { DataImportService } from './data-import.service';
import { DataImportController } from './data-import.controller';
import { FinancialMovement } from '../database/entities/financial-movement.entity';
import { Profile } from '../database/entities/profile.entity';
import { FinancialCategory } from '../database/entities/financial-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialMovement, Profile, FinancialCategory]),
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  controllers: [DataImportController],
  providers: [DataImportService],
  exports: [DataImportService],
})
export class DataImportModule {}
