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
  Wallet,
  Building2,
  PiggyBank,
  Trash2,
  Edit,
  TrendingUp,
} from 'lucide-react';
import {
  accountsService,
  Account,
  AccountType,
  CreateAccountDto,
  TotalBalance,
} from '@/services/accountsService';
import { profileService } from '@/services/profileService';

interface Profile {
  id: string;
  name: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState<TotalBalance | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateAccountDto>({
    name: '',
    bank: '',
    type: AccountType.CHECKING,
    initialBalance: 0,
    profileId: '',
  });

  useEffect(() => {
    fetchData();
    
    // Listen for custom refresh events (e.g., after transfers)
    const handleRefresh = () => fetchData();
    window.addEventListener('accounts-refresh', handleRefresh);
    
    return () => {
      window.removeEventListener('accounts-refresh', handleRefresh);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsData, balanceData, profilesData] = await Promise.all([
        accountsService.getAll(),
        accountsService.getTotalBalance(),
        profileService.getAll(),
      ]);
      setAccounts(accountsData);
      setTotalBalance(balanceData);
      setProfiles(profilesData);

      // Set default profile if available
      if (profilesData.length > 0 && !formData.profileId) {
        setFormData((prev) => ({ ...prev, profileId: profilesData[0].id }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.profileId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSubmitting(true);
    try {
      if (editingAccount) {
        await accountsService.update(editingAccount.id, formData);
        toast.success('Conta atualizada com sucesso!');
      } else {
        await accountsService.create(formData);
        toast.success('Conta criada com sucesso!');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar conta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      bank: account.bank || '',
      type: account.type,
      initialBalance: Number(account.initialBalance),
      profileId: account.profile?.id || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;

    try {
      await accountsService.delete(id);
      toast.success('Conta excluída');
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erro ao excluir');
    }
  };

  const resetForm = () => {
    setEditingAccount(null);
    setFormData({
      name: '',
      bank: '',
      type: AccountType.CHECKING,
      initialBalance: 0,
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

  const getAccountTypeLabel = (type: AccountType) => {
    const labels: Record<AccountType, string> = {
      [AccountType.CHECKING]: 'Corrente',
      [AccountType.SAVINGS]: 'Poupança',
      [AccountType.WALLET]: 'Carteira',
    };
    return labels[type] || type;
  };

  const getAccountTypeIcon = (type: AccountType) => {
    switch (type) {
      case AccountType.CHECKING:
        return <Building2 className="h-5 w-5" />;
      case AccountType.SAVINGS:
        return <PiggyBank className="h-5 w-5" />;
      case AccountType.WALLET:
        return <Wallet className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  return (
    <MobileLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Contas
          </h1>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Novo
          </Button>
        </div>

        {/* Total Balance Card */}
        {totalBalance && (
          <Card className="bg-linear-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">Saldo Total</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatCurrency(totalBalance.totalBalance)}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm text-blue-100">
                    <span>
                      Saldo inicial: {formatCurrency(totalBalance.totalInitialBalance)}
                    </span>
                    <span>
                      Movimentações: {formatCurrency(totalBalance.movementsBalance)}
                    </span>
                  </div>
                </div>
                <div className="bg-white/20 p-4 rounded-full">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accounts List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Suas Contas ({accounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma conta cadastrada.</p>
                <p className="text-sm">
                  Clique em &quot;Nova Conta&quot; para começar.
                </p>
              </div>
            ) : (
              accounts.map((account) => (
                <div
                  key={account.id}
                  className={`p-4 rounded-lg border ${
                    !account.active ? 'opacity-50 bg-muted' : 'bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        {getAccountTypeIcon(account.type)}
                      </div>
                      <div>
                        <span className="font-medium">{account.name}</span>
                        {account.bank && (
                          <p className="text-sm text-muted-foreground">
                            {account.bank}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {getAccountTypeLabel(account.type)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold whitespace-nowrap ${
                        (account.currentBalance ?? account.initialBalance) < 0 
                          ? 'text-red-600' 
                          : 'text-blue-600'
                      }`}>
                        {formatCurrency(Number(account.currentBalance ?? account.initialBalance))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Saldo atual
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(account)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(account.id)}
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
              {editingAccount ? 'Editar Conta' : 'Nova Conta'}
            </DialogTitle>
            <DialogDescription>
              {editingAccount
                ? 'Atualize os dados da conta.'
                : 'Cadastre uma conta para registrar seu saldo inicial.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Conta *</Label>
              <Input
                id="name"
                placeholder="Ex: Nubank, Itaú, Carteira"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank">Banco (opcional)</Label>
              <Input
                id="bank"
                placeholder="Ex: Nubank, Banco do Brasil"
                value={formData.bank}
                onChange={(e) =>
                  setFormData({ ...formData, bank: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: AccountType) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AccountType.CHECKING}>
                      Corrente
                    </SelectItem>
                    <SelectItem value={AccountType.SAVINGS}>
                      Poupança
                    </SelectItem>
                    <SelectItem value={AccountType.WALLET}>Carteira</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="initialBalance">Saldo Inicial *</Label>
                <Input
                  id="initialBalance"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.initialBalance || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initialBalance: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile">Perfil *</Label>
              <Select
                value={formData.profileId}
                onValueChange={(value) =>
                  setFormData({ ...formData, profileId: value })
                }
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
              {submitting
                ? 'Salvando...'
                : editingAccount
                ? 'Salvar'
                : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
