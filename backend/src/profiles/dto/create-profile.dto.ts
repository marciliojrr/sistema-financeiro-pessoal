import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ProfileRole } from '../../database/entities/profile.entity';

export class CreateProfileDto {
  @ApiProperty({ example: 'Pessoal', description: 'Nome do perfil financeiro' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: true, description: 'Perfil está ativo?' })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @ApiProperty({
    example: 'uuid-do-usuario',
    description: 'ID do usuário (relacionamento)',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    example: 'admin',
    description: 'Papel do perfil: admin (controle total), editor (edita mas não exclui), viewer (só visualiza)',
    enum: ProfileRole,
    default: ProfileRole.ADMIN,
  })
  @IsOptional()
  @IsEnum(ProfileRole)
  role?: ProfileRole = ProfileRole.ADMIN;
}
