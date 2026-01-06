import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsUUID,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { AccountType } from '../../database/entities/account.entity';

export class CreateAccountDto {
  @ApiProperty({ example: 'Conta Nubank' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Nubank', required: false })
  @IsOptional()
  @IsString()
  bank?: string;

  @ApiProperty({ enum: AccountType, example: AccountType.CHECKING })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiProperty({ example: 10000.0, description: 'Saldo inicial da conta' })
  @IsNumber()
  initialBalance: number;

  @ApiProperty({ example: 'uuid-do-perfil' })
  @IsUUID()
  profileId: string;
}
