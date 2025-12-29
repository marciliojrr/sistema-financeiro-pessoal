import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // Valida usuário por email e senha
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { email },
      relations: ['profiles'] 
    });

    if (!user) throw new UnauthorizedException('E-mail ou senha inválidos');

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) throw new UnauthorizedException('E-mail ou senha inválidos');

    return user;
  }

  // Gera e retorna um token JWT para o usuário autenticado
  async login(user: User) {
    const payload = { sub: user.id, email: user.email, name: user.name };
    const defaultProfile = user.profiles && user.profiles.length > 0 ? user.profiles[0] : null;

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        defaultProfileId: defaultProfile ? defaultProfile.id : null,
      },
    };
  }

  // Para registro: hash da senha
  async hashPassword(plaintext: string) {
    return await bcrypt.hash(plaintext, 10);
  }
}
