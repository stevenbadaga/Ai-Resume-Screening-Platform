'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SupportedLanguage } from '@/lib/i18n/translations';

const FIRST_LOGIN_COPY: Record<SupportedLanguage, {
  title: string;
  subtitle: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordHint: string;
  setPassword: string;
  Setting: string;
  success: string;
  errorGeneric: string;
  passwordsDontMatch: string;
  passwordTooShort: string;
  invalidCurrent: string;
  accountNotSetup: string;
  tooManyAttempts: string;
  backToSignIn: string;
}> = {
  en: {
    title: 'Set up your password',
    subtitle: 'Your account was created for you. Choose a new password to activate it.',
    currentPassword: 'Temporary password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    passwordHint: 'At least 8 characters',
    setPassword: 'Set password & activate ➔',
    Setting: 'Activating…',
    success: 'Password set! Signing you in…',
    errorGeneric: 'Could not set password. Please try again.',
    passwordsDontMatch: 'The two passwords do not match.',
    passwordTooShort: 'Password must be at least 8 characters.',
    invalidCurrent: 'The temporary password is incorrect.',
    accountNotSetup: 'This account does not need setup.',
    tooManyAttempts: 'Too many attempts. Please try again later.',
    backToSignIn: '← Back to sign in',
  },
  fr: {
    title: 'Configurez votre mot de passe',
    subtitle: 'Votre compte a été créé pour vous. Choisissez un nouveau mot de passe pour l’activer.',
    currentPassword: 'Mot de passe temporaire',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le nouveau mot de passe',
    passwordHint: 'Au moins 8 caractères',
    setPassword: 'Définir le mot de passe et activer ➔',
    Setting: 'Activation…',
    success: 'Mot de passe défini ! Connexion en cours…',
    errorGeneric: 'Impossible de définir le mot de passe. Réessayez.',
    passwordsDontMatch: 'Les deux mots de passe ne correspondent pas.',
    passwordTooShort: 'Le mot de passe doit comporter au moins 8 caractères.',
    invalidCurrent: 'Le mot de passe temporaire est incorrect.',
    accountNotSetup: 'Ce compte n’a pas besoin d’activation.',
    tooManyAttempts: 'Trop de tentatives. Réessayez plus tard.',
    backToSignIn: '← Retour à la connexion',
  },
  es: {
    title: 'Configura tu contraseña',
    subtitle: 'Tu cuenta fue creada para ti. Elige una nueva contraseña para activarla.',
    currentPassword: 'Contraseña temporal',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar nueva contraseña',
    passwordHint: 'Mínimo 8 caracteres',
    setPassword: 'Establecer contraseña y activar ➔',
    Setting: 'Activando…',
    success: '¡Contraseña establecida! Iniciando sesión…',
    errorGeneric: 'No se pudo establecer la contraseña. Inténtalo de nuevo.',
    passwordsDontMatch: 'Las dos contraseñas no coinciden.',
    passwordTooShort: 'La contraseña debe tener al menos 8 caracteres.',
    invalidCurrent: 'La contraseña temporal es incorrecta.',
    accountNotSetup: 'Esta cuenta no necesita configuración.',
    tooManyAttempts: 'Demasiados intentos. Inténtalo más tarde.',
    backToSignIn: '← Volver al inicio de sesión',
  },
  de: {
    title: 'Passwort festlegen',
    subtitle: 'Ihr Konto wurde für Sie erstellt. Wählen Sie ein neues Passwort zur Aktivierung.',
    currentPassword: 'Temporäres Passwort',
    newPassword: 'Neues Passwort',
    confirmPassword: 'Neues Passwort bestätigen',
    passwordHint: 'Mindestens 8 Zeichen',
    setPassword: 'Passwort festlegen & aktivieren ➔',
    Setting: 'Aktivierung…',
    success: 'Passwort festgelegt! Anmeldung wird fortgesetzt…',
    errorGeneric: 'Passwort konnte nicht festgelegt werden. Erneut versuchen.',
    passwordsDontMatch: 'Die beiden Passwörter stimmen nicht überein.',
    passwordTooShort: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
    invalidCurrent: 'Das temporäre Passwort ist falsch.',
    accountNotSetup: 'Dieses Konto benötigt keine Aktivierung.',
    tooManyAttempts: 'Zu viele Versuche. Später erneut versuchen.',
    backToSignIn: '← Zur Anmeldung',
  },
  rw: {
    title: 'Andika paswotio yawe',
    subtitle: 'Konti yawe yafungurwa kuri wewe. Hitamo paswotio nshya kugira ngo igake.',
    currentPassword: 'Paswotio ya sisitemu',
    newPassword: 'Paswotio nshya',
    confirmPassword: 'Okwandika paswotio nshya',
    passwordHint: 'Inyuguti 8 cyangwa zirenga',
    setPassword: 'Andika paswotio & ngira ngo igake ➔',
    Setting: 'Igake…',
    success: 'Paswotio yandikwa! Turakwinjira…',
    errorGeneric: 'Paswotio ntiyazwigurwa. Ongera ugerageze.',
    passwordsDontMatch: 'Ibipasuro byombi ntibihura.',
    passwordTooShort: 'Paswotio igomba kuba ifite inyuguti 8 cyangwa zirenga.',
    invalidCurrent: 'Paswotio ya sisitemu iraho.',
    accountNotSetup: 'Iyi konti ntiyikenewe kwandika.',
    tooManyAttempts: 'Ongeraneza bwinshi. Ongera ugerageze nyuma.',
    backToSignIn: '← Kuruhira inzu y’injira',
  },
};

export default function FirstLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const { language } = useLanguage();
  const copy = FIRST_LOGIN_COPY[language];

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (session?.user && !session.user.mustChangePassword) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError(copy.passwordsDontMatch);
      return;
    }
    if (newPassword.length < 8) {
      setError(copy.passwordTooShort);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/first-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setError(copy.tooManyAttempts);
      } else if (res.status === 403) {
        setError(copy.accountNotSetup);
      } else if (res.ok && data.success) {
        setSuccess(true);
        const requestedDestination = searchParams.get('callbackUrl');
        const validDestination = requestedDestination?.startsWith('/') && !requestedDestination.startsWith('//')
          ? requestedDestination
          : '/dashboard';
        const signInUrl = `/auth/signin?setup=complete&callbackUrl=${encodeURIComponent(validDestination)}`;
        setTimeout(() => signOut({ callbackUrl: signInUrl }), 1200);
      } else if (res.status === 401) {
        setError(copy.invalidCurrent);
      } else {
        setError(copy.errorGeneric);
      }
    } catch {
      setError(copy.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-2xl mx-auto">
            ✓
          </div>
          <h1 className="text-xl font-bold">{copy.success}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full panel-raised rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-extrabold tracking-tight">{copy.title}</h1>
          <p className="text-xs text-[var(--muted)]">{copy.subtitle}</p>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-lg border text-xs font-semibold text-center border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="field-label">{copy.currentPassword}</label>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full field !rounded-lg !px-4 !py-2.5"
              placeholder="••••••••••••"
            />
          </div>
          <div>
            <label className="field-label">{copy.newPassword}</label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full field !rounded-lg !px-4 !py-2.5"
              placeholder="••••••••••••"
            />
            <p className="mt-1 text-[10px] text-[var(--muted)]">{copy.passwordHint}</p>
          </div>
          <div>
            <label className="field-label">{copy.confirmPassword}</label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full field !rounded-lg !px-4 !py-2.5"
              placeholder="••••••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="w-full !py-3 btn btn-primary !rounded-lg !text-xs !font-bold"
          >
            {loading ? copy.Setting : copy.setPassword}
          </button>
        </form>

        <div className="pt-2 text-center text-xs">
          <a href="/auth/signin" className="text-[var(--muted)] hover:text-[var(--foreground)] hover:underline">
            {copy.backToSignIn}
          </a>
        </div>
      </div>
    </div>
  );
}
