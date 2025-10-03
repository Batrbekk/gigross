'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { LoginForm } from '@/components/auth/LoginForm';
import { RegistrationForm } from '@/components/auth/RegistrationForm';
import { ConfirmForm } from '@/components/auth/ConfirmForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import AuthGlassPanel from '@/components/auth/AuthGlassPanel';
import { RedirectLoader } from '@/components/ui/page-loader';
import { useAuthStore } from '@/stores/authStore';
import { useApi } from '@/hooks/useApi';

type AuthStep = 
  | 'login' 
  | 'register' 
  | 'confirm-registration' 
  | 'confirm-password-reset' 
  | 'forgot-password' 
  | 'reset-password';

interface AuthState {
  step: AuthStep;
  email: string;
  resetToken?: string;
}

export default function HomePage() {
  const [authState, setAuthState] = useState<AuthState>({
    step: 'login',
    email: '',
  });
  const { isAuthenticated, user, clearLoading } = useAuthStore();
  const { execute } = useApi();
  const router = useRouter();

  // Проверяем, авторизован ли пользователь, и перенаправляем на dashboard
  useEffect(() => {
    if (isAuthenticated && user && window.location.pathname === '/') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  // Если пользователь авторизован и на главной странице, показываем загрузку
  if (isAuthenticated && user && typeof window !== 'undefined' && window.location.pathname === '/') {
    return <RedirectLoader message="Перенаправление..." />;
  }

  // Обработчики для различных форм
  const handleRegistrationSuccess = async (email: string) => {
    // Отправляем OTP код для подтверждения регистрации
    try {
      await execute('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          email,
          type: 'registration',
        }),
      });
      // Сбрасываем loading состояние при переходе на ConfirmForm
      clearLoading();
      setAuthState({ step: 'confirm-registration', email });
    } catch {
      // Ошибка отправки OTP - можно добавить уведомление пользователю
    }
  };

  const handleLoginError = (error: Error & { data?: unknown }) => {
    // Если пользователь не подтвержден, переходим к подтверждению
    const errorData = error.data as { requiresVerification?: boolean; email?: string } | undefined;
    if (errorData?.requiresVerification && errorData.email) {
      setAuthState({ step: 'confirm-registration', email: errorData.email });
    }
  };

  const handleForgotPassword = () => {
    setAuthState({ step: 'forgot-password', email: '' });
  };

  const handleForgotPasswordSuccess = (email: string) => {
    setAuthState({ step: 'confirm-password-reset', email });
  };

  const handleConfirmPasswordResetSuccess = (resetToken: string) => {
    setAuthState({ step: 'reset-password', email: authState.email, resetToken });
  };

  const handleResetPasswordSuccess = () => {
    setAuthState({ step: 'login', email: '' });
  };

  const handleBackToLogin = () => {
    setAuthState({ step: 'login', email: '' });
  };

  const handleBackToRegister = () => {
    setAuthState({ step: 'register', email: '' });
  };

  const renderAuthForm = () => {
    switch (authState.step) {
      case 'login':
        return (
          <LoginForm 
            onSwitchToRegister={() => setAuthState({ step: 'register', email: '' })}
            onForgotPassword={handleForgotPassword}
            onError={handleLoginError}
          />
        );
      
      case 'register':
        return (
          <RegistrationForm 
            onSwitchToLogin={() => setAuthState({ step: 'login', email: '' })}
            onSuccess={handleRegistrationSuccess}
          />
        );
      
      case 'confirm-registration':
        return (
          <ConfirmForm
            email={authState.email}
            type="registration"
            onSuccess={() => {
              // После успешного подтверждения пользователь автоматически авторизован
              // Middleware обработает перенаправление
              
              // Сбрасываем состояние формы
              setAuthState({ step: 'login', email: '' });
            }}
            onBack={handleBackToRegister}
          />
        );
      
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onSuccess={handleForgotPasswordSuccess}
            onBack={handleBackToLogin}
          />
        );
      
      case 'confirm-password-reset':
        return (
          <ConfirmForm
            email={authState.email}
            type="password-reset"
            onSuccess={(data?: unknown) => {
              const resetData = data as { resetToken?: string } | undefined;
              if (resetData?.resetToken) {
                handleConfirmPasswordResetSuccess(resetData.resetToken);
              }
            }}
            onBack={() => setAuthState({ step: 'forgot-password', email: '' })}
          />
        );
      
      case 'reset-password':
        return (
          <ResetPasswordForm
            resetToken={authState.resetToken!}
            onSuccess={handleResetPasswordSuccess}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-6">
          {renderAuthForm()}
        </div>
      </div>

      {/* Right side - Glass Panel with Animated Spheres */}
      <AuthGlassPanel className="hidden lg:block" />
    </div>
  );
}