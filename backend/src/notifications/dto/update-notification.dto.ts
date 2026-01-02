import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotificationDto {
  @ApiProperty({ description: 'Título da notificação', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Mensagem da notificação', required: false })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({ description: 'Tipo da notificação', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'Status de leitura', required: false })
  @IsBoolean()
  @IsOptional()
  read?: boolean;
}
