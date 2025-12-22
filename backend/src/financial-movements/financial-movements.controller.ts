import { Controller, Post, Body, Get, Patch, Query, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FinancialMovementsService } from './financial-movements.service';
import { CreateFinancialMovementDto } from './dto/create-financial-movement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateFinancialMovementDto } from './dto/update-financial-movement.dto';

@ApiTags('financial-movements')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('financial-movements')
export class FinancialMovementsController {
    constructor(private readonly movementService: FinancialMovementsService) {}

    @Post()
    create(@Req() req, @Body() dto: CreateFinancialMovementDto) {
        return this.movementService.create(dto, req.user.userId);
    }

    @Get()
    findAll(@Req() req, @Query() query) {
        return this.movementService.findAll(req.user.userId, query);
    }

    @Get(':id')
    findOne(@Req() req, @Param('id') id: string) {
        return this.movementService.findOne(id, req.user.userId);
    }

    @Delete(':id')
    remove(@Req() req, @Param('id') id: string) {
        return this.movementService.remove(id, req.user.userId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdateFinancialMovementDto, @Req() req) {
        return this.movementService.update(id, updateDto, req.user.userId);
    }
}
