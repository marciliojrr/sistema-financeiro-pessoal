import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'ID do perfil' })
  @IsUUID()
  @IsNotEmpty()
  profileId: string;

  @ApiProperty({ description: 'Título da notificação' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Mensagem da notificação' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Tipo da notificação' })
  @IsString()
  @IsNotEmpty()
  type: string;
}
