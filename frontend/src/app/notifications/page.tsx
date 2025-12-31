'use client';

import { useEffect, useState } from 'react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, BellOff, CheckCheck, AlertCircle, Wallet, PiggyBank, Info } from 'lucide-react';
import { notificationsService, Notification } from '@/services/notificationsService';
import { toast } from 'sonner';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
      const data = await notificationsService.getAll(filter === 'unread' ? false : undefined);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      toast.success('Marcada como lida');
    } catch (error) {
      console.error('Failed to mark as read', error);
      toast.error('Erro ao marcar como lida');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('Todas marcadas como lidas');
    } catch (error) {
      console.error('Failed to mark all as read', error);
      toast.error('Erro ao marcar todas como lidas');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BUDGET_ALERT':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'DEBT_DUE':
        return <Wallet className="h-5 w-5 text-red-500" />;
      case 'RESERVE_GOAL':
        return <PiggyBank className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'BUDGET_ALERT':
        return 'border-l-orange-500';
      case 'DEBT_DUE':
        return 'border-l-red-500';
      case 'RESERVE_GOAL':
        return 'border-l-green-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <MobileLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Notificações
            </h1>
            <p className="text-muted-foreground text-sm">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Ler todas
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setFilter('all')}
          >
            Todas
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setFilter('unread')}
          >
            Não lidas
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Nenhuma notificação</h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'unread' 
                  ? 'Você não tem notificações não lidas.' 
                  : 'Você não tem notificações ainda.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "border-l-4 transition-all",
                getNotificationColor(notification.type),
                !notification.read && "bg-primary/5 cursor-pointer hover:bg-primary/10",
                notification.read && "opacity-75"
              )}
              onClick={() => !notification.read && handleMarkAsRead(notification.id)}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {/* Indicador de não lida - bolinha azul */}
                  <div className="flex flex-col items-center gap-1">
                    {!notification.read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    )}
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={cn(
                        "font-medium",
                        !notification.read && "font-semibold"
                      )}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Toque para ler
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(parseISO(notification.createdAt), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MobileLayout>
  );
}
