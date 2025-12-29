'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Plus, CreditCard as CreditCardIcon, Calendar, Trash2 } from 'lucide-react';
import { creditCardsService, CreditCard } from '@/services/creditCardsService';
import { toast } from 'sonner';

export default function CreditCardsPage() {
    const router = useRouter();
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCards = async () => {
        try {
            const data = await creditCardsService.getAll();
            setCards(data);
        } catch (error) {
            console.error('Failed to fetch credit cards', error);
            toast.error('Erro ao carregar cartões');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCards();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este cartão?')) return;
        try {
            await creditCardsService.delete(id);
            toast.success('Cartão excluído com sucesso');
            fetchCards();
        } catch (error) {
            console.error('Failed to delete card', error);
            toast.error('Erro ao excluir cartão');
        }
    };

    return (
        <MobileLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Meus Cartões</h1>
                <Button onClick={() => router.push('/credit-cards/new')}>
                    <Plus className="mr-2 h-4 w-4" /> Novo
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-8">Carregando...</div>
            ) : cards.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                     <CreditCardIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                     <h3 className="text-lg font-medium">Nenhum cartão cadastrado</h3>
                     <p className="text-sm text-muted-foreground mt-2 mb-6">Cadastre seus cartões para gerenciar faturas.</p>
                     <Button onClick={() => router.push('/credit-cards/new')}>
                        <Plus className="mr-2 h-4 w-4" /> Cadastrar Cartão
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {cards.map((card) => (
                        <Link href={`/credit-cards/${card.id}`} key={card.id} className="block transition-transform hover:scale-[1.02]">
                            <Card className="overflow-hidden cursor-pointer h-full">
                                <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{card.cardName}</CardTitle>
                                            <CardDescription className="text-slate-300">{card.bank}</CardDescription>
                                        </div>
                                        <CreditCardIcon className="h-6 w-6 opacity-70" />
                                    </div>
                                    <div className="mt-4 text-xl font-mono tracking-wider">
                                        •••• •••• •••• {card.cardNumber.slice(-4)}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-sm text-muted-foreground">Limite</div>
                                        <div className="font-bold text-lg text-green-600">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.limit)}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>Fecha dia {card.closingDay}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>Vence dia {card.dueDay}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/30 p-2 flex justify-end">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50" 
                                        onClick={(e) => {
                                            e.preventDefault(); // Prevent navigation when clicking delete
                                            handleDelete(card.id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                    </Button>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </MobileLayout>
    );
}
