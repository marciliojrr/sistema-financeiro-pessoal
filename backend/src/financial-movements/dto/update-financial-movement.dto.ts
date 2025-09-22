import { PartialType } from '@nestjs/swagger';
import { CreateFinancialMovementDto } from './create-financial-movement.dto';

export class UpdateFinancialMovementDto extends PartialType(CreateFinancialMovementDto) {}
