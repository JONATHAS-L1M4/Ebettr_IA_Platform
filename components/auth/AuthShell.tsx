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
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <img
            src="http://img.ebettr.com/images/2026/03/06/logotipo.png"
            alt="Ebettr IA"
            className="h-8 w-auto brightness-0 invert"
          />
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            {(title || subtitle) && (
              <CardHeader className="text-center">
                {title && <CardTitle className="text-xl">{title}</CardTitle>}
                {subtitle && <CardDescription>{subtitle}</CardDescription>}
              </CardHeader>
            )}
            <CardContent>{children}</CardContent>
          </Card>
          {footer}
        </div>
      </div>
    </div>
  );
};
