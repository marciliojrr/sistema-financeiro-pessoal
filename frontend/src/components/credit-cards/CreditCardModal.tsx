'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInputField } from '@/components/ui/currency-input';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { creditCardsService, CreateCreditCardDto } from '@/services/creditCardsService';
import { emitDataChange } from '@/hooks/useDataRefresh';

const cardSchema = z.object({
  cardName: z.string().min(2, 'Nome muito curto'),
  bank: z.string().min(2, 'Nome do banco muito curto'),
  cardNumber: z.string().length(16, 'O número deve ter 16 dígitos'),
  limit: z.union([z.string(), z.number()]),
  closingDay: z.coerce.number().min(1).max(31),
  dueDay: z.coerce.number().min(1).max(31),
});

type CardFormData = z.infer<typeof cardSchema>;

interface CreditCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreditCardModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreditCardModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      cardName: '',
      bank: '',
      cardNumber: '',
      limit: '',
      closingDay: 1,
      dueDay: 10
    }
  });

  const resetForm = () => {
    form.reset({
      cardName: '',
      bank: '',
      cardNumber: '',
      limit: '',
      closingDay: 1,
      dueDay: 10
    });
  };

  const onSubmit = async (data: CardFormData) => {
    setLoading(true);
    const profileId = localStorage.getItem('profileId') || localStorage.getItem('userId');

    if (!profileId) {
      toast.error('Erro de sessão. Faça login novamente.');
      setLoading(false);
      return;
    }

    try {
      const limitValue = typeof data.limit === 'string' 
        ? parseFloat(data.limit)
        : data.limit;

      const payload: CreateCreditCardDto = {
        ...data,
        limit: limitValue,
        profileId: profileId!,
      };

      await creditCardsService.create(payload);
      toast.success('Cartão cadastrado com sucesso!');
      
      // Reset form and close modal
      resetForm();
      onOpenChange(false);
      
      // Emit event to update other screens
      emitDataChange('credit-cards');
      
      // Notify parent component if callback exists
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Create card error', error);
      toast.error('Erro ao cadastrar cartão. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-slate-600" />
            </div>
            Novo Cartão de Crédito
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do seu cartão de crédito.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
              placeholder="0,00"
              onValueChange={(val) => form.setValue('limit', val || '')} 
              value={form.watch('limit')}
            />
            {form.formState.errors.limit && <p className="text-sm text-red-500">{form.formState.errors.limit.message?.toString()}</p>}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar Cartão'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
