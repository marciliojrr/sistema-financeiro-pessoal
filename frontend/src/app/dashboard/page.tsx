'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { dashboardService, DashboardSummary } from '@/services/dashboardService';
import { transactionsService, Transaction } from '@/services/transactionsService';
import { accountsService, TotalBalance } from '@/services/accountsService';
import { ExpensesChart } from '@/components/dashboard/ExpensesChart';
import { MonthlyEvolutionChart } from '@/components/dashboard/MonthlyEvolutionChart';
import { BudgetComparisonChart } from '@/components/dashboard/BudgetComparisonChart';
import { toast } from 'sonner';
import { ArrowDownIcon, ArrowUpIcon, Wallet, List, TrendingUp } from 'lucide-react';
import { parseISO, format } from 'date-fns';

import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { ProfileSwitcher } from '@/components/ProfileSwitcher';
import { ProfileNotificationModal } from '@/components/ProfileNotificationModal';
import { UserAvatar } from '@/components/UserAvatar';
import { useDataRefresh } from '@/hooks/useDataRefresh';

export default function DashboardPage() {
  const { userName, userAvatar } = useAuth();
  const { profiles, currentProfileId, isLoading: profileLoading } = useProfile();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<{ category: string; amount: number }[]>([]);
  const [evolutionData, setEvolutionData] = useState<{ month: string; year: number; income: number; expense: number; balance: number }[]>([]);
  const [budgetData, setBudgetData] = useState<{ category: string; planned: number; actual: number; percentage: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixedExpenses, setFixedExpenses] = useState(0);
  const [reserves, setReserves] = useState<{ name: string; current: number; target: number; percentage: number }[]>([]);
  const [latestTransactions, setLatestTransactions] = useState<Transaction[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [totalBalance, setTotalBalance] = useState<TotalBalance | null>(null);

  // Show profile notification on first visit after login
  useEffect(() => {
    const hasShownProfileNotification = sessionStorage.getItem('profileNotificationShown');
    if (!hasShownProfileNotification && !profileLoading && currentProfileId) {
      setShowProfileModal(true);
      sessionStorage.setItem('profileNotificationShown', 'true');
    }
  }, [profileLoading, currentProfileId]);

  const activeProfileName = profiles.find(p => p.id === currentProfileId)?.name || 'Principal';

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const [summary, expenses, fixed, reservesData, transactions, evolution, budget, patrimonio] = await Promise.all([
         dashboardService.getSummary(),
         dashboardService.getExpensesByCategory(month, year),
         dashboardService.getFixedExpenses(month, year),
         dashboardService.getReservesProgress(),
         transactionsService.getAll(),
         dashboardService.getMonthlyEvolution(6),
         dashboardService.getBudgetPlanning(month, year),
         accountsService.getTotalBalance(),
      ]);
      
      setData(summary);
      setChartData(expenses);
      setFixedExpenses(fixed);
      setReserves(reservesData);
      setEvolutionData(evolution);
      setBudgetData(budget);
      setTotalBalance(patrimonio);
      // Filtra parcelas de compras e transfer_in (para consolidar transferências)
      const filteredTransactions = transactions.filter(t => {
        if (t.installmentPurchaseId) return false;
        // Oculta transfer_in para não duplicar transferências na listagem
        if (t.type.toUpperCase() === 'TRANSFER_IN') return false;
        return true;
      });
      setLatestTransactions(filteredTransactions.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Escuta eventos de mudança de dados para atualizar automaticamente
  useDataRefresh('dashboard', fetchDashboard);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };



// ...

  return (
    <MobileLayout>
      <header className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
             <UserAvatar 
                name={userName} 
                avatar={userAvatar} 
                size="md" 
             />
              <div>
                 <h1 className="text-xl font-bold tracking-tight">{getGreeting()}, {userName?.split(' ')[0] || 'Visitante'} 👋</h1>
                 <p className="text-xs text-muted-foreground">
                   {data ? `Aqui está seu resumo financeiro de ${data.currentMonth}/${data.currentYear}` : '...'}
                 </p>
              </div>
           </div>
           <ProfileSwitcher />
        </div>
      </header>
      
      <div className="space-y-4">
         {/* Patrimônio Card - Featured */}
         <Card className="bg-primary text-primary-foreground border-none">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-primary-foreground/80 flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Patrimônio
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center justify-between">
                 {loading ? <Skeleton className="h-8 w-32 bg-primary-foreground/20" /> : (
                     <p className="text-3xl font-bold">{formatCurrency(totalBalance?.totalBalance || 0)}</p>
                 )}
                 <TrendingUp className="h-6 w-6 text-primary-foreground/60" />
            </CardContent>
         </Card>

         {/* KPI Cards - Receitas, Despesas, Resultado */}
         <div className="grid grid-cols-3 gap-3">
            <Card>
                <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      Receitas
                      <ArrowUpIcon className="h-3 w-3 text-green-500" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    {loading ? <Skeleton className="h-5 w-16" /> : (
                         <p className="text-sm font-bold text-green-600">{formatCurrency(data?.balance.totalIncome || 0)}</p>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      Despesas
                      <ArrowDownIcon className="h-3 w-3 text-red-500" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    {loading ? <Skeleton className="h-5 w-16" /> : (
                        <p className="text-sm font-bold text-red-600">{formatCurrency(data?.balance.totalExpense || 0)}</p>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      Resultado
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    {loading ? <Skeleton className="h-5 w-16" /> : (
                        <p className={`text-sm font-bold ${(data?.balance.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {(data?.balance.balance || 0) >= 0 ? '+' : ''}{formatCurrency(data?.balance.balance || 0)}
                        </p>
                    )}
                </CardContent>
            </Card>
         </div>


         {/* Latest Transactions */}
         <Card>
             <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                 <CardTitle className="text-sm font-medium flex items-center gap-2">
                   <List className="h-4 w-4" />
                   Últimas Movimentações
                 </CardTitle>
                 <Link href="/transactions">
                     <Button variant="ghost" size="sm" className="text-xs">
                         Ver todas
                     </Button>
                 </Link>
             </CardHeader>
             <CardContent className="p-4 pt-0 space-y-3">
                 {loading ? (
                   <>
                     <Skeleton className="h-10 w-full rounded-lg" />
                     <Skeleton className="h-10 w-full rounded-lg" />
                   </>
                 ) : latestTransactions.length === 0 ? (
                   <p className="text-sm text-gray-500 text-center py-4">Nenhuma movimentação recente.</p>
                 ) : (
                    latestTransactions.map((t) => {
                      const typeUpper = t.type.toUpperCase();
                      const isTransfer = typeUpper === 'TRANSFER_IN' || typeUpper === 'TRANSFER_OUT';
                      // Transferências aparecem só como transfer_out (consolidado)
                      const typeLabel = isTransfer 
                        ? 'Transferência'
                        : (typeUpper === 'INCOME' ? 'Receita' : 'Despesa');
                      const colorClass = isTransfer 
                        ? 'text-blue-600' 
                        : (typeUpper === 'INCOME' ? 'text-green-600' : 'text-red-600');
                      
                      return (
                        <div key={t.id} className="flex justify-between items-center border-b last:border-0 pb-2 last:pb-0">
                          <div>
                            <p className="font-medium text-sm">{t.description}</p>
                             <p className="text-xs text-muted-foreground">
                               {typeLabel} • {format(parseISO(t.date), 'dd/MM/yyyy')}
                             </p>
                          </div>
                          <span className={`font-bold text-sm ${colorClass}`}>
                            {formatCurrency(Number(t.amount))}
                          </span>
                        </div>
                      );
                    })
                 )}
             </CardContent>
         </Card>

         {/* Charts Section - Stacked Layout */}
         <div className="space-y-4">
           <MonthlyEvolutionChart data={evolutionData} loading={loading} />
           <ExpensesChart data={chartData} loading={loading} />
           <BudgetComparisonChart data={budgetData} loading={loading} />
         </div>

         {/* Free Spend & Reserves */}
         <div className="grid gap-4">
            <Card className="bg-linear-to-br from-indigo-500 to-purple-600 text-white border-0">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium text-white/80">Disponível para Gasto Livre</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    {loading ? <Skeleton className="h-8 w-32 bg-white/20" /> : (
                        <div>
                             <p className="text-2xl font-bold">
                                {formatCurrency((data?.balance.totalIncome || 0) - (fixedExpenses || 0))}
                            </p>
                            <p className="text-xs text-indigo-100 mt-1 opacity-80">
                                (Renda - Despesas Fixas)
                            </p>
                            <div className="mt-2 text-xs flex justify-between opacity-70">
                                <span>Fixas: {formatCurrency(fixedExpenses)}</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium">Minhas Reservas</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {loading ? <Skeleton className="h-20 w-full" /> : 
                        reserves.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center">Nenhuma reserva criada.</p>
                        ) : (
                            reserves.map((reserve, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{reserve.name}</span>
                                        <span className="text-muted-foreground">{formatCurrency(reserve.current)} / {formatCurrency(reserve.target)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary transition-all duration-500" 
                                            style={{ width: `${Math.min(reserve.percentage, 100)}%` }} 
                                        />
                                    </div>
                                    <p className="text-xs text-end text-muted-foreground">{reserve.percentage.toFixed(0)}%</p>
                                </div>
                            ))
                        )
                    }
                </CardContent>
            </Card>
         </div>

         {/* Upcoming Bills or Activity */}
         <div className="space-y-2">
            <h2 className="text-lg font-semibold">Próximas Contas</h2>
             <Card>
                 <CardContent className="p-4 space-y-4">
                     {loading ? (
                       <>
                         <Skeleton className="h-12 w-full rounded-lg" />
                         <Skeleton className="h-12 w-full rounded-lg" />
                       </>
                     ) : (
                        data?.upcomingBills.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">Nenhuma conta próxima.</p>
                        ) : (
                          data?.upcomingBills.map((bill, index) => (
                             <div key={index} className="flex justify-between items-center border-b last:border-0 pb-3 last:pb-0">
                                <div>
                                   <p className="font-medium text-sm">{bill.description}</p>
                                   <p className="text-xs text-muted-foreground">{new Date(bill.date).toLocaleDateString()}</p>
                                </div>
                                <span className="font-bold text-sm text-red-600">
                                   {formatCurrency(Number(bill.amount))}
                                </span>
                             </div>
                          ))
                        )
                     )}
                 </CardContent>
             </Card>
         </div>
      </div>

      {/* Profile Notification Modal - shows after login */}
      <ProfileNotificationModal
        profileName={activeProfileName}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </MobileLayout>
  );
}
