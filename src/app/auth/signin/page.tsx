'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SupportedLanguage } from '@/lib/i18n/translations';

const SIGN_IN_COPY: Record<SupportedLanguage, {
  title: string;
  subtitle: string;
  email: string;
  password: string;
  secureAccess: string;
  signIn: string;
  authenticating: string;
  invalidCredentials: string;
  showPassword: string;
  hidePassword: string;
  noAccount: string;
  createAccount: string;
}> = {
  en: {
    title: 'Sign In to RecruitAI',
    subtitle: 'Enterprise explainable AI resume screening & applicant tracking.',
    email: 'Email Address',
    password: 'Password',
    secureAccess: 'Secure workspace access',
    signIn: 'Sign In ➔',
    authenticating: 'Authenticating...',
    invalidCredentials: 'Invalid email or password credentials.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    noAccount: "Don't have an account?",
    createAccount: 'Create Account →',
  },
  fr: {
    title: 'Se connecter à RecruitAI',
    subtitle: "Criblage de CV par IA explicable et suivi des candidatures d'entreprise.",
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    secureAccess: 'Accès sécurisé à l’espace de travail',
    signIn: 'Se connecter ➔',
    authenticating: 'Authentification...',
    invalidCredentials: 'Adresse e-mail ou mot de passe incorrect.',
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
    noAccount: "Vous n'avez pas de compte ?",
    createAccount: 'Créer un compte →',
  },
  es: {
    title: 'Iniciar sesión en RecruitAI',
    subtitle: 'Filtrado explicable de CV con IA y seguimiento de candidatos.',
    email: 'Dirección de correo',
    password: 'Contraseña',
    secureAccess: 'Acceso seguro al espacio de trabajo',
    signIn: 'Iniciar sesión ➔',
    authenticating: 'Autenticando...',
    invalidCredentials: 'El correo o la contraseña no son válidos.',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
    noAccount: '¿No tienes una cuenta?',
    createAccount: 'Crear cuenta →',
  },
  de: {
    title: 'Bei RecruitAI anmelden',
    subtitle: 'Erklärbare KI-Lebenslaufprüfung und Bewerberverwaltung.',
    email: 'E-Mail-Adresse',
    password: 'Passwort',
    secureAccess: 'Sicherer Zugriff auf den Arbeitsbereich',
    signIn: 'Anmelden ➔',
    authenticating: 'Authentifizierung...',
    invalidCredentials: 'Ungültige E-Mail-Adresse oder ungültiges Passwort.',
    showPassword: 'Passwort anzeigen',
    hidePassword: 'Passwort ausblenden',
    noAccount: 'Noch kein Konto?',
    createAccount: 'Konto erstellen →',
  },
  rw: {
    title: 'Injira muri RecruitAI',
    subtitle: 'Isuzuma rya CV risobanurwa na AI no gukurikirana abasaba akazi.',
    email: 'Aderesi ya imeyili',
    password: 'Ijambo ry’ibanga',
    secureAccess: 'Kwinjira mu mwanya w’akazi mu buryo bwizewe',
    signIn: 'Injira ➔',
    authenticating: 'Birimo kugenzurwa...',
    invalidCredentials: 'Imeyili/ijambo ry’ibanga si byo.',
    showPassword: 'Erekana ijambo ry’ibanga',
    hidePassword: 'Hisha ijambo ry’ibanga',
    noAccount: 'Nta konti ufite?',
    createAccount: 'Fungura konti →',
  },
};

export default function SignIn() {
  const { language } = useLanguage();
  const copy = SIGN_IN_COPY[language];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError(copy.invalidCredentials);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-2 sm:px-4">
      <div className="relative max-w-lg w-full dark:bg-[#17242B]/95 bg-[#FFFDF8]/95 dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-5 sm:p-8 shadow-xl shadow-slate-950/10 dark:shadow-black/25 space-y-6 backdrop-blur-sm transition overflow-hidden">
        {/* Brand Header */}
        <div className="text-center space-y-3 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-[#0F766E] flex items-center justify-center text-white text-2xl font-extrabold mx-auto shadow-lg shadow-teal-900/20 ring-4 ring-teal-700/10">
            R
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full dark:bg-emerald-400/10 bg-emerald-50 dark:text-emerald-300 text-emerald-700 border dark:border-emerald-400/20 border-emerald-200 text-[9px] font-bold uppercase tracking-[0.18em]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            {copy.secureAccess}
          </div>
          <h1 className="text-2xl font-extrabold dark:text-white text-slate-900 tracking-tight">
            {copy.title}
          </h1>
          <p className="text-xs dark:text-slate-400 text-slate-500">
            {copy.subtitle}
          </p>
        </div>

        {error && (
          <div role="alert" className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs font-bold text-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="signin-email" className="block dark:text-slate-400 text-slate-600 font-bold uppercase tracking-wider mb-1.5">
              {copy.email}
            </label>
            <input
              type="email"
              id="signin-email"
              name="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@codafriqa.rw"
              className="w-full dark:bg-slate-950/80 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-xl px-4 py-2.5 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
            />
          </div>

          <div>
            <label htmlFor="signin-password" className="block dark:text-slate-400 text-slate-600 font-bold uppercase tracking-wider mb-1.5">
              {copy.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="signin-password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full dark:bg-slate-950/80 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-xl px-4 py-2.5 pr-16 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 rounded-md text-[10px] font-bold dark:text-slate-400 text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-teal-900/20 hover:-translate-y-0.5"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                {copy.authenticating}
              </span>
            ) : copy.signIn}
          </button>
        </form>

        {/* Link to Registration */}
        <div className="pt-2 text-center text-xs dark:text-slate-400 text-slate-500">
          {copy.noAccount}{' '}
          <Link href="/auth/signup" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            {copy.createAccount}
          </Link>
        </div>
      </div>
    </div>
  );
}