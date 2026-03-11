import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  `group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border
   bg-card bg-clip-padding px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground shadow-sm
   transition-all outline-none select-none disabled:pointer-events-none disabled:cursor-not-allowed
   disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30
   aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20
   dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40
   [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
  {
    variants: {
      variant: {
        primary:
          'border-border bg-card text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground',
        default:
          'border-border bg-card text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground',
        outline:
          'border-border bg-card text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground',
        secondary:
          'border-border bg-card text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground',
        ghost:
          'border-transparent bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground',
        destructive:
          'border-red-900/50 bg-red-950/40 text-red-300 hover:border-red-600 hover:bg-red-700 hover:text-red-50 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        link:
          'border-transparent bg-transparent px-0 py-0 text-primary shadow-none underline-offset-4 hover:bg-transparent hover:text-primary hover:underline'
      },
      size: {
        default: 'h-10 px-4 py-2 data-[icon=inline-end]:pr-3 data-[icon=inline-start]:pl-3',
        xs:
          "h-8 gap-1 rounded-lg px-3 py-1.5 text-[10px] data-[slot=button-group]:rounded-lg data-[icon=inline-end]:pr-2 data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm:
          "h-10 px-4 py-2 text-xs data-[slot=button-group]:rounded-lg data-[icon=inline-end]:pr-3 data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-11 px-5 py-2.5 text-xs data-[icon=inline-end]:pr-4 data-[icon=inline-start]:pl-4',
        icon: 'size-8 px-0 py-0',
        'icon-xs':
          "size-6 rounded-lg px-0 py-0 data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        'icon-sm':
          "size-7 rounded-lg px-0 py-0 data-[slot=button-group]:rounded-lg",
        'icon-lg': 'size-9 px-0 py-0'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
