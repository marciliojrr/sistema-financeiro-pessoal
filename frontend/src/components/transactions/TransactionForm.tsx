'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { categoriesService, Category } from '@/services/categoriesService';
import { transactionsService, CreateTransactionDto } from '@/services/transactionsService';
import { useRouter } from 'next/navigation';

const transactionSchema = z.object({
  description: z.string().min(3, 'Descrição muito curta'),
  amount: z.string().min(1, 'Valor obrigatório'), // Handle as string for input masking later
  date: z.string().min(1, 'Data obrigatória'),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().optional(),
  isPaid: z.boolean().default(true),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  initialType?: 'INCOME' | 'EXPENSE';
}

export function TransactionForm({ initialType = 'EXPENSE' }: TransactionFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: initialType,
      date: new Date().toISOString().split('T')[0],
      isPaid: true,
      amount: '',
    },
  });

  const type = form.watch('type');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const allCategories = await categoriesService.getAll();
        setCategories(allCategories.filter(c => c.type === type));
      } catch (error) {
        console.error('Failed to load categories', error);
        toast.error('Erro ao carregar categorias');
      }
    };
    fetchCategories();
  }, [type]);

  const onSubmit = async (data: TransactionFormData) => {
    setLoading(true);
    const profileId = localStorage.getItem('profileId') || localStorage.getItem('userId');

    if (!profileId) {
      toast.error('Sessão inválida. Por favor, faça login novamente.');
      router.push('/login');
      setLoading(false);
      return;
    }

    try {
      
      const payload: CreateTransactionDto = {
        description: data.description,
        amount: parseFloat(data.amount.replace(',', '.')),
        date: data.date,
        type: data.type.toLowerCase() as 'income' | 'expense',
        categoryId: data.categoryId === 'none' ? undefined : data.categoryId,
        profileId: profileId!,
      };

      await transactionsService.create(payload);
      toast.success('Transação salva com sucesso!');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erro ao salvar transação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select 
            onValueChange={(val) => form.setValue('type', val as 'INCOME' | 'EXPENSE')} 
            defaultValue={type}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INCOME">Receita</SelectItem>
            <SelectItem value="EXPENSE">Despesa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Valor (R$)</Label>
        <Input 
            id="amount" 
            type="number" 
            step="0.01" 
            placeholder="0,00" 
            {...form.register('amount')} 
        />
        {form.formState.errors.amount && (
            <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input 
            id="description" 
            placeholder="Ex: Salário, Mercado..." 
            {...form.register('description')} 
        />
        {form.formState.errors.description && (
            <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Categoria</Label>
        <Select onValueChange={(val) => form.setValue('categoryId', val)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem categoria</SelectItem>
            {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Data</Label>
        <Input type="date" id="date" {...form.register('date')} />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
}
