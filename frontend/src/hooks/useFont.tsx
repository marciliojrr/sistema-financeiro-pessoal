'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type FontType = 'geist' | 'jakarta';

interface FontContextType {
  font: FontType;
  setFont: (font: FontType) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [font, setFontState] = useState<FontType>('geist');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedFont = localStorage.getItem('app-font') as FontType;
    if (savedFont && ['geist', 'jakarta'].includes(savedFont)) {
      setFontState(savedFont);
    }
    setMounted(true);
  }, []);

  const setFont = (newFont: FontType) => {
    setFontState(newFont);
    localStorage.setItem('app-font', newFont);
  };

  useEffect(() => {
    document.body.setAttribute('data-font', font);
  }, [font]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <FontContext.Provider value={{ font, setFont }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
}
