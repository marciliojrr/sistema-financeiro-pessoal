'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash, Loader2, Landmark, Pencil } from 'lucide-react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { debtsService, Debt } from '@/services/debtsService';
import { CurrencyInputField } from '@/components/ui/currency-input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDataRefresh, emitDataChange } from '@/hooks/useDataRefresh';
import { format } from 'date-fns';

const debtSchema = z.object({
  description: z.string().min(1, 'Nome obrigatório'),
  totalAmount: z.string().min(1, 'Valor obrigatório'),
  totalInstallments: z.string().min(1, 'Parcelas obrigatório'),
  startDate: z.string().min(1, 'Data obrigatória'),
  dueDateDay: z.string().min(1, 'Dia de vcto obrigatório'),
});

type DebtFormData = z.infer<typeof debtSchema>;

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const form = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      description: '',
      totalAmount: '',
      totalInstallments: '1',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      dueDateDay: '5',
    },
  });

  const fetchDebts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await debtsService.getAll();
      setDebts(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar dívidas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Escuta eventos de mudança de dados para atualizar automaticamente
  useDataRefresh('debts', fetchDebts);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const resetForm = () => {
    setEditingDebt(null);
    form.reset({
      description: '',
      totalAmount: '',
      totalInstallments: '1',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      dueDateDay: '5',
    });
  };

  const openEditDialog = (debt: Debt) => {
    setEditingDebt(debt);
    form.reset({
      description: debt.description,
      totalAmount: String(debt.totalAmount),
      totalInstallments: debt.totalInstallments.toString(),
      startDate: debt.startDate.split('T')[0],
      dueDateDay: debt.dueDateDay.toString(),
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: DebtFormData) => {
    setSubmitting(true);
    const profileId = localStorage.getItem('profileId');
    if (!profileId) {
      toast.error('Perfil não identificado');
      setSubmitting(false);
      return;
    }

    try {
      // Valor já vem como string numérica pura do CurrencyInputField
      const numericAmount = parseFloat(data.totalAmount);
      
      if (isNaN(numericAmount) || numericAmount <= 0) {
        toast.error('Valor inválido');
        setSubmitting(false);
        return;
      }
      
      const payload = {
        description: data.description,
        totalAmount: numericAmount,
        totalInstallments: parseInt(data.totalInstallments),
        startDate: data.startDate,
        dueDateDay: parseInt(data.dueDateDay),
        profileId: profileId
      };

      if (editingDebt) {
        await debtsService.update(editingDebt.id, payload);
        toast.success('Dívida atualizada com sucesso!');
      } else {
        await debtsService.create(payload);
        toast.success('Dívida adicionada com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
      // Emite evento para atualizar outras telas
      emitDataChange('debts');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar dívida');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta dívida?')) return;
    try {
      await debtsService.delete(id);
      toast.success('Dívida excluída');
      // Emite evento para atualizar outras telas
      emitDataChange('debts');
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const calculateProgress = (debt: Debt) => {
    if (!debt.totalInstallments || debt.totalInstallments === 0) return 0;
    const paid = debt.paidInstallments || 0;
    return Math.round((paid / debt.totalInstallments) * 100);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <MobileLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Landmark className="h-6 w-6" />
          Gerenciar Dívidas
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDebt ? 'Editar Dívida' : 'Nova Dívida'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Nome da Dívida</Label>
                <Input id="description" placeholder="Ex: Empréstimo Pessoal" {...form.register('description')} />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Valor Total Devido</Label>
                <CurrencyInputField
                  id="totalAmount"
                  value={form.watch('totalAmount')}
                  onValueChange={(val) => form.setValue('totalAmount', val || '')}
                  placeholder="0,00"
                />
                {form.formState.errors.totalAmount && (
                  <p className="text-sm text-red-500">{form.formState.errors.totalAmount.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalInstallments">Nº Parcelas</Label>
                  <Input type="number" id="totalInstallments" {...form.register('totalInstallments')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDateDay">Dia Vencimento</Label>
                  <Input type="number" id="dueDateDay" {...form.register('dueDateDay')} max={31} min={1} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início</Label>
                <Input type="date" id="startDate" {...form.register('startDate')} />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : (editingDebt ? 'Atualizar' : 'Salvar')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Carregando...</p>
        ) : debts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <p>Nenhuma dívida cadastrada.</p>
              <p className="text-sm">Clique no + para adicionar.</p>
            </CardContent>
          </Card>
        ) : (
          debts.map((debt) => {
            const progress = calculateProgress(debt);
            const paidInstallments = debt.paidInstallments || 0;
            const remainingAmount = debt.remainingAmount ?? debt.totalAmount;

            return (
              <Card key={debt.id} className="relative overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-semibold">{debt.description}</CardTitle>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground hover:text-foreground" 
                        onClick={() => openEditDialog(debt)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-red-500" 
                        onClick={() => handleDelete(debt.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex justify-between items-center mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor Total</p>
                      <p className="font-bold">{formatCurrency(debt.totalAmount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Restante</p>
                      <p className="font-medium text-orange-600">{formatCurrency(remainingAmount)}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progresso: {paidInstallments} de {debt.totalInstallments} parcelas</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="mt-4 flex gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                    <span>Vence dia {debt.dueDateDay}</span>
                    <span>•</span>
                    <span>Início: {new Date(debt.startDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </MobileLayout>
  );
}
