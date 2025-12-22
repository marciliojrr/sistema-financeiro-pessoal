import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialMovement } from 'src/database/entities/financial-movement.entity';
import { CreateFinancialMovementDto } from './dto/create-financial-movement.dto';
import { Profile } from 'src/database/entities/profile.entity';
import { FinancialCategory } from 'src/database/entities/financial-category.entity';
import { UpdateFinancialMovementDto } from './dto/update-financial-movement.dto';

@Injectable()
export class FinancialMovementsService {
    constructor(
        @InjectRepository(FinancialMovement)
        private readonly movementRepository: Repository<FinancialMovement>,
        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,
        @InjectRepository(FinancialCategory)
        private readonly categoryRepository: Repository<FinancialCategory>
    ) { }

    async create(data: CreateFinancialMovementDto, userId: number) {
        // Profile: só pode ser usado se pertence ao usuário logado
        const profile = await this.profileRepository.findOne({ where: { id: data.profileId }, relations: ['user'] });

        if (!profile) throw new NotFoundException('Perfil não encontrado.');

        if (profile.user.id !== userId.toString()) throw new ForbiddenException('Acesso negado. Você só pode adicionar movimentações em seus próprios perfis.');

        // Categoria precisa existir
        const category = await this.categoryRepository.findOne({ where: { id: data.categoryId } });

        if (!category) throw new NotFoundException('Categoria não encontrada.');

        const movement = this.movementRepository.create({
            ...data,
            profile,
            category,
            date: new Date(data.date)
        });
        return this.movementRepository.save(movement);
    }

    async findAll(userId: string, filters?: any) {
        // Busca todas as movimentações só dos perfis do usuário autenticado, com filtros
        try {
            const query = this.movementRepository
                .createQueryBuilder('movement')
                .leftJoinAndSelect('movement.profile', 'profile')
                .leftJoinAndSelect('movement.category', 'category')
                .leftJoin('profile.user', 'user')
                .where('profile.user.id = :userId', { userId });

            if (filters?.profileId) query.andWhere('profile.id = :profileId', { profileId: filters.profileId });
            if (filters?.categoryId) query.andWhere('category.id = :categoryId', { categoryId: filters.categoryId });
            if (filters?.startDate) query.andWhere('movement.date >= :startDate', { startDate: filters.startDate });
            if (filters?.endDate) query.andWhere('movement.date <= :endDate', { endDate: filters.endDate });

            return query.orderBy('movement.date', 'DESC').getMany();
        } catch (err) {
            // Log no console tudo do erro:
            console.error('Erro no findAll financial-movements:', err.message, err.stack);
            throw err; // deixa o Nest responder o erro via ExceptionFilter, mas agora com mensagem SQL
        }
    }

    async findOne(id: string, userId: string) {
        const movement = await this.movementRepository.findOne({ where: { id }, relations: ['profile', 'category', 'profile.user'] });

        if (!movement) throw new NotFoundException('Movimentação não encontrada.');
        if (movement.profile.user.id !== userId) throw new ForbiddenException('Acesso negado.');

        return movement;
    }

    async remove(id: string, userId: string) {
        const movement = await this.findOne(id, userId);
        await this.movementRepository.remove(movement);

        return { deleted: true };
    }

    async update(id: string, data: UpdateFinancialMovementDto, userId: string) {
        const movement = await this.movementRepository.findOne({ where: { id }, relations: ['profile', 'profile.user', 'category'] });

        if (!movement) throw new NotFoundException('Movimentação não encontrada.');
        if (movement.profile.user.id !== userId) throw new ForbiddenException('Acesso negado.');

        // Se profileId for alterado, valide propriedade e existência
        if (data.profileId && data.profileId !== movement.profile.id) {
            const profile = await this.profileRepository.findOne({ where: { id: data.profileId }, relations: ['user'] });
            
            if (!profile) throw new NotFoundException('Perfil não encontrado.');
            if (profile.user.id !== userId) throw new ForbiddenException('Você só pode usar perfis próprios.');

            movement.profile = profile;
        }

        // Se categoryId for alterado, valide existência
        if (data.categoryId && data.categoryId !== movement.category.id) {
            const category = await this.categoryRepository.findOne({ where: { id: data.categoryId } });
            
            if (!category) throw new NotFoundException('Categoria não encontrada.');
            
            movement.category = category;
        }

        // Atualiza demais propriedades
        if (data.amount !== undefined) movement.amount = data.amount;
        if (data.description !== undefined) movement.description = data.description;
        if (data.type !== undefined) movement.type = data.type;
        if (data.date !== undefined) movement.date = new Date(data.date);
        if (data.notes !== undefined) movement.notes = data.notes;

        return this.movementRepository.save(movement);
    }
}
