'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';
import { useState, useEffect } from 'react';

type ContextualHelpProps = {
  helpMessage: string;
  defaultOpen?: boolean;
  onClose?: () => void;
};

export default function ContextualHelp({ helpMessage, defaultOpen = false, onClose }: ContextualHelpProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Lightbulb className="h-6 w-6 text-primary" />
            Asistencia Inteligente
          </DialogTitle>
          <DialogDescription>Hemos detectado un problema y te ofrecemos una posible solución.</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">{helpMessage}</p>
        <DialogFooter className="sm:justify-start mt-4">
          <Button type="button" onClick={() => handleOpenChange(false)}>
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
