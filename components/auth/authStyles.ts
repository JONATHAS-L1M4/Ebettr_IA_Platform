export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const authSectionCardClass =
  'animate-fade-in';

export const authFieldClass = 'space-y-2';

export const authLabelClass =
  'block text-sm font-medium tracking-tight text-zinc-100';

export const authInputIconClass =
  'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-zinc-200';

export const authInputBaseClass =
  'h-11 w-full rounded-xl border border-white/10 bg-zinc-950/80 px-3 text-sm text-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] outline-none transition placeholder:text-zinc-500 focus:border-white/30 focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60';

export const authInputWithLeadingIconClass = cn(authInputBaseClass, 'pl-11');

export const authInputWithBothIconsClass = cn(
  authInputBaseClass,
  'pl-11 pr-11'
);

export const authPrimaryButtonClass =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-zinc-950 shadow-[0_18px_40px_-22px_rgba(255,255,255,0.7)] transition hover:bg-zinc-200 focus:outline-none focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60';

export const authSecondaryButtonClass =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white focus:outline-none focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60';

export const authInlineLinkClass =
  'text-sm font-medium text-zinc-400 underline-offset-4 transition hover:text-white hover:underline';

export const authHelperTextClass = 'text-sm leading-6 text-zinc-400';

export const authFooterClass =
  'mt-6 border-t border-white/10 pt-4 text-center text-sm text-zinc-400';

export const authOtpInputClass =
  'h-12 w-11 rounded-xl border border-white/10 bg-zinc-950/80 text-center text-lg font-semibold uppercase text-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] outline-none transition focus:border-white/30 focus:ring-4 focus:ring-white/10 sm:h-14 sm:w-12';

export const authInfoCardClass =
  'rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-zinc-300';
