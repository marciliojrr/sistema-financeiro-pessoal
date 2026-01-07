'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod'; // Standard import
import { zodResolver } from '@hookform/resolvers/zod';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { creditCardsService, CreateInstallmentPurchaseDto } from '@/services/creditCardsService';
import { CurrencyInputField } from '@/components/ui/currency-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categoriesService, FinancialCategory } from '@/services/categoriesService'; // Need to be sure this exists

const purchaseSchema = z.object({
  productName: z.string().min(2, 'Nome do produto necessário'),
  totalValue: z.string().min(1, 'Valor obrigatório'),
  installments: z.string().transform(v => parseInt(v)).refine(v => v >= 1, 'Mínimo 1 parcela'),
  purchaseDate: z.string().min(1, 'Data obrigatória'),
  categoryId: z.string().optional()
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

export default function NewPurchasePage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<FinancialCategory[]>([]);
    
    // Fetch categories for selection
    useEffect(() => {
        categoriesService.getAll()
            .then(setCategories)
            .catch(err => console.error("Failed to load categories", err));
    }, []);

    const form = useForm<PurchaseFormData>({
        resolver: zodResolver(purchaseSchema),
        defaultValues: {
            installments: 1,
            purchaseDate: new Date().toISOString().split('T')[0]
        }
    });

    const onSubmit = async (data: PurchaseFormData) => {
        setLoading(true);
        try {
             const cleanValue = String(data.totalValue).replace(/[^0-9,]/g, '').replace(',', '.');
             
             const payload: CreateInstallmentPurchaseDto = {
                productName: data.productName,
                totalValue: parseFloat(cleanValue),
                installments: data.installments,
                purchaseDate: data.purchaseDate,
                // @ts-ignore
                creditCardId: params.id as string,
                categoryId: data.categoryId === "none" ? undefined : data.categoryId
             };

             await creditCardsService.createInstallmentPurchase(payload);
             toast.success('Compra registrada com sucesso!');
             router.push(`/credit-cards/${params.id}`);
        } catch (error) {
            console.error('Failed to create purchase', error);
            toast.error('Erro ao registrar compra.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MobileLayout>
            <div className="flex items-center gap-2 mb-6">
                 <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold">Nova Compra Parcelada</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalhes da Compra</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="productName">O que você comprou?</Label>
                            <Input id="productName" placeholder="Ex: Geladeira, iPhone, Roupas..." {...form.register('productName')} />
                            {form.formState.errors.productName && <p className="text-sm text-red-500">{form.formState.errors.productName.message}</p>}
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="totalValue">Valor Total</Label>
                            <CurrencyInputField 
                                id="totalValue"
                                placeholder="0,00"
                                onValueChange={(val) => form.setValue('totalValue', val || '')} 
                                value={form.getValues('totalValue')}
                            />
                            {form.formState.errors.totalValue && <p className="text-sm text-red-500">{form.formState.errors.totalValue.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="installments">Número de Parcelas</Label>
                            <Input type="number" id="installments" min={1} {...form.register('installments')} />
                             <p className="text-xs text-muted-foreground">O valor das parcelas será calculado automaticamente.</p>
                            {form.formState.errors.installments && <p className="text-sm text-red-500">{form.formState.errors.installments.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="purchaseDate">Data da Compra</Label>
                            <Input type="date" id="purchaseDate" {...form.register('purchaseDate')} />
                            {form.formState.errors.purchaseDate && <p className="text-sm text-red-500">{form.formState.errors.purchaseDate.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="categoryId">Categoria</Label>
                            <Select onValueChange={(v) => form.setValue('categoryId', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sem categoria</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" className="w-full mt-4" disabled={loading}>
                            {loading ? 'Processando...' : 'Lançar Compra'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </MobileLayout>
    );    
}
