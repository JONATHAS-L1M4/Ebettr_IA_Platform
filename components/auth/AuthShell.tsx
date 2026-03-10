import React from 'react';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <div className="relative min-h-screen bg-zinc-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_38%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-md items-center px-4 py-8 sm:px-6">
        <div className="w-full">
          <img
            src="http://img.ebettr.com/images/2026/03/06/logotipo.png"
            alt="Ebettr IA"
            className="mx-auto mb-8 h-12 w-auto brightness-0 invert sm:h-18"
          />

          <div className="w-full rounded-[28px] border border-white/10 bg-zinc-900/80 p-6 shadow-[0_30px_100px_-55px_rgba(0,0,0,1)] backdrop-blur sm:p-8">
            {title && (
              <div className="text-center">
                <h1 className="text-2xl font-semibold leading-tight tracking-[-0.04em] text-white">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-2 text-sm text-zinc-400">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
