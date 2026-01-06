'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, CreditCard, Plus, Wallet, ArrowLeftRight, MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer"
import { QuickTransactionModal } from '@/components/transactions/QuickTransactionModal';
import { TransferModal } from '@/components/transactions/TransferModal';


interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Início', href: '/dashboard' },
  { icon: Wallet, label: 'Contas', href: '/accounts' },
  { icon: CreditCard, label: 'Cartões', href: '/credit-cards' },
  { icon: MoreHorizontal, label: 'Mais', href: '/more' }, 
];

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  const handleOpenTransactionModal = (type: 'INCOME' | 'EXPENSE') => {
    setTransactionType(type);
    setDrawerOpen(false);
    // Small delay to allow drawer to close first
    setTimeout(() => {
      setTransactionModalOpen(true);
    }, 100);
  };

  const handleOpenTransferModal = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setTransferModalOpen(true);
    }, 100);
  };

  const handleTransactionSuccess = () => {
    setTransactionModalOpen(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-[calc(4rem+env(safe-area-inset-bottom))]">
      {/* Content */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 animate-in fade-in">
        {children}
      </main>

      {/* Transaction Modals */}
      <QuickTransactionModal
        open={transactionModalOpen}
        onOpenChange={setTransactionModalOpen}
        type={transactionType}
      />
      
      <TransferModal
        open={transferModalOpen}
        onOpenChange={setTransferModalOpen}
        onSuccess={() => router.refresh()}
      />

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
             <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
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
                    <DrawerHeader className="relative">
                        <DrawerTitle>Ações Rápidas</DrawerTitle>
                        <DrawerDescription className="sr-only">Selecione uma ação para realizar</DrawerDescription>
                        <DrawerClose asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-4 top-4 h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </DrawerClose>
                    </DrawerHeader>
                    <div className="p-4 pb-8">
                        <div className="grid grid-cols-3 gap-4">
                            <Button 
                              variant="outline" 
                              className="flex flex-col h-auto py-4 gap-2 w-full border-2 hover:border-green-500 hover:bg-green-50"
                              onClick={() => handleOpenTransactionModal('INCOME')}
                            >
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <Wallet className="h-5 w-5 text-green-600" />
                                </div>
                                <span className="text-sm font-medium">Receita</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="flex flex-col h-auto py-4 gap-2 w-full border-2 hover:border-red-500 hover:bg-red-50"
                              onClick={() => handleOpenTransactionModal('EXPENSE')}
                            >
                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <CreditCard className="h-5 w-5 text-red-600" />
                                </div>
                                <span className="text-sm font-medium">Despesa</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="flex flex-col h-auto py-4 gap-2 w-full border-2 hover:border-blue-500 hover:bg-blue-50"
                              onClick={handleOpenTransferModal}
                            >
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <ArrowLeftRight className="h-5 w-5 text-blue-600" />
                                </div>
                                <span className="text-sm font-medium">Transferir</span>
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-4">
                            Para mais opções, acesse o menu &quot;Mais&quot;
                        </p>
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
