'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  /** "sheet" se ancla abajo en móvil (filtros, menús). */
  variant?: 'center' | 'sheet';
};

/** Diálogo accesible basado en <dialog> nativo: foco atrapado, Escape y fondo inerte. */
export function Dialog({ open, onClose, title, children, className, variant = 'center' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="dialog-title"
      className={cn(
        'm-0 max-h-[100dvh] max-w-none bg-transparent p-0 text-espresso backdrop:bg-espresso/40',
        variant === 'sheet'
          ? 'mt-auto w-full md:m-auto md:w-[min(560px,calc(100%-32px))]'
          : 'm-auto w-[min(520px,calc(100%-32px))]',
      )}
    >
      {open && (
        <div
          className={cn(
            'flex max-h-[90dvh] flex-col bg-white shadow-[var(--shadow-float)]',
            variant === 'sheet' ? 'animate-sheet-in rounded-t-lg md:rounded-lg' : 'animate-fade-in rounded-lg',
            className,
          )}
        >
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 id="dialog-title" className="font-display text-xl">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 inline-flex size-11 items-center justify-center rounded-md hover:bg-ivory"
              aria-label="Cerrar"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
