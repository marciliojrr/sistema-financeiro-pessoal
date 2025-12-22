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
import { DebtsService } from './debts.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('debts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Post()
  create(@Req() req, @Body() createDebtDto: CreateDebtDto) {
    return this.debtsService.create(req.user.userId, createDebtDto);
  }

  @Get()
  findAll(@Req() req, @Query() query: { profileId?: string }) {
    return this.debtsService.findAll(req.user.userId, query);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.debtsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Req() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDebtDto: UpdateDebtDto,
  ) {
    return this.debtsService.update(id, req.user.userId, updateDebtDto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.debtsService.remove(id, req.user.userId);
  }
}
