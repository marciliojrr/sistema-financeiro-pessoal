-- Configurações iniciais do PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configurar timezone
SET TIMEZONE='America/Sao_Paulo';

-- Criar usuário e banco, se não existirem (redundância)

DO
$do$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_roles
        WHERE rolname = 'financeiro_user') THEN

        CREATE ROLE financeiro_user WITH LOGIN PASSWORD 'financeiro_password';
    END IF;
END
$do$;

-- Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE financeiro_db TO financeiro_user;