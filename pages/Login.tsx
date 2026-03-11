import React, { useMemo, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { authService, AuthResponse } from '../services/authService';
import { AuthShell } from '../components/auth/AuthShell';
import { LoginForm } from '../components/auth/LoginForm';
import { TwoFactorForm } from '../components/auth/TwoFactorForm';
import {
  RecoveryCodeForm,
  RecoveryForm,
  ResetPasswordForm,
  SignupForm,
} from '../components/auth/AdditionalAuthForms';

interface LoginProps {
  onLogin: (role: 'admin' | 'client' | 'support') => void;
}

type LoginView =
  | 'login'
  | 'recovery'
  | 'recovery-code'
  | 'reset-password'
  | '2fa'
  | 'signup';

const getViewCopy = (view: LoginView) => {
  switch (view) {
    case '2fa':
      return {
        title: 'Confirmar',
        subtitle: 'Digite o codigo de verificacao para continuar.',
      };
    case 'recovery':
      return {
        title: 'Recuperar senha',
        subtitle: 'Informe seu email para recuperar o acesso.',
      };
    case 'recovery-code':
      return {
        title: 'Codigo',
        subtitle: 'Digite o codigo enviado para o seu email.',
      };
    case 'reset-password':
      return {
        title: 'Nova senha',
        subtitle: 'Crie uma nova senha para sua conta.',
      };
    case 'signup':
      return {
        title: 'Criar conta',
        subtitle: 'Preencha os dados para criar seu cadastro.',
      };
    case 'login':
    default:
      return {
        title: 'Entrar',
        subtitle: 'Use seu email e senha para acessar.',
      };
  }
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { addNotification } = useNotification();
  const [view, setView] = useState<LoginView>('login');
  const [, setError] = useState('');

  const [tempEmail, setTempEmail] = useState('');
  const [tempRole, setTempRole] = useState<'admin' | 'client' | 'support' | null>(null);
  const [csrfToken2FA, setCsrfToken2FA] = useState('');
  const [preauthToken, setPreauthToken] = useState('');

  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  const isSignUpEnabled = String(process.env.ENABLE_SIGN_UP).toLowerCase() !== 'false';

  const viewCopy = useMemo(() => getViewCopy(view), [view]);

  const handleLoginAttempt = async (
    email: string,
    role: 'admin' | 'client' | 'support',
    authData: AuthResponse
  ) => {
    setTempEmail(email);
    setTempRole(role);
    setError('');

    if (authData.two_factor_enabled) {
      setCsrfToken2FA(authData.csrf_token || '');
      if (authData.preauth_token) {
        setPreauthToken(authData.preauth_token);
      }
      setView('2fa');
      addNotification(
        'info',
        'Confirmacao necessaria',
        'Informe o codigo para continuar.'
      );
    } else {
      addNotification('success', 'Bem-vindo', 'Acesso liberado.');
      onLogin(role);
    }
  };

  const handle2FASuccess = () => {
    if (tempRole) {
      addNotification('success', 'Autenticado', 'Login realizado com sucesso.');
      onLogin(tempRole);
    }
  };

  const handleRecoveryRequestSuccess = (email: string) => {
    setRecoveryEmail(email);
    setError('');
    addNotification('info', 'Email Enviado', `Um codigo foi enviado para ${email}.`);
    setView('recovery-code');
  };

  const handleRecoveryCodeSuccess = (token: string) => {
    setResetToken(token);
    setError('');
    setView('reset-password');
  };

  const handleResetPasswordSuccess = () => {
    addNotification(
      'success',
      'Senha Alterada',
      'Sua senha foi redefinida. Faca login para continuar.'
    );
    setView('login');
    setResetToken('');
    setRecoveryEmail('');
    setError('');
  };

  const handleSignupSuccess = (email: string) => {
    addNotification(
      'success',
      'Conta criada',
      'Cadastro concluido. Faca login para continuar.'
    );
    setTempEmail(email);
    setView('login');
    setError('');
  };

  const handleResend2FA = async () => {
    try {
      const { required, csrfToken } = await authService.check2FARequirement(tempEmail);
      if (required && csrfToken) {
        setCsrfToken2FA(csrfToken);
        setError('');
        addNotification(
          'success',
          'Codigo reenviado',
          'Confira o codigo no seu aplicativo.'
        );
      } else {
        const message = 'Nao foi possivel reenviar o codigo.';
        setError(message);
        addNotification('error', 'Erro', message);
      }
    } catch (e) {
      const message = 'Falha ao processar a solicitacao.';
      setError(message);
      addNotification('error', 'Erro', message);
    }
  };

  return (
    <AuthShell title={viewCopy.title} subtitle={viewCopy.subtitle} footer={null}>
      {view === 'login' && (
        <LoginForm
          onSuccess={handleLoginAttempt}
          onError={setError}
          onForgotPassword={() => {
            setView('recovery');
            setError('');
          }}
          onSignUp={() => {
            setView('signup');
            setError('');
          }}
          showSignUp={isSignUpEnabled}
        />
      )}

      {view === '2fa' && (
        <TwoFactorForm
          email={tempEmail}
          csrfToken={csrfToken2FA}
          preauthToken={preauthToken}
          onSuccess={handle2FASuccess}
          onError={setError}
          onCancel={() => {
            localStorage.removeItem('ebettr_access_token');
            setView('login');
            setError('');
            setTempRole(null);
            setPreauthToken('');
          }}
          onResend={handleResend2FA}
        />
      )}

      {view === 'signup' && isSignUpEnabled && (
        <SignupForm
          onSuccess={handleSignupSuccess}
          onError={setError}
          onLogin={() => {
            setView('login');
            setError('');
          }}
        />
      )}

      {view === 'recovery' && (
        <RecoveryForm
          onSuccess={handleRecoveryRequestSuccess}
          onCancel={() => {
            setView('login');
            setError('');
          }}
        />
      )}

      {view === 'recovery-code' && (
        <RecoveryCodeForm
          email={recoveryEmail}
          onSuccess={handleRecoveryCodeSuccess}
          onCancel={() => {
            setView('login');
            setError('');
          }}
        />
      )}

      {view === 'reset-password' && (
        <ResetPasswordForm
          email={recoveryEmail}
          resetToken={resetToken}
          onSuccess={handleResetPasswordSuccess}
          onCancel={() => {
            setView('login');
            setError('');
          }}
        />
      )}
    </AuthShell>
  );
};

export default Login;
