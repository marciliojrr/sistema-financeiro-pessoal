'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Receipt, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { transactionsService, Transaction } from '@/services/transactionsService';
import { toast } from 'sonner';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal';

const MONTHS = [
    { value: 0, label: 'Janeiro' },
    { value: 1, label: 'Fevereiro' },
    { value: 2, label: 'Março' },
    { value: 3, label: 'Abril' },
    { value: 4, label: 'Maio' },
    { value: 5, label: 'Junho' },
    { value: 6, label: 'Julho' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Setembro' },
    { value: 9, label: 'Outubro' },
    { value: 10, label: 'Novembro' },
    { value: 11, label: 'Dezembro' },
];

export default function TransactionsPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filter state
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showAllTime, setShowAllTime] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    const fetchTransactions = async () => {
        try {
            const data = await transactionsService.getAll();
            const filtered = data.filter(t => !t.installmentPurchaseId);
            setTransactions(filtered);
        } catch (error) {
            console.error('Failed to fetch transactions', error);
            toast.error('Erro ao carregar transações');
        } finally {
            setLoading(false);
        }
    };

    // Filter transactions by selected period
    useEffect(() => {
        if (showAllTime) {
            setFilteredTransactions(transactions);
        } else {
            const startDate = startOfMonth(new Date(selectedYear, selectedMonth));
            const endDate = endOfMonth(new Date(selectedYear, selectedMonth));
            
            const filtered = transactions.filter(t => {
                const date = parseISO(t.date);
                return date >= startDate && date <= endDate;
            });
            setFilteredTransactions(filtered);
        }
    }, [transactions, selectedMonth, selectedYear, showAllTime]);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
        
        try {
            await transactionsService.delete(id);
            toast.success('Transação excluída');
            fetchTransactions();
        } catch (error) {
            console.error('Failed to delete transaction', error);
            toast.error('Erro ao excluir transação');
        }
    };

    const handleExportCSV = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const profileId = localStorage.getItem('profileId');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/reports/export/csv${profileId ? `?profileId=${profileId}` : ''}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (!response.ok) throw new Error('Falha ao exportar');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transacoes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success('Arquivo exportado com sucesso!');
        } catch (error) {
            console.error('Failed to export CSV', error);
            toast.error('Erro ao exportar CSV');
        }
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
            } else {
                setSelectedMonth(selectedMonth - 1);
            }
        } else {
            if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
            } else {
                setSelectedMonth(selectedMonth + 1);
            }
        }
        setShowAllTime(false);
    };

    // Calculate totals for filtered transactions (excluding transfers)
    const totals = filteredTransactions.reduce(
        (acc, t) => {
            const typeUpper = t.type.toUpperCase();
            const isTransfer = typeUpper === 'TRANSFER_IN' || typeUpper === 'TRANSFER_OUT';
            if (isTransfer) return acc; // Don't count transfers in income/expense
            
            const amount = Number(t.amount) || 0;
            if (typeUpper === 'INCOME') {
                acc.income += amount;
            } else {
                acc.expense += amount;
            }
            return acc;
        },
        { income: 0, expense: 0 }
    );

    // Get available years from transactions
    const availableYears = [...new Set(transactions.map(t => parseISO(t.date).getFullYear()))].sort((a, b) => b - a);
    if (!availableYears.includes(selectedYear)) {
        availableYears.push(selectedYear);
        availableYears.sort((a, b) => b - a);
    }

    return (
        <MobileLayout>
            {/* Page Title */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Receipt className="h-6 w-6" />
                    Transações
                </h1>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => router.push('/transactions/new')}>
                        <Plus className="mr-2 h-4 w-4" /> Nova
                    </Button>
                </div>
            </div>


            {/* Period Filter */}
            <Card className="mb-4">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigateMonth('prev')}
                            disabled={showAllTime}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        
                        <div className="flex gap-2 flex-1 justify-center">
                            <Select 
                                value={showAllTime ? 'all' : String(selectedMonth)}
                                onValueChange={(v) => {
                                    if (v === 'all') {
                                        setShowAllTime(true);
                                    } else {
                                        setShowAllTime(false);
                                        setSelectedMonth(Number(v));
                                    }
                                }}
                            >
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todo período</SelectItem>
                                    {MONTHS.map(m => (
                                        <SelectItem key={m.value} value={String(m.value)}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            
                            {!showAllTime && (
                                <Select 
                                    value={String(selectedYear)}
                                    onValueChange={(v) => setSelectedYear(Number(v))}
                                >
                                    <SelectTrigger className="w-[90px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableYears.map(y => (
                                            <SelectItem key={y} value={String(y)}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigateMonth('next')}
                            disabled={showAllTime}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Period Summary */}
                    <div className="flex justify-between mt-4 text-sm">
                        <div className="text-center">
                            <p className="text-muted-foreground">Receitas</p>
                            <p className="font-bold text-green-600">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.income)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-muted-foreground">Despesas</p>
                            <p className="font-bold text-red-600">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.expense)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-muted-foreground">Saldo</p>
                            <p className={`font-bold ${totals.income - totals.expense >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.income - totals.expense)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions List */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="text-center py-4">Carregando...</div>
                    ) : filteredTransactions.length === 0 ? (
                         <div className="text-center py-8 text-muted-foreground">
                            Nenhuma transação encontrada{!showAllTime && ` em ${MONTHS[selectedMonth].label}/${selectedYear}`}.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredTransactions.map((t) => {
                                const typeUpper = t.type.toUpperCase();
                                const isTransfer = typeUpper === 'TRANSFER_IN' || typeUpper === 'TRANSFER_OUT';
                                const typeLabel = isTransfer 
                                    ? (typeUpper === 'TRANSFER_OUT' ? 'Transferência ↗' : 'Transferência ↙')
                                    : (typeUpper === 'INCOME' ? 'Receita' : 'Despesa');
                                const dotColor = isTransfer 
                                    ? 'bg-blue-500' 
                                    : (typeUpper === 'INCOME' ? 'bg-green-500' : 'bg-red-500');
                                const textColor = isTransfer 
                                    ? 'text-blue-600' 
                                    : (typeUpper === 'INCOME' ? 'text-green-600' : 'text-red-600');
                                
                                return (
                                    <div 
                                        key={t.id} 
                                        className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer"
                                        onClick={() => {
                                            setSelectedTransaction(t);
                                            setDetailModalOpen(true);
                                        }}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                                                <p className="font-medium truncate">{t.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <span>{typeLabel}</span>
                                                <span>•</span>
                                                <span>{format(parseISO(t.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold whitespace-nowrap ${textColor}`}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                            </span>
                                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/transactions/${t.id}/edit`)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(t.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de detalhes */}
            <TransactionDetailModal
                transaction={selectedTransaction}
                open={detailModalOpen}
                onOpenChange={setDetailModalOpen}
                onDelete={(id) => {
                    handleDelete(id);
                    setDetailModalOpen(false);
                }}
            />
        </MobileLayout>
    );
}
