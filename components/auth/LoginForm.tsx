import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from '../ui/Icons';
import { authService, AuthResponse } from '../../services/authService';
import { useNotification } from '../../context/NotificationContext';
import {
  authSectionCardClass,
} from './authStyles';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface LoginFormProps {
  onSuccess: (
    email: string,
    role: 'admin' | 'client' | 'support',
    authData: AuthResponse
  ) => void;
  onForgotPassword: () => void;
  onSignUp: () => void;
  onError: (msg: string) => void;
  showSignUp: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onForgotPassword,
  onSignUp,
  onError,
  showSignUp,
}) => {
  const { addNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onError('');
    setIsLoading(true);

    try {
      const initialCsrf = await authService.getLoginCsrf();
      const authData = await authService.login(email, password, initialCsrf);

      let role: 'admin' | 'client' | 'support' = 'client';
      if (email.toLowerCase().includes('admin')) role = 'admin';
      else if (email.toLowerCase().includes('suporte')) role = 'support';

      onSuccess(email, role, authData);
    } catch (err: any) {
      const errorMessage = err.message || 'Email ou senha incorretos.';
      onError(errorMessage);
      addNotification('error', 'Falha no Login', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={authSectionCardClass}>
      <form onSubmit={handleSubmit} className="grid gap-6">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              required
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="login-password">Senha</Label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="ml-auto text-sm underline-offset-4 transition hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-2.5 text-muted-foreground transition hover:text-foreground"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </div>

        {showSignUp && (
          <div className="text-center text-sm">
            Nao tem uma conta?{' '}
            <button
              type="button"
              onClick={onSignUp}
              className="font-medium underline underline-offset-4"
            >
              Criar cadastro
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
