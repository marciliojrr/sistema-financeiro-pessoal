'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ClientDate() {
  const [date, setDate] = useState<Date | null>(null);

  useEffect(() => {
    setDate(new Date());
  }, []);

  if (!date) return <span className="opacity-0">...</span>;

  return (
    <>
      {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
    </>
  );
}
