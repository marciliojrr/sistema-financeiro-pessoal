'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, ChevronLeft, ChevronRight, PieChart } from 'lucide-react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Progress } from "@/components/ui/progress"
import { toast } from 'sonner';
import { 
    budgetsService, 
    BudgetPlanningItem 
} from '@/services/budgetsService';
import { categoriesService, Category } from '@/services/categoriesService';
import { CurrencyInputField } from '@/components/ui/currency-input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useDataRefresh, emitDataChange } from '@/hooks/useDataRefresh';

const budgetSchema = z.object({
  amount: z.string().min(1, 'Valor obrigatório'),
  categoryId: z.string().min(1, 'Categoria obrigatória'),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

export default function BudgetsPage() {
  const [planningData, setPlanningData] = useState<BudgetPlanningItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      amount: '',
      categoryId: '',
    },
  });

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    const profileId = localStorage.getItem('profileId');
    try {
      const [planning, cats] = await Promise.all([
          budgetsService.getPlanning(month, year, profileId || undefined),
          categoriesService.getAll()
      ]);
      setPlanningData(planning);
      // Filter only expense categories usually for budget? Or all? Usually Expense.
      setCategories(cats.filter(c => c.type === 'EXPENSE'));
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  // Escuta eventos de mudança de dados para atualizar automaticamente
  useDataRefresh(['budgets', 'transactions'], fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrevMonth = () => {
      if (month === 1) {
          setMonth(12);
          setYear(year - 1);
      } else {
          setMonth(month - 1);
      }
  };

  const handleNextMonth = () => {
      if (month === 12) {
          setMonth(1);
          setYear(year + 1);
      } else {
          setMonth(month + 1);
      }
  };

  const onSubmit = async (data: BudgetFormData) => {
    setSubmitting(true);
    const profileId = localStorage.getItem('profileId');
    if (!profileId) {
        toast.error('Perfil não identificado');
        setSubmitting(false);
        return;
    }

    try {
        // Valor já vem como string numérica pura do CurrencyInputField
        const numericAmount = parseFloat(data.amount);
        
        if (isNaN(numericAmount) || numericAmount <= 0) {
          toast.error('Valor inválido');
          setSubmitting(false);
          return;
        }
        
        await budgetsService.create({
            amount: numericAmount,
            month,
            year,
            categoryId: data.categoryId,
            profileId
        });

        toast.success('Orçamento definido!');
        setIsDialogOpen(false);
        form.reset();
        // Emite evento para atualizar outras telas
        emitDataChange('budgets');
    } catch (error) {
        console.error(error);
        toast.error('Erro ao definir orçamento');
    } finally {
        setSubmitting(false);
    }
  };


  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <MobileLayout>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <PieChart className="h-6 w-6" />
          Planejamento
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Definir Orçamento para {months[month-1]}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
               <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria</Label>
                <Select 
                    value={form.watch('categoryId')} 
                    onValueChange={(val) => form.setValue('categoryId', val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 {form.formState.errors.categoryId && (
                  <p className="text-sm text-red-500">{form.formState.errors.categoryId.message}</p>
                )}
               </div>

               <div className="space-y-2">
                <Label htmlFor="amount">Valor Limite</Label>
                <CurrencyInputField
                    id="amount"
                    value={form.watch('amount')}
                    onValueChange={(val) => form.setValue('amount', val || '')}
                    placeholder="0,00"
                />
                 {form.formState.errors.amount && (
                  <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Definir'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-card p-2 rounded-lg border shadow-sm mb-6">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold">{months[month-1]} {year}</span>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 pb-20">
        {loading ? (
             <p className="text-center text-muted-foreground">Carregando...</p>
        ) : planningData.length === 0 ? (
             <Card className="border-dashed">
                 <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                     <p>Nenhum orçamento definido para este mês.</p>
                 </CardContent>
             </Card>
        ) : (
            planningData.map((item, idx) => {
                const percentage = item.budget > 0 ? (item.actual / item.budget) * 100 : 0;
                const isOver = item.actual > item.budget;
                const isAlert = item.actual > item.alertThreshold;

                return (
                    <Card key={idx} className={cn("relative overflow-hidden", isOver ? "border-red-200 bg-red-50/30" : "")}>
                        <CardContent className="p-4">
                             <div className="flex justify-between items-center mb-2">
                                 <span className="font-semibold">{item.category}</span>
                                 <span className={cn("text-xs font-bold px-2 py-1 rounded-full",
                                     isOver ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                 )}>
                                     {isOver ? 'Estourado' : 'Dentro'}
                                 </span>
                             </div>
                             
                             <div className="flex justify-between text-sm mb-1">
                                 <span className="text-muted-foreground">Gasto: {formatCurrency(item.actual)}</span>
                                 <span className="font-medium">Limite: {formatCurrency(item.budget)}</span>
                             </div>

                             <Progress value={Math.min(percentage, 100)} className={cn("h-2", 
                                 isOver ? "bg-red-100 [&>div]:bg-red-500" : 
                                 isAlert ? "bg-yellow-100 [&>div]:bg-yellow-500" : "bg-green-100 [&>div]:bg-green-500"
                             )} />
                             
                             <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                 <span>{percentage.toFixed(1)}% utilizado</span>
                                 <span>Restante: {formatCurrency(item.remaining)}</span>
                             </div>
                        </CardContent>
                    </Card>
                )
            })
        )}
      </div>
    </MobileLayout>
  );
}
