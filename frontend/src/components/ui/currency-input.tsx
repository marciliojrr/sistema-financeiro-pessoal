'use client';

import React, { useRef } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Initialize only once with the initial value
  const initialValueRef = useRef<string | null>(null);
  if (initialValueRef.current === null) {
    if (value !== undefined && value !== '' && value !== 0) {
      const numVal = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(numVal)) {
        initialValueRef.current = numVal.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      } else {
        initialValueRef.current = '';
      }
    } else {
      initialValueRef.current = '';
    }
  }

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const cursorPos = input.selectionStart || 0;
    let rawValue = input.value;
    
    // Keep only digits and one comma
    let cleaned = '';
    let hasComma = false;
    let decimals = 0;
    
    for (const char of rawValue) {
      if (char >= '0' && char <= '9') {
        if (hasComma) {
          if (decimals < 2) {
            cleaned += char;
            decimals++;
          }
        } else {
          cleaned += char;
        }
      } else if ((char === ',' || char === '.') && !hasComma) {
        cleaned += ',';
        hasComma = true;
      }
    }

    // Update input value directly (bypass React state for responsiveness)
    input.value = cleaned;
    
    // Restore cursor position
    const newPos = Math.min(cursorPos, cleaned.length);
    input.setSelectionRange(newPos, newPos);

    // Notify parent
    if (cleaned) {
      const numericStr = cleaned.replace(',', '.');
      onValueChange(numericStr);
    } else {
      onValueChange(undefined);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const raw = input.value;
    
    if (raw) {
      const numericStr = raw.replace(',', '.');
      const num = parseFloat(numericStr);
      if (!isNaN(num)) {
        input.value = num.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
    }
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none">
        R$
      </span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        defaultValue={initialValueRef.current}
        onInput={handleInput}
        onBlur={handleBlur}
        autoComplete="off"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    </div>
  );
}
