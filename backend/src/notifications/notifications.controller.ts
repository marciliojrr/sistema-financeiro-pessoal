import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  findAll(@Req() req, @Query('read') read?: string) {
    return this.notificationsService.findAll(req.user.userId, { read });
  }

  @Patch(':id')
  update(
    @Req() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, req.user.userId, dto);
  }

  @Patch(':id/read')
  markAsRead(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Delete(':id')
  delete(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.delete(id, req.user.userId);
  }
}
