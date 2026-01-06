'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Wallet,
  CreditCard,
  PiggyBank,
  Target,
  TrendingUp,
  RefreshCw,
  Calculator,
  Tag,
  Bell,
  Download,
  Upload,
  Database,
  Settings,
  LogOut,
  ChevronRight,
  HelpCircle,
  Star,
  Check,
  Type,
  Pencil,
} from 'lucide-react';
import { useFont } from '@/hooks/useFont';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { UserAvatar } from '@/components/UserAvatar';
import { AvatarSelection } from '@/components/auth/AvatarSelection';
import { userService } from '@/services/userService';
import { toast } from 'sonner';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  gradient: string;
  iconColor: string;
}

const financeItems: MenuItem[] = [
  {
    icon: Wallet,
    label: 'Contas Bancárias',
    description: 'Gerenciar suas contas e saldos',
    href: '/accounts',
    gradient: 'from-blue-500 to-blue-600',
    iconColor: 'text-white',
  },
  {
    icon: CreditCard,
    label: 'Dívidas',
    description: 'Empréstimos e financiamentos',
    href: '/debts',
    gradient: 'from-red-500 to-rose-600',
    iconColor: 'text-white',
  },
  {
    icon: RefreshCw,
    label: 'Recorrentes',
    description: 'Despesas e receitas automáticas',
    href: '/recurring',
    gradient: 'from-purple-500 to-violet-600',
    iconColor: 'text-white',
  },
];

const planningItems: MenuItem[] = [
  {
    icon: Target,
    label: 'Orçamentos',
    description: 'Limites mensais por categoria',
    href: '/budgets',
    gradient: 'from-green-500 to-emerald-600',
    iconColor: 'text-white',
  },
  {
    icon: PiggyBank,
    label: 'Reservas',
    description: 'Metas de poupança e investimentos',
    href: '/reserves',
    gradient: 'from-pink-500 to-rose-500',
    iconColor: 'text-white',
  },
  {
    icon: Calculator,
    label: 'Simulação',
    description: 'Simule compras parceladas',
    href: '/simulation',
    gradient: 'from-orange-500 to-amber-600',
    iconColor: 'text-white',
  },
];

const systemItems: MenuItem[] = [
  {
    icon: Tag,
    label: 'Categorias',
    description: 'Organizar suas categorias',
    href: '/categories',
    gradient: 'from-indigo-500 to-blue-600',
    iconColor: 'text-white',
  },
  {
    icon: Bell,
    label: 'Notificações',
    description: 'Alertas e lembretes',
    href: '/notifications',
    gradient: 'from-yellow-500 to-orange-500',
    iconColor: 'text-white',
  },
  {
    icon: TrendingUp,
    label: 'Movimentações',
    description: 'Histórico completo de transações',
    href: '/transactions',
    gradient: 'from-emerald-500 to-teal-600',
    iconColor: 'text-white',
  },
];

const dataItems: MenuItem[] = [
  {
    icon: Download,
    label: 'Importar Dados',
    description: 'Importar extratos e planilhas',
    href: '/import',
    gradient: 'from-cyan-500 to-blue-500',
    iconColor: 'text-white',
  },
  {
    icon: Upload,
    label: 'Exportar Dados',
    description: 'Baixe seus dados em CSV',
    href: '/export',
    gradient: 'from-teal-500 to-cyan-600',
    iconColor: 'text-white',
  },
  {
    icon: Database,
    label: 'Backup',
    description: 'Backup e restauração',
    href: '/backup',
    gradient: 'from-slate-500 to-gray-600',
    iconColor: 'text-white',
  },
  {
    icon: Settings,
    label: 'Configurações',
    description: 'Preferências do sistema',
    href: '/settings',
    gradient: 'from-gray-500 to-slate-600',
    iconColor: 'text-white',
  },
];

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
        {title}
      </h2>
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardContent className="p-0">
          {items.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 p-4 hover:bg-muted/50 active:bg-muted transition-all duration-200 ${
                index !== items.length - 1 ? 'border-b border-border/50' : ''
              }`}
            >
              <div className={`p-2.5 rounded-xl bg-linear-to-br ${item.gradient} shadow-lg shadow-${item.gradient.split('-')[1]}/20`}>
                <item.icon className={`h-5 w-5 ${item.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {item.description}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MorePage() {
  const { logout, userName, userAvatar, updateUser } = useAuth();
  const { font, setFont } = useFont(); 
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAvatarDrawerOpen, setIsAvatarDrawerOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserEmail(localStorage.getItem('userEmail'));
    setUserId(localStorage.getItem('userId'));
  }, []);

  const handleAvatarUpdate = async (newAvatar: string) => {
    if (!userId) return;
    
    try {
      await userService.update(userId, { avatar: newAvatar });
      updateUser(userName || '', newAvatar);
      setIsAvatarDrawerOpen(false);
      toast.success('Avatar atualizado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar avatar');
    }
  };

  return (
    <MobileLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Mais Opções
          </h1>
        </div>

        {/* User Profile Card */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="bg-linear-to-br from-primary via-primary to-primary/80 p-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="ring-2 ring-white/30 rounded-full">
                  <UserAvatar 
                    name={userName} 
                    avatar={userAvatar} 
                    size="lg" 
                    className="border-2 border-white/20"
                  />
                </div>
                <Drawer open={isAvatarDrawerOpen} onOpenChange={setIsAvatarDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full shadow-md hover:scale-105 transition-transform"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Alterar Avatar</DrawerTitle>
                      <DrawerDescription>Escolha um novo estilo para o seu perfil</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                      <AvatarSelection 
                        selectedAvatar={userAvatar} 
                        onSelect={handleAvatarUpdate} 
                        userName={userName || 'User'} 
                      />
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-lg truncate">
                  {userName || 'Usuário'}
                </p>
                <p className="text-sm text-white/70 truncate">{userEmail || ''}</p>
              </div>
              <Link href="/settings">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white/70 hover:text-white hover:bg-white/20"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Quick Stats or Actions */}
          <div className="grid grid-cols-3 divide-x divide-border/50 bg-muted/30">
            <Link href="/transactions" className="p-3 text-center hover:bg-muted/50 transition-colors">
              <TrendingUp className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Transações</span>
            </Link>
            <Link href="/credit-cards" className="p-3 text-center hover:bg-muted/50 transition-colors">
              <CreditCard className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Cartões</span>
            </Link>
            <Link href="/budgets" className="p-3 text-center hover:bg-muted/50 transition-colors">
              <Target className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Orçamentos</span>
            </Link>
          </div>
        </Card>

        {/* Appearance Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Aparência
          </h2>
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="p-4 bg-muted/20 border-b border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    <Type className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Estilo da Fonte</h3>
                    <p className="text-xs text-muted-foreground">Escolha a tipografia do sistema</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFont('geist')}
                    className={`relative p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                      font === 'geist'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                        : 'border-transparent bg-background hover:bg-muted'
                    }`}
                  >
                    <div className="font-sans text-sm font-medium mb-1">Geist (Padrão)</div>
                    <div className="text-xs text-muted-foreground">Moderna e limpa</div>
                    {font === 'geist' && (
                      <div className="absolute top-2 right-2 p-1 rounded-full bg-blue-600 text-white">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setFont('jakarta')}
                    className={`relative p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                      font === 'jakarta'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                        : 'border-transparent bg-background hover:bg-muted'
                    }`}
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    <div className="text-sm font-medium mb-1">Jakarta Sans</div>
                    <div className="text-xs text-muted-foreground">Geométrica</div>
                    {font === 'jakarta' && (
                      <div className="absolute top-2 right-2 p-1 rounded-full bg-blue-600 text-white">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Sections */}
        <MenuSection title="💰 Finanças" items={financeItems} />
        <MenuSection title="📊 Planejamento" items={planningItems} />
        <MenuSection title="⚙️ Sistema" items={systemItems} />
        <MenuSection title="📁 Dados" items={dataItems} />

        {/* Help & Support Section */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <Link
              href="/settings"
              className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b border-border/50"
            >
              <div className="p-2.5 rounded-xl bg-linear-to-br from-blue-400 to-indigo-500 shadow-lg">
                <HelpCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Ajuda & Suporte</p>
                <p className="text-xs text-muted-foreground">Dúvidas frequentes</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="p-2.5 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 shadow-lg">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Avaliar o App</p>
                <p className="text-xs text-muted-foreground">Deixe sua opinião</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </Link>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <Button
              variant="ghost"
              className="w-full justify-start gap-4 p-4 h-auto text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-none"
              onClick={logout}
            >
              <div className="p-2.5 rounded-xl bg-linear-to-br from-red-500 to-rose-600 shadow-lg">
                <LogOut className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Sair do Sistema</p>
                <p className="text-xs text-red-400">Encerrar sessão atual</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Version Info */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Sistema Financeiro Pessoal
          </p>
          <p className="text-xs text-muted-foreground/60">
            Versão 1.0.0
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
