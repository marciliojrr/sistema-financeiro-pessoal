'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, CreditCard as CreditCardIcon, FileText, ShoppingBag, Plus } from 'lucide-react';
import { creditCardsService, CreditCard, CreditCardInvoice, InstallmentItem } from '@/services/creditCardsService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExtendedCreditCard extends CreditCard {
    invoices: CreditCardInvoice[];
    purchases: any[]; // Defines basic structure
}

export default function CardDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const [card, setCard] = useState<ExtendedCreditCard | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchCardDetails = async () => {
        try {
            const data = await creditCardsService.getOne(params.id as string) as ExtendedCreditCard;
            setCard(data);
        } catch (error) {
            console.error('Failed to fetch card details', error);
            toast.error('Erro ao carregar detalhes do cartão');
            router.push('/credit-cards');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchCardDetails();
        }
    }, [params.id]);

    const handlePayInvoice = async (invoiceId: string, amount: number) => {
        // Simple navigation to payment confirmation or direct action?
        // Let's implement a direct action for now or a modal.
        // For simplicity, let's confirm via window.confirm
        if (!confirm(`Deseja pagar a fatura de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}? Isso lançará uma despesa.`)) return;
        
        try {
            const profileId = localStorage.getItem('profileId') || localStorage.getItem('userId');
            if(!profileId) throw new Error("No profile");

            await creditCardsService.payInvoice(invoiceId, { profileId });
            toast.success("Fatura paga com sucesso!");
            fetchCardDetails();
        } catch (e) {
            toast.error("Erro ao pagar fatura");
        }
    };

    if (loading) return <MobileLayout><div className="p-4 text-center">Carregando...</div></MobileLayout>;
    if (!card) return <MobileLayout><div className="p-4 text-center">Cartão não encontrado</div></MobileLayout>;

    return (
        <MobileLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/credit-cards')}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold">{card.cardName}</h1>
                </div>

                {/* Card Info */}
                <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-0">
                    <CardHeader className="pb-2">
                         <div className="flex justify-between items-start">
                            <CardTitle className="text-lg text-white">{card.bank}</CardTitle>
                            <CreditCardIcon className="h-6 w-6 opacity-70" />
                        </div>
                    </CardHeader>
                    <CardContent>
                          <div className="text-2xl font-mono tracking-wider mb-4">
                            •••• {card.cardNumber.slice(-4)}
                        </div>
                        <div className="flex justify-between text-sm opacity-90">
                            <div>
                                <p className="text-xs text-slate-300">Limite</p>
                                <p className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.limit)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-300">Vencimento</p>
                                <p className="font-semibold">Dia {card.dueDay}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 {/* Quick Actions */}
                 <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => router.push(`/credit-cards/${card.id}/purchase`)}>
                        <ShoppingBag className="h-5 w-5 text-blue-500" />
                        <span className="text-xs">Nova Compra</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" disabled title="Em breve">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="text-xs text-gray-400">Gerar Fatura</span>
                    </Button>
                </div>

                {/* Invoices & History */}
                <Tabs defaultValue="invoices">
                    <TabsList className="w-full">
                        <TabsTrigger value="invoices" className="flex-1">Faturas</TabsTrigger>
                        <TabsTrigger value="purchases" className="flex-1">Compras Recentes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="invoices" className="space-y-4 mt-4">
                        {card.invoices && card.invoices.length > 0 ? (
                            card.invoices.map(invoice => (
                                <Card key={invoice.id}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-lg">{format(new Date(invoice.month + '-10'), 'MMMM yyyy', { locale: ptBR })}</p>
                                            <Badge variant={invoice.paid ? "default" : "destructive"}>
                                                {invoice.paid ? "Paga" : "Aberta"}
                                            </Badge>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.totalAmount)}</p>
                                           {!invoice.paid && (
                                                <Button size="sm" variant="link" className="px-0 h-auto text-blue-600" onClick={() => handlePayInvoice(invoice.id, invoice.totalAmount)}>
                                                    Pagar agora
                                                </Button>
                                           )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">Nenhuma fatura fechada ainda.</div>
                        )}
                    </TabsContent>

                    <TabsContent value="purchases" className="mt-4">
                        <div className="space-y-2">
                             {card.purchases && card.purchases.length > 0 ? (
                                card.purchases.map((p: any) => (
                                    <div key={p.id} className="flex justify-between p-3 border rounded-md bg-card">
                                        <div>
                                            <p className="font-medium">{p.productName}</p>
                                            <p className="text-xs text-muted-foreground">{p.installments}x de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.totalValue / p.installments)}</p>
                                        </div>
                                        <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.totalValue)}</span>
                                    </div>
                                ))
                             ) : (
                                <div className="text-center py-8 text-muted-foreground">Nenhuma compra parcelada registrada.</div>
                             )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </MobileLayout>
    );
}
