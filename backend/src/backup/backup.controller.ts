import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { BackupService } from './backup.service';
import type { BackupData } from './backup.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('backup')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('export')
  async exportBackup(
    @Request() req: { user: { userId: string } },
    @Query('profileId') profileId: string,
    @Res() res: Response,
  ) {
    const backup = await this.backupService.exportBackup(
      req.user.userId,
      profileId,
    );

    const today = new Date().toISOString().split('T')[0];
    const filename = 'backup_' + profileId + '_' + today + '.json';

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.send(JSON.stringify(backup, null, 2));
  }

  @Post('restore')
  async restoreBackup(
    @Request() req: { user: { userId: string } },
    @Query('profileId') profileId: string,
    @Body() backup: BackupData,
  ) {
    return this.backupService.restoreBackup(req.user.userId, profileId, backup);
  }
}
