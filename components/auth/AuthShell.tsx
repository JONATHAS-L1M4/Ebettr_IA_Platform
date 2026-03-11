import React from 'react';
import { darkTheme } from '../../design-tokens';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  title,
  subtitle,
  children,
  footer,
}) => {
  const darkStyles = { ...(darkTheme as React.CSSProperties), colorScheme: 'dark' as const };
  return (
    <div
      className="auth-screen flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-foreground md:p-10"
      style={darkStyles}
    >
      <div className="flex w-full max-w-md flex-col gap-7">
        <div className="flex items-center gap-2 self-center font-medium">
          <img
            src="http://img.ebettr.com/images/2026/03/06/logotipo.png"
            alt="Ebettr IA"
            className="h-12 w-auto brightness-0 invert md:h-14"
          />
        </div>

        <div className="flex flex-col gap-6">
          <Card className="rounded-2xl">
            {(title || subtitle) && (
              <CardHeader className="px-8 pt-8 text-center">
                {title && <CardTitle className="text-2xl">{title}</CardTitle>}
                {subtitle && <CardDescription>{subtitle}</CardDescription>}
              </CardHeader>
            )}
            <CardContent className="px-8 pb-8">{children}</CardContent>
          </Card>
          {footer}
        </div>
      </div>
    </div>
  );
};
