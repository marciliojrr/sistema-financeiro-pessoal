# Parte 1: Exemplos Práticos de Casos de Uso

### Caso Prático 1: Cadastro de despesas fixas e variáveis no início do mês

- Usuário abre o sistema no início do mês.
- Navega para "Lançamento de Despesas".
- Insere despesas fixas: parcela do financiamento, contas de água, energia, internet, condomínio e valor da fatura do cartão já previsto.
- Insere despesas variáveis: gastos do mês não feitos com cartão, como um reparo doméstico.
- Sistema atualiza automaticamente a categorização e mostra previsão do saldo disponível.


### Caso Prático 2: Registro de compra parcelada no cartão de crédito

- Usuário compra uma geladeira parcelada em 12 vezes.
- No sistema, vai na "Central de Cartões" e seleciona o cartão correspondente.
- Registra a compra, informando valor total, número de parcelas, data da compra e local.
- Sistema gera automaticamente as 12 parcelas mensais na fatura do cartão.
- Usuário visualiza o cronograma das parcelas e acompanha o impacto no orçamento mensal.


### Caso Prático 3: Fechamento e pagamento da fatura do cartão

- No final do mês, usuário recebe a fatura do cartão.
- No sistema, registra o valor da fatura e dados da data de vencimento.
- Após realizar o pagamento, marca a fatura como paga.
- Sistema atualiza o status das parcelas correspondentes e libera saldo para novas compras.


### Caso Prático 4: Visualização do gasto livre e reservas

- Após lançar receitas e despesas, o usuário acessa o dashboard.
- Visualiza claramente o valor disponível para gasto livre.
- Acompanha o progresso da reserva de emergência e outras reservas planejadas.
- Recebe um alerta sobre aproximação do limite da reserva viagem.


### Caso Prático 5: Planejamento orçamentário e simulação de compra

- Usuário acessa o planejamento mensal.
- Define metas para receitas, despesas e reservas.
- Usa o modo simulação para analisar a compra de um celular novo em 10 parcelas.
- Sistema mostra o impacto no orçamento e sugere alternativas.

***

# Parte 2: Diagramas UML

### 1. Diagrama de Caso de Uso (simplificado)

- Usuário
    - Gerenciar categorias
    - Registrar movimentações
    - Gerenciar cartões (cadastro e compras parceladas)
    - Fechar e pagar fatura
    - Gerenciar dívidas
    - Visualizar dashboard
    - Fazer planejamento e simulação
    - Gerenciar múltiplos perfis
    - Configurar alertas e notificações


### 2. Diagrama de Classes (simplificado)

- Classes principais:
    - Usuário
    - Perfil
    - CategoriaFinanceira
    - MovimentacaoFinanceira (Receita, Despesa)
    - CartaoCredito (contendo ComprasParceladas)
    - CompraParcelada (parcelas separadas)
    - FaturaCartao
    - Divida
    - Reserva
    - Orçamento
    - Notificacao


### 3. Diagrama de Sequência (exemplo do lançamento de compra parcelada)

- Usuário → Sistema: Solicita cadastro da compra parcelada
- Sistema → Banco de Dados: Grava dados da compra e parcelas
- Banco de Dados → Sistema: Confirmação
- Sistema → Usuário: Atualiza visualização das parcelas e cronograma

***

# Parte 3: Fluxos de Interface Visual (descrição)

### Tela Inicial / Dashboard

- Resumo geral: saldo, ganho total, despesas fixas, variáveis, gastos livres, reservas.
- Acesso rápido para lançamentos, gerenciamento de cartões e orçamentos.
- Alertas e notificações visíveis.


### Tela de Lançamento de Movimentações

- Formulário simples para despesa/receita.
- Seleção de categoria com busca.
- Campo para anexar descrição e data.
- Opção para identificação de compra parcelada se for cartão.


### Tela Central de Cartões

- Lista de cartões cadastrados.
- Botão para cadastrar novo cartão.
- Para cada cartão: visualização rápida das parcelas ativas.
- Opção para registrar compra parcelada.
- Histórico de faturas e status de pagamento.


### Tela de Planejamento e Simulação

- Área para definir receitas, despesas e metas mensais.
- Botões para criar simulações, modificar valores hipotéticos.
- Gráficos comparativos para decisões financeiras.


### Tela de Configuração de Notificações e Reservas

- Configuração detalhada de alertas customizáveis.
- Visualização do progresso das reservas e metas.


