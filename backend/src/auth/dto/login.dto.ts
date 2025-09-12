import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class LoginDto {
    @ApiProperty( { example: 'usuario@email.com', description: 'Email do usuário' } )
    @IsEmail( {}, { message: 'Email inválido' } )
    @IsNotEmpty( { message: 'Email é obrigatório' } )
    email: string;

    @ApiProperty( { example: 'senha123', description: 'Senha do usuário' } )
    @IsNotEmpty( { message: 'Senha é obrigatória' } )
    @MinLength( 6, { message: 'Senha deve ter no mínimo 6 caracteres' } )
    password: string;
}