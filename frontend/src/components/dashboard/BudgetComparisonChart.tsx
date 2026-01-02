'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Target } from 'lucide-react';

interface BudgetData {
  category: string;
  planned: number;
  actual: number;
  percentage: number;
}

interface BudgetComparisonChartProps {
  data: BudgetData[] | null;
  loading: boolean;
}

export function BudgetComparisonChart({ data, loading }: BudgetComparisonChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
      <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            Orçamento vs Realizado
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            Orçamento vs Realizado
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center text-muted-foreground text-sm flex-col gap-3">
          <Target className="h-12 w-12 opacity-20" />
          <p className="font-medium">Nenhum orçamento cadastrado</p>
          <p className="text-xs text-center max-w-[200px]">Crie orçamentos na página de Orçamentos para acompanhar seus gastos por categoria.</p>
        </CardContent>
      </Card>
    );
  }

  // Limit to top 5 categories with budget
  const chartData = data.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" />
          Orçamento vs Realizado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart 
              data={chartData} 
              layout="vertical"
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis 
                type="number" 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="category" 
                width={80}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                // @ts-expect-error - Recharts types expect undefined but we handle it
                formatter={(value: number, name: string) => [
                  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0),
                  name === 'planned' ? 'Planejado' : 'Realizado'
                ]}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend 
                formatter={(value) => value === 'planned' ? 'Planejado' : 'Realizado'}
                iconType="circle"
              />
              <Bar dataKey="planned" fill="#60a5fa" name="planned" radius={[0, 4, 4, 0]} />
              <Bar dataKey="actual" name="actual" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.percentage <= 100 ? '#22c55e' : '#ef4444'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
