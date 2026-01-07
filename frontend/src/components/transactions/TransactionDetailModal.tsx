'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/services/transactionsService';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpIcon, ArrowDownIcon, ArrowRightLeft, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: string) => void;
}

export function TransactionDetailModal({ 
  transaction, 
  open, 
  onOpenChange,
  onDelete 
}: TransactionDetailModalProps) {
  const router = useRouter();

  if (!transaction) return null;

  const typeUpper = transaction.type.toUpperCase();
  const isTransfer = typeUpper === 'TRANSFER_IN' || typeUpper === 'TRANSFER_OUT';
  const isIncome = typeUpper === 'INCOME';
  
  const getTypeInfo = () => {
    if (isTransfer) {
      const isOut = typeUpper === 'TRANSFER_OUT';
      return {
        label: isOut ? 'Transferência Saída' : 'Transferência Entrada',
        icon: <ArrowRightLeft className="h-5 w-5" />,
        color: 'bg-blue-100 text-blue-700',
        textColor: 'text-blue-600'
      };
    }
    if (isIncome) {
      return {
        label: 'Receita',
        icon: <ArrowUpIcon className="h-5 w-5" />,
        color: 'bg-green-100 text-green-700',
        textColor: 'text-green-600'
      };
    }
    return {
      label: 'Despesa',
      icon: <ArrowDownIcon className="h-5 w-5" />,
      color: 'bg-red-100 text-red-700',
      textColor: 'text-red-600'
    };
  };

  const typeInfo = getTypeInfo();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleEdit = () => {
    onOpenChange(false);
    router.push(`/transactions/${transaction.id}/edit`);
  };

  const handleDelete = () => {
    if (onDelete && confirm('Tem certeza que deseja excluir esta transação?')) {
      onDelete(transaction.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge className={typeInfo.color}>
              {typeInfo.icon}
              <span className="ml-1">{typeInfo.label}</span>
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Valor */}
          <div className="text-center">
            <p className={`text-3xl font-bold ${typeInfo.textColor}`}>
              {formatCurrency(Number(transaction.amount))}
            </p>
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Descrição</p>
            <p className="font-medium">{transaction.description}</p>
          </div>

          {/* Data */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Data</p>
            <p className="font-medium">
              {format(parseISO(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          {/* Categoria ID */}
          {transaction.categoryId && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Categoria</p>
              <Badge variant="outline">Categoria vinculada</Badge>
            </div>
          )}

          {/* Conta ID */}
          {transaction.accountId && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Conta</p>
              <Badge variant="secondary">Conta vinculada</Badge>
            </div>
          )}

          {/* Status */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={transaction.isPaid ? 'default' : 'outline'}>
              {transaction.isPaid ? 'Pago' : 'Pendente'}
            </Badge>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={handleEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
