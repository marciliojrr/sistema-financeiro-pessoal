'use client';

import { useEffect, useState } from 'react';

import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardService, DashboardSummary } from '@/services/dashboardService';
import { ExpensesChart } from '@/components/dashboard/ExpensesChart';
import { toast } from 'sonner';
import { ArrowDownIcon, ArrowUpIcon, Wallet } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { userName } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<{ category: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixedExpenses, setFixedExpenses] = useState(0);
  const [reserves, setReserves] = useState<{ name: string; current: number; target: number; percentage: number }[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        const [summary, expenses, fixed, reservesData] = await Promise.all([
           dashboardService.getSummary(),
           dashboardService.getExpensesByCategory(month, year),
           dashboardService.getFixedExpenses(month, year),
           dashboardService.getReservesProgress()
        ]);
        
        setData(summary);
        setChartData(expenses);
        setFixedExpenses(fixed);
        setReserves(reservesData);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
        toast.error('Erro ao carregar dados do dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <MobileLayout>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Bom dia, {userName?.split(' ')[0] || 'Visitante'} 👋</h1>
        <p className="text-muted-foreground">Aqui está seu resumo financeiro de {data ? `${data.currentMonth}/${data.currentYear}` : '...'}.</p>
      </header>
      
      <div className="space-y-4">
         {/* KPI Cards */}
         <div className="grid grid-cols-2 gap-4">
            <Card>
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Receitas</CardTitle>
                    <ArrowUpIcon className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    {loading ? <Skeleton className="h-6 w-20" /> : (
                         <p className="text-lg font-bold text-green-600">{formatCurrency(data?.balance.totalIncome || 0)}</p>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
                    <ArrowDownIcon className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    {loading ? <Skeleton className="h-6 w-20" /> : (
                        <p className="text-lg font-bold text-red-600">{formatCurrency(data?.balance.totalExpense || 0)}</p>
                    )}
                </CardContent>
            </Card>
         </div>

         {/* Balance Card - Featured */}
         <Card className="bg-primary text-primary-foreground border-none">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-primary-foreground/80 flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Saldo Atual
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                 {loading ? <Skeleton className="h-8 w-32 bg-primary-foreground/20" /> : (
                     <p className="text-3xl font-bold">{formatCurrency(data?.balance.balance || 0)}</p>
                 )}
            </CardContent>
         </Card>

         {/* Charts Section */}
         <ExpensesChart data={chartData} loading={loading} />

         {/* Free Spend & Reserves */}
         <div className="grid gap-4">
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
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
    </MobileLayout>
  );
}
