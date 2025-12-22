import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class SimpleAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers['authorization'];

    if (auth && auth === 'Bearer aplicacao123') return true;

    throw new UnauthorizedException('Não autorizado');
  }
}
