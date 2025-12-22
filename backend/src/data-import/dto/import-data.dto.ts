import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export enum ImportSource {
  CSV = 'csv',
  OPEN_BANKING = 'open_banking',
}

export class ImportDataDto {
  @ApiProperty({ example: 'uuid-do-perfil' })
  @IsString()
  @IsNotEmpty()
  profileId: string;

  @ApiProperty({ enum: ImportSource, example: ImportSource.CSV })
  @IsEnum(ImportSource)
  source: ImportSource;

  @ApiPropertyOptional({ example: 'uuid-da-categoria-padrao' })
  @IsOptional()
  @IsString()
  defaultCategoryId?: string;
}

export class OpenBankingConnectDto {
  @ApiProperty({ example: 'uuid-do-perfil' })
  @IsString()
  @IsNotEmpty()
  profileId: string;

  @ApiProperty({ example: 'nubank', description: 'Identificador do banco' })
  @IsString()
  @IsNotEmpty()
  bankId: string;

  @ApiPropertyOptional({ example: 'auth-code-from-bank' })
  @IsOptional()
  @IsString()
  authorizationCode?: string;
}
