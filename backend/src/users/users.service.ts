import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from 'src/auth/auth.service';

import { ProfilesService } from 'src/profiles/profiles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly authService: AuthService,
    private readonly profilesService: ProfilesService,
  ) {}

  async create(data: CreateUserDto) {
    const hashedPassword = await this.authService.hashPassword(data.password);
    const user = this.usersRepository.create({
      ...data,
      password: hashedPassword,
    });
    const savedUser = await this.usersRepository.save(user);

    // Create default profile
    const profile = await this.profilesService.createProfile({
      name: 'Principal',
      userId: savedUser.id,
      active: true,
    });
    
    // Return user with defaultProfileId context if possible, or just the user.
    // The auth.service.login handles fetching the profile, so just creating it here is sufficient 
    // for the subsequent login call to find it.

    return savedUser;
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

  async update(id: string, data: Partial<CreateUserDto>) {
    await this.usersRepository.update(id, data);
    return this.findOne(id);
  }
}
