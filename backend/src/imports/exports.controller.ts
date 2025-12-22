import { Controller, Get, Query, Res, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExportsService } from './exports.service';

@ApiTags('Exports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('csv')
  @ApiOperation({ summary: 'Exportar transações para CSV' })
  @ApiQuery({ name: 'profileId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async exportCsv(
    @Req() req,
    @Res() res: Response,
    @Query('profileId') profileId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      profileId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const csvData = await this.exportsService.exportCsv(
      req.user.userId,
      filters,
    );

    res.header('Content-Type', 'text/csv');
    res.attachment(`transacoes_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csvData);
  }
}
