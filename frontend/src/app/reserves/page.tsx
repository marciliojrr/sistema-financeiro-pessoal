'use client';

import { useEffect, useState } from 'react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, PiggyBank, Target, TrendingUp } from 'lucide-react';
import { reservesService, Reserve, CreateReserveDto } from '@/services/reservesService';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function ReservesPage() {
  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReserve, setEditingReserve] = useState<Reserve | null>(null);
  const [addMoneyReserve, setAddMoneyReserve] = useState<Reserve | null>(null);
  const [addAmount, setAddAmount] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    description: '',
    color: '#6366f1',
  });

  const fetchReserves = async () => {
    try {
      const data = await reservesService.getAll();
      setReserves(data);
    } catch (error) {
      console.error('Failed to fetch reserves', error);
      toast.error('Erro ao carregar reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReserves();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      description: '',
      color: '#6366f1',
    });
    setEditingReserve(null);
  };

  const handleOpenDialog = (reserve?: Reserve) => {
    if (reserve) {
      setEditingReserve(reserve);
      setFormData({
        name: reserve.name,
        targetAmount: String(reserve.targetAmount),
        currentAmount: String(reserve.currentAmount),
        targetDate: reserve.targetDate ? reserve.targetDate.split('T')[0] : '',
        description: reserve.description || '',
        color: reserve.color || '#6366f1',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const profileId = localStorage.getItem('profileId') || localStorage.getItem('userId');
    if (!profileId) {
      toast.error('Perfil não encontrado');
      return;
    }

    try {
      if (editingReserve) {
        await reservesService.update(editingReserve.id, {
          name: formData.name,
          targetAmount: parseFloat(formData.targetAmount),
          currentAmount: parseFloat(formData.currentAmount) || 0,
          targetDate: formData.targetDate || undefined,
          description: formData.description || undefined,
          color: formData.color,
        });
        toast.success('Reserva atualizada!');
      } else {
        const createData: CreateReserveDto = {
          profileId,
          name: formData.name,
          targetAmount: parseFloat(formData.targetAmount),
          currentAmount: parseFloat(formData.currentAmount) || 0,
          targetDate: formData.targetDate || undefined,
          description: formData.description || undefined,
          color: formData.color,
        };
        await reservesService.create(createData);
        toast.success('Reserva criada!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchReserves();
    } catch (error) {
      console.error('Failed to save reserve', error);
      toast.error('Erro ao salvar reserva');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta reserva?')) return;

    try {
      await reservesService.delete(id);
      toast.success('Reserva excluída');
      fetchReserves();
    } catch (error) {
      console.error('Failed to delete reserve', error);
      toast.error('Erro ao excluir reserva');
    }
  };

  const handleAddMoney = async () => {
    if (!addMoneyReserve || !addAmount) return;

    try {
      await reservesService.addToReserve(addMoneyReserve.id, parseFloat(addAmount));
      toast.success('Valor adicionado!');
      setAddMoneyReserve(null);
      setAddAmount('');
      fetchReserves();
    } catch (error) {
      console.error('Failed to add money', error);
      toast.error('Erro ao adicionar valor');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const totalSaved = reserves.reduce((sum, r) => sum + Number(r.currentAmount), 0);
  const totalTarget = reserves.reduce((sum, r) => sum + Number(r.targetAmount), 0);

  return (
    <MobileLayout>
      {/* Header with summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PiggyBank className="h-6 w-6" />
              Minhas Reservas
            </h1>
            <p className="text-muted-foreground text-sm">Gerencie suas metas financeiras</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Nova
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingReserve ? 'Editar Reserva' : 'Nova Reserva'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Reserva</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Reserva de Emergência"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetAmount">Meta (R$)</Label>
                    <Input
                      id="targetAmount"
                      type="number"
                      step="0.01"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                      placeholder="10000.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentAmount">Valor Atual (R$)</Label>
                    <Input
                      id="currentAmount"
                      type="number"
                      step="0.01"
                      value={formData.currentAmount}
                      onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="targetDate">Data Alvo (opcional)</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Para que serve esta reserva?"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Cor</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <span className="text-sm text-muted-foreground">{formData.color}</span>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit">{editingReserve ? 'Salvar' : 'Criar'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-white/80">Total Guardado</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSaved)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/80">Meta Total</p>
                <p className="text-lg font-semibold">{formatCurrency(totalTarget)}</p>
              </div>
            </div>
            {totalTarget > 0 && (
              <div className="mt-3">
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${getProgress(totalSaved, totalTarget)}%` }}
                  />
                </div>
                <p className="text-xs text-white/80 mt-1 text-right">
                  {getProgress(totalSaved, totalTarget).toFixed(0)}% do total
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reserves List */}
      <div className="space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </>
        ) : reserves.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Nenhuma reserva criada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comece a guardar dinheiro criando sua primeira meta financeira.
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Criar Reserva
              </Button>
            </CardContent>
          </Card>
        ) : (
          reserves.map((reserve) => {
            const progress = getProgress(Number(reserve.currentAmount), Number(reserve.targetAmount));
            return (
              <Card key={reserve.id} className="overflow-hidden">
                <div
                  className="h-1"
                  style={{ backgroundColor: reserve.color }}
                />
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: reserve.color }}
                      />
                      <CardTitle className="text-base">{reserve.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(reserve)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => handleDelete(reserve.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {reserve.description && (
                    <p className="text-xs text-muted-foreground mb-2">{reserve.description}</p>
                  )}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-bold" style={{ color: reserve.color }}>
                      {formatCurrency(Number(reserve.currentAmount))}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      de {formatCurrency(Number(reserve.targetAmount))}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: reserve.color,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{progress.toFixed(0)}% concluído</span>
                    {reserve.targetDate && (
                      <span>Meta: {format(parseISO(reserve.targetDate), 'dd/MM/yyyy')}</span>
                    )}
                  </div>
                  {/* Add/Withdraw buttons */}
                  <div className="flex gap-2 mt-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setAddMoneyReserve(reserve)}
                        >
                          <TrendingUp className="h-4 w-4 mr-1" /> Depositar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Depositar em {reserve.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Valor (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="100.00"
                              value={addAmount}
                              onChange={(e) => setAddAmount(e.target.value)}
                            />
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button onClick={handleAddMoney}>Depositar</Button>
                            </DialogClose>
                          </DialogFooter>
                        </div>
                      </DialogContent>
                    </Dialog>
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
