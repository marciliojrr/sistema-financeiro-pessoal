'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CurrencyInputFieldProps {
  value: string | number;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

/**
 * Formata um número para exibição em formato brasileiro (1.234,56)
 */
function formatToBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte uma string de valor brasileiro para número
 * Aceita formatos: "1.234,56" ou "1234.56" ou "1234,56"
 */
function parseBRLToNumber(value: string): number {
  if (!value) return 0;
  
  // Remove espaços
  let cleaned = value.trim();
  
  // Se tem tanto ponto quanto vírgula, o ponto é milhar e vírgula é decimal
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  // Se tem só vírgula, ela é o separador decimal
  else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }
  // Se tem só ponto, precisamos determinar se é milhar ou decimal
  // Se o ponto está seguido de exatamente 2 dígitos no final, é decimal
  // Caso contrário, é milhar
  else if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      // É decimal, mantém como está
    } else {
      // É milhar, remove
      cleaned = cleaned.replace(/\./g, '');
    }
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function CurrencyInputField({
  value,
  onValueChange,
  placeholder = '0,00',
  className,
  id,
}: CurrencyInputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState('');
  const [hasLocalEdits, setHasLocalEdits] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calcula o valor de display baseado no estado
  const getDisplayValue = (): string => {
    // Se o usuário está editando, usa o valor local
    if (isFocused || hasLocalEdits) {
      return localValue;
    }
    
    // Caso contrário, formata o valor da prop
    if (value === undefined || value === '' || value === 0) {
      return '';
    }
    
    const numVal = typeof value === 'string' ? parseBRLToNumber(value) : value;
    if (numVal > 0) {
      return formatToBRL(numVal);
    }
    return '';
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const cursorPos = input.selectionStart || 0;
    const rawValue = input.value;
    
    // Permite apenas dígitos e um separador decimal (vírgula ou ponto)
    let cleaned = '';
    let hasDecimal = false;
    let decimals = 0;
    
    for (const char of rawValue) {
      if (char >= '0' && char <= '9') {
        if (hasDecimal) {
          if (decimals < 2) {
            cleaned += char;
            decimals++;
          }
        } else {
          cleaned += char;
        }
      } else if ((char === ',' || char === '.') && !hasDecimal) {
        cleaned += ',';
        hasDecimal = true;
      }
    }

    setHasLocalEdits(true);
    setLocalValue(cleaned);

    // Notifica o parent com o valor numérico puro (string com ponto decimal)
    if (cleaned) {
      const numericStr = cleaned.replace(',', '.');
      onValueChange(numericStr);
    } else {
      onValueChange(undefined);
    }
    
    // Restaura posição do cursor
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const newPos = Math.min(cursorPos, cleaned.length);
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    });
  };

  const handleFocus = () => {
    setIsFocused(true);
    
    // Ao focar, mostra o valor atual sem formatação de milhar para facilitar edição
    const currentNumVal = typeof value === 'string' ? parseBRLToNumber(value) : (value || 0);
    if (currentNumVal > 0) {
      setLocalValue(currentNumVal.toFixed(2).replace('.', ','));
    } else {
      setLocalValue('');
    }
    setHasLocalEdits(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    if (localValue) {
      const numVal = parseBRLToNumber(localValue);
      if (numVal > 0) {
        // Garante que o valor numérico está correto
        onValueChange(numVal.toString());
      } else {
        onValueChange(undefined);
      }
    }
    
    // Reseta as edições locais para que o componente volte a usar a prop
    setHasLocalEdits(false);
    setLocalValue('');
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
        value={getDisplayValue()}
        onChange={() => {}} // Controlled by onInput
        onInput={handleInput}
        onFocus={handleFocus}
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
