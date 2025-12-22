import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@Req() req, @Query('profileId') profileId?: string) {
    return this.dashboardService.getSummary(req.user.userId, profileId);
  }

  @Get('charts/category')
  getCategoryCharts(@Req() req, @Query('profileId') profileId?: string) {
    return this.dashboardService.getCategoryCharts(req.user.userId, profileId);
  }

  @Get('charts/evolution')
  getEvolutionCharts(@Req() req, @Query('profileId') profileId?: string) {
    return this.dashboardService.getEvolutionCharts(req.user.userId, profileId);
  }
}
