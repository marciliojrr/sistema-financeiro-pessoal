import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { Profile } from '../database/entities/profile.entity';
import { User } from '../database/entities/user.entity';
import { FinancialCategory } from '../database/entities/financial-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, User, FinancialCategory])],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
