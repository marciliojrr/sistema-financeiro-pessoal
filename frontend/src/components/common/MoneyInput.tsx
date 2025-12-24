'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface MoneyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  value?: number; // External value (controlled)
  onValueChange?: (val: number) => void;
  prefix?: string;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, label, error, value, onValueChange, ...props }, ref) => {
    // Internal state for formatting
    const [displayValue, setDisplayValue] = React.useState('');

    React.useEffect(() => {
      if (value !== undefined) {
          // Format initial value
          // Note: This needs careful handling to avoid cursor jumping if we were editing
          // For now, naive implementation: if external value changes, update display
          // In a real robust input, we'd handle cursor position or use a library like react-number-format
          // But "don't invent stack" -> we stick to basics + logic.
          
          // Simple logic:
          // Value 123.45 -> "R$ 123,45"
          const formatted = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
          }).format(value);
          setDisplayValue(formatted.replace('R$', '').trim());
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Get raw input
      let raw = e.target.value;
      
      // Remove everything that is not digit
      raw = raw.replace(/\D/g, '');

      if (!raw) {
          setDisplayValue('');
          onValueChange && onValueChange(0);
          return;
      }

      // Convert to number (cents)
      const numValue = parseInt(raw, 10) / 100;
      
      // Notify parent
      onValueChange && onValueChange(numValue);

      // We don't update displayValue here immediately to valid BRL string because it might mess up typing?
      // Actually standard pattern for Money Input is:
      // User types "1" -> 0,01
      // User types "12" -> 0,12
      // User types "123" -> 1,23
      
      const formatted = new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
      }).format(numValue);
      
      setDisplayValue(formatted);
    };

    return (
      <div className="space-y-2">
        {label && <Label className={error ? 'text-destructive' : ''}>{label}</Label>}
        <div className="relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                 R$
             </span>
             <Input
                inputMode="decimal"
                ref={ref}
                value={displayValue}
                onChange={handleChange}
                className={cn('pl-9', error && 'border-destructive focus-visible:ring-destructive', className)}
                placeholder="0,00"
                {...props}
            />
        </div>
        {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      </div>
    );
  }
);
MoneyInput.displayName = 'MoneyInput';
