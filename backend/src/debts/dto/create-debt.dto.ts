import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsOptional,
  IsDateString,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDebtDto {
  @ApiProperty({ description: 'ID do perfil' })
  @IsUUID()
  @IsNotEmpty()
  profileId: string;

  @ApiPropertyOptional({ description: 'ID da categoria' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ description: 'Descrição da dívida' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Valor total da dívida' })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({ description: 'Total de parcelas' })
  @IsNumber()
  @Min(1)
  totalInstallments: number;

  @ApiProperty({ description: 'Data de início' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Dia do vencimento' })
  @IsNumber()
  @Min(1)
  @Max(31)
  dueDateDay: number;

  @ApiPropertyOptional({ description: 'Taxa de juros mensal (%)' })
  @IsNumber()
  @IsOptional()
  interestRate?: number;
}
