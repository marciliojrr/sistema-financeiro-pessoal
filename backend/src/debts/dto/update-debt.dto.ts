import { PartialType } from '@nestjs/swagger';
import { CreateDebtDto } from './create-debt.dto';
import { IsBoolean, IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDebtDto extends PartialType(CreateDebtDto) {
  @ApiPropertyOptional({ description: 'Se a dívida está ativa' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Valor restante (atualização manual)' })
  @IsNumber()
  @IsOptional()
  remainingAmount?: number;

  @ApiPropertyOptional({ description: 'Parcelas pagas (atualização manual)' })
  @IsNumber()
  @IsOptional()
  paidInstallments?: number;
}
