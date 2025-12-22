import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { MovementType } from '../../database/entities/financial-movement.entity';

export class CreateFinancialMovementDto {
  @ApiProperty({ example: 2500.5, description: 'Valor da movimentação' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    example: 'Salário mensal',
    description: 'Descrição da movimentação',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 'income',
    enum: MovementType,
    description: 'Tipo: receita ou despesa',
  })
  @IsEnum(MovementType)
  type: MovementType;

  @ApiProperty({
    example: '2025-09-16',
    description: 'Data da movimentação (YYYY-MM-DD)',
  })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Observações adicionais', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'uuid-do-perfil' })
  @IsString()
  @IsNotEmpty()
  profileId: string;

  @ApiProperty({ example: 'uuid-da-categoria' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    example: 'uuid-da-divida',
    required: false,
    description: 'Se for pagamento de dívida',
  })
  @IsOptional()
  @IsString()
  debtId?: string;

  @ApiProperty({
    example: 'uuid-do-cenario',
    required: false,
    description: 'Se for movimento de simulação',
  })
  @IsOptional()
  @IsString()
  scenarioId?: string;
}
