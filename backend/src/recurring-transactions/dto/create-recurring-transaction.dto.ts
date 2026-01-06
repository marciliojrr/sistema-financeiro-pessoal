import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsUUID,
  IsDateString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { MovementType } from '../../database/entities/financial-movement.entity';
import { RecurrenceFrequency } from '../../database/entities/recurring-transaction.entity';

export class CreateRecurringTransactionDto {
  @ApiProperty({ example: 'Aluguel do Apartamento' })
  @IsString()
  description: string;

  @ApiProperty({ example: 2500.0 })
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: MovementType, example: MovementType.EXPENSE })
  @IsEnum(MovementType)
  type: MovementType;

  @ApiProperty({
    enum: RecurrenceFrequency,
    example: RecurrenceFrequency.MONTHLY,
  })
  @IsEnum(RecurrenceFrequency)
  frequency: RecurrenceFrequency;

  @ApiProperty({ example: '2023-10-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-10-01', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: 'uuid-categoria' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'uuid-perfil' })
  @IsUUID()
  profileId: string;

  @ApiProperty({ example: 'uuid-reserva', required: false })
  @IsOptional()
  @IsUUID()
  reserveId?: string;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Se true, não gera lançamentos retroativos para datas passadas',
  })
  @IsOptional()
  @IsBoolean()
  skipPastRuns?: boolean;
}
