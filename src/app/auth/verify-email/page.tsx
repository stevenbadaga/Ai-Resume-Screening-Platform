'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SupportedLanguage } from '@/lib/i18n/translations';

const VERIFY_COPY: Record<SupportedLanguage, {
  title: string;
  verifying: string;
  successTitle: string;
  successBody: string;
  failedTitle: string;
  goSignIn: string;
}> = {
  en: {
    title: 'Email Verification',
    verifying: 'Verifying your email address...',
    successTitle: 'Email verified!',
    successBody: 'Your email address has been confirmed. You can now sign in to your account.',
    failedTitle: 'Verification failed',
    goSignIn: 'Go to sign in →',
  },
  fr: {
    title: "Vérification de l'e-mail",
    verifying: "Vérification de votre adresse e-mail...",
    successTitle: 'E-mail vérifié !',
    successBody: 'Votre adresse e-mail a été confirmée. Vous pouvez maintenant vous connecter.',
    failedTitle: 'Échec de la vérification',
    goSignIn: 'Aller à la connexion →',
  },
  es: {
    title: 'Verificación de correo',
    verifying: 'Verificando su dirección de correo...',
    successTitle: '¡Correo verificado!',
    successBody: 'Su dirección de correo ha sido confirmada. Ya puede iniciar sesión.',
    failedTitle: 'Error de verificación',
    goSignIn: 'Ir a iniciar sesión →',
  },
  de: {
    title: 'E-Mail-Bestätigung',
    verifying: 'Ihre E-Mail-Adresse wird bestätigt...',
    successTitle: 'E-Mail bestätigt!',
    successBody: 'Ihre E-Mail-Adresse wurde bestätigt. Sie können sich jetzt anmelden.',
    failedTitle: 'Bestätigung fehlgeschlagen',
    goSignIn: 'Zur Anmeldung →',
  },
  rw: {
    title: 'Kwemeza imeyili',
    verifying: 'Aderesi ya imeyili irimo kwemezwa...',
    successTitle: 'Imeyili yemejwe!',
    successBody: 'Aderesi ya imeyili yemejwe. Ubu ushobora kwinjira muri konti yawe.',
    failedTitle: 'Kwemeza byanze',
    goSignIn: 'Injira →',
  },
};

function VerifyEmailPanel() {
  const { language } = useLanguage();
  const copy = VERIFY_COPY[language];
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(
    token ? '' : 'Missing verification token. Please use the link from your verification email.'
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.success) {
          setStatus('success');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
          setMessage('Network error. Please try again.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8 px-4">
      <div className="relative max-w-md w-full dark:bg-[#17242B]/95 bg-[#FFFDF8]/95 dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-8 shadow-xl space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#0F766E] flex items-center justify-center text-white text-2xl font-extrabold mx-auto shadow-lg shadow-teal-900/20 ring-4 ring-teal-700/10">
          R
        </div>

        <h1 className="text-xl font-extrabold dark:text-white text-slate-900 tracking-tight">
          {copy.title}
        </h1>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <span className="w-6 h-6 rounded-full border-2 border-teal-600/30 border-t-teal-600 animate-spin" />
            <p className="text-xs dark:text-slate-400 text-slate-500">{copy.verifying}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3 py-2">
            <div className="text-4xl">✅</div>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{copy.successTitle}</p>
            <p className="text-xs dark:text-slate-400 text-slate-500">{copy.successBody}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3 py-2">
            <div className="text-4xl">⚠️</div>
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{copy.failedTitle}</p>
            <p className="text-xs dark:text-slate-400 text-slate-500">{message}</p>
            <p className="text-[11px] dark:text-slate-500 text-slate-400">
              Request a new link from the sign-in page (&ldquo;Resend verification email&rdquo;).
            </p>
          </div>
        )}

        <Link
          href="/auth/signin"
          className="inline-block w-full py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white font-bold rounded-xl text-xs transition shadow-lg shadow-teal-900/20"
        >
          {copy.goSignIn}
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-xs dark:text-slate-400 text-slate-500">Loading…</div>}>
      <VerifyEmailPanel />
    </Suspense>
  );
}
