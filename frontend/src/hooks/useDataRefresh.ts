'use client';

import { useEffect, useRef } from 'react';

/**
 * Sistema de eventos global para reatividade do SPA.
 * 
 * Uso:
 * - Para disparar: emitDataChange('transactions') ou emitDataChange(['transactions', 'accounts'])
 * - Para ouvir: useDataRefresh('transactions', fetchData)
 * 
 * Eventos disponíveis:
 * - transactions: Quando transações são criadas/editadas/deletadas
 * - accounts: Quando contas são criadas/editadas/deletadas ou saldo muda
 * - categories: Quando categorias são criadas/editadas/deletadas
 * - budgets: Quando orçamentos são criados/editados/deletados
 * - credit-cards: Quando cartões são criados/editados/deletados
 * - invoices: Quando faturas são atualizadas
 * - debts: Quando dívidas são criadas/editadas/deletadas
 * - reserves: Quando reservas são criadas/editadas/deletadas
 * - dashboard: Quando qualquer dado que afeta o dashboard muda
 * - all: Refresh completo de todos os dados
 */

export type DataChangeEvent = 
  | 'transactions' 
  | 'accounts' 
  | 'categories' 
  | 'budgets'
  | 'credit-cards'
  | 'invoices'
  | 'debts'
  | 'reserves'
  | 'dashboard'
  | 'all';

const EVENT_PREFIX = 'data-change:';

/**
 * Dispara um evento de mudança de dados para outros componentes reagirem.
 * @param events - Um ou mais tipos de eventos para disparar
 */
export function emitDataChange(events: DataChangeEvent | DataChangeEvent[]) {
  const eventList = Array.isArray(events) ? events : [events];
  
  eventList.forEach(event => {
    window.dispatchEvent(new CustomEvent(`${EVENT_PREFIX}${event}`, {
      detail: { timestamp: Date.now() }
    }));
  });

  // Se não for 'all' e afetar dados financeiros, também dispara dashboard
  const financialEvents: DataChangeEvent[] = ['transactions', 'accounts', 'credit-cards', 'invoices', 'debts'];
  const shouldUpdateDashboard = eventList.some(e => financialEvents.includes(e)) && !eventList.includes('dashboard');
  
  if (shouldUpdateDashboard) {
    window.dispatchEvent(new CustomEvent(`${EVENT_PREFIX}dashboard`, {
      detail: { timestamp: Date.now() }
    }));
  }
}

/**
 * Hook para reagir a mudanças de dados.
 * @param events - Um ou mais tipos de eventos para ouvir
 * @param callback - Função a ser chamada quando o evento ocorrer
 */
export function useDataRefresh(
  events: DataChangeEvent | DataChangeEvent[],
  callback: () => void
) {
  // Usa ref para armazenar a versão mais recente do callback
  const callbackRef = useRef(callback);
  
  // Atualiza a ref dentro de um effect para evitar atualização durante render
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  useEffect(() => {
    const eventList = Array.isArray(events) ? events : [events];

    const handler = () => {
      callbackRef.current();
    };

    // Adiciona listener para cada evento
    eventList.forEach(event => {
      window.addEventListener(`${EVENT_PREFIX}${event}`, handler);
    });
    
    // Também ouve 'all'
    window.addEventListener(`${EVENT_PREFIX}all`, handler);

    return () => {
      eventList.forEach(event => {
        window.removeEventListener(`${EVENT_PREFIX}${event}`, handler);
      });
      window.removeEventListener(`${EVENT_PREFIX}all`, handler);
    };
  }, [events]);
}

/**
 * Mantém compatibilidade com eventos antigos (accounts-refresh, etc.)
 * Pode ser removido após migração completa.
 */
export function emitLegacyRefresh(eventName: string) {
  window.dispatchEvent(new CustomEvent(eventName));
}
