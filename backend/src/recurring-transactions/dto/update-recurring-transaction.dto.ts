import { PartialType } from '@nestjs/swagger';
import { CreateRecurringTransactionDto } from './create-recurring-transaction.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRecurringTransactionDto extends PartialType(
  CreateRecurringTransactionDto,
) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
