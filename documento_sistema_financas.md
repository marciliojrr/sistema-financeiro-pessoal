# Documento de Definição Completa do Sistema Web de Controle Financeiro Pessoal

## 1. Visão Geral do Produto

### Objetivo do Sistema

Desenvolver uma plataforma web intuitiva e eficiente para controle financeiro pessoal, fornecendo ferramentas para gerenciamento de receitas, despesas, reservas, cartões de crédito e planejamento financeiro. O sistema tem como objetivo principal proporcionar clareza sobre a saúde financeira do usuário, auxiliando na tomada de decisões e na criação de hábitos financeiros saudáveis.

### Público-Alvo

- Pessoas físicas que desejam gerir suas finanças pessoais e familiares.
- Usuários que buscam controle detalhado sobre gastos fixos, variáveis, reservas, cartões de crédito parcelados e planejamento orçamentário.
- Usuários que valorizam facilidade de uso, visualização clara e informações atualizadas.


### Contexto e Motivação

Muitos usuários utilizam métodos fragmentados, como planilhas, para controle financeiro, dificultando a visão integrada e atualizada da situação financeira. Este sistema visa centralizar e automatizar esse controle, promovendo organização, controle e planejamento financeiro pessoal eficaz.

***

## 2. Requisitos Funcionais

### 2.1 Categorias Financeiras

- Cadastro, edição e exclusão de categorias personalizadas.
- Categorias padrão: despesas fixas, despesas variáveis, ganhos fixos, ganhos variáveis, reservas, gasto livre, combustível.
- Categorização automática ou manual de lançamentos.


### 2.2 Lançamento de Movimentações Financeiras

- Registro de receitas e despesas com data, valor, categoria, e descrição.
- Gestão específica de reservas financeiras com metas e prazos.
- Controle detalhado de gasto livre e combustível.


### 2.3 Central de Cartões de Crédito

- Cadastro múltiplo de cartões.
- Registro de compras parceladas: produto, valor total, parcelas, data da compra, local opcional.
- Registros de compras avulsas (não parceladas).
- Fechamento mensal da fatura com lançamento do valor total.
- Pagamento da fatura com atualização automática das parcelas pagas.
- Visualização do histórico de parcelamentos e faturas.
- Sugestão do cartão mais vantajoso para novas compras parceladas.


### 2.4 Gerenciamento de Dívidas e Empréstimos

- Cadastro de dívidas ou empréstimos externos ao cartão.
- Controle de parcelas, juros, datas de pagamento e amortizações.


### 2.5 Planejamento Orçamentário Mensal

- Cadastro das previsões de receitas e despesas para o mês.
- Comparação entre o orçamento planejado e o realizado.
- Alertas para desvios significativos.


### 2.6 Suporte a Múltiplos Perfis

- Criação e gerenciamento de múltiplos perfis vinculados a uma conta.
- Alternância simples entre perfis.
- Controle independente de dados para cada perfil.
- Permissões diferenciadas (ex. perfil administrador).


### 2.7 Importação e Exportação de Dados

- Importação de extratos bancários e movimentações via APIs bancárias (Open Banking) ou arquivos CSV.
- Exportação de dados em CSV, PDF, e outras plataformas financeiras.


### 2.8 Dashboards e Relatórios Customizáveis

- Painel principal com visão mensal resumida.
- Gráficos de receitas, despesas, reservas, cartões e dívidas.
- Opção de customizar visualizações e gerar relatórios detalhados.


### 2.9 Modo Simulação Financeira

- Criação de cenários hipotéticos.
- Alteração temporária de receitas, despesas e dívidas para análise de impacto.
- Visualização dos resultados simulados sem afetar dados reais.


### 2.10 Configurações Avançadas para Reservas

- Definição de metas financeiras com prazos e valores-alvo.
- Opção de reforço automático periódico nas reservas.
- Visualização e alertas de progresso.


### 2.11 Avisos e Notificações Dinâmicas

- Alertas personalizáveis para vencimento de contas, limites de cartão, metas financeiras e eventos relevantes.
- Configuração de lembretes via e-mail e/ou notificação no sistema.


### 2.12 Segurança

- Autenticação e autorização segura.
- Backup automático e manual dos dados.
- Conformidade com LGPD para proteção de dados pessoais.

***

## 3. Requisitos Não Funcionais

### 3.1 Usabilidade e Acessibilidade

- Interface intuitiva, responsiva e amigável.
- Acessibilidade para pessoas com necessidades especiais.


### 3.2 Escalabilidade e Performance

- Backend capaz de suportar crescimento da base de usuários.
- Respostas rápidas com otimização de consultas ao banco de dados.


### 3.3 Segurança

- Criptografia de dados sensíveis.
- Implementação de políticas de segurança para acesso e armazenamento.


### 3.4 Compatibilidade

- Funcionar em desktop e mobile via web browser.
- Preparação para futuras versões mobile nativas.

***

## 4. Casos de Uso Detalhados

### 4.1 Cadastro e Edição de Categorias

Usuário cria ou edita categorias financeiras para organizar seus lançamentos.

### 4.2 Lançamento de Receitas e Despesas

Registro detalhado com data, valor, categoria, descrição.

### 4.3 Compra Parcelada em Cartão

Usuário informa compra parcelada com detalhes; sistema gera parcelas mensais.

### 4.4 Fechamento e Pagamento da Fatura

Usuário registra valor da fatura; após pagamento, sistema atualiza parcelas quitadas.

### 4.5 Gerenciamento de Dívidas

Controle das parcelas de dívidas externas, com controle de juros e prazos.

### 4.6 Planejamento Orçamentário

Usuário define orçamento mensal; sistema compara com valores lançados.

### 4.7 Gestão de Múltiplos Perfis

Administra perfis, alterna visualização e mantém dados separados.

### 4.8 Importação de Extratos

Importação via arquivos ou APIs para lançar movimentações automaticamente.

### 4.9 Visualização e Relatórios

Consultas e filtros customizáveis, geração de relatórios exportáveis.

### 4.10 Simulação Financeira

Ambiente para testar cenários sem alterar dados efetivos.

### 4.11 Configuração de Reservas

Definição e acompanhamento das reservas financeiras com alertas.

### 4.12 Notificações

Configuração e recebimento de alertas sobre eventos financeiros prioritários.

### 4.13 Segurança e Backup

Login seguro, controle de acesso e backup periódico dos dados.

***

## 5. Arquitetura do Sistema

### 5.1 Backend (NestJS)

- API RESTful para comunicação com frontend.
- Serviços para gerenciamento de dados financeiros, autenticação, notificações.
- Integração com PostgreSQL para persistência.


### 5.2 Frontend (NextJS/React)

- Interface responsiva e dinâmica.
- Componentes para dashboards, formulários, relatórios e notificações.


### 5.3 Banco de Dados (PostgreSQL)

- Modelagem relacional para categorias, usuários, perfis, lançamentos, cartões, reservas e dívidas.
- Índices e otimizações para performance.


### 5.4 Containerização (Docker)

- Imagens para backend, frontend e banco.
- Docker Compose para orquestração local e produção.


### 5.5 Segurança

- JWT para autenticação.
- Criptografia para dados sensíveis.
- Políticas de CORS, rate limiting e proteção contra ataques comuns.

***

## 6. Fluxos da Interface do Usuário

- Tela de login/cadastro.
- Dashboard inicial personalizável.
- Telas para cadastro e edição de categorias.
- Formulários para lançamento de receitas, despesas e compras parceladas.
- Painel de cartões e gestão de faturas.
- Área para planejamento orçamentário e simulação.
- Relatórios e exportação.
- Configurações de perfil, notificações e segurança.

***

## 7. Plano de Desenvolvimento e Roadmap

- MVP: funções básicas (cadastro, lançamentos, cartões, dashboards).
- Versão 2: reservas avançadas, notificações, dívidas, orçamentos.
- Versão 3: importação/exportação, múltiplos perfis, simulação.
- Fases de testes, validação, deployment com Docker.
- Atualizações contínuas e suporte.

***

## 8. Considerações Finais

- Flexibilizar para futuras integrações (apps mobile, assistentes virtuais).
- Documentação clara e suporte ao usuário.
- Monitoramento e análise para melhorias baseado em uso real.

***

