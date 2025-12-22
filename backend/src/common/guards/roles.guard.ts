import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile, ProfileRole } from '../../database/entities/profile.entity';

export const ROLES_KEY = 'roles';

/**
 * Decorator para definir quais roles podem acessar um endpoint
 * Uso: @Roles(ProfileRole.ADMIN, ProfileRole.EDITOR)
 */
export const Roles = (...roles: ProfileRole[]) => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(ROLES_KEY, roles, descriptor?.value ?? target);
  };
};

/**
 * Guard que verifica se o perfil do usuário tem a role necessária
 * Requer que o profileId seja passado via query param ou body
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<ProfileRole[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    // Se não há roles definidas, permite acesso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const profileId = request.query?.profileId || request.body?.profileId;

    // Se não há profileId, não pode verificar role
    if (!profileId) {
      throw new ForbiddenException(
        'ProfileId é necessário para verificar permissões',
      );
    }

    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
    });

    if (!profile) {
      throw new ForbiddenException('Perfil não encontrado');
    }

    const hasRole = requiredRoles.includes(profile.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Permissão negada. Role necessária: ${requiredRoles.join(' ou ')}. Sua role: ${profile.role}`,
      );
    }

    return true;
  }
}
