INSERT INTO notifications (id, title, message, read, type, "createdAt", "profileId") VALUES 
(gen_random_uuid(), 'Alerta de Orcamento', 'Atencao: Voce atingiu 92% do orcamento de Alimentacao.', false, 'BUDGET_ALERT', NOW() - INTERVAL '2 hours', 'ef808e9d-fe94-41ae-9497-a2940fd33b6c'),
(gen_random_uuid(), 'Lembrete de Conta', 'A despesa Aluguel de R$ 1.500,00 vence em 3 dias.', false, 'DEBT_DUE', NOW() - INTERVAL '5 hours', 'ef808e9d-fe94-41ae-9497-a2940fd33b6c'),
(gen_random_uuid(), 'Meta Atingida!', 'Parabens! Voce atingiu sua meta para a reserva Emergencia.', false, 'RESERVE_GOAL', NOW() - INTERVAL '1 day', 'ef808e9d-fe94-41ae-9497-a2940fd33b6c'),
(gen_random_uuid(), 'Informacao do Sistema', 'Bem-vindo ao Sistema Financeiro Pessoal!', true, 'SYSTEM', NOW() - INTERVAL '3 days', 'ef808e9d-fe94-41ae-9497-a2940fd33b6c');
