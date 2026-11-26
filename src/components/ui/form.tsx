import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

const control =
  'w-full rounded-md border border-line bg-white px-3.5 text-espresso placeholder:text-muted/70 ' +
  'transition-colors duration-150 hover:border-mocha focus:border-espresso focus:outline-none ' +
  'aria-[invalid=true]:border-danger disabled:bg-ivory disabled:text-muted';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'h-11', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'min-h-24 py-2.5', className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(control, 'h-11 pr-8', className)} {...props} />;
}

export function Checkbox({ label, className, ...props }: ComponentProps<'input'> & { label: ReactNode }) {
  return (
    <label className={cn('inline-flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem]', className)}>
      <input type="checkbox" className="size-[18px] accent-espresso" {...props} />
      <span>{label}</span>
    </label>
  );
}

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

/** Campo con etiqueta visible, ayuda y error asociado por id (aria-describedby en el control). */
export function Field({ label, htmlFor, error, hint, optional, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {optional && <span className="ml-1 font-normal text-muted">(opcional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-[0.8125rem] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} className="text-[0.8125rem] text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormMessage({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'animate-fade-in rounded-md border px-4 py-3 text-sm',
        tone === 'error' ? 'border-danger/30 bg-danger/5 text-danger' : 'border-success/30 bg-success/5 text-success',
      )}
    >
      {children}
    </p>
  );
}
