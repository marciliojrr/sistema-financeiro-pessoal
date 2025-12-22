import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservesService } from './reserves.service';
import { ReservesController } from './reserves.controller';
import { Reserve } from '../database/entities/reserve.entity';
import { Profile } from '../database/entities/profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reserve, Profile])],
  controllers: [ReservesController],
  providers: [ReservesService],
  exports: [ReservesService],
})
export class ReservesModule {}
