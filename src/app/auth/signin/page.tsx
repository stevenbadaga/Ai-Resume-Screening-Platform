'use client';

import { Suspense, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  emailNotVerified: string;
  emailNotVerifiedHint: string;
  resendVerification: string;
  resendSent: string;
  resending: string;
  // Invalid email prompt (shown under the email field with an actionable hint)
  emailInvalidPrompt: string;
  // Two-step sign-in (step 2: emailed code)
  codeTitle: string;
  codeSentTo: string;
  codeLabel: string;
  codePlaceholder: string;
  verify: string;
  verifying: string;
  codeInvalid: string;
  codeHint: string;
  resendCode: string;
  codeResent: string;
  backToCredentials: string;
  codeDeliveryFailed: string;
  tooManyAttempts: string;
  activate: string;
  activationSuccess: string;
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
    emailNotVerified: 'Please verify your email address before signing in.',
    emailNotVerifiedHint: 'We sent a verification code when you registered. Enter it to activate your account.',
    resendVerification: 'Resend verification code',
    resendSent: 'Verification code sent. Check your inbox.',
    resending: 'Sending...',
    emailInvalidPrompt: "That email address doesn't look valid. Check it for typos — a missing '@', stray spaces, or an incomplete domain — then try again.",
    codeTitle: 'Two-Step Verification',
    codeSentTo: 'We emailed a 6-digit code to',
    codeLabel: 'Verification Code',
    codePlaceholder: '000000',
    verify: 'Verify & Sign In ➔',
    verifying: 'Verifying...',
    codeInvalid: 'Invalid or expired code. Please try again.',
    codeHint: 'The code expires in 10 minutes. Check your spam folder if it is not in your inbox.',
    resendCode: 'Resend code',
    codeResent: 'New code sent. Check your inbox.',
    backToCredentials: '← Use a different account',
    codeDeliveryFailed: 'The email could not be sent right now. Please try again shortly.',
    tooManyAttempts: 'Too many attempts. Please try again later.',
    activate: 'Activate ➔',
    activationSuccess: 'Email verified! Continuing to sign-in…',
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
    emailNotVerified: 'Veuillez vérifier votre adresse e-mail avant de vous connecter.',
    emailNotVerifiedHint: "Un code de vérification vous a été envoyé lors de l'inscription. Saisissez-le pour activer votre compte.",
    resendVerification: "Renvoyer le code de vérification",
    resendSent: "Code de vérification envoyé. Consultez votre boîte de réception.",
    resending: 'Envoi...',
    emailInvalidPrompt: "Cette adresse e-mail ne semble pas valide. Vérifiez l'absence de fautes de frappe — un « @ » manquant, des espaces ou un domaine incomplet — puis réessayez.",
    codeTitle: 'Vérification en deux étapes',
    codeSentTo: 'Nous avons envoyé un code à 6 chiffres à',
    codeLabel: 'Code de vérification',
    codePlaceholder: '000000',
    verify: 'Vérifier et se connecter ➔',
    verifying: 'Vérification...',
    codeInvalid: 'Code invalide ou expiré. Veuillez réessayer.',
    codeHint: 'Le code expire dans 10 minutes. Vérifiez votre dossier spam s’il n’est pas dans votre boîte.',
    resendCode: 'Renvoyer le code',
    codeResent: 'Nouveau code envoyé. Consultez votre boîte de réception.',
    backToCredentials: '← Utiliser un autre compte',
    codeDeliveryFailed: 'L’e-mail n’a pas pu être envoyé pour le moment. Veuillez réessayer sous peu.',
    tooManyAttempts: 'Trop de tentatives. Veuillez réessayer plus tard.',
    activate: 'Activer ➔',
    activationSuccess: 'E-mail vérifié ! Continuation de la connexion…',
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
    emailNotVerified: 'Verifique su dirección de correo antes de iniciar sesión.',
    emailNotVerifiedHint: 'Se envió un código de verificación al registrarse. Ingréselo para activar su cuenta.',
    resendVerification: 'Reenviar código de verificación',
    resendSent: 'Código de verificación enviado. Revise su bandeja de entrada.',
    resending: 'Enviando...',
    emailInvalidPrompt: 'Esa dirección de correo no parece válida. Revise si hay errores tipográficos — una «@» ausente, espacios o un dominio incompleto — e inténtelo de nuevo.',
    codeTitle: 'Verificación en dos pasos',
    codeSentTo: 'Enviamos un código de 6 dígitos a',
    codeLabel: 'Código de verificación',
    codePlaceholder: '000000',
    verify: 'Verificar e iniciar sesión ➔',
    verifying: 'Verificando...',
    codeInvalid: 'Código inválido o caducado. Inténtelo de nuevo.',
    codeHint: 'El código caduca en 10 minutos. Revise su carpeta de spam si no está en la bandeja.',
    resendCode: 'Reenviar código',
    codeResent: 'Nuevo código enviado. Revise su bandeja de entrada.',
    backToCredentials: '← Usar otra cuenta',
    codeDeliveryFailed: 'No se pudo enviar el correo ahora mismo. Inténtelo de nuevo en breve.',
    tooManyAttempts: 'Demasiados intentos. Inténtelo más tarde.',
    activate: 'Activar ➔',
    activationSuccess: '¡Correo verificado! Continuando con el inicio de sesión…',
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
    emailNotVerified: 'Bitte bestätigen Sie Ihre E-Mail-Adresse vor der Anmeldung.',
    emailNotVerifiedHint: 'Bei der Registrierung wurde ein Bestätigungscode gesendet. Geben Sie ihn ein, um Ihr Konto zu aktivieren.',
    resendVerification: 'Bestätigungscode erneut senden',
    resendSent: 'Bestätigungscode gesendet. Überprüfen Sie Ihren Posteingang.',
    resending: 'Wird gesendet...',
    emailInvalidPrompt: 'Diese E-Mail-Adresse scheint nicht gültig zu sein. Prüfen Sie auf Tippfehler — fehlendes „@", Leerzeichen oder eine unvollständige Domain — und versuchen Sie es erneut.',
    codeTitle: 'Zwei-Schritte-Verifizierung',
    codeSentTo: 'Wir haben einen 6-stelligen Code gesendet an',
    codeLabel: 'Bestätigungscode',
    codePlaceholder: '000000',
    verify: 'Verifizieren und anmelden ➔',
    verifying: 'Wird verifiziert...',
    codeInvalid: 'Ungültiger oder abgelaufener Code. Bitte erneut versuchen.',
    codeHint: 'Der Code läuft in 10 Minuten ab. Prüfen Sie Ihren Spam-Ordner, falls er nicht im Posteingang ist.',
    resendCode: 'Code erneut senden',
    codeResent: 'Neuer Code gesendet. Überprüfen Sie Ihren Posteingang.',
    backToCredentials: '← Anderes Konto verwenden',
    codeDeliveryFailed: 'Die E-Mail konnte gerade nicht gesendet werden. Bitte gleich erneut versuchen.',
    tooManyAttempts: 'Zu viele Versuche. Bitte später erneut versuchen.',
    activate: 'Aktivieren ➔',
    activationSuccess: 'E-Mail bestätigt! Anmeldung wird fortgesetzt…',
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
    emailNotVerified: 'Banza umeze aderesi ya imeyili mbere yo kwinjira.',
    emailNotVerifiedHint: 'Kode yo kwemeza yoherejwe iyo wiyandikishije. Yandike kugira ngo ukoreshe konti yawe.',
    resendVerification: 'Ongera uwohereze kode yo kwemeza',
    resendSent: 'Kode yo kwemeza yoherejwe. Reba uko utunganya.',
    resending: 'Birimo koherezwa...',
    emailInvalidPrompt: 'Aderesi ya imeyili ntiyoneka nk’iy’ukuri. Isuzume amakosa yo kwandika — @ ibura, umwanya utariyo, cyangwa urudomo ruranganye —ongera ugerageze.',
    codeTitle: 'Kwemeza mu matambwe abiri',
    codeSentTo: 'Twohereze kode nshya ibara 6 kuri',
    codeLabel: 'Kode yo kwemeza',
    codePlaceholder: '000000',
    verify: 'Emeza & winjire ➔',
    verifying: 'Birimo kwemezwa...',
    codeInvalid: 'Kode itemeuye cyangwa yarengeje igihe. Ongera ugerageze.',
    codeHint: 'Kode irengera umunota 10. Reba n’ububiko bw’ibaruwa bashobora kuyikubiyemo.',
    resendCode: 'Ongera uwohereze kode',
    codeResent: 'Kode nshya yoherejwe. Reba uko utunganya.',
    backToCredentials: '← Koresha konti ikomeye',
    codeDeliveryFailed: 'Imeyili ntishobora koherezwa ubu. Ongera ugerageze minyote.',
    tooManyAttempts: 'Ongeraneza bwinshi. Ongera ugerageze nyuma.',
    activate: 'Emeza konti ➔',
    activationSuccess: 'Imeyili yemejwe! Birimo gukomeza kwinjira…',
  },
};

function SignInForm() {
  const { language } = useLanguage();
  const copy = SIGN_IN_COPY[language];
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'delivery-failed'>('idle');

  // Two-step sign-in state: step 'credentials' → step 'code'.
  const [step, setStep] = useState<'credentials' | 'code'>('credentials');
  const [code, setCode] = useState('');
  const [codeStatus, setCodeStatus] = useState<'idle' | 'verifying' | 'resent' | 'delivery-failed'>('idle');

  // Signup activation (unverified account): the emailed activation code can
  // be typed straight into the banner — on success the flow continues into
  // the two-step sign-in automatically.
  const [activationCode, setActivationCode] = useState('');
  const [activationState, setActivationState] = useState<'idle' | 'activating' | 'done'>('idle');

  // Invalid-email prompt: raised by client-side format validation and by a
  // 400 from the resend endpoint (syntactically invalid address).
  const [emailFormatError, setEmailFormatError] = useState(false);
  // Resend-cooldown countdown (server-enforced); 0 = no active cooldown.
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const EMAIL_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // One-second self-chaining countdown while a resend cooldown is active.
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setTimeout(() => setCooldownSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  // Signup now requires email verification (spec §6.1) — a redirect from the
  // signup page shows a heads-up instead of a bare sign-in form.
  const justRegistered = searchParams.get('registered') === '1';
  const emailDeliveryFailed = searchParams.get('emailDelivery') === 'failed';

  const handleResend = async () => {
    if (!email || resendState === 'sending') return;
    setEmailFormatError(false);
    // Client-side prompt: catch obvious typos before bothering the server.
    if (!EMAIL_FORMAT_RE.test(email.trim()) || email.length > 320) {
      setEmailFormatError(true);
      return;
    }
    setResendState('sending');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 400) {
        // The server rejected the address format — same prompt, server-confirmed.
        setEmailFormatError(true);
        setResendState('idle');
        return;
      }
      if (typeof data?.cooldownSeconds === 'number' && data.cooldownSeconds > 0) {
        // A code was just sent; show the real wait instead of a false "sent".
        setCooldownSeconds(data.cooldownSeconds);
        setResendState('idle');
        return;
      }
      if (data?.delivered === false) {
        // Delivery provider failed — honest notice, retry stays available.
        setResendState('delivery-failed');
        return;
      }
      setResendState('sent');
    } catch {
      setResendState('idle');
    }
  };

  // Step 1: verify credentials server-side and email the 6-digit code.
  const runChallenge = async (): Promise<void> => {
    setLoading(true);
    setError('');
    setEmailNotVerified(false);
    setResendState('idle');

    try {
      const res = await fetch('/api/auth/login/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        // Factor 1 solved. Move to the code step — the password stays in
        // memory only; it is re-checked by NextAuth when the session is issued.
        setStep('code');
        setCodeStatus('idle');
      } else if (data.error === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(true);
      } else if (res.status === 429) {
        setError(copy.tooManyAttempts);
      } else if (res.status === 503) {
        setStep('code');
        setCodeStatus('delivery-failed');
      } else {
        setError(copy.invalidCredentials);
      }
    } catch {
      setError(copy.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runChallenge();
  };

  // Activate the account with the emailed signup code, then roll straight
  // into the two-step sign-in (the credentials are already in memory).
  const handleActivate = async () => {
    if (activationState === 'activating' || activationCode.length !== 6) return;
    setActivationState('activating');
    setError('');
    try {
      const res = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: activationCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setActivationState('done');
        setEmailNotVerified(false);
        await runChallenge();
      } else if (res.status === 429) {
        setError(copy.tooManyAttempts);
        setActivationState('idle');
      } else {
        setError(copy.codeInvalid);
        setActivationState('idle');
      }
    } catch {
      setError(copy.codeInvalid);
      setActivationState('idle');
    }
  };

  // Step 2: verify the emailed code, then exchange both factors for a session.
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codeStatus === 'verifying') return;
    setError('');
    setCodeStatus('verifying');

    try {
      const res = await fetch('/api/auth/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.verified && data.mfaTicket) {
        // Both factors proven. NextAuth issues the session — it re-verifies
        // the password AND the ticket, so the ticket alone grants nothing.
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
          mfaTicket: data.mfaTicket,
        });
        if (result?.error) {
          setError(copy.invalidCredentials);
          setStep('credentials');
        } else {
          router.push('/dashboard');
          router.refresh();
        }
      } else if (res.status === 429) {
        setError(copy.tooManyAttempts);
      } else {
        setError(copy.codeInvalid);
      }
    } catch {
      setError(copy.codeInvalid);
    } finally {
      setCodeStatus('idle');
    }
  };

  // Resend a fresh login code (server enforces a 60s cooldown).
  const handleResendCode = async () => {
    if (!email || !password || codeStatus === 'verifying' || cooldownSeconds > 0) return;
    setError('');
    try {
      const res = await fetch('/api/auth/login/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429 && typeof data?.retryAfterSeconds === 'number') {
        // Cooldown active — show the real wait instead of a failure.
        setCooldownSeconds(data.retryAfterSeconds);
        setCodeStatus('resent');
      } else if (res.ok && res.status !== 503) {
        setCodeStatus('resent');
      } else {
        setCodeStatus('delivery-failed');
      }
    } catch {
      setCodeStatus('delivery-failed');
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
            {step === 'code' ? copy.codeTitle : copy.title}
          </h1>
          {step === 'credentials' && (
            <p className="text-xs dark:text-slate-400 text-slate-500">
              {copy.subtitle}
            </p>
          )}
          {step === 'code' && (
            <p className="text-xs dark:text-slate-400 text-slate-500">
              {copy.codeSentTo} <span className="font-bold dark:text-white text-slate-800">{email}</span>
            </p>
          )}
        </div>

        {error && (
          <div role="alert" className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs font-bold text-center">
            ⚠️ {error}
          </div>
        )}

        {justRegistered && !error && !emailNotVerified && step === 'credentials' && (
          <div
            className={
              emailDeliveryFailed
                ? 'p-3.5 bg-amber-950/70 border border-amber-800 rounded-xl text-amber-200 text-xs font-semibold text-center space-y-2'
                : 'p-3.5 bg-teal-950/70 border border-teal-800 rounded-xl text-teal-300 text-xs font-semibold text-center'
            }
          >
            {emailDeliveryFailed ? (
              <>
                <p>⚠️ Account created, but the verification email could not be sent (email delivery is not working right now).</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendState === 'sending' || cooldownSeconds > 0}
                  className="px-3 py-1.5 bg-amber-700/80 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
                >
                  {cooldownSeconds > 0
                    ? `⏳ ${cooldownSeconds}s`
                    : resendState === 'sending'
                      ? copy.resending
                      : copy.resendVerification}
                </button>
                {resendState === 'delivery-failed' && (
                  <p className="font-medium text-amber-200">⚠️ {copy.codeDeliveryFailed}</p>
                )}
                {resendState === 'sent' && (
                  <p className="font-medium opacity-90">✅ {copy.resendSent}</p>
                )}
              </>
            ) : (
              <p>✅ Account created. Sign in with your email and password — you will then be asked for the verification code we emailed you.</p>
            )}
          </div>
        )}

        {emailNotVerified && (
          <div role="alert" className="p-3.5 bg-amber-950/70 border border-amber-800 rounded-xl text-amber-200 text-xs space-y-3 text-center">
            <p className="font-bold">⚠️ {copy.emailNotVerified}</p>
            <p className="font-medium opacity-90">{copy.emailNotVerifiedHint}</p>
            {activationState === 'done' ? (
              <p className="font-semibold text-emerald-300">✅ {copy.activationSuccess}</p>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="text"
                    id="activation-code"
                    name="activationCode"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-label={copy.codeLabel}
                    maxLength={6}
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder={copy.codePlaceholder}
                    className="w-40 dark:bg-slate-950/80 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-xl px-3 py-2 dark:text-white text-slate-900 placeholder-slate-400 text-center text-lg font-bold tracking-[0.3em] focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition"
                  />
                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={activationState === 'activating' || activationCode.length !== 6}
                    className="px-3 py-2 bg-amber-700/80 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
                  >
                    {activationState === 'activating' ? copy.verifying : copy.activate}
                  </button>
                </div>
                {resendState === 'delivery-failed' && (
                  <p className="font-medium text-amber-200">⚠️ {copy.codeDeliveryFailed}</p>
                )}
                {resendState === 'sent' ? (
                  <p className="font-semibold text-emerald-300">✅ {copy.resendSent}</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendState === 'sending' || cooldownSeconds > 0}
                    className="px-3 py-1.5 bg-amber-700/80 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
                  >
                    {cooldownSeconds > 0
                      ? `⏳ ${cooldownSeconds}s`
                      : resendState === 'sending'
                        ? copy.resending
                        : copy.resendVerification}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4 text-xs">
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
                required              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailFormatError) setEmailFormatError(false);
              }}
              placeholder="user@codafriqa.rw"
              aria-invalid={emailFormatError || undefined}
              aria-describedby={emailFormatError ? 'signin-email-format-error' : undefined}
              className={`w-full dark:bg-slate-950/80 bg-slate-50 border rounded-xl px-4 py-2.5 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 transition ${
                emailFormatError
                  ? 'border-rose-500 dark:border-rose-500 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-500/10'
                  : 'dark:bg-slate-950/80 dark:border-slate-800 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
              }`}
            />
            {emailFormatError && (
              <p
                id="signin-email-format-error"
                role="alert"
                className="mt-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400"
              >
                ⚠️ {copy.emailInvalidPrompt}
              </p>
            )}
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
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-4 text-xs">
            <div>
              <label htmlFor="signin-code" className="block dark:text-slate-400 text-slate-600 font-bold uppercase tracking-wider mb-1.5">
                {copy.codeLabel}
              </label>
              <input
                type="text"
                id="signin-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={copy.codePlaceholder}
                className="w-full dark:bg-slate-950/80 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-xl px-4 py-3 dark:text-white text-slate-900 placeholder-slate-400 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition"
              />
              <p className="mt-2 text-[11px] dark:text-slate-500 text-slate-400">{copy.codeHint}</p>
            </div>

            {codeStatus === 'delivery-failed' && (
              <div role="alert" className="p-3.5 bg-amber-950/70 border border-amber-800 rounded-xl text-amber-200 text-xs font-semibold text-center">
                ⚠️ {copy.codeDeliveryFailed}
              </div>
            )}
            {codeStatus === 'resent' && (
              <div role="status" className="p-3.5 bg-teal-950/70 border border-teal-800 rounded-xl text-teal-300 text-xs font-semibold text-center">
                ✅ {copy.codeResent}
              </div>
            )}

            <button
              type="submit"
              disabled={codeStatus === 'verifying' || code.length !== 6}
              className="w-full py-3 bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-teal-900/20 hover:-translate-y-0.5"
            >
              {codeStatus === 'verifying' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  {copy.verifying}
                </span>
              ) : copy.verify}
            </button>

            <div className="flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setCode('');
                  setError('');
                }}
                className="dark:text-slate-400 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
              >
                {copy.backToCredentials}
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={cooldownSeconds > 0}
                className="dark:text-slate-400 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline disabled:opacity-60 disabled:hover:no-underline"
              >
                {cooldownSeconds > 0 ? `${copy.resendCode} (${cooldownSeconds}s)` : copy.resendCode}
              </button>
            </div>
          </form>
        )}

        {/* Forgot password (spec §6.1) */}
        <div className="pt-2 text-center text-xs">
          <a
            href="/auth/forgot-password"
            className="dark:text-slate-400 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
          >
            Forgot your password?
          </a>
        </div>

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

export default function SignIn() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center text-xs dark:text-slate-400 text-slate-500">Loading…</div>}>
      <SignInForm />
    </Suspense>
  );
}
