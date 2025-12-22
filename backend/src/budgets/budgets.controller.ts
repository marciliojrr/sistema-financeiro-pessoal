import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Query,
  Param,
  Delete,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('budgets')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Req() req, @Query() query) {
    return this.budgetsService.findAll(req.user.userId, query);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.budgetsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Req() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.budgetsService.remove(id, req.user.userId);
  }
}
