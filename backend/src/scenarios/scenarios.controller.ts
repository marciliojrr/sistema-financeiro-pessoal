import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ScenariosService } from './scenarios.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('scenarios')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('scenarios')
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @Post()
  create(@Request() req, @Body() createScenarioDto: CreateScenarioDto) {
    return this.scenariosService.create(req.user.userId, createScenarioDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.scenariosService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.scenariosService.findOne(id, req.user.userId);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.scenariosService.remove(id, req.user.userId);
  }

  @Get(':id/summary')
  getSummary(@Request() req, @Param('id') id: string) {
    return this.scenariosService.getSummary(id, req.user.userId);
  }

  @Get(':id/comparison')
  getComparison(@Request() req, @Param('id') id: string) {
    return this.scenariosService.getComparison(id, req.user.userId);
  }

  @Get(':id/suggestions')
  getSmartSuggestions(
    @Request() req,
    @Param('id') id: string,
    @Query('purchaseAmount') purchaseAmount?: string,
    @Query('installments') installments?: string,
  ) {
    return this.scenariosService.getSmartSuggestions(
      id,
      req.user.userId,
      purchaseAmount ? parseFloat(purchaseAmount) : undefined,
      installments ? parseInt(installments, 10) : undefined,
    );
  }
}

