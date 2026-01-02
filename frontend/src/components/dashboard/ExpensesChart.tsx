'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChartIcon } from 'lucide-react';

interface ChartData {
  category: string;
  amount: number;
  [key: string]: string | number;
}

interface ExpensesChartProps {
  data: ChartData[] | null;
  loading: boolean;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

export function ExpensesChart({ data, loading }: ExpensesChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const total = data?.reduce((sum, item) => sum + item.amount, 0) || 0;

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChartIcon className="h-4 w-4" />
            Despesas por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] flex items-center justify-center">
          <Skeleton className="h-40 w-40 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChartIcon className="h-4 w-4" />
            Despesas por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] flex items-center justify-center text-muted-foreground text-sm flex-col gap-2">
          <PieChartIcon className="h-12 w-12 opacity-20" />
          <p>Sem despesas neste mês.</p>
        </CardContent>
      </Card>
    );
  }

  // Custom legend with values
  const renderLegend = (props: { payload?: Array<{ value: string; color: string; payload?: { amount: number } }> }) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-2">
        {payload?.map((entry, index) => {
          const amount = entry.payload?.amount || 0;
          const percentage = total > 0 ? ((amount / total) * 100).toFixed(0) : 0;
          return (
            <div key={`legend-${index}`} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full shrink-0" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground truncate max-w-[120px]" title={entry.value}>
                {entry.value}
              </span>
              <span className="font-medium text-foreground">{percentage}%</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChartIcon className="h-4 w-4" />
          Despesas por Categoria
        </CardTitle>
        <p className="text-sm text-muted-foreground">Total: {formatCurrency(total)}</p>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="40%"
                outerRadius={90}
                innerRadius={50}
                fill="#8884d8"
                dataKey="amount"
                nameKey="category"
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip 
                // @ts-expect-error - Recharts types expect undefined but we handle it
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => label}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
              />
              {/* @ts-expect-error - Recharts Legend content type mismatch */}
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
