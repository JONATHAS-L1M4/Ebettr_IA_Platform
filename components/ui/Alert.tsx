import React from 'react';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type AlertVariant = 'default' | 'destructive';

interface AlertProps extends React.ComponentProps<'div'> {
  variant?: AlertVariant;
}

const alertVariants: Record<AlertVariant, string> = {
  default: 'border-white/10 bg-zinc-950/95 text-zinc-50',
  destructive: 'border-white/10 bg-zinc-950/95 text-zinc-50',
};

export function Alert({
  className,
  variant = 'default',
  ...props
}: AlertProps) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        'relative w-full rounded-2xl border px-4 py-3 text-left text-sm shadow-[0_24px_80px_-40px_rgba(0,0,0,1)] backdrop-blur',
        alertVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('pr-8 text-sm font-semibold tracking-tight text-zinc-50', className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-sm leading-relaxed text-zinc-400',
        className
      )}
      {...props}
    />
  );
}

export function AlertAction({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-action"
      className={cn('absolute right-2 top-2', className)}
      {...props}
    />
  );
}
