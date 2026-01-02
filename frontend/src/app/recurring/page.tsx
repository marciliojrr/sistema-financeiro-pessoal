'use client';

import { useEffect, useState } from 'react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Plus, 
  RefreshCw, 
  Calendar,
  Trash2,
  Edit,
  Pause,
  Play,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  recurringTransactionsService, 
  RecurringTransaction,
  CreateRecurringTransactionDto 
} from '@/services/recurringTransactionsService';
import { categoriesService } from '@/services/categoriesService';
import { profileService } from '@/services/profileService';

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface Profile {
  id: string;
  name: string;
}

export default function RecurringTransactionsPage() {
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateRecurringTransactionDto>({
    description: '',
    amount: 0,
    type: 'EXPENSE',
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    profileId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transactionsData, categoriesData, profilesData] = await Promise.all([
        recurringTransactionsService.getAll(),
        categoriesService.getAll(),
        profileService.getAll(),
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
      setProfiles(profilesData);
      
      // Set default profile if available
      if (profilesData.length > 0 && !formData.profileId) {
        setFormData(prev => ({ ...prev, profileId: profilesData[0].id }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.description || !formData.amount || !formData.categoryId || !formData.profileId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSubmitting(true);
    try {
      if (editingTransaction) {
        await recurringTransactionsService.update(editingTransaction.id, formData);
        toast.success('Transação atualizada com sucesso!');
      } else {
        await recurringTransactionsService.create(formData);
        toast.success('Transação recorrente criada!');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar transação');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (transaction: RecurringTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description,
      amount: Number(transaction.amount),
      type: transaction.type,
      frequency: transaction.frequency,
      startDate: transaction.startDate.split('T')[0],
      endDate: transaction.endDate?.split('T')[0],
      categoryId: transaction.category?.id || '',
      profileId: transaction.profile?.id || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação recorrente?')) return;
    
    try {
      await recurringTransactionsService.delete(id);
      toast.success('Transação excluída');
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erro ao excluir');
    }
  };

  const handleToggleActive = async (transaction: RecurringTransaction) => {
    try {
      await recurringTransactionsService.toggleActive(transaction.id, !transaction.active);
      toast.success(transaction.active ? 'Transação pausada' : 'Transação reativada');
      fetchData();
    } catch (error) {
      console.error('Error toggling:', error);
      toast.error('Erro ao atualizar');
    }
  };

  const resetForm = () => {
    setEditingTransaction(null);
    setFormData({
      description: '',
      amount: 0,
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      startDate: new Date().toISOString().split('T')[0],
      categoryId: '',
      profileId: profiles[0]?.id || '',
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      MONTHLY: 'Mensal',
      WEEKLY: 'Semanal',
      YEARLY: 'Anual',
    };
    return labels[frequency] || frequency;
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <MobileLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Transações Recorrentes</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie receitas e despesas automáticas
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nova
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs text-green-600 font-medium">Receitas</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(
                      transactions
                        .filter(t => t.type === 'INCOME' && t.active)
                        .reduce((sum, t) => sum + Number(t.amount), 0)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-xs text-red-600 font-medium">Despesas</p>
                  <p className="text-lg font-bold text-red-700">
                    {formatCurrency(
                      transactions
                        .filter(t => t.type === 'EXPENSE' && t.active)
                        .reduce((sum, t) => sum + Number(t.amount), 0)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Suas Recorrências ({transactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma transação recorrente cadastrada.</p>
                <p className="text-sm">Clique em &quot;Nova&quot; para começar.</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`p-4 rounded-lg border ${
                    !transaction.active ? 'opacity-50 bg-muted' : 'bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{transaction.description}</span>
                        {!transaction.active && (
                          <Badge variant="secondary" className="text-xs">Pausada</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant={transaction.type === 'INCOME' ? 'default' : 'destructive'}>
                          {transaction.type === 'INCOME' ? 'Receita' : 'Despesa'}
                        </Badge>
                        <Badge variant="outline">{getFrequencyLabel(transaction.frequency)}</Badge>
                        {transaction.category && (
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                            {transaction.category.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Próxima: {formatDate(transaction.nextRun)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(Number(transaction.amount))}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleActive(transaction)}
                        >
                          {transaction.active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? 'Editar Transação' : 'Nova Transação Recorrente'}
            </DialogTitle>
            <DialogDescription>
              {editingTransaction 
                ? 'Atualize os dados da transação recorrente.'
                : 'Configure uma transação que será lançada automaticamente.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                placeholder="Ex: Aluguel, Salário"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'INCOME' | 'EXPENSE') => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Receita</SelectItem>
                    <SelectItem value="EXPENSE">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: 'MONTHLY' | 'WEEKLY' | 'YEARLY') => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Semanal</SelectItem>
                  <SelectItem value="MONTHLY">Mensal</SelectItem>
                  <SelectItem value="YEARLY">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim (opcional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile">Perfil *</Label>
              <Select
                value={formData.profileId}
                onValueChange={(value) => setFormData({ ...formData, profileId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Salvando...' : editingTransaction ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
