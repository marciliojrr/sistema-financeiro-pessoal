## Prompt (Google Antigravity + Gemini 3 Pro High)

Você é um(a) especialista sênior em **Product Design (UI/UX)** e **Front-end Engineering**. Sua missão é **criar TODO o front-end** do projeto “Sistema Financeiro Pessoal” com **mobile-first**, excelente usabilidade, navegação extremamente rápida e compatibilidade com desktop/tablet, usando **shadcn/ui**.

# 0) Contexto do projeto

- Produto: sistema web para controle financeiro pessoal: receitas, despesas, categorias, reservas/metas, dívidas, cartões (com recomendação de melhor cartão), dashboard e relatórios, importação OFX/CSV e fluxo Open Banking, exportações CSV, perfis (profiles).
- Backend: NestJS, rotas com prefixo global **`/api/v1`**.
  - Base dev: **`http://localhost:3001/api/v1`**
  - Swagger: **`http://localhost:3001/api/docs`**
- O usuário final exige: **fluxos rápidos**, **poucos toques**, **baixa fricção**, e sensação de app “nativo” no mobile (mesmo sendo web).

# 1) Stack obrigatória (não inventar outra)

- **Next.js 15 (App Router)** + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** como biblioteca base de componentes (Radix)
- Ícones: **lucide-react**
- Formulários: **react-hook-form + zod**
- HTTP: **axios**
- Charts: **recharts**
- Datas: **date-fns**
- Toast: usar padrão shadcn (Sonner) ou react-hot-toast; escolha 1 e mantenha consistência.

# 2) Objetivo máximo: usabilidade extrema (UX first)

Projete e implemente com foco em:

- **Mobile-first real (thumb-driven)**: tudo deve funcionar com uma mão; ações primárias na zona inferior.
- **Navegação rápida e mínima**: reduzir troca de páginas; preferir _drawers/sheets_ e ações rápidas.
- **Prevenção de erros**: validação em tempo real, máscaras, mensagens claras, confirmações para ações destrutivas.
- **Performance percebida**: skeletons, loading por seção, empty states úteis, feedback imediato.
- **Acessibilidade (WCAG)**: foco visível, contraste, aria/labels, teclado, touch targets ≥ 44px.
- **Confiança em produto financeiro**: linguagem clara, formatação monetária correta, confirmação em ações sensíveis, estado consistente.

# 3) Arquitetura de navegação (crítico)

## Mobile

- Implementar **Bottom Navigation fixa** (4–5 destinos) + **FAB** central para “Adicionar” (menu de ações rápidas).
- Considerar iOS safe-area: usar `pb-[env(safe-area-inset-bottom)]` (ou CSS equivalente) no container da bottom nav.
- Evitar “hamburger menu” como navegação primária.
- Command Palette (Ctrl/⌘K) também deve existir (mesmo no mobile via botão/atalho).

## Desktop/Tablet

- **Sidebar** colapsável + **Topbar** com busca/atalhos/command palette.
- Layout responsivo com breakpoints claros.

## Sugestão de destinos principais (ajuste se justificar)

1. Dashboard
2. Movimentações (se existir no backend; se não, deixar preparado)
3. Cartões
4. Planejamento/Orçamentos
5. Mais (hub): Categorias, Reservas, Dívidas, Relatórios, Importar/Exportar, Open Banking, Perfis, Configurações

# 4) Padrões de UI (shadcn/ui + design system mínimo)

- Usar shadcn/ui para **tudo**: Button, Input, Card, Tabs, Table (evitar no mobile), Badge, Avatar, DropdownMenu, Tooltip, Dialog, Sheet, Drawer, Toast/Sonner, Skeleton, Separator, Breadcrumb (desktop), Command.
- Criar componentes compostos reutilizáveis:
  - `MoneyInput` (máscara + parsing seguro + inputMode decimal)
  - `DatePickerMobile` (abre em Drawer/Sheet no mobile)
  - `ProfileSwitcher` (seleciona profileId e persiste)
  - `EmptyState`
  - `ConfirmDialog`
  - `PageHeader`
  - `QuickActions` (menu do FAB)
- Tema claro/escuro com toggle e contraste adequado.

# 5) Integração com a API (ROTAS REAIS — obrigatório)

## 5.1 Base e autenticação

- Base URL: `NEXT_PUBLIC_API_URL` (fallback `http://localhost:3001/api/v1`)
- JWT no header: `Authorization: Bearer <token>`
- Interceptor:
  - anexar token
  - tratar 401: limpar sessão e redirecionar para `/login` com toast amigável
- Armazenamento: preferir cookie seguro quando possível; se simplificar, usar localStorage **com cuidado** e abstração para trocar depois.

## 5.2 Endpoints reais (usar exatamente estes paths)

### Auth

- `POST /auth/login`  
  Body (LoginDto): `{ email: string; password: string }`

### Users

- `POST /users` (público; registro) — DTO `CreateUserDto` (descobrir pelo Swagger; tipar mínimo se necessário)
- `GET /users`
- `GET /users/:id`
- `DELETE /users/:id`

### Profiles

- `POST /profiles` (CreateProfileDto): `{ name: string; userId: string; active?: boolean; role?: "admin"|"editor"|"viewer" }`
- `GET /profiles`
- `GET /profiles/:id`
- `DELETE /profiles/:id`
  UX: app deve funcionar sempre com um `profileId` selecionado; a maioria das telas filtra por profile.

### Dashboard

- `GET /dashboard/summary?profileId=...`
- `GET /dashboard/charts/category?profileId=...`
- `GET /dashboard/charts/evolution?profileId=...`

### Categories

- `POST /categories` (CreateCategoryDto)
- `GET /categories`
- `GET /categories/:id`
- `DELETE /categories/:id`

### Budgets

- `POST /budgets` (CreateBudgetDto)
- `GET /budgets` (suportar query params; no mínimo `profileId` se aplicável)
- `GET /budgets/:id`
- `PATCH /budgets/:id` (UpdateBudgetDto)
- `DELETE /budgets/:id`

### Debts

- `POST /debts` (CreateDebtDto):
  `{ profileId, categoryId?, description, totalAmount, totalInstallments, startDate, dueDateDay, interestRate? }`
- `GET /debts?profileId=...`
- `GET /debts/:id`
- `PATCH /debts/:id` (UpdateDebtDto: `active?`, `remainingAmount?`, `paidInstallments?`)
- `DELETE /debts/:id`

### Reserves

- `POST /reserves` (CreateReserveDto):
  `{ profileId, name, targetAmount, currentAmount?, targetDate?, description?, color? }`
- `GET /reserves?profileId=...`
- `GET /reserves/:id`
- `PATCH /reserves/:id` (UpdateReserveDto)
- `DELETE /reserves/:id`

### Reports

- `GET /reports/dashboard-summary?profileId=...`
- `GET /reports/monthly-balance?month=...&year=...&profileId=...`
- `GET /reports/expenses-by-category?month=...&year=...&isFixed=true|false&profileId=...`
- `GET /reports/budget-planning?month=...&year=...&profileId=...`
- `GET /reports/reserves-progress?profileId=...`
- `GET /reports/export/csv?profileId=...` (download CSV)

### Imports (upload)

- `POST /imports/ofx` multipart/form-data: `file`, `profileId`
- `POST /imports/csv` multipart/form-data: `file`, `profileId`

### Exports

- `GET /exports/csv?profileId=...&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` (download CSV)

### Data Import (Open Banking + CSV)

- `POST /data-import/csv` multipart/form-data: `file`, `profileId`, `defaultCategoryId?`
- `GET /data-import/banks`
- `GET /data-import/authorize?bankId=...&redirectUri=...` → `{ authorizationUrl }`
- `POST /data-import/token` body `{ bankId: string; code: string }` → `{ accessToken }`
- `GET /data-import/accounts?bankId=...&accessToken=...`
- `POST /data-import/open-banking` body:
  `{ profileId, bankId, accessToken, accountId, startDate, endDate, defaultCategoryId? }`

### Credit Cards (confirmado no repo)

- `GET /credit-cards/recommendation?amount=...&date=YYYY-MM-DD`
- `POST /credit-cards` (CreateCreditCardDto)
- `GET /credit-cards`
- `GET /credit-cards/:id`
  Se houver endpoints adicionais (faturas/parcelas), detectar via Swagger e implementar.

# 6) Regras de UX específicas (pontos do seu relatório, aplicados ao seu stack)

- Bottom nav + FAB não podem ser cobertos por toast: em mobile, toast deve aparecer **top-center**.
- Preferir **Drawer/Sheet** no mobile para criação/edição (ex.: criar reserva, criar dívida, criar categoria, importar).
- “Glanceability”: Dashboard com KPIs grandes + cards + charts simples; listas de itens como cards.
- Não usar tabela para listagem principal no mobile (usar cards/list).
- Inputs:
  - `MoneyInput`: `inputMode="decimal"`; máscara BRL; validação; evitar float.
  - Date picker: abrir em drawer/sheet.
  - Select/Combobox de categoria: abrir em drawer/sheet (não popover pequeno no mobile).
- Confirmações e undo:
  - Ações destrutivas com confirm dialog.
  - Quando possível, oferecer “Desfazer” via toast.

# 7) Páginas/fluxos que DEVEM existir (entregue o app completo)

## Autenticação

- `/login` (consome `POST /auth/login`)
- (Opcional) `/register` (consome `POST /users`)

## Pós-login (shell com navegação)

- Dashboard (usa `/dashboard/*`)
- Categorias
- Reservas
- Dívidas
- Orçamentos
- Cartões (com “recomendação”)
- Relatórios
- Importar/Exportar
- Open Banking (fluxo `data-import/*`)
- Perfis (profiles) e Configurações

# 8) Qualidade: estados e padrões obrigatórios

- Em rotas principais, usar `loading.tsx`, `error.tsx`, `not-found.tsx`.
- Loading granular (por card, por lista) + skeleton.
- Empty states com CTA (“Criar primeira reserva”, “Adicionar categoria”, etc.).
- Tratar erros de API com mensagens úteis e não técnicas.
- Componentes responsivos e testáveis.

# 9) Entregáveis (saída)

Gere:

- Estrutura completa do `frontend/` (Next App Router)
- Setup shadcn/ui + tailwind
- Layout responsivo: bottom nav (mobile) + sidebar (desktop)
- FAB + Quick Actions
- Command Palette
- Camada API `services/api` + types + hooks
- Telas com fluxos completos para endpoints listados
- README explicando como rodar e configurar `NEXT_PUBLIC_API_URL`

# 10) Sequência de execução (para evitar respostas gigantes e erros)

Produza em fases:

**Fase 1 — Foundation**

1. Estrutura de pastas, configuração shadcn/tailwind, layout global (mobile/desktop), auth guard/redirect.
2. Implementar `services/api.ts`, gerenciamento de token, toasts, componentes base (MoneyInput, DatePickerMobile, ProfileSwitcher, BottomNav, Sidebar).

**Fase 2 — Core UX** 3) Login + seleção de Profile (profiles) e persistência do `profileId`. 4) Dashboard completo consumindo:

- `/dashboard/summary`
- `/dashboard/charts/category`
- `/dashboard/charts/evolution`

**Fase 3 — Módulos** 5) Categories, Reserves, Debts, Budgets (CRUDs com drawers no mobile). 6) Reports (todos endpoints listados + downloads CSV). 7) Imports/Exports e Data Import (Open Banking) com UX em etapas. 8) Credit cards + recommendation.

Comece pela Fase 1 e só avance quando terminar e validar.
