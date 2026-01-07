import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesService, Category } from '@/services/categoriesService';

// Query Keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (profileId?: string) => [...categoryKeys.lists(), { profileId }] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

// Hooks
export function useCategories(profileId?: string) {
  return useQuery({
    queryKey: categoryKeys.list(profileId),
    queryFn: () => categoriesService.getAll(profileId),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, profileId }: { data: Omit<Category, 'id'>; profileId: string }) =>
      categoriesService.create(data, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Category, 'id'>> }) =>
      categoriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useSuggestCategory(description: string, profileId: string) {
  return useQuery({
    queryKey: ['categories', 'suggest', description, profileId],
    queryFn: () => categoriesService.suggest(description, profileId),
    enabled: description.length >= 3 && !!profileId,
  });
}
