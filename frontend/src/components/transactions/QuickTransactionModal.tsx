'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TransactionForm } from './TransactionForm';
import { emitDataChange } from '@/hooks/useDataRefresh';

interface QuickTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'INCOME' | 'EXPENSE';
  onSuccess?: () => void;
}

export function QuickTransactionModal({ 
  open, 
  onOpenChange, 
  type,
  onSuccess 
}: QuickTransactionModalProps) {
  const handleSuccess = () => {
    // Fecha o modal
    onOpenChange(false);
    
    // Emite eventos para atualizar todas as telas relevantes
    emitDataChange(['transactions', 'accounts', 'dashboard']);
    
    // Notifica o componente pai se houver callback
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'INCOME' ? (
              <>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-lg">💰</span>
                </div>
                Nova Receita
              </>
            ) : (
              <>
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 text-lg">💸</span>
                </div>
                Nova Despesa
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <TransactionForm 
          key={type} 
          initialType={type} 
          onSuccess={handleSuccess}
          isModal={true}
        />
      </DialogContent>
    </Dialog>
  );
}
