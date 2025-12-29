'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { creditCardsService, CreateCreditCardDto } from '@/services/creditCardsService';
import { CurrencyInputField } from '@/components/ui/currency-input';

const cardSchema = z.object({
  cardName: z.string().min(2, 'Nome muito curto'),
  bank: z.string().min(2, 'Nome do banco muito curto'),
  cardNumber: z.string().length(16, 'O número deve ter 16 dígitos'),
  limit: z.any(), // Currency input handling handles string/number conversion manually
  closingDay: z.coerce.number().min(1).max(31),
  dueDay: z.coerce.number().min(1).max(31),
});

type CardFormData = z.infer<typeof cardSchema>;

export default function NewCreditCardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<CardFormData>({
        resolver: zodResolver(cardSchema),
        defaultValues: {
            closingDay: 1,
            dueDay: 10
        }
    });

    const onSubmit = async (data: CardFormData) => {
        setLoading(true);
        const profileId = localStorage.getItem('profileId') || localStorage.getItem('userId');

        if (!profileId) {
            toast.error('Erro de sessão. Faça login novamente.');
            router.push('/login');
            return;
        }

        try {
            // CurrencyInput masks as string, convert to float for API
            const limitValue = typeof data.limit === 'string' 
                ? parseFloat(data.limit.replace(/[^0-9,]/g, '').replace(',', '.'))
                : data.limit;

            const payload: CreateCreditCardDto = {
                ...data,
                limit: limitValue,
                profileId: profileId!,
            };

            await creditCardsService.create(payload);
            toast.success('Cartão cadastrado com sucesso!');
            router.push('/credit-cards');
            router.refresh();
        } catch (error) {
            console.error('Create card error', error);
            toast.error('Erro ao cadastrar cartão. Verifique os dados.');
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
                <h1 className="text-xl font-bold">Novo Cartão</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Dados do Cartão</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cardName">Apelido do Cartão</Label>
                            <Input id="cardName" placeholder="Ex: Nubank Principal" {...form.register('cardName')} />
                            {form.formState.errors.cardName && <p className="text-sm text-red-500">{form.formState.errors.cardName.message}</p>}
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="bank">Banco Emissor</Label>
                            <Input id="bank" placeholder="Ex: Nubank, Itaú, Bradesco" {...form.register('bank')} />
                            {form.formState.errors.bank && <p className="text-sm text-red-500">{form.formState.errors.bank.message}</p>}
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="cardNumber">Número do Cartão (16 dígitos)</Label>
                            <Input id="cardNumber" placeholder="0000000000000000" maxLength={16} {...form.register('cardNumber')} />
                            <p className="text-xs text-muted-foreground">Digite apenas os números.</p>
                            {form.formState.errors.cardNumber && <p className="text-sm text-red-500">{form.formState.errors.cardNumber.message}</p>}
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="limit">Limite de Crédito</Label>
                            <CurrencyInputField 
                                id="limit"
                                placeholder="R$ 0,00"
                                onValueChange={(val) => form.setValue('limit', val || '')} 
                                value={form.getValues('limit')}
                            />
                            {form.formState.errors.limit && <p className="text-sm text-red-500">{form.formState.errors.limit.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="closingDay">Dia Fechamento</Label>
                                <Input type="number" id="closingDay" min={1} max={31} {...form.register('closingDay')} />
                                {form.formState.errors.closingDay && <p className="text-sm text-red-500">{form.formState.errors.closingDay.message}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="dueDay">Dia Vencimento</Label>
                                <Input type="number" id="dueDay" min={1} max={31} {...form.register('dueDay')} />
                                {form.formState.errors.dueDay && <p className="text-sm text-red-500">{form.formState.errors.dueDay.message}</p>}
                            </div>
                        </div>

                        <Button type="submit" className="w-full mt-4" disabled={loading}>
                            {loading ? 'Salvando...' : 'Cadastrar Cartão'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </MobileLayout>
    );
}
