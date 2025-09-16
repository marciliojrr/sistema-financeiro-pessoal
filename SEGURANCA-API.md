# Guia de Segurança de Endpoints no Sistema Financeiro Pessoal

Este documento explica a implementação de segurança nos endpoints da API do Sistema Financeiro Pessoal, apresentando os conceitos, razões por trás das escolhas de design e instruções para manutenção e evolução do sistema de autenticação.

## Índice

1. [Conceitos Fundamentais](#conceitos-fundamentais)
2. [Implementação Atual](#implementação-atual)
3. [Como Funciona](#como-funciona)
4. [Guia de Manutenção](#guia-de-manutenção)
5. [Evolução do Sistema de Segurança](#evolução-do-sistema-de-segurança)

## Conceitos Fundamentais

### Autenticação vs. Autorização

- **Autenticação**: Processo de verificar a identidade de um usuário (quem você é)
- **Autorização**: Processo de verificar os direitos de acesso de um usuário (o que você pode fazer)

### Guards no NestJS

Os Guards são uma camada de proteção que determinam se uma requisição deve ser processada ou rejeitada, com base em certas condições como a autenticação do usuário.

### JWT (JSON Web Tokens)

Um método para transmitir informações de autenticação entre partes de forma segura, usando um token assinado digitalmente que pode ser verificado e confiado.

### Decoradores (Decorators)

Os decoradores são um recurso do TypeScript que permite adicionar metadados e comportamentos a classes, métodos, propriedades e parâmetros.

## Implementação Atual

Nosso sistema usa uma abordagem baseada em decoradores para proteger endpoints, com uma estrutura que facilita a manutenção e clareza do código.

### Componentes Principais

1. **JwtAuthGuard**: Guarda que verifica a presença e validade de um token JWT
2. **Decorador @Public()**: Marca rotas que não precisam de autenticação
3. **Reflector**: Serviço que permite acessar metadados dos decoradores

### Fluxo de Autenticação

1. O usuário se autentica e recebe um token JWT
2. O token é enviado no cabeçalho Authorization em requisições subsequentes
3. O JwtAuthGuard verifica o token para cada requisição
4. Endpoints marcados como @Public() ignoram esta verificação

## Como Funciona

### 1. Definição do Decorador Public

```typescript
// src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

Este decorador marca métodos que devem ser acessíveis sem autenticação.

### 2. Configuração do JwtAuthGuard

```typescript
// src/auth/jwt-auth.guard.ts
import { ExecutionContext, Injectable, Reflector } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }
    
    return super.canActivate(context);
  }
}
```

O guard verifica se um endpoint está marcado como público e, se não estiver, executa a verificação JWT padrão.

### 3. Aplicação nos Controladores

#### Exemplo: Controlador de Usuários

```typescript
@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    // ... constructor ...

    @Public()
    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }

    // Métodos protegidos por padrão
    @Get()
    findAll() {
        return this.userService.findAll();
    }
    
    // ... outros métodos ...
}
```

Neste controlador:
- O guard JWT é aplicado em todas as rotas por padrão
- Apenas o endpoint `create` (registro de usuários) está marcado como público

#### Exemplo: Controlador de Health

```typescript
@ApiTags('health')
@UseGuards(JwtAuthGuard)
@Controller('health')
export class HealthController {
    // ... constructor ...

    @Public()
    @Get()
    async check() {
        // ... implementação ...
    }

    @Public()
    @Get('detailed')
    async detailedCheck() {
        // ... implementação ...
    }
}
```

No controlador de health, todos os endpoints são públicos para permitir monitoramento do sistema.

## Guia de Manutenção

### Adicionar um Novo Endpoint Protegido

Para adicionar um endpoint que requer autenticação:

```typescript
@Get('novo-endpoint')
novoEndpoint() {
    // Implementação...
    return { data: 'endpoint protegido' };
}
```

Não é necessário adicionar nenhum decorador específico, pois a proteção é aplicada por padrão no nível do controlador.

### Adicionar um Novo Endpoint Público

Para adicionar um endpoint que NÃO requer autenticação:

```typescript
@Public()
@Get('endpoint-publico')
endpointPublico() {
    // Implementação...
    return { data: 'endpoint público' };
}
```

Basta adicionar o decorador `@Public()` antes do método.

### Verificar o Estado de Proteção dos Endpoints

Para auditar a segurança e verificar quais endpoints estão protegidos ou públicos:

1. Endpoints protegidos: Todos os métodos em controladores com `@UseGuards(JwtAuthGuard)` que NÃO têm o decorador `@Public()`
2. Endpoints públicos: Todos os métodos marcados com `@Public()`

## Evolução do Sistema de Segurança

### Implementação de Roles (Papéis)

Para adicionar controle de acesso baseado em papéis:

1. Crie um decorador de roles:

```typescript
// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

2. Implemente um RolesGuard:

```typescript
// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

3. Use-o em conjunto com o JwtAuthGuard:

```typescript
@Roles('admin')
@Get('admin-only')
adminOnly() {
  return { message: 'Área de administrador' };
}
```

### Implementação de Rate Limiting

Para proteger a API contra abusos:

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### Implementação de Refresh Tokens

Para melhorar a experiência do usuário com tokens de curta duração:

1. Crie um serviço para gerenciar refresh tokens
2. Implemente endpoints para renovação de tokens
3. Armazene refresh tokens de forma segura (banco de dados com criptografia)

### Logging de Segurança

Para monitorar tentativas de acesso:

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private logger: Logger
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Implementação existente...
    
    // Adicionar logging
    const request = context.switchToHttp().getRequest();
    this.logger.log(`Tentativa de acesso: ${request.method} ${request.url}`);
    
    // Retorno existente...
  }
}
```

## Conclusão

O sistema de segurança implementado fornece uma base sólida para proteção dos endpoints da API. A abordagem baseada em decoradores oferece clareza, manutenibilidade e flexibilidade para evolução futura.

Ao seguir este guia, você poderá:
- Entender como funciona a proteção de endpoints
- Adicionar novos endpoints com a proteção adequada
- Evoluir o sistema para incluir recursos avançados como roles e rate limiting

A segurança é um processo contínuo. Revise regularmente suas implementações e mantenha-se atualizado sobre as melhores práticas de segurança em APIs.