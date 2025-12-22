# Sistema Financeiro Pessoal

Um sistema web completo para controle financeiro pessoal, desenvolvido com tecnologias modernas para proporcionar uma experiência intuitiva e eficiente na gestão de suas finanças.

![TypeScript](https://img.shields.io/badge/TypeScript-98.5%25-3178C6)
![JavaScript](https://img.shields.io/badge/JavaScript-0.8%25-F7DF1E)
![CSS](https://img.shields.io/badge/CSS-0.4%25-1572B6)
![Dockerfile](https://img.shields.io/badge/Dockerfile-0.2%25-2496ED)
![Other](https://img.shields.io/badge/Other-0.1%25-lightgrey)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED)

## 📋 Visão Geral

Este projeto tem como objetivo desenvolver uma plataforma web completa para controle financeiro pessoal, fornecendo ferramentas para gerenciamento de receitas, despesas, reservas, cartões de crédito e planejamento financeiro.

### 🎯 Público-Alvo

- Pessoas físicas que desejam gerir suas finanças pessoais e familiares
- Usuários que buscam controle detalhado sobre gastos fixos, variáveis, reservas e cartões de crédito
- Usuários que valorizam facilidade de uso, visualização clara e informações atualizadas

## ✅ Status do Projeto

### Backend: **100% Implementado** 🎉

| Métrica           | Valor |
| ----------------- | ----- |
| **Entidades**     | 14    |
| **Módulos**       | 16    |
| **Endpoints API** | 70+   |
| **Cron Jobs**     | 4     |

### Frontend: **Aguardando Desenvolvimento**

---

## ✨ Funcionalidades Implementadas

### 💰 Gerenciamento Financeiro

- ✅ **Categorias Financeiras**: CRUD completo com categorias personalizadas
- ✅ **Movimentações**: Receitas e despesas com filtros e soft delete
- ✅ **Reservas Financeiras**: Metas, prazos, auto-save automático
- ✅ **Dívidas**: Controle de parcelas, juros e amortizações

### 💳 Central de Cartões de Crédito

- ✅ Cadastro múltiplo de cartões
- ✅ Compras parceladas com geração automática de parcelas
- ✅ Fechamento e pagamento de faturas
- ✅ **Sugestão do melhor cartão** para novas compras

### 📊 Analytics e Relatórios

- ✅ Dashboard com resumo financeiro
- ✅ Gráficos por categoria e evolução mensal
- ✅ Exportação para CSV
- ✅ Planejamento orçamentário (planejado vs realizado)

### 🎭 Modo Simulação

- ✅ Criação de cenários hipotéticos
- ✅ Clonagem de dados reais para simulação
- ✅ Comparação cenário vs realidade

### 📥 Importação/Exportação

- ✅ Importação de arquivos OFX (extratos bancários)
- ✅ Importação de arquivos CSV
- ✅ Estrutura Open Banking preparada

### 🔔 Automação e Notificações

- ✅ Alertas de orçamento estourado (8:00 AM)
- ✅ Lembretes de contas a vencer (9:00 AM)
- ✅ Auto-save de reservas (10:00 AM)
- ✅ Alertas de metas de reservas (11:00 AM)

### 👥 Múltiplos Perfis

- ✅ Perfis independentes por usuário
- ✅ Roles diferenciadas: **ADMIN**, **EDITOR**, **VIEWER**
- ✅ RolesGuard para autorização por perfil

### 🔒 Segurança

- ✅ Autenticação JWT
- ✅ Validação de propriedade em todos os endpoints
- ✅ Soft delete com histórico
- ✅ Audit logs para rastreamento

---

## 🛠️ Tecnologias Utilizadas

### Backend

- **NestJS** - Framework Node.js
- **PostgreSQL** - Banco de dados
- **TypeORM** - ORM
- **Swagger** - Documentação da API
- **@nestjs/schedule** - Cron jobs

### Infraestrutura

- **Docker** + **Docker Compose**
- **Makefile** para automação

---

## 🚀 Instalação e Configuração

### Com Docker (Recomendado)

```bash
# Clone o repositório
git clone https://github.com/marciliojrr/sistema-financeiro-pessoal.git
cd sistema-financeiro-pessoal

# Inicie os containers
docker-compose up -d

# Acesse
# Backend API: http://localhost:3001
# Swagger Docs: http://localhost:3001/api/docs
```

### Desenvolvimento Local

```bash
# Backend
cd backend
npm install
npm run start:dev

# Acesse: http://localhost:3001/api/docs
```

---

## 📖 Documentação da API

A documentação interativa (Swagger) está disponível em:

```
http://localhost:3001/api/docs
```

**Dica**: Ao autenticar no Swagger, use apenas o token JWT (sem o prefixo "Bearer").

---

## 📋 Roadmap

### ✅ Fase 1: Backend (CONCLUÍDO)

- [x] CRUD de todas as entidades
- [x] Cartões de crédito com parcelamento
- [x] Dívidas com juros
- [x] Reservas com metas e auto-save
- [x] Dashboard e relatórios
- [x] Modo simulação
- [x] Importação OFX/CSV
- [x] Open Banking (estrutura)
- [x] Notificações automáticas
- [x] Roles de perfil

### 🔄 Fase 2: Frontend (EM BREVE)

- [ ] Interface de autenticação
- [ ] Dashboard principal
- [ ] Formulários de movimentações
- [ ] Visualização de cartões e faturas
- [ ] Gráficos e relatórios visuais

### 📱 Fase 3: Melhorias Futuras

- [ ] Notificações via e-mail
- [ ] Backup automático
- [ ] Exportação PDF
- [ ] App mobile

---

## 📞 Contato

- **GitHub**: [marciliojrr](https://github.com/marciliojrr)

---

Desenvolvido com ❤️ para tornar o controle financeiro pessoal mais simples e eficiente.
