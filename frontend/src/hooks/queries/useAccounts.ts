import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsService, Account, CreateAccountDto } from '@/services/accountsService';

// Query Keys
export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: (profileId?: string) => [...accountKeys.lists(), { profileId }] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
  balance: (id: string) => [...accountKeys.detail(id), 'balance'] as const,
  totalBalance: () => [...accountKeys.all, 'totalBalance'] as const,
};

// Hooks
export function useAccounts(profileId?: string) {
  return useQuery({
    queryKey: accountKeys.list(profileId),
    queryFn: () => accountsService.getAll(profileId),
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () => accountsService.getById(id),
    enabled: !!id,
  });
}

export function useAccountBalance(id: string) {
  return useQuery({
    queryKey: accountKeys.balance(id),
    queryFn: () => accountsService.getBalance(id),
    enabled: !!id,
  });
}

export function useTotalBalance() {
  return useQuery({
    queryKey: accountKeys.totalBalance(),
    queryFn: () => accountsService.getTotalBalance(),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAccountDto) => accountsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAccountDto> }) =>
      accountsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(variables.id) });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accountsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export function useTransferBetweenAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { fromAccountId: string; toAccountId: string; amount: number; description?: string }) =>
      accountsService.transfer(data.fromAccountId, data.toAccountId, data.amount, data.description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
