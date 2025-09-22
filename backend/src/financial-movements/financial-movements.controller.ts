import { Controller, Post, Body, Get, Query, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FinancialMovementsService } from './financial-movements.service';
import { CreateFinancialMovementDto } from './dto/create-financial-movement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
        console.log('Query Params:', query);
        console.log('User ID:', req.user.userId);
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
}
