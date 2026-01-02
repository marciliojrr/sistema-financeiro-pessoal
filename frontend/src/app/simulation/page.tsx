'use client';

import { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calculator, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  DollarSign, 
  Calendar,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

// Types
type CardSuggestion = {
  card: {
    id: string;
    cardName: string;
    limit: number;
    closingDay: number;
    dueDay: number;
  };
  workable: boolean;
  reason?: string;
  diffDays?: number;
  dueDate?: string;
  closingDate?: string;
};

type DashboardSummary = {
  income: number;
  expense: number;
  balance: number;
  reservesTotal: number;
  budgetUsage: number;
};

export default function SimulationPage() {
  // State for Tab 1: Purchase Simulation
  const [purchaseValue, setPurchaseValue] = useState('');
  const [installments, setInstallments] = useState('1');
  const [cardSuggestions, setCardSuggestions] = useState<{
    bestCard: CardSuggestion | null;
    others: CardSuggestion[];
    all: CardSuggestion[];
  } | null>(null);
  const [loadingCards, setLoadingCards] = useState(false);

  // State for Tab 2: Scenarios
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [scenarioIncome, setScenarioIncome] = useState(0);
  const [scenarioExpense, setScenarioExpense] = useState(0);
  const [scenarioNewDebt, setScenarioNewDebt] = useState(0);

  // State for Tab 3: Calculators
  const [calcInitialValue, setCalcInitialValue] = useState('1000');
  const [calcMonthly, setCalcMonthly] = useState('500');
  const [calcRate, setCalcRate] = useState('1');
  const [calcPeriod, setCalcPeriod] = useState('12');
  const [calcType, setCalcType] = useState<'investment' | 'debt'>('investment');
  const [calcResult, setCalcResult] = useState<{
    finalValue: number;
    totalContributions: number;
    totalInterest: number;
    months: number;
  } | null>(null);

  // State for Smart Suggestions
  const [smartSuggestions, setSmartSuggestions] = useState<{
    type: 'warning' | 'info' | 'success' | 'tip';
    icon: string;
    title: string;
    description: string;
  }[]>([]);

  const formatCurrency = (value: number | undefined | null) => {
    const safeValue = Number(value);
    if (isNaN(safeValue)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(safeValue);
  };

  // Load dashboard data on mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const profileId = localStorage.getItem('profileId');
        const response = await api.get('/reports/dashboard-summary', {
          params: { profileId }
        });
        setDashboardData(response.data);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
        toast.error('Erro ao carregar dados financeiros');
      } finally {
        setLoadingDashboard(false);
      }
    };
    loadDashboardData();
  }, []);

  // Tab 1: Simulate Purchase
  const handleSimulatePurchase = async () => {
    const value = parseFloat(purchaseValue);
    if (!value || value <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    setLoadingCards(true);
    setSmartSuggestions([]);
    
    try {
      const response = await api.get('/credit-cards/recommendation', {
        params: { amount: value }
      });
      setCardSuggestions(response.data);

      // Generate smart suggestions based on impact
      const numInstallments = parseInt(installments) || 1;
      const monthlyImpact = value / numInstallments;
      const income = Number(dashboardData?.income) || 0;
      const currentBalance = Number(dashboardData?.balance) || 0;
      const newBalance = currentBalance - monthlyImpact;
      const percentOfIncome = income > 0 ? (monthlyImpact / income) * 100 : 0;

      const suggestions: typeof smartSuggestions = [];

      // Rule 1: Check if balance goes negative
      if (newBalance < 0) {
        suggestions.push({
          type: 'warning',
          icon: '⚠️',
          title: 'Saldo Negativo',
          description: `Esta compra deixaria seu saldo mensal em R$ ${newBalance.toFixed(2)}.`,
        });
      }

      // Rule 2: Check percentage of income
      if (percentOfIncome > 30) {
        suggestions.push({
          type: 'warning',
          icon: '💳',
          title: 'Parcela Comprometedora',
          description: `A parcela de R$ ${monthlyImpact.toFixed(2)} representa ${percentOfIncome.toFixed(0)}% da sua renda.`,
        });
      } else if (percentOfIncome > 15) {
        suggestions.push({
          type: 'info',
          icon: '💡',
          title: 'Parcela Significativa',
          description: `A parcela representa ${percentOfIncome.toFixed(0)}% da sua renda. Considere mais parcelas.`,
        });
      }

      // Rule 3: Suggest alternative installments
      if (numInstallments < 18 && percentOfIncome > 10) {
        const altInstallments = Math.min(numInstallments + 6, 24);
        const altMonthly = value / altInstallments;
        suggestions.push({
          type: 'tip',
          icon: '🔢',
          title: 'Alternativa de Parcelamento',
          description: `Em ${altInstallments}x: R$ ${altMonthly.toFixed(2)}/mês (-${((monthlyImpact - altMonthly) / monthlyImpact * 100).toFixed(0)}%)`,
        });
      }

      // Rule 4: Positive feedback
      if (newBalance > 0 && percentOfIncome <= 15) {
        suggestions.push({
          type: 'success',
          icon: '✅',
          title: 'Compra Viável',
          description: 'Esta compra parece caber no seu orçamento atual!',
        });
      }

      // Rule 5: Low balance warning
      if (newBalance >= 0 && newBalance < 200) {
        suggestions.push({
          type: 'tip',
          icon: '⏳',
          title: 'Saldo Apertado',
          description: 'Seu saldo ficaria baixo após esta compra. Considere aguardar.',
        });
      }

      setSmartSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to get card suggestions', error);
      toast.error('Erro ao buscar sugestões de cartão');
    } finally {
      setLoadingCards(false);
    }
  };

  const getInstallmentImpact = () => {
    const value = parseFloat(purchaseValue) || 0;
    const numInstallments = parseInt(installments) || 1;
    const monthlyImpact = value / numInstallments;
    const currentBalance = Number(dashboardData?.balance) || 0;
    const newBalance = currentBalance - monthlyImpact;
    const income = Number(dashboardData?.income) || 0;
    const percentageOfIncome = income > 0 ? (monthlyImpact / income) * 100 : 0;

    return { 
      monthlyImpact: isNaN(monthlyImpact) ? 0 : monthlyImpact, 
      newBalance: isNaN(newBalance) ? 0 : newBalance, 
      percentageOfIncome: isNaN(percentageOfIncome) ? 0 : percentageOfIncome,
      hasData: income > 0 || currentBalance > 0
    };
  };

  // Tab 2: Scenario Comparison
  const getScenarioComparison = () => {
    // Create safe values even without dashboard data
    const currentIncome = Number(dashboardData?.income) || 0;
    const currentExpense = Number(dashboardData?.expense) || 0;
    const currentBalance = currentIncome - currentExpense;

    const newIncome = currentIncome + (Number(scenarioIncome) || 0);
    const newExpense = currentExpense + (Number(scenarioExpense) || 0) + ((Number(scenarioNewDebt) || 0) / 12);
    const newBalance = newIncome - newExpense;
    const balanceDiff = newBalance - currentBalance;

    return {
      current: {
        income: currentIncome,
        expense: currentExpense,
        balance: currentBalance
      },
      projected: {
        income: newIncome,
        expense: newExpense,
        balance: newBalance
      },
      diff: {
        income: Number(scenarioIncome) || 0,
        expense: (Number(scenarioExpense) || 0) + ((Number(scenarioNewDebt) || 0) / 12),
        balance: balanceDiff
      }
    };
  };

  // Tab 3: Calculators
  const handleCalculate = () => {
    const initial = parseFloat(calcInitialValue) || 0;
    const monthly = parseFloat(calcMonthly) || 0;
    const rate = (parseFloat(calcRate) || 0) / 100;
    const months = parseInt(calcPeriod) || 12;

    if (calcType === 'debt') {
      // Debt payoff calculation
      const debt = initial;
      const payment = monthly;
      
      if (payment <= debt * rate) {
        setCalcResult({
          months: 999,
          finalValue: 0,
          totalContributions: 0,
          totalInterest: 0
        });
        return;
      }

      let balance = debt;
      let monthCount = 0;
      let totalPaid = 0;
      let totalInterest = 0;

      while (balance > 0 && monthCount < 360) {
        monthCount++;
        const interest = balance * rate;
        totalInterest += interest;
        balance = balance + interest - payment;
        totalPaid += payment;
        if (balance < 0) {
          totalPaid += balance;
          balance = 0;
        }
      }

      setCalcResult({
        months: monthCount,
        finalValue: 0,
        totalContributions: totalPaid,
        totalInterest
      });
    } else {
      // Investment calculation
      let balance = initial;
      let totalContributions = initial;
      let totalInterest = 0;

      for (let i = 1; i <= months; i++) {
        const interest = balance * rate;
        balance += interest + monthly;
        totalContributions += monthly;
        totalInterest += interest;
      }

      setCalcResult({
        months,
        finalValue: balance,
        totalContributions,
        totalInterest
      });
    }
  };

  const impact = getInstallmentImpact();
  const scenarioComparison = getScenarioComparison();

  return (
    <MobileLayout>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          Simulação Financeira
        </h1>
      </div>

      <Tabs defaultValue="purchase" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="purchase" className="text-xs">
            <ShoppingCart className="h-4 w-4 mr-1" />
            Compra
          </TabsTrigger>
          <TabsTrigger value="scenario" className="text-xs">
            <TrendingUp className="h-4 w-4 mr-1" />
            Cenários
          </TabsTrigger>
          <TabsTrigger value="calc" className="text-xs">
            <Calculator className="h-4 w-4 mr-1" />
            Calculadora
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Purchase Simulation */}
        <TabsContent value="purchase" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Simular Compra Parcelada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Valor da Compra (R$)</Label>
                <Input
                  type="number"
                  value={purchaseValue}
                  onChange={(e) => setPurchaseValue(e.target.value)}
                  placeholder="1000.00"
                />
              </div>
              <div>
                <Label>Parcelas Desejadas</Label>
                <div className="grid grid-cols-6 gap-1 mt-1">
                  {[1, 2, 3, 6, 10, 12].map(n => (
                    <Button
                      key={n}
                      variant={installments === String(n) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInstallments(String(n))}
                    >
                      {n}x
                    </Button>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={handleSimulatePurchase} disabled={loadingCards}>
                {loadingCards ? 'Analisando...' : 'Analisar Melhor Cartão'}
              </Button>
            </CardContent>
          </Card>

          {/* Impact Preview */}
          {purchaseValue && parseFloat(purchaseValue) > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Impacto no Orçamento
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-background p-2 rounded">
                    <p className="text-muted-foreground text-xs">Parcela Mensal</p>
                    <p className="font-bold text-lg">{formatCurrency(impact.monthlyImpact)}</p>
                  </div>
                  <div className="bg-background p-2 rounded">
                    <p className="text-muted-foreground text-xs">% da Receita</p>
                    <p className={`font-bold text-lg ${impact.percentageOfIncome > 30 ? 'text-red-500' : 'text-green-600'}`}>
                      {impact.percentageOfIncome.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-background rounded">
                  <p className="text-xs text-muted-foreground">Saldo após compra</p>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{formatCurrency(Number(dashboardData?.balance) || 0)}</span>
                    <ArrowRight className="h-4 w-4" />
                    <span className={`font-bold ${impact.newBalance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {formatCurrency(impact.newBalance)}
                    </span>
                  </div>
                </div>
                {impact.percentageOfIncome > 30 && (
                  <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    ⚠️ Esta compra representa mais de 30% da sua receita mensal. Considere parcelar em mais vezes.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Card Suggestions */}
          {cardSuggestions && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Sugestão de Cartão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cardSuggestions.bestCard ? (
                  <>
                    <div className="p-3 border-2 border-green-500 rounded-lg bg-green-50">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-bold text-green-700">Melhor Opção</span>
                      </div>
                      <p className="font-semibold">{cardSuggestions.bestCard.card.cardName}</p>
                      <p className="text-sm text-muted-foreground">
                        {cardSuggestions.bestCard.diffDays} dias até o vencimento
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Limite: {formatCurrency(cardSuggestions.bestCard.card.limit)}
                      </p>
                    </div>

                    {cardSuggestions.others.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Outras opções:</p>
                        {cardSuggestions.others.map((s, i) => (
                          <div key={i} className="p-2 border rounded text-sm">
                            <p className="font-medium">{s.card.cardName}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.diffDays} dias • Limite: {formatCurrency(s.card.limit)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-700">Nenhum cartão com limite disponível</span>
                    </div>
                  </div>
                )}

                {/* Installment Recommendation */}
                {parseFloat(purchaseValue) > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-700 mb-2">💡 Sugestão de Parcelas</p>
                    <p className="text-xs text-blue-600">
                      {(() => {
                        const value = parseFloat(purchaseValue);
                        const balance = Number(dashboardData?.balance) || 0;
                        const freeBalance = balance > 0 ? balance * 0.3 : value / 6; // Fallback to 6x if no balance
                        const ideal = freeBalance > 0 ? Math.ceil(value / freeBalance) : 6;
                        if (balance <= 0) return "Sem dados de saldo. Considere parcelar em 6x ou menos.";
                        if (ideal <= 1) return "Você pode pagar à vista sem comprometer seu orçamento.";
                        if (ideal <= 3) return `Parcele em ${ideal}x para manter conforto financeiro.`;
                        if (ideal <= 12) return `Sugerimos ${ideal}x para não impactar demais seu saldo.`;
                        return "Considere adiar essa compra ou buscar alternativas mais baratas.";
                      })()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Smart Suggestions */}
          {smartSuggestions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  💡 Sugestões Inteligentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {smartSuggestions.map((suggestion, idx) => {
                  const bgColors = {
                    warning: 'bg-red-50 border-red-200',
                    info: 'bg-blue-50 border-blue-200',
                    success: 'bg-green-50 border-green-200',
                    tip: 'bg-amber-50 border-amber-200',
                  };
                  const textColors = {
                    warning: 'text-red-700',
                    info: 'text-blue-700',
                    success: 'text-green-700',
                    tip: 'text-amber-700',
                  };
                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg border ${bgColors[suggestion.type]}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{suggestion.icon}</span>
                        <div>
                          <p className={`font-semibold ${textColors[suggestion.type]}`}>
                            {suggestion.title}
                          </p>
                          <p className={`text-sm ${textColors[suggestion.type]} opacity-80`}>
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Scenarios */}
        <TabsContent value="scenario" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Criar Cenário Hipotético</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingDashboard ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p className="font-medium mb-1">Situação Atual:</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Receita</p>
                        <p className="font-bold text-green-600">{formatCurrency(Number(dashboardData?.income) || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Despesa</p>
                        <p className="font-bold text-red-600">{formatCurrency(Number(dashboardData?.expense) || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Saldo</p>
                        <p className="font-bold">{formatCurrency((Number(dashboardData?.income) || 0) - (Number(dashboardData?.expense) || 0))}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Adicionar Receita Mensal
                    </Label>
                    <Input
                      type="number"
                      value={scenarioIncome || ''}
                      onChange={(e) => setScenarioIncome(parseFloat(e.target.value) || 0)}
                      placeholder="Ex: Aumento de salário"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Adicionar Despesa Mensal
                    </Label>
                    <Input
                      type="number"
                      value={scenarioExpense || ''}
                      onChange={(e) => setScenarioExpense(parseFloat(e.target.value) || 0)}
                      placeholder="Ex: Novo aluguel"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-amber-600" />
                      Nova Dívida (valor total)
                    </Label>
                    <Input
                      type="number"
                      value={scenarioNewDebt || ''}
                      onChange={(e) => setScenarioNewDebt(parseFloat(e.target.value) || 0)}
                      placeholder="Ex: Financiamento (divide em 12 meses)"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Scenario Comparison */}
          {scenarioComparison && (scenarioIncome > 0 || scenarioExpense > 0 || scenarioNewDebt > 0) && (
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Comparativo: Atual vs Projetado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Current */}
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs font-medium mb-2 text-center">ATUAL</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Receita</span>
                        <span className="text-green-600">{formatCurrency(scenarioComparison.current.income)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Despesa</span>
                        <span className="text-red-600">{formatCurrency(scenarioComparison.current.expense)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="font-medium">Saldo</span>
                        <span className="font-bold">{formatCurrency(scenarioComparison.current.balance)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Projected */}
                  <div className={`p-3 rounded-lg ${scenarioComparison.diff.balance >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className="text-xs font-medium mb-2 text-center">PROJETADO</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Receita</span>
                        <span className="text-green-600">{formatCurrency(scenarioComparison.projected.income)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Despesa</span>
                        <span className="text-red-600">{formatCurrency(scenarioComparison.projected.expense)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="font-medium">Saldo</span>
                        <span className={`font-bold ${scenarioComparison.projected.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {formatCurrency(scenarioComparison.projected.balance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diff Summary */}
                <div className={`mt-3 p-2 rounded text-center ${scenarioComparison.diff.balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <p className="text-sm">
                    {scenarioComparison.diff.balance >= 0 ? '✅' : '⚠️'} Diferença no saldo: 
                    <span className={`font-bold ml-1 ${scenarioComparison.diff.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {scenarioComparison.diff.balance >= 0 ? '+' : ''}{formatCurrency(scenarioComparison.diff.balance)}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 3: Calculators */}
        <TabsContent value="calc" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button
                  variant={calcType === 'investment' ? 'default' : 'outline'}
                  onClick={() => setCalcType('investment')}
                >
                  <PiggyBank className="h-4 w-4 mr-2" />
                  Investimento
                </Button>
                <Button
                  variant={calcType === 'debt' ? 'default' : 'outline'}
                  onClick={() => setCalcType('debt')}
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Quitação
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>{calcType === 'debt' ? 'Valor da Dívida' : 'Valor Inicial'} (R$)</Label>
                  <Input
                    type="number"
                    value={calcInitialValue}
                    onChange={(e) => setCalcInitialValue(e.target.value)}
                  />
                </div>
                <div>
                  <Label>{calcType === 'debt' ? 'Pagamento Mensal' : 'Aporte Mensal'} (R$)</Label>
                  <Input
                    type="number"
                    value={calcMonthly}
                    onChange={(e) => setCalcMonthly(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Taxa Mensal (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={calcRate}
                      onChange={(e) => setCalcRate(e.target.value)}
                    />
                  </div>
                  {calcType === 'investment' && (
                    <div>
                      <Label>Período (meses)</Label>
                      <Input
                        type="number"
                        value={calcPeriod}
                        onChange={(e) => setCalcPeriod(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <Button className="w-full" onClick={handleCalculate}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Calculator Result */}
          {calcResult && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                {calcType === 'debt' ? (
                  calcResult.months >= 360 ? (
                    <div className="text-center text-red-500 py-4">
                      <XCircle className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-bold">Pagamento insuficiente!</p>
                      <p className="text-sm">O valor não cobre os juros mensais.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-center p-3 bg-background rounded-lg">
                        <Calendar className="h-6 w-6 mx-auto mb-1 text-primary" />
                        <p className="text-2xl font-bold">{calcResult.months} meses</p>
                        <p className="text-xs text-muted-foreground">para quitar</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-center p-2 bg-background rounded">
                          <p className="text-muted-foreground">Total Pago</p>
                          <p className="font-bold">{formatCurrency(calcResult.totalContributions)}</p>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded">
                          <p className="text-red-600 text-xs">Juros Pagos</p>
                          <p className="font-bold text-red-600">{formatCurrency(calcResult.totalInterest)}</p>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg">
                      <p className="text-sm opacity-80">Valor Final em {calcResult.months} meses</p>
                      <p className="text-2xl font-bold">{formatCurrency(calcResult.finalValue)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-center p-2 bg-background rounded">
                        <p className="text-muted-foreground text-xs">Total Investido</p>
                        <p className="font-bold">{formatCurrency(calcResult.totalContributions)}</p>
                      </div>
                      <div className="text-center p-2 bg-background rounded">
                        <p className="text-muted-foreground text-xs">Rendimento</p>
                        <p className="font-bold text-green-600">{formatCurrency(calcResult.totalInterest)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </MobileLayout>
  );
}
