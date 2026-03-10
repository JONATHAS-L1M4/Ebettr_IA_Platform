import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2 } from '../ui/Icons';
import { authService } from '../../services/authService';
import { useNotification } from '../../context/NotificationContext';
import {
  authInlineLinkClass,
  authOtpInputClass,
  authPrimaryButtonClass,
  authSecondaryButtonClass,
  authSectionCardClass,
  cn,
} from './authStyles';

interface TwoFactorFormProps {
  email: string;
  csrfToken: string;
  preauthToken?: string;
  onSuccess: () => void;
  onCancel: () => void;
  onError: (msg: string) => void;
  onResend: () => void;
}

export const TwoFactorForm: React.FC<TwoFactorFormProps> = ({
  email,
  csrfToken,
  preauthToken,
  onSuccess,
  onCancel,
  onError,
  onResend,
}) => {
  const { addNotification } = useNotification();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((current) => current - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    const focusTimer = setTimeout(() => inputRefs.current[0]?.focus(), 100);
    return () => clearTimeout(focusTimer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onError('');
    setIsLoading(true);

    try {
      await authService.verify2FA(email, csrfToken, code, preauthToken);
      onSuccess();
    } catch (err: any) {
      const msg = err.message || 'Codigo de verificacao incorreto ou expirado.';
      onError(msg);
      addNotification('error', 'Erro de acesso', msg);
      setCode('');
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;

    if (val === '') {
      const chars = code.split('');
      chars[index] = '';
      setCode(chars.join(''));
      return;
    }

    if (!/^\d$/.test(val.slice(-1))) return;

    const chars = code.split('');
    for (let i = 0; i < 6; i += 1) {
      if (!chars[i]) chars[i] = '';
    }

    chars[index] = val.slice(-1);
    setCode(chars.join('').slice(0, 6));

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    setCode(pastedData);
    inputRefs.current[Math.min(pastedData.length - 1, 5)]?.focus();
  };

  const handleResendClick = () => {
    if (countdown > 0) return;
    onError('');
    onResend();
    setCountdown(30);
  };

  return (
    <div className={cn(authSectionCardClass, 'animate-scale-in')}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            onError('');
            onCancel();
          }}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              maxLength={1}
              inputMode="numeric"
              value={code[index] || ''}
              onChange={(e) => handleInput(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              className={authOtpInputClass}
            />
          ))}
        </div>

        <div className="space-y-3">
          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className={authPrimaryButtonClass}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirmando...
              </>
            ) : (
              'Continuar'
            )}
          </button>

          <button
            type="button"
            onClick={handleResendClick}
            disabled={countdown > 0}
            className={authSecondaryButtonClass}
          >
            {countdown > 0
              ? `Reenviar codigo em ${countdown}s`
              : 'Reenviar codigo'}
          </button>
        </div>
      </form>

      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={handleResendClick}
          disabled={countdown > 0}
          className={cn(
            authInlineLinkClass,
            countdown > 0 && 'no-underline opacity-60 hover:no-underline'
          )}
        >
          Nao recebeu? Solicite um novo codigo.
        </button>
      </div>
    </div>
  );
};
