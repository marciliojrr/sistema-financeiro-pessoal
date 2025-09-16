# Sistema Financeiro Pessoal

Um sistema web completo para controle financeiro pessoal, desenvolvido com tecnologias modernas para proporcionar uma experiência intuitiva e eficiente na gestão de suas finanças.

![TypeScript](https://img.shields.io/badge/TypeScript-80%25-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-8.6%25-yellow)
![CSS](https://img.shields.io/badge/CSS-2.9%25-purple)
![Dockerfile](https://img.shields.io/badge/Dockerfile-3.1%25-blue)
![Makefile](https://img.shields.io/badge/Makefile-5.4%25-lightgrey)

## 📋 Visão Geral

Este projeto tem como objetivo desenvolver uma plataforma web completa para controle financeiro pessoal, fornecendo ferramentas para gerenciamento de receitas, despesas, reservas, cartões de crédito e planejamento financeiro. O sistema busca proporcionar clareza sobre a saúde financeira do usuário, auxiliando na tomada de decisões e na criação de hábitos financeiros saudáveis.

### 🎯 Público-Alvo

- Pessoas físicas que desejam gerir suas finanças pessoais e familiares
- Usuários que buscam controle detalhado sobre gastos fixos, variáveis, reservas e cartões de crédito
- Usuários que valorizam facilidade de uso, visualização clara e informações atualizadas

## ✨ Funcionalidades

### Gerenciamento Financeiro

- **Categorias Financeiras**: Cadastro, edição e exclusão de categorias personalizadas
- **Lançamento de Movimentações**: Registro detalhado de receitas e despesas
- **Reservas Financeiras**: Gestão de reservas com metas e prazos
- **Central de Cartões de Crédito**: Controle completo de cartões, parcelas e faturas

### Planejamento e Análise

- **Planejamento Orçamentário**: Previsão e comparativo de receitas e despesas
- **Dashboards e Relatórios**: Visualizações personalizáveis e relatórios detalhados
- **Simulação Financeira**: Criação de cenários hipotéticos para análise de impacto
- **Importação e Exportação**: Suporte a importação de extratos e exportação de dados

### Organização e Segurança

- **Múltiplos Perfis**: Suporte a vários perfis financeiros vinculados a uma conta
- **Avisos e Notificações**: Alertas personalizáveis para eventos financeiros importantes
- **Segurança Avançada**: Autenticação segura e backup de dados
- **Gerenciamento de Dívidas**: Controle de empréstimos e dívidas com juros e parcelas

## 🛠️ Tecnologias Utilizadas

### Backend
- **NestJS**: Framework Node.js para construção de APIs robustas
- **PostgreSQL**: Banco de dados relacional para persistência de dados
- **TypeScript**: Linguagem de programação tipada para maior segurança

### Frontend
- **NextJS/React**: Framework para construção de interfaces modernas e responsivas
- **TypeScript**: Para desenvolvimento frontend mais seguro e previsível
- **CSS**: Estilização de componentes e layouts

### Infraestrutura
- **Docker**: Containerização para facilitar desenvolvimento e deploy
- **Docker Compose**: Orquestração de containers
- **Makefile**: Automação de comandos e processos

## 🏗️ Arquitetura do Sistema

O sistema é construído com uma arquitetura moderna e escalável:

- **Backend**: API RESTful com NestJS, oferecendo serviços para gerenciamento de dados financeiros, autenticação e notificações
- **Frontend**: Interface responsiva e dinâmica com NextJS/React
- **Banco de Dados**: PostgreSQL com modelagem relacional otimizada
- **Containerização**: Docker para padronizar ambientes de desenvolvimento e produção
- **Segurança**: Implementação de JWT, criptografia e proteções contra ataques comuns

## 🚀 Instalação e Configuração

### Pré-requisitos

- Docker e Docker Compose
- Node.js (versão LTS recomendada)
- npm ou yarn

### Passos para Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/marciliojrr/sistema-financeiro-pessoal.git
   cd sistema-financeiro-pessoal
   ```

2. Configuração do ambiente:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

3. Iniciar com Docker:
   ```bash
   make up
   # ou
   docker-compose up -d
   ```

4. Acesse o sistema:
   ```
   Frontend: http://localhost:3000
   Backend API: http://localhost:3001
   ```

### Execução sem Docker (Desenvolvimento)

Para executar o projeto em modo de desenvolvimento:

1. Backend:
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

2. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📊 Exemplos de Uso

### Gerenciamento de Finanças
- Cadastre suas categorias de receitas e despesas
- Registre movimentações financeiras com valores, datas e categorias
- Acompanhe seu saldo atual e projeções futuras

### Controle de Cartões
- Cadastre seus cartões de crédito
- Registre compras parceladas e acompanhe o status de cada parcela
- Gerencie o fechamento e pagamento de faturas

### Planejamento Financeiro
- Defina metas para suas reservas financeiras
- Compare gastos planejados com realizados
- Utilize simulações para planejar grandes decisões financeiras

## 📋 Roadmap

O desenvolvimento segue um planejamento em fases:

### MVP (Versão Atual)
- Funções básicas de cadastro e autenticação
- Lançamento de receitas e despesas
- Gerenciamento básico de cartões
- Dashboard inicial

### Versão 2.0
- Reservas financeiras avançadas
- Sistema de notificações
- Gerenciamento de dívidas
- Planejamento orçamentário

### Versão 3.0
- Importação/exportação de dados
- Suporte a múltiplos perfis
- Simulação financeira avançada
- Integração com Open Banking

### Padrões de Código
- Siga as convenções de nomenclatura do projeto
- Escreva testes para novas funcionalidades
- Mantenha a documentação atualizada

### API e Documentação
- A documentação da API está disponível através do Swagger
- Acesse: `http://localhost:3001/api/docs` quando o servidor estiver em execução
- **Importante**: Ao autenticar-se no Swagger, utilize apenas o token obtido após o login, sem incluir o prefixo "Bearer"

## 📞 Contato

Para questões, sugestões ou problemas, entre em contato:
- **GitHub**: [marciliojrr](https://github.com/marciliojrr)

---

Desenvolvido com ❤️ para tornar o controle financeiro pessoal mais simples e eficiente.
