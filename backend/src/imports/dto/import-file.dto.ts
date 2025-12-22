import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImportFileDto {
  @ApiProperty({ description: 'ID do perfil onde as transações serão salvas' })
  @IsUUID()
  profileId: string;

  @ApiProperty({
    description: 'ID da conta ou cartão (opcional) para vincular',
  })
  @IsOptional()
  @IsUUID()
  accountId?: string;
}
