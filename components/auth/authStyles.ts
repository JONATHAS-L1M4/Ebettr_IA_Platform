export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const authSectionCardClass =
  'animate-fade-in';

export const authFieldClass = 'space-y-2';

export const authLabelClass =
  'block text-sm font-medium tracking-tight text-foreground';

export const authInputIconClass =
  'pointer-events-none absolute left-3 top-2.5 text-muted-foreground transition-colors group-focus-within:text-foreground';

export const authInputBaseClass =
  'w-full px-3 py-2 bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background text-sm placeholder:text-muted-foreground shadow-sm text-foreground transition disabled:cursor-not-allowed disabled:opacity-50';

export const authInputWithLeadingIconClass = cn(authInputBaseClass, 'pl-9');

export const authInputWithBothIconsClass = cn(
  authInputBaseClass,
  'pl-9 pr-10'
);

export const authPrimaryButtonClass =
  'inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground shadow-sm transition-all hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60';

export const authSecondaryButtonClass =
  'inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground shadow-sm transition-all hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60';

export const authInlineLinkClass =
  'text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline';

export const authHelperTextClass = 'text-sm leading-6 text-muted-foreground';

export const authFooterClass =
  'mt-6 border-t border-border pt-4 text-center text-sm text-muted-foreground';

export const authOtpInputClass =
  'h-12 w-11 rounded-xl border border-input bg-background text-center text-lg font-semibold uppercase text-foreground shadow-sm outline-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-14 sm:w-12';

export const authInfoCardClass =
  'rounded-2xl border border-border bg-muted px-4 py-3 text-sm leading-6 text-muted-foreground';
