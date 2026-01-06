'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  CreditCard as CreditCardIcon, 
  FileText, 
  ShoppingBag,
  Receipt,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { creditCardsService, CreditCard, CreditCardInvoice } from '@/services/creditCardsService';
import { categoriesService, Category } from '@/services/categoriesService';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ExtendedCreditCard extends CreditCard {
    purchases: any[];
}

interface InvoiceWithAmount extends CreditCardInvoice {
    amount?: number;
}

export default function CardDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const [card, setCard] = useState<ExtendedCreditCard | null>(null);
    const [invoices, setInvoices] = useState<InvoiceWithAmount[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Payment Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithAmount | null>(null);
    const [paymentType, setPaymentType] = useState<'total' | 'partial' | 'minimum'>('total');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [paymentLoading, setPaymentLoading] = useState(false);

    const formatCurrency = (value: number | undefined | null) => {
        const safeValue = Number(value);
        if (isNaN(safeValue)) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(safeValue);
    };

    const getMonthName = (monthStr: string, year: number) => {
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const monthNum = parseInt(monthStr) - 1;
        return `${months[monthNum] || monthStr}/${year}`;
    };

    const fetchCardDetails = async () => {
        try {
            const data = await creditCardsService.getOne(params.id as string) as ExtendedCreditCard;
            setCard(data);
        } catch (error) {
            console.error('Failed to fetch card details', error);
            toast.error('Erro ao carregar detalhes do cartão');
            router.push('/credit-cards');
        }
    };

    const fetchInvoices = async () => {
        try {
            const data = await creditCardsService.getInvoices(params.id as string);
            setInvoices(data);
        } catch (error) {
            console.error('Failed to fetch invoices', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await categoriesService.getAll();
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchCardDetails(), fetchInvoices(), fetchCategories()]);
            setLoading(false);
        };
        if (params.id) {
            loadData();
        }
    }, [params.id]);

    const openPaymentModal = (invoice: InvoiceWithAmount) => {
        setSelectedInvoice(invoice);
        const amount = Number(invoice.amount) || Number(invoice.totalAmount) || 0;
        setPaymentAmount(amount.toFixed(2));
        setPaymentType('total');
        setSelectedCategory('');
        setPaymentModalOpen(true);
    };

    const handlePayment = async () => {
        if (!selectedInvoice) return;
        
        setPaymentLoading(true);
        try {
            const profileId = localStorage.getItem('profileId') || '';
            if (!profileId) throw new Error("Perfil não encontrado");

            await creditCardsService.payInvoice(selectedInvoice.id, { 
                profileId,
                categoryId: selectedCategory || undefined
            });
            
            toast.success("Pagamento registrado com sucesso!");
            setPaymentModalOpen(false);
            fetchInvoices();
        } catch (e) {
            toast.error("Erro ao registrar pagamento");
        } finally {
            setPaymentLoading(false);
        }
    };

    const getStatusBadge = (status: string, paid?: boolean) => {
        if (paid || status === 'PAID') {
            return <Badge className="bg-green-100 text-green-700 border-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />Paga</Badge>;
        }
        if (status === 'CLOSED') {
            return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Fechada</Badge>;
        }
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300"><AlertCircle className="h-3 w-3 mr-1" />Aberta</Badge>;
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

                {/* Card Visual */}
                <Card className="bg-linear-to-r from-slate-900 to-slate-800 text-white border-0">
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
                                <p className="font-semibold">{formatCurrency(card.limit)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-300">Fechamento</p>
                                <p className="font-semibold">Dia {card.closingDay}</p>
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
                    
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                                <FileText className="h-5 w-5 text-green-600" />
                                <span className="text-xs">Fechar Fatura</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Fechar Fatura</DialogTitle>
                                <DialogDescription>
                                    Selecione o mês e ano para encerrar a fatura. Isso congelará os lançamentos.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const month = Number(formData.get('month'));
                                const year = Number(formData.get('year'));
                                try {
                                    await creditCardsService.closeInvoice(card.id, year, month);
                                    toast.success("Fatura fechada com sucesso!");
                                    fetchInvoices();
                                } catch (err) {
                                    toast.error("Erro ao fechar fatura (verifique se já existe).");
                                }
                            }}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="month">Mês</Label>
                                            <Input id="month" name="month" type="number" min="1" max="12" defaultValue={new Date().getMonth() + 1} required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="year">Ano</Label>
                                            <Input id="year" name="year" type="number" min="2020" defaultValue={new Date().getFullYear()} required />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Confirmar Fechamento</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Invoices & History Tabs */}
                <Tabs defaultValue="invoices">
                    <TabsList className="w-full">
                        <TabsTrigger value="invoices" className="flex-1">
                            <Receipt className="h-4 w-4 mr-1" />
                            Faturas
                        </TabsTrigger>
                        <TabsTrigger value="purchases" className="flex-1">
                            <ShoppingBag className="h-4 w-4 mr-1" />
                            Compras
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="invoices" className="space-y-4 mt-4">
                        {invoices && invoices.length > 0 ? (
                            invoices.map(invoice => {
                                const amount = Number(invoice.amount) || Number(invoice.totalAmount) || 0;
                                const isPaid = invoice.paid || invoice.status === 'PAID';
                                const isClosed = invoice.status === 'CLOSED';
                                
                                return (
                                    <Card key={invoice.id} className={isPaid ? 'border-green-200 bg-green-50/30' : ''}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <p className="font-medium">{getMonthName(invoice.month, invoice.year)}</p>
                                                </div>
                                                {getStatusBadge(invoice.status, invoice.paid)}
                                            </div>
                                            
                                            <div className="flex items-center justify-between mt-3">
                                                <div>
                                                    <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
                                                    {invoice.dueDate && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Vencimento: {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                {!isPaid && isClosed && (
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => openPaymentModal(invoice)}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <DollarSign className="h-4 w-4 mr-1" />
                                                        Pagar
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Receipt className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                <p>Nenhuma fatura fechada ainda.</p>
                                <p className="text-xs mt-1">Use o botão "Fechar Fatura" para consolidar as compras do mês.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="purchases" className="mt-4">
                        <div className="space-y-2">
                             {card.purchases && card.purchases.length > 0 ? (
                                card.purchases.map((p: any) => (
                                    <div key={p.id} className="flex justify-between p-3 border rounded-md bg-card">
                                        <div>
                                            <p className="font-medium">{p.productName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {p.installments}x de {formatCurrency(p.totalValue / p.installments)}
                                            </p>
                                        </div>
                                        <span className="font-semibold">{formatCurrency(p.totalValue)}</span>
                                    </div>
                                ))
                             ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                    <p>Nenhuma compra parcelada registrada.</p>
                                </div>
                             )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Payment Modal */}
            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            Registrar Pagamento
                        </DialogTitle>
                        <DialogDescription>
                            {card?.cardName} - {selectedInvoice && getMonthName(selectedInvoice.month, selectedInvoice.year)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Invoice Total */}
                        <div className="p-4 bg-muted rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">Valor da Fatura</p>
                            <p className="text-3xl font-bold text-primary">
                                {formatCurrency(Number(selectedInvoice?.amount) || Number(selectedInvoice?.totalAmount))}
                            </p>
                        </div>

                        {/* Payment Type */}
                        <div className="space-y-2">
                            <Label>Tipo de Pagamento</Label>
                            <RadioGroup value={paymentType} onValueChange={(v) => {
                                setPaymentType(v as any);
                                const total = Number(selectedInvoice?.amount) || Number(selectedInvoice?.totalAmount) || 0;
                                if (v === 'total') setPaymentAmount(total.toFixed(2));
                                else if (v === 'minimum') setPaymentAmount((total * 0.15).toFixed(2)); // 15% mínimo
                                else setPaymentAmount('');
                            }} className="grid grid-cols-3 gap-2">
                                <div>
                                    <RadioGroupItem value="total" id="total" className="peer sr-only" />
                                    <Label 
                                        htmlFor="total" 
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 peer-data-[state=checked]:bg-green-50 cursor-pointer"
                                    >
                                        <CheckCircle2 className="h-5 w-5 mb-1 text-green-600" />
                                        <span className="text-xs font-medium">Total</span>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="partial" id="partial" className="peer sr-only" />
                                    <Label 
                                        htmlFor="partial" 
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-yellow-600 peer-data-[state=checked]:bg-yellow-50 cursor-pointer"
                                    >
                                        <Receipt className="h-5 w-5 mb-1 text-yellow-600" />
                                        <span className="text-xs font-medium">Parcial</span>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="minimum" id="minimum" className="peer sr-only" />
                                    <Label 
                                        htmlFor="minimum" 
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-600 peer-data-[state=checked]:bg-red-50 cursor-pointer"
                                    >
                                        <AlertCircle className="h-5 w-5 mb-1 text-red-600" />
                                        <span className="text-xs font-medium">Mínimo</span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Warning for minimum payment */}
                        {paymentType === 'minimum' && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                ⚠️ O pagamento mínimo acarreta juros sobre o saldo restante.
                            </div>
                        )}

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="paymentAmount">Valor Pago (R$)</Label>
                            <Input
                                id="paymentAmount"
                                type="number"
                                step="0.01"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                disabled={paymentType === 'total'}
                                placeholder="0.00"
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label>Categoria da Despesa</Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria (opcional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handlePayment} 
                            disabled={paymentLoading || !paymentAmount}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {paymentLoading ? 'Processando...' : 'Confirmar Pagamento'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MobileLayout>
    );
}
