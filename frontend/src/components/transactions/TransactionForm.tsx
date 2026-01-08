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
import { transactionsService, CreateTransactionDto, Transaction, TransactionStatus } from '@/services/transactionsService';
import { creditCardsService, CreditCard } from '@/services/creditCardsService';
import { accountsService, Account } from '@/services/accountsService';
import { useRouter } from 'next/navigation';
import { CurrencyInputField } from '@/components/ui/currency-input';
import { cn } from '@/lib/utils';
import { emitDataChange } from '@/hooks/useDataRefresh';
import { Switch } from '@/components/ui/switch';

const transactionSchema = z.object({
  description: z.string().min(3, 'Descrição muito curta'),
  amount: z.string().min(1, 'Valor obrigatório'),
  date: z.date({
    required_error: "Uma data é necessária.",
  }),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().optional(),
  isPaid: z.boolean().default(true),
  paymentMethod: z.enum(['CASH', 'CREDIT_CARD']).default('CASH'),
  creditCardId: z.string().optional(),
  installments: z.number().optional(),
  accountId: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  initialType?: 'INCOME' | 'EXPENSE';
  initialData?: Transaction;
  transactionId?: string;
  onSuccess?: () => void;
  isModal?: boolean;
}

export function TransactionForm({ 
  initialType = 'EXPENSE', 
  initialData, 
  transactionId,
  onSuccess,
}: TransactionFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<Category | null>(null);

  // Determina o tipo inicial corretamente
  const getInitialType = (): 'INCOME' | 'EXPENSE' => {
    if (initialData?.type) {
      const typeUpper = initialData.type.toUpperCase();
      if (typeUpper === 'INCOME' || typeUpper === 'EXPENSE') {
        return typeUpper as 'INCOME' | 'EXPENSE';
      }
    }
    return initialType;
  };

  // Parseia a data inicial corretamente para evitar problemas de timezone
  const getInitialDate = (): Date => {
    if (initialData?.date) {
      // Se a data vem como string YYYY-MM-DD, cria a data no fuso local
      const dateStr = initialData.date.split('T')[0];
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  };

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: getInitialType(),
      date: getInitialDate(),
      isPaid: initialData?.isPaid ?? true,
      amount: initialData?.amount ? String(initialData.amount) : '',
      description: initialData?.description || '',
      categoryId: initialData?.categoryId || 'none',
      paymentMethod: 'CASH',
      installments: 1,
      accountId: initialData?.accountId || 'none',
    },
  });

  const type = form.watch('type');
  const paymentMethod = form.watch('paymentMethod');
  const accountId = form.watch('accountId');
  const creditCardId = form.watch('creditCardId');
  const installments = form.watch('installments');
  const categoryId = form.watch('categoryId');

  useEffect(() => {
    const loadData = async () => {
        try {
            const [allCategories, allCards, allAccounts] = await Promise.all([
                categoriesService.getAll(),
                creditCardsService.getAll(),
                accountsService.getAll()
            ]);
            setCategories(allCategories.filter(c => c.type === type.toLowerCase()));
            setCreditCards(allCards);
            setAccounts(allAccounts);
        } catch (error) {
            console.error('Failed to load data', error);
            toast.error('Erro ao carregar dados');
        }
    };
    loadData();
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
      // O valor já vem como string numérica pura do CurrencyInputField (ex: "2603.16")
      const numericAmount = parseFloat(data.amount);
      
      if (isNaN(numericAmount) || numericAmount <= 0) {
        toast.error('Valor inválido');
        setLoading(false);
        return;
      }
      
      if (data.paymentMethod === 'CREDIT_CARD' && data.type === 'EXPENSE') {
          // Credit Card Installment Purchase
          if (!data.creditCardId) {
              toast.error('Selecione um cartão de crédito');
              setLoading(false);
              return;
          }

          await creditCardsService.createInstallmentPurchase({
              productName: data.description,
              totalValue: numericAmount,
              installments: Number(data.installments || 1),
              // Formata a data como YYYY-MM-DD para evitar problemas de timezone
              purchaseDate: format(data.date, 'yyyy-MM-dd'),
              creditCardId: data.creditCardId,
              categoryId: data.categoryId === 'none' ? undefined : data.categoryId
          });
          toast.success('Compra parcelada registrada com sucesso!');
          
          // Emite evento de mudança para atualizar outras telas
          emitDataChange(['transactions', 'credit-cards', 'invoices']);

      } else {
          // Standard Transaction
          const payload: CreateTransactionDto = {
            description: data.description,
            amount: numericAmount,
            // Formata a data como YYYY-MM-DD para evitar problemas de timezone
            date: format(data.date, 'yyyy-MM-dd'),
            type: data.type.toLowerCase() as 'income' | 'expense',
            categoryId: data.categoryId === 'none' ? undefined : data.categoryId,
            profileId: profileId!,
            accountId: data.accountId === 'none' ? undefined : data.accountId,
            status: data.isPaid ? TransactionStatus.COMPLETED : TransactionStatus.PENDING,
          };

          if (transactionId) {
            await transactionsService.update(transactionId, payload);
            toast.success('Transação atualizada com sucesso!');
          } else {
            await transactionsService.create(payload);
            toast.success('Transação salva com sucesso!');
          }
          
          // Emite evento de mudança para atualizar outras telas
          emitDataChange(['transactions', 'accounts']);
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard'); 
        router.refresh();
      }
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
            value={type}
            onValueChange={(val) => form.setValue('type', val as 'INCOME' | 'EXPENSE')} 
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
            placeholder="0,00"
        />
        {form.formState.errors.amount && (
            <p className="text-sm text-red-500">{form.formState.errors.amount?.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input 
            id="description" 
            placeholder="Ex: Salário, Mercado..." 
            {...form.register('description')} 
            onChange={(e) => {
              form.setValue('description', e.target.value);
              // Debounce auto-suggest
              const value = e.target.value;
              if (value.length >= 3) {
                const profileId = localStorage.getItem('profileId') || localStorage.getItem('userId');
                if (profileId) {
                  clearTimeout((window as unknown as Record<string, ReturnType<typeof setTimeout>>).__suggestTimeout);
                  (window as unknown as Record<string, ReturnType<typeof setTimeout>>).__suggestTimeout = setTimeout(async () => {
                    try {
                      const result = await categoriesService.suggest(value, profileId);
                      if (result.suggested && result.category) {
                        setSuggestedCategory(result.category);
                      } else {
                        setSuggestedCategory(null);
                      }
                    } catch {
                      setSuggestedCategory(null);
                    }
                  }, 500);
                }
              } else {
                setSuggestedCategory(null);
              }
            }}
        />
        {form.formState.errors.description && (
            <p className="text-sm text-red-500">{form.formState.errors.description?.message}</p>
        )}
        {suggestedCategory && (
          <div 
            className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => {
              form.setValue('categoryId', suggestedCategory.id);
              setSuggestedCategory(null);
              toast.success(`Categoria "${suggestedCategory.name}" selecionada!`);
            }}
          >
            <p className="text-sm text-green-700">
              💡 Sugestão: <strong>{suggestedCategory.name}</strong>
              <span className="text-xs ml-2 text-green-600">(clique para aplicar)</span>
            </p>
          </div>
        )}
      </div>

      {type === 'EXPENSE' && (
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de Pagamento</Label>
            <Select 
                value={paymentMethod}
                onValueChange={(val) => form.setValue('paymentMethod', val as 'CASH' | 'CREDIT_CARD')} 
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">À Vista / Débito</SelectItem>
                <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>
      )}

      {paymentMethod === 'CASH' && (
        <div className="space-y-2 p-4 bg-muted/50 rounded-lg border border-border/50">
          <Label htmlFor="accountId">Conta (Opcional)</Label>
          <Select 
            value={accountId}
            onValueChange={(val) => form.setValue('accountId', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Carteira / Dinheiro</SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
           <p className="text-xs text-muted-foreground">Selecione a conta para debitar/creditar o saldo.</p>
        </div>
      )}

      {type === 'EXPENSE' && paymentMethod === 'CREDIT_CARD' && (
          <div className="space-y-4 border-l-2 border-primary/50 pl-4">
              <div className="space-y-2">
                <Label htmlFor="creditCardId">Cartão de Crédito</Label>
                <Select 
                  value={creditCardId || ''}
                  onValueChange={(val) => form.setValue('creditCardId', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditCards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>{card.cardName} (Final {card.cardNumber.slice(-4)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="installments">Parcelas</Label>
                <Select 
                  value={String(installments || 1)}
                  onValueChange={(val) => form.setValue('installments', Number(val))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Número de parcelas" />
                    </SelectTrigger>
                    <SelectContent>
                        {[...Array(12)].map((_, i) => (
                            <SelectItem key={i+1} value={String(i+1)}>{i+1}x</SelectItem>
                        ))}
                        <SelectItem value="18">18x</SelectItem>
                        <SelectItem value="24">24x</SelectItem>
                    </SelectContent>
                </Select>
              </div>
          </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="categoryId">Categoria</Label>
        <Select value={categoryId} onValueChange={(val) => form.setValue('categoryId', val)}>
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
            <p className="text-sm text-red-500">{form.formState.errors.date?.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2 p-4 bg-muted/30 rounded-lg">
          <Switch
              id="isPaid"
              checked={form.watch('isPaid')}
              onCheckedChange={(checked) => form.setValue('isPaid', checked)}
          />
          <Label htmlFor="isPaid" className="cursor-pointer">
              {form.watch('isPaid') 
                ? (type === 'EXPENSE' ? 'Conta Paga' : 'Receita Recebida') 
                : (type === 'EXPENSE' ? 'Conta Pendente' : 'Receita Pendente')}
          </Label>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
}
