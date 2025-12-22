import { Controller, Get, Query, Res, UseGuards, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

@ApiTags('reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard-summary')
  async getDashboardSummary(
    @Req() req,
    @Query('profileId') profileId?: string,
  ) {
    return this.reportsService.getDashboardSummary(req.user.userId, profileId);
  }

  @Get('monthly-balance')
  async getMonthlyBalance(
    @Req() req,
    @Query('month') month: number,
    @Query('year') year: number,
    @Query('profileId') profileId?: string,
  ) {
    return this.reportsService.getMonthlyBalance(
      req.user.userId,
      month,
      year,
      profileId,
    );
  }

  @Get('expenses-by-category')
  async getExpensesByCategory(
    @Req() req,
    @Query('month') month: number,
    @Query('year') year: number,
    @Query('isFixed') isFixed?: string,
    @Query('profileId') profileId?: string,
  ) {
    // Parse isFixed boolean from string query param if present
    const isFixedBool = isFixed === undefined ? undefined : isFixed === 'true';
    return this.reportsService.getExpensesByCategory(
      req.user.userId,
      month,
      year,
      isFixedBool,
      profileId,
    );
  }

  @Get('budget-planning')
  async getBudgetPlanning(
    @Req() req,
    @Query('month') month: number,
    @Query('year') year: number,
    @Query('profileId') profileId?: string,
  ) {
    return this.reportsService.getBudgetPlanning(
      req.user.userId,
      month,
      year,
      profileId,
    );
  }

  @Get('reserves-progress')
  async getReservesProgress(
    @Req() req,
    @Query('profileId') profileId?: string,
  ) {
    return this.reportsService.getReservesProgress(req.user.userId, profileId);
  }

  @Get('export/csv')
  async exportCsv(
    @Req() req,
    @Res() res: Response,
    @Query('profileId') profileId?: string,
  ) {
    const csv = await this.reportsService.exportData(
      req.user.userId,
      profileId,
    );

    res.header('Content-Type', 'text/csv');
    res.header(
      'Content-Disposition',
      'attachment; filename=financial_report.csv',
    );
    res.send(csv);
  }
}
