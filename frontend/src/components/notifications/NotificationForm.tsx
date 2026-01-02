'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Notification, CreateNotificationDto, UpdateNotificationDto } from '@/services/notificationsService';
import { Loader2 } from 'lucide-react';

interface NotificationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification?: Notification | null;
  profileId: string;
  onSubmit: (data: CreateNotificationDto | UpdateNotificationDto) => Promise<void>;
}

const NOTIFICATION_TYPES = [
  { value: 'BUDGET_ALERT', label: 'Alerta de Orçamento' },
  { value: 'DEBT_DUE', label: 'Vencimento de Dívida' },
  { value: 'RESERVE_GOAL', label: 'Meta de Reserva' },
  { value: 'SYSTEM', label: 'Sistema' },
];

export function NotificationForm({
  open,
  onOpenChange,
  notification,
  profileId,
  onSubmit,
}: NotificationFormProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(notification?.title || '');
  const [message, setMessage] = useState(notification?.message || '');
  const [type, setType] = useState(notification?.type || 'SYSTEM');

  const isEditing = !!notification;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        await onSubmit({ title, message, type });
      } else {
        await onSubmit({ profileId, title, message, type });
      }
      onOpenChange(false);
      setTitle('');
      setMessage('');
      setType('SYSTEM');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Notificação' : 'Nova Notificação'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados da notificação.'
              : 'Crie um lembrete ou alerta personalizado.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Conta de luz vence amanhã"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Detalhes da notificação..."
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
