import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly authService: AuthService,
    ) {}

    async create(data: CreateUserDto) {
        const hashedPassword = await this.authService.hashPassword(data.password);
        const user = this.usersRepository.create({ ...data, password: hashedPassword });
        return this.usersRepository.save(user);
    }

    findAll() {
        return this.usersRepository.find();
    }

    findOne(id: string) {
        return this.usersRepository.findOne({ where: { id } });
    }

    async remove(id: string) {
        await this.usersRepository.delete(id);
        return { deleted: true };
    }
}
