'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, CheckCircle2 } from 'lucide-react';

interface ProfileNotificationModalProps {
  profileName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileNotificationModal({
  profileName,
  isOpen,
  onClose,
}: ProfileNotificationModalProps) {
  const [open, setOpen] = useState(isOpen);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  // Auto-close after 2 seconds
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setOpen(false);
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      setOpen(value);
      if (!value) onClose();
    }}>
      <DialogContent className="max-w-xs text-center">
        <DialogHeader className="items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <DialogTitle className="text-lg">Login realizado!</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <User className="h-4 w-4" />
            <span className="text-sm">Perfil ativo:</span>
          </div>
          <p className="text-xl font-bold text-primary">{profileName}</p>
        </div>

        <Button onClick={handleClose} className="w-full">
          OK
        </Button>
        
        <p className="text-xs text-muted-foreground">
          Este aviso fechará automaticamente em 2 segundos
        </p>
      </DialogContent>
    </Dialog>
  );
}
