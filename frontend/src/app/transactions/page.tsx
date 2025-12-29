'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
} from '@/components/ui/table'; // Need to create this or use standard table
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { transactionsService, Transaction } from '@/services/transactionsService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TransactionsPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        try {
            const data = await transactionsService.getAll();
            setTransactions(data);
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

    return (
        <MobileLayout>
            <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xl font-bold">Transações</CardTitle>
                    <Button onClick={() => router.push('/transactions/new')}>
                        <Plus className="mr-2 h-4 w-4" /> Nova
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Carregando...</div>
                    ) : transactions.length === 0 ? (
                         <div className="text-center py-8 text-muted-foreground">
                            Nenhuma transação encontrada.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                             <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground font-medium">
                                    <tr>
                                        <th className="p-3">Data</th>
                                        <th className="p-3">Descrição</th>
                                        <th className="p-3">Valor</th>
                                        <th className="p-3">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((t) => (
                                        <tr key={t.id} className="border-t hover:bg-muted/50">
                                            <td className="p-3">
                                                {format(new Date(t.date), 'dd/MM/yyyy', { locale: ptBR })}
                                            </td>
                                            <td className="p-3">
                                                <div className="font-medium">{t.description}</div>
                                                <div className="text-xs text-muted-foreground">{t.type === 'INCOME' ? 'Receita' : 'Despesa'}</div>
                                            </td>
                                            <td className={`p-3 font-medium ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => router.push(`/transactions/${t.id}/edit`)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(t.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </MobileLayout>
    );
}
