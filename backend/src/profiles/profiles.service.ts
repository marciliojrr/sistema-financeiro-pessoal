import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../database/entities/profile.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { User } from '../database/entities/user.entity';

@Injectable()
export class ProfilesService {
    constructor(
        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}

    async createProfile(data: CreateProfileDto) {
        const user = await this.userRepository.findOne({ where: { id: data.userId } });
        if (!user) throw new Error('Usuário não encontrado');
        const profile = this.profileRepository.create({ ...data, user});
        return this.profileRepository.save(profile);
    }

    findAll() {
        return this.profileRepository.find( { relations: ['user', 'categories'] } );
    }

    findOne(id: string) {
        return this.profileRepository.findOne({ where: { id }, relations: ['user', 'categories'] });
    }

    async remove(id: string) {
        await this.profileRepository.delete(id);
        return { deleted: true };
    }
}
