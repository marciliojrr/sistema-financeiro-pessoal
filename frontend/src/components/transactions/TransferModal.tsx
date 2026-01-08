'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { accountsService, Account } from '@/services/accountsService';
import { transactionsService } from '@/services/transactionsService';
import { CurrencyInputField } from '@/components/ui/currency-input';
import { emitDataChange } from '@/hooks/useDataRefresh';


interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TransferModal({ open, onOpenChange, onSuccess }: TransferModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      loadAccounts();
    }
  }, [open]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const profileId = localStorage.getItem('profileId');
      const data = await accountsService.getAll(profileId || undefined);
      setAccounts(data.filter(acc => acc.active));
    } catch (error) {
      console.error('Failed to load accounts', error);
      toast.error('Erro ao carregar contas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sourceAccountId || !destinationAccountId) {
      toast.error('Selecione as contas de origem e destino');
      return;
    }

    if (sourceAccountId === destinationAccountId) {
      toast.error('A conta de origem e destino devem ser diferentes');
      return;
    }

    if (!amount) {
      toast.error('Informe o valor da transferência');
      return;
    }

    const profileId = localStorage.getItem('profileId');
    if (!profileId) {
      toast.error('Perfil não identificado');
      return;
    }

    setSubmitting(true);

    try {
      // Valor já vem como string numérica pura do CurrencyInputField (ex: "1234.56")
      const numericAmount = parseFloat(amount);

      if (numericAmount <= 0) {
        toast.error('O valor deve ser maior que zero');
        setSubmitting(false);
        return;
      }

      const sourceAccount = accounts.find(a => a.id === sourceAccountId);
      const destAccount = accounts.find(a => a.id === destinationAccountId);
      
      const transferDescription = description.trim() || 
        `Transferência: ${sourceAccount?.name} → ${destAccount?.name}`;

      // Create transfer out from source account
      await transactionsService.create({
        description: transferDescription,
        amount: numericAmount,
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'transfer_out',
        profileId,
        accountId: sourceAccountId,
      });

      // Create transfer in to destination account
      await transactionsService.create({
        description: transferDescription,
        amount: numericAmount,
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'transfer_in',
        profileId,
        accountId: destinationAccountId,
      });

      toast.success('Transferência realizada com sucesso!');
      
      // Reset form
      setSourceAccountId('');
      setDestinationAccountId('');
      setAmount('');
      setDescription('');
      
      onOpenChange(false);
      
      // Emite eventos de mudança para atualizar outras telas
      emitDataChange(['transactions', 'accounts']);
      
      // Notify parent of successful transfer
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error('Erro ao realizar transferência');
    } finally {
      setSubmitting(false);
    }
  };

  const sourceAccount = accounts.find(a => a.id === sourceAccountId);
  const destAccount = accounts.find(a => a.id === destinationAccountId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-blue-600" />
            </div>
            Transferência entre Contas
          </DialogTitle>
          <DialogDescription>
            Transfira saldo de uma conta para outra
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : accounts.length < 2 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Você precisa de pelo menos 2 contas para fazer transferências.</p>
            <p className="text-sm mt-2">Crie mais contas em Contas.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Source Account */}
            <div className="space-y-2">
              <Label htmlFor="source">Conta de Origem</Label>
              <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta de origem" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem 
                      key={account.id} 
                      value={account.id}
                      disabled={account.id === destinationAccountId}
                    >
                      {account.name} {account.bank && `(${account.bank})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Visual Arrow */}
            {sourceAccountId && (
              <div className="flex items-center justify-center py-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
                  <span className="text-sm font-medium truncate max-w-[80px]">
                    {sourceAccount?.name}
                  </span>
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium truncate max-w-[80px]">
                    {destAccount?.name || '...'}
                  </span>
                </div>
              </div>
            )}

            {/* Destination Account */}
            <div className="space-y-2">
              <Label htmlFor="destination">Conta de Destino</Label>
              <Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta de destino" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem 
                      key={account.id} 
                      value={account.id}
                      disabled={account.id === sourceAccountId}
                    >
                      {account.name} {account.bank && `(${account.bank})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor da Transferência</Label>
              <CurrencyInputField
                id="amount"
                value={amount}
                onValueChange={(val) => setAmount(val || '')}
                placeholder="0,00"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Observação <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Reserva para emergência, Pagamento de conta..."
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Ajuda você a lembrar o motivo desta transferência
              </p>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transferindo...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Confirmar Transferência
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
