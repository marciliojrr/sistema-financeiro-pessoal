import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsService, Transaction, CreateTransactionDto } from '@/services/transactionsService';

// Query Keys
export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};

// Hooks
export function useTransactions(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: transactionKeys.list(filters || {}),
    queryFn: () => transactionsService.getAll(filters),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => transactionsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionDto) => transactionsService.create(data),
    onSuccess: () => {
      // Invalida todas as queries de transações
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      // Também invalida accounts pois saldos podem ter mudado
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransactionDto> }) =>
      transactionsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
