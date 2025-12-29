import React from 'react';
import CurrencyInput from 'react-currency-input-field';

import { cn } from '@/lib/utils';

interface CurrencyInputFieldProps {
  value: string | number;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function CurrencyInputField({
  value,
  onValueChange,
  placeholder = '0,00',
  className,
  id,
}: CurrencyInputFieldProps) {
  return (
    <CurrencyInput
      id={id}
      name="input-name"
      placeholder={placeholder}
      defaultValue={value}
      decimalsLimit={2}
      onValueChange={onValueChange}
      prefix="R$ "
      decimalSeparator=","
      groupSeparator="."
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    />
  );
}
