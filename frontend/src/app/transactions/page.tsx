'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
} from '@/components/ui/table'; // Need to create this or use standard table
import { Plus, Pencil, Trash2, Receipt, Download } from 'lucide-react';
import { transactionsService, Transaction } from '@/services/transactionsService';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TransactionsPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        try {
            const data = await transactionsService.getAll();
            // Filtrar para não mostrar parcelas de compras parceladas
            const filtered = data.filter(t => !t.installmentPurchaseId);
            setTransactions(filtered);
        } catch (error) {
            console.error('Failed to fetch transactions', error);
            toast.error('Erro ao carregar transações');
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <MobileLayout>
            <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Transações
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleExportCSV}>
                            <Download className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => router.push('/transactions/new')}>
                            <Plus className="mr-2 h-4 w-4" /> Nova
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="text-center py-4">Carregando...</div>
                    ) : transactions.length === 0 ? (
                         <div className="text-center py-8 text-muted-foreground">
                            Nenhuma transação encontrada.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {transactions.map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${t.type.toUpperCase() === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <p className="font-medium truncate">{t.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            <span>{t.type.toUpperCase() === 'INCOME' ? 'Receita' : 'Despesa'}</span>
                                            <span>•</span>
                                            <span>{format(parseISO(t.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold whitespace-nowrap ${t.type.toUpperCase() === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                        </span>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/transactions/${t.id}/edit`)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(t.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </MobileLayout>
    );
}
