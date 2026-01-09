"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "./TransactionForm";
import {
  transactionsService,
  Transaction,
} from "@/services/transactionsService";
import { emitDataChange } from "@/hooks/useDataRefresh";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: "INCOME" | "EXPENSE";
  transactionId?: string | null;
  onSuccess?: () => void;
}

export function TransactionModal({
  open,
  onOpenChange,
  type = "EXPENSE",
  transactionId,
  onSuccess,
}: TransactionModalProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditMode = !!transactionId;

  // Fetch transaction data when editing
  useEffect(() => {
    if (open && transactionId) {
      const fetchTransaction = async () => {
        setLoading(true);
        try {
          const data = await transactionsService.getById(transactionId);
          setTransaction(data);
        } catch (error) {
          console.error("Failed to fetch transaction", error);
          toast.error("Erro ao carregar transação");
          onOpenChange(false);
        } finally {
          setLoading(false);
        }
      };
      fetchTransaction();
    } else if (!open) {
      // Reset when modal closes
      setTransaction(null);
    }
  }, [open, transactionId, onOpenChange]);

  const handleSuccess = () => {
    // Close modal
    onOpenChange(false);

    // Reset state
    setTransaction(null);

    // Emit events to update all relevant screens
    emitDataChange(["transactions", "accounts", "dashboard"]);

    // Notify parent component if callback exists
    if (onSuccess) {
      onSuccess();
    }
  };

  // Determine type for new transactions or from existing data
  const effectiveType =
    isEditMode && transaction
      ? (transaction.type.toUpperCase() as "INCOME" | "EXPENSE")
      : type;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-lg">✏️</span>
                </div>
                Editar Transação
              </>
            ) : effectiveType === "INCOME" ? (
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
          <DialogDescription>
            {isEditMode
              ? "Atualize os dados da transação abaixo."
              : "Preencha os dados da nova transação."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <TransactionForm
            key={transactionId || effectiveType}
            initialType={effectiveType}
            initialData={transaction || undefined}
            transactionId={transactionId || undefined}
            onSuccess={handleSuccess}
            isModal={true}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
