import { Injectable } from '@nestjs/common';
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

  findAll() {
    return this.profileRepository.find({ relations: ['user', 'categories'] });
  }

  findOne(id: string) {
    return this.profileRepository.findOne({
      where: { id },
      relations: ['user', 'categories'],
    });
  }

  async remove(id: string) {
    const profile = await this.findOne(id);

    // We assume remove is called with permission check in controller or elsewhere,
    // but here we just need the user ID for logging.
    // profile.user might be loaded by findOne (relations ['user']).
    const userId = profile?.user?.id;

    await this.profileRepository.softDelete(id);

    if (userId) {
      await this.auditLogsService.logChange(userId, 'DELETE', 'Profile', id, {
        old: profile,
      });
    }

    return { deleted: true };
  }
}
