'use client';

import { useState } from 'react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingUp, TrendingDown, PiggyBank, DollarSign, Calendar } from 'lucide-react';

type SimulationResult = {
  months: number;
  finalValue: number;
  totalContributions: number;
  totalInterest: number;
  monthlyData: Array<{
    month: number;
    balance: number;
    contribution: number;
    interest: number;
  }>;
};

export default function SimulationPage() {
  // Investment simulation state
  const [initialValue, setInitialValue] = useState('1000');
  const [monthlyContribution, setMonthlyContribution] = useState('500');
  const [interestRate, setInterestRate] = useState('1');
  const [period, setPeriod] = useState('12');
  const [simulationType, setSimulationType] = useState<'investment' | 'savings' | 'debt'>('investment');
  
  const [result, setResult] = useState<SimulationResult | null>(null);

  const calculateInvestment = () => {
    const initial = parseFloat(initialValue) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const rate = (parseFloat(interestRate) || 0) / 100;
    const months = parseInt(period) || 12;

    let balance = initial;
    let totalContributions = initial;
    let totalInterest = 0;
    const monthlyData = [];

    for (let i = 1; i <= months; i++) {
      const interest = balance * rate;
      balance += interest + monthly;
      totalContributions += monthly;
      totalInterest += interest;

      monthlyData.push({
        month: i,
        balance: balance,
        contribution: monthly,
        interest: interest
      });
    }

    setResult({
      months,
      finalValue: balance,
      totalContributions,
      totalInterest,
      monthlyData
    });
  };

  const calculateDebtPayoff = () => {
    const debt = parseFloat(initialValue) || 0;
    const payment = parseFloat(monthlyContribution) || 0;
    const rate = (parseFloat(interestRate) || 0) / 100;

    if (payment <= debt * rate) {
      setResult({
        months: 999,
        finalValue: 0,
        totalContributions: 0,
        totalInterest: 0,
        monthlyData: []
      });
      return;
    }

    let balance = debt;
    let months = 0;
    let totalPaid = 0;
    let totalInterest = 0;
    const monthlyData = [];

    while (balance > 0 && months < 360) {
      months++;
      const interest = balance * rate;
      totalInterest += interest;
      balance = balance + interest - payment;
      totalPaid += payment;

      if (balance < 0) {
        totalPaid += balance;
        balance = 0;
      }

      monthlyData.push({
        month: months,
        balance: Math.max(0, balance),
        contribution: payment,
        interest: interest
      });
    }

    setResult({
      months,
      finalValue: 0,
      totalContributions: totalPaid,
      totalInterest,
      monthlyData
    });
  };

  const handleCalculate = () => {
    if (simulationType === 'debt') {
      calculateDebtPayoff();
    } else {
      calculateInvestment();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <MobileLayout>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          Simulação Financeira
        </h1>
      </div>

      {/* Simulation Type */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <Label className="mb-2 block">Tipo de Simulação</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={simulationType === 'investment' ? 'default' : 'outline'}
              className="flex flex-col h-auto py-3"
              onClick={() => setSimulationType('investment')}
            >
              <TrendingUp className="h-5 w-5 mb-1" />
              <span className="text-xs">Investimento</span>
            </Button>
            <Button
              variant={simulationType === 'savings' ? 'default' : 'outline'}
              className="flex flex-col h-auto py-3"
              onClick={() => setSimulationType('savings')}
            >
              <PiggyBank className="h-5 w-5 mb-1" />
              <span className="text-xs">Poupança</span>
            </Button>
            <Button
              variant={simulationType === 'debt' ? 'default' : 'outline'}
              className="flex flex-col h-auto py-3"
              onClick={() => setSimulationType('debt')}
            >
              <TrendingDown className="h-5 w-5 mb-1" />
              <span className="text-xs">Quitação</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Input Form */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {simulationType === 'debt' ? 'Dados da Dívida' : 'Dados do Investimento'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="initial">
              {simulationType === 'debt' ? 'Valor da Dívida (R$)' : 'Valor Inicial (R$)'}
            </Label>
            <Input
              id="initial"
              type="number"
              value={initialValue}
              onChange={(e) => setInitialValue(e.target.value)}
              placeholder="1000"
            />
          </div>

          <div>
            <Label htmlFor="monthly">
              {simulationType === 'debt' ? 'Pagamento Mensal (R$)' : 'Aporte Mensal (R$)'}
            </Label>
            <Input
              id="monthly"
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              placeholder="500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rate">Taxa Mensal (%)</Label>
              <Input
                id="rate"
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="1"
              />
            </div>
            {simulationType !== 'debt' && (
              <div>
                <Label htmlFor="period">Período (meses)</Label>
                <Input
                  id="period"
                  type="number"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="12"
                />
              </div>
            )}
          </div>

          <Button className="w-full" onClick={handleCalculate}>
            <Calculator className="h-4 w-4 mr-2" />
            Calcular
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resultado da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {simulationType === 'debt' ? (
              <div className="space-y-4">
                {result.months >= 360 ? (
                  <div className="text-center py-4 text-red-500">
                    <p className="font-bold">⚠️ Pagamento insuficiente!</p>
                    <p className="text-sm">O valor mensal não cobre os juros.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-background rounded-lg">
                        <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-2xl font-bold">{result.months}</p>
                        <p className="text-xs text-muted-foreground">meses para quitar</p>
                      </div>
                      <div className="text-center p-3 bg-background rounded-lg">
                        <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
                        <p className="text-lg font-bold">{formatCurrency(result.totalContributions)}</p>
                        <p className="text-xs text-muted-foreground">total pago</p>
                      </div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
                      <p className="text-sm text-red-600">Juros pagos</p>
                      <p className="text-xl font-bold text-red-600">{formatCurrency(result.totalInterest)}</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg">
                  <p className="text-sm opacity-80">Valor Final em {result.months} meses</p>
                  <p className="text-3xl font-bold">{formatCurrency(result.finalValue)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground">Total Investido</p>
                    <p className="text-lg font-bold">{formatCurrency(result.totalContributions)}</p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground">Rendimento</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(result.totalInterest)}</p>
                  </div>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Rentabilidade: {((result.totalInterest / result.totalContributions) * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Presets */}
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Cenários Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSimulationType('investment');
                setInitialValue('5000');
                setMonthlyContribution('1000');
                setInterestRate('1');
                setPeriod('24');
              }}
            >
              Reserva 2 anos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSimulationType('investment');
                setInitialValue('0');
                setMonthlyContribution('500');
                setInterestRate('0.8');
                setPeriod('60');
              }}
            >
              Aposentadoria
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSimulationType('debt');
                setInitialValue('10000');
                setMonthlyContribution('800');
                setInterestRate('3');
                setPeriod('');
              }}
            >
              Quitar dívida
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSimulationType('savings');
                setInitialValue('1000');
                setMonthlyContribution('200');
                setInterestRate('0.5');
                setPeriod('12');
              }}
            >
              Poupança 1 ano
            </Button>
          </div>
        </CardContent>
      </Card>
    </MobileLayout>
  );
}
