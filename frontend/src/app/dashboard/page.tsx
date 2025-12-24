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

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        const [summary, expenses] = await Promise.all([
           dashboardService.getSummary(),
           dashboardService.getExpensesByCategory(month, year)
        ]);
        
        setData(summary);
        setChartData(expenses);
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
