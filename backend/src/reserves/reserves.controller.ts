import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReservesService } from './reserves.service';
import { CreateReserveDto } from './dto/create-reserve.dto';
import { UpdateReserveDto } from './dto/update-reserve.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('reserves')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('reserves')
export class ReservesController {
  constructor(private readonly reservesService: ReservesService) {}

  @Post()
  create(@Req() req, @Body() createReserveDto: CreateReserveDto) {
    return this.reservesService.create(req.user.userId, createReserveDto);
  }

  @Get()
  findAll(@Req() req, @Query('profileId') profileId?: string) {
    return this.reservesService.findAll(req.user.userId, profileId);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.reservesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Req() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReserveDto: UpdateReserveDto,
  ) {
    return this.reservesService.update(id, req.user.userId, updateReserveDto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.reservesService.remove(id, req.user.userId);
  }
}
