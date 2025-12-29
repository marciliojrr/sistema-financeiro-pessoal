'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { categoriesService, Category } from '@/services/categoriesService';
import { transactionsService, CreateTransactionDto, Transaction } from '@/services/transactionsService';
import { useRouter } from 'next/navigation';
import { CurrencyInputField } from '@/components/ui/currency-input';
import { cn } from '@/lib/utils';

const transactionSchema = z.object({
  description: z.string().min(3, 'Descrição muito curta'),
  amount: z.string().min(1, 'Valor obrigatório'),
  date: z.date({
    required_error: "Uma data é necessária.",
  }),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().optional(),
  isPaid: z.boolean().default(true),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  initialType?: 'INCOME' | 'EXPENSE';
  initialData?: Transaction;
  transactionId?: string;
}

export function TransactionForm({ initialType = 'EXPENSE', initialData, transactionId }: TransactionFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: initialData?.type || initialType,
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      isPaid: initialData?.isPaid ?? true,
      amount: initialData?.amount ? String(initialData.amount) : '',
      description: initialData?.description || '',
      categoryId: initialData?.categoryId || 'none',
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
      // Remove symbols like "R$ " and convert comma to dot for parsing
      const cleanAmount = data.amount.replace(/[^0-9,]/g, '').replace(',', '.');
      
      const payload: CreateTransactionDto = {
        description: data.description,
        amount: parseFloat(cleanAmount),
        date: data.date.toISOString(),
        type: data.type.toLowerCase() as 'income' | 'expense',
        categoryId: data.categoryId === 'none' ? undefined : data.categoryId,
        profileId: profileId!,
      };

      if (transactionId) {
        await transactionsService.update(transactionId, payload);
        toast.success('Transação atualizada com sucesso!');
      } else {
        await transactionsService.create(payload);
        toast.success('Transação salva com sucesso!');
      }
      
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
        <Label htmlFor="amount">Valor</Label>
        <CurrencyInputField
            id="amount"
            value={form.getValues('amount')}
            onValueChange={(val) => form.setValue('amount', val || '')}
            placeholder="R$ 0,00"
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

      <div className="space-y-2 flex flex-col">
        <Label>Data</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full pl-3 text-left font-normal",
                !form.watch('date') && "text-muted-foreground"
              )}
            >
              {form.watch('date') ? (
                format(form.watch('date'), "PPP", { locale: ptBR })
              ) : (
                <span>Selecione uma data</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={form.watch('date')}
              onSelect={(date) => date && form.setValue('date', date)}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {form.formState.errors.date && (
            <p className="text-sm text-red-500">{form.formState.errors.date.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
}
