'use client';

import { useEffect, useState } from 'react';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, BellOff, CheckCheck, AlertCircle, Wallet, PiggyBank, Info, Plus, Trash2, Pencil } from 'lucide-react';
import { notificationsService, Notification, CreateNotificationDto, UpdateNotificationDto } from '@/services/notificationsService';
import { NotificationForm } from '@/components/notifications/NotificationForm';
import { toast } from 'sonner';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const profileId = typeof window !== 'undefined' ? localStorage.getItem('profileId') || '' : '';

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

  const handleCreate = async (data: CreateNotificationDto | UpdateNotificationDto) => {
    try {
      const newNotification = await notificationsService.create(data as CreateNotificationDto);
      setNotifications(prev => [newNotification, ...prev]);
      toast.success('Notificação criada!');
    } catch (error) {
      console.error('Failed to create notification', error);
      toast.error('Erro ao criar notificação');
      throw error;
    }
  };

  const handleUpdate = async (data: CreateNotificationDto | UpdateNotificationDto) => {
    if (!editingNotification) return;
    try {
      const updated = await notificationsService.update(editingNotification.id, data as UpdateNotificationDto);
      setNotifications(prev => prev.map(n => n.id === editingNotification.id ? updated : n));
      setEditingNotification(null);
      toast.success('Notificação atualizada!');
    } catch (error) {
      console.error('Failed to update notification', error);
      toast.error('Erro ao atualizar notificação');
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await notificationsService.delete(deletingId);
      setNotifications(prev => prev.filter(n => n.id !== deletingId));
      toast.success('Notificação excluída!');
    } catch (error) {
      console.error('Failed to delete notification', error);
      toast.error('Erro ao excluir notificação');
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingId(null);
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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notificações
            {unreadCount > 0 && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Ler todas
              </Button>
            )}
          </div>
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
              <p className="text-sm text-muted-foreground mb-4">
                {filter === 'unread' 
                  ? 'Você não tem notificações não lidas.' 
                  : 'Você não tem notificações ainda.'}
              </p>
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar lembrete
              </Button>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "border-l-4 transition-all",
                getNotificationColor(notification.type),
                !notification.read && "bg-primary/5",
                notification.read && "opacity-75"
              )}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {/* Icon */}
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
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingNotification(notification);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(notification.id);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(parseISO(notification.createdAt), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Marcar como lida
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Form */}
      <NotificationForm
        open={formOpen || !!editingNotification}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditingNotification(null);
          }
        }}
        notification={editingNotification}
        profileId={profileId}
        onSubmit={editingNotification ? handleUpdate : handleCreate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Notificação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}
