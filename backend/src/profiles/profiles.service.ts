import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../database/entities/profile.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { User } from '../database/entities/user.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async createProfile(data: CreateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: data.userId },
    });
    if (!user) throw new Error('Usuário não encontrado');

    // Check for duplicate profile name for this user - return existing instead of error
    const existingProfile = await this.profileRepository.findOne({
      where: { name: data.name, user: { id: data.userId } },
    });
    if (existingProfile) {
      // Return existing profile to avoid duplicates (idempotent operation)
      return existingProfile;
    }

    const profile = this.profileRepository.create({ ...data, user });
    const savedProfile = await this.profileRepository.save(profile);

    await this.auditLogsService.logChange(
      user.id,
      'CREATE',
      'Profile',
      savedProfile.id,
      savedProfile,
    );

    return savedProfile;
  }

  // SECURITY FIX: Filter profiles by user ID
  findAllByUser(userId: string) {
    return this.profileRepository.find({
      where: { user: { id: userId } },
      relations: ['categories'],
    });
  }

  // SECURITY FIX: Get profile only if it belongs to user
  async findOneByUser(id: string, userId: string) {
    const profile = await this.profileRepository.findOne({
      where: { id },
      relations: ['user', 'categories'],
    });

    if (!profile) {
      throw new NotFoundException('Perfil não encontrado');
    }

    if (profile.user.id !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    return profile;
  }

  // Keep legacy methods for internal use only
  findAll() {
    return this.profileRepository.find({ relations: ['user', 'categories'] });
  }

  findOne(id: string) {
    return this.profileRepository.findOne({
      where: { id },
      relations: ['user', 'categories'],
    });
  }

  async remove(id: string, userId: string) {
    const profile = await this.findOneByUser(id, userId);

    await this.profileRepository.delete(id);

    await this.auditLogsService.logChange(userId, 'DELETE', 'Profile', id, {
      old: profile,
    });

    return { deleted: true };
  }

  async update(id: string, data: Partial<CreateProfileDto>, userId: string) {
    await this.findOneByUser(id, userId); // Verify ownership
    await this.profileRepository.update(id, { name: data.name });
    return this.findOneByUser(id, userId);
  }
}

