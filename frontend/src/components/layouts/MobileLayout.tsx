'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CreditCard, PieChart, Plus, Wallet, Menu, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"


interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Início', href: '/dashboard' },
  { icon: Wallet, label: 'Dívidas', href: '/debts' },
  { icon: CreditCard, label: 'Cartões', href: '/credit-cards' },
  { icon: PieChart, label: 'Planej.', href: '/budgets' }, 
];

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-[calc(4rem+env(safe-area-inset-bottom))]">
      {/* Content */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 animate-in fade-in">
        {children}
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-md z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 w-full max-w-md mx-auto relative">
          
          {navItems.slice(0, 2).map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full space-y-1 text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* FAB - Central Action Button */}
          <div className="-mt-8">
             <Drawer>
                <DrawerTrigger asChild>
                    <Button 
                        size="icon" 
                        className="h-14 w-14 rounded-full shadow-lg border-4 border-background"
                        aria-label="Adicionar"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Ações Rápidas</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 grid grid-cols-3 gap-4">
                        <Link href="/transactions/new?type=INCOME" className="w-full">
                            <Button variant="outline" className="flex flex-col h-auto py-3 gap-2 w-full">
                                    <Wallet className="h-5 w-5 text-green-500" />
                                    <span className="text-xs">Receita</span>
                            </Button>
                        </Link>
                        <Link href="/transactions/new?type=EXPENSE" className="w-full">
                            <Button variant="outline" className="flex flex-col h-auto py-3 gap-2 w-full">
                                    <CreditCard className="h-5 w-5 text-red-500" />
                                    <span className="text-xs">Despesa</span>
                            </Button>
                        </Link>
                        <Button variant="outline" className="flex flex-col h-auto py-3 gap-2">
                             <Menu className="h-5 w-5" />
                             <span className="text-xs">Outros</span>
                        </Button>
                        <Link href="/categories" className="w-full col-span-3">
                            <Button variant="ghost" className="w-full text-xs">
                                Gerenciar Categorias
                            </Button>
                        </Link>
                        <Link href="/transactions" className="w-full col-span-3">
                            <Button variant="outline" className="w-full text-xs">
                                📋 Ver Movimentações
                            </Button>
                        </Link>
                        <div className="col-span-3 border-t pt-4 mt-2">
                            <Button 
                                variant="ghost" 
                                className="w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={logout}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sair do Sistema
                            </Button>
                        </div>
                    </div>
                </DrawerContent>
             </Drawer>
          </div>

          {navItems.slice(2).map((item) => {
             const isActive = pathname.startsWith(item.href);
             return (
               <Link
                 key={item.href}
                 href={item.href}
                 className={cn(
                   "flex flex-col items-center justify-center w-16 h-full space-y-1 text-xs font-medium transition-colors",
                   isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                 )}
               >
                 <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                 <span>{item.label}</span>
               </Link>
             );
           })}

        </div>
      </div>
    </div>
  );
}
