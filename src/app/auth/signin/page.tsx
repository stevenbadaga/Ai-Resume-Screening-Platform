'use client';

import { Suspense, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
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
  applicantTab: string;
  staffTab: string;
  applicantBadge: string;
  staffBadge: string;
  applicantSub: string;
  staffSub: string;
  applicantPlaceholder: string;
  staffPlaceholder: string;
  noStaffAccount: string;
  createStaffAccount: string;
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
  codeCooldownWait: string;
  codeSentToTOTP: string;
  totpHint: string;
  activate: string;
  activationSuccess: string;
  registeredEmailFailed: string;
  registeredSuccess: string;
  forgotPassword: string;
  loadingText: string;
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
    noAccount: "Don't have an applicant account?",
    createAccount: 'Create Applicant Account →',
    applicantTab: 'Work Applicant',
    staffTab: 'Company & Staff',
    applicantBadge: 'Candidate Workspace',
    staffBadge: 'Company Staff Workspace',
    applicantSub: 'Sign in to track your job applications, CV status, and interview invites.',
    staffSub: 'Sign in to access resume screening pipelines, scoring rubrics, and team analytics.',
    applicantPlaceholder: 'candidate@example.com',
    staffPlaceholder: 'recruiter@company.com',
    noStaffAccount: 'Registering a company or joining a team?',
    createStaffAccount: 'Create Staff Account →',
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
    codeCooldownWait: 'A code was just sent — finishing sign-in…',
    codeSentToTOTP: 'Enter the 6-digit code from your authenticator app for',
    totpHint: 'Enter the 6-digit code currently shown in your authenticator app. If you lost access to your device, contact your administrator.',
    activate: 'Activate ➔',
    activationSuccess: 'Email verified! Continuing to sign-in…',
    registeredEmailFailed: 'Account created, but the verification email could not be sent (email delivery is not working right now).',
    registeredSuccess: 'Account created. Sign in with your email and password — you will then be asked for the verification code we emailed you.',
    forgotPassword: 'Forgot your password?',
    loadingText: 'Loading…',
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
    noAccount: "Vous n'avez pas de compte candidat ?",
    createAccount: 'Créer un compte candidat →',
    applicantTab: 'Candidat',
    staffTab: 'Entreprise & Équipe',
    applicantBadge: 'Espace Candidat',
    staffBadge: 'Espace Entreprise & Équipe',
    applicantSub: 'Connectez-vous pour suivre vos candidatures, vos CV et vos invitations d’entretien.',
    staffSub: 'Connectez-vous pour accéder au criblage de CV, aux grilles de notation et aux métriques.',
    applicantPlaceholder: 'candidat@exemple.com',
    staffPlaceholder: 'recruteur@entreprise.com',
    noStaffAccount: 'Vous enregistrez une entreprise ou rejoignez une équipe ?',
    createStaffAccount: 'Créer un compte entreprise →',
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
    codeCooldownWait: 'Un code vient d’être envoyé — finalisation de la connexion…',
    codeSentToTOTP: 'Entrez le code à 6 chiffres de votre application authentificatrice pour',
    totpHint: 'Entrez le code à 6 chiffres actuellement affiché dans votre application authentificatrice. Si vous avez perdu l’accès à votre appareil, contactez votre administrateur.',
    activate: 'Activer ➔',
    activationSuccess: 'E-mail vérifié ! Continuation de la connexion…',
    registeredEmailFailed: 'Compte créé, mais l’e-mail de vérification n’a pas pu être envoyé (l’envoi d’e-mails ne fonctionne pas pour le moment).',
    registeredSuccess: 'Compte créé. Connectez-vous avec votre e-mail et votre mot de passe — le code de vérification qui vous a été envoyé vous sera ensuite demandé.',
    forgotPassword: 'Mot de passe oublié ?',
    loadingText: 'Chargement…',
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
    noAccount: '¿No tienes una cuenta de candidato?',
    createAccount: 'Crear cuenta de candidato →',
    applicantTab: 'Candidato',
    staffTab: 'Empresa y Personal',
    applicantBadge: 'Espacio del Candidato',
    staffBadge: 'Espacio de Empresa y Equipo',
    applicantSub: 'Inicia sesión para revisar tus solicitudes, estado de CV e invitaciones a entrevistas.',
    staffSub: 'Inicia sesión para acceder al cribado de CVs, rúbricas de evaluación y análisis de equipo.',
    applicantPlaceholder: 'candidato@ejemplo.com',
    staffPlaceholder: 'reclutador@empresa.com',
    noStaffAccount: '¿Registras una empresa o te unes a un equipo?',
    createStaffAccount: 'Crear cuenta de personal →',
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
    codeCooldownWait: 'Se acaba de enviar un código — completando el inicio de sesión…',
    codeSentToTOTP: 'Ingresa el código de 6 dígitos de tu app de autenticación para',
    totpHint: 'Ingresa el código de 6 dígitos de tu app de autenticación. Si perdiste el acceso a tu dispositivo, contacta a tu administrador.',
    activate: 'Activar ➔',
    activationSuccess: '¡Correo verificado! Continuando con el inicio de sesión…',
    registeredEmailFailed: 'Cuenta creada, pero no se pudo enviar el correo de verificación (el envío de correos no funciona en este momento).',
    registeredSuccess: 'Cuenta creada. Inicie sesión con su correo y contraseña; después se le pedirá el código de verificación que le enviamos.',
    forgotPassword: '¿Olvidó su contraseña?',
    loadingText: 'Cargando…',
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
    noAccount: 'Noch kein Bewerberkonto?',
    createAccount: 'Bewerberkonto erstellen →',
    applicantTab: 'Bewerber',
    staffTab: 'Unternehmen & Team',
    applicantBadge: 'Bewerber-Arbeitsbereich',
    staffBadge: 'Unternehmens-Arbeitsbereich',
    applicantSub: 'Melden Sie sich an, um Ihre Bewerbungen, Lebenslauf-Status und Einladungen einzusehen.',
    staffSub: 'Melden Sie sich an, um Lebenslauf-Prüfungen, Bewertungsrubriken und Team-Analysen zu verwalten.',
    applicantPlaceholder: 'bewerber@beispiel.de',
    staffPlaceholder: 'recruiter@unternehmen.de',
    noStaffAccount: 'Unternehmen registrieren oder Team beitreten?',
    createStaffAccount: 'Mitarbeiterkonto erstellen →',
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
    codeCooldownWait: 'Ein Code wurde gerade gesendet — Anmeldung wird abgeschlossen…',
    codeSentToTOTP: 'Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App für ein',
    totpHint: 'Geben Sie den 6-stelligen Code ein, der aktuell in Ihrer Authenticator-App angezeigt wird. Wenn Sie den Zugriff auf Ihr Gerät verloren haben, wenden Sie sich an Ihren Administrator.',
    activate: 'Aktivieren ➔',
    activationSuccess: 'E-Mail bestätigt! Anmeldung wird fortgesetzt…',
    registeredEmailFailed: 'Konto erstellt, aber die Bestätigungs-E-Mail konnte nicht gesendet werden (der E-Mail-Versand funktioniert derzeit nicht).',
    registeredSuccess: 'Konto erstellt. Melden Sie sich mit E-Mail und Passwort an — anschließend werden Sie nach dem per E-Mail gesendeten Bestätigungscode gefragt.',
    forgotPassword: 'Passwort vergessen?',
    loadingText: 'Wird geladen…',
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
    noAccount: 'Nta konti y’usaba akazi ufite?',
    createAccount: 'Fungura konti y’usaba akazi →',
    applicantTab: 'Usaba akazi',
    staffTab: 'Ikigo n’Abakozi',
    applicantBadge: 'Umwanya w’Usaba Akazi',
    staffBadge: 'Umwanya w’Ikigo n’Abakozi',
    applicantSub: 'Injira kugira ngo ukurikirane ubusabe bwawe, imiterere ya CV, n’ubutumire bw’ibazwa.',
    staffSub: 'Injira kugira ngo ubashe gukoresha isuzuma rya CV, ibipimo byo gusuzuma, n’ibarurishamibare.',
    applicantPlaceholder: 'usaba@urugero.rw',
    staffPlaceholder: 'umukozi@ikigo.rw',
    noStaffAccount: 'Ukeneye kwandikisha ikigo cyangwa kwinjira mu ikipe?',
    createStaffAccount: 'Fungura konti y’ikigo →',
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
    codeCooldownWait: 'Kode yoherezwa vuba — baguze gusa…',
    codeSentToTOTP: 'Andika kodya 6 kuturageza hanyuma',
    totpHint: 'Andika kodya 6 ishyirwaga muri prooteyi yawe ya autentifikasyon. Niba uburyowoko bwawe bwafunzwe, kontakt yufite umuyobozi wawe.',
    activate: 'Emeza konti ➔',
    activationSuccess: 'Imeyili yemejwe! Birimo gukomeza kwinjira…',
    registeredEmailFailed: 'Konti yafunguwe, ariko imeyili yo kwemeza ntishobora koherezwa (kohereza imeyili ntikora ubu).',
    registeredSuccess: 'Konti yafunguwe. Injira ukoresha imeyili n’ijambo ry’ibanga — hanyuma ugasabwa kode yo kwemeza twoherejwe.',
    forgotPassword: 'Wibagiwe ijambo ry’ibanga?',
    loadingText: 'Birimo gupakura…',
  },
};

function SignInForm() {
  const { language } = useLanguage();
  const copy = SIGN_IN_COPY[language];
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialPortal =
    searchParams.get('portal') === 'staff' ||
    searchParams.get('accountType') === 'worker' ||
    searchParams.get('type') === 'worker'
      ? 'staff'
      : 'applicant';

  const [portalType, setPortalType] = useState<'applicant' | 'staff'>(initialPortal);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'delivery-failed'>('idle');

  // Two-step sign-in state: step 'credentials' → 'code' (emailed) or 'totp' (TOTP).
  const [step, setStep] = useState<'credentials' | 'code' | 'totp'>('credentials');
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
  const runChallenge = async (isRetry = false): Promise<void> => {
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
        // Factor 1 solved. Move to the appropriate second-factor step.
        if (data.next === 'totp') {
          setStep('totp');
        } else {
          setStep('code');
        }
        setCodeStatus('idle');
      } else if (data.error === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(true);
      } else if (res.status === 429) {
        // A code was issued moments ago (60s resend cooldown) — wait it out
        // and ask once more instead of dead-ending the user with a scary
        // error. The server stays authoritative: a real flood (IP/account
        // limiter) carries no retryAfterSeconds and still shows the error.
        if (
          !isRetry &&
          typeof data?.retryAfterSeconds === 'number' &&
          data.retryAfterSeconds > 0 &&
          data.retryAfterSeconds <= 70
        ) {
          setError(copy.codeCooldownWait);
          await new Promise((resolve) => setTimeout(resolve, Math.min(data.retryAfterSeconds, 60) * 1000));
          return runChallenge(true);
        }
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

  // Step 2: verify the second factor (emailed code or TOTP), then exchange
  // both factors for a session.
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codeStatus === 'verifying') return;
    setError('');
    setCodeStatus('verifying');

    try {
      const res = await fetch('/api/auth/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, factor: step === 'totp' ? 'totp' : 'code' }),
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
          const requestedDestination = searchParams.get('callbackUrl');
          const destination = requestedDestination?.startsWith('/') && !requestedDestination.startsWith('//')
            ? requestedDestination
            : '/dashboard';
          router.push(destination);
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
  // For TOTP, this is not available — codes refresh every 30 seconds.
  const handleResendCode = async () => {
    if (step === 'totp') return; // TOTP codes auto-refresh; no resend.
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
      <div className="panel-raised rounded-2xl max-w-lg w-full p-5 sm:p-8 space-y-6 overflow-hidden">
        {/* Brand Header */}
        <div className="text-center space-y-3 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-white dark:text-[#0B0F14] text-2xl font-extrabold mx-auto shadow-md ring-4 ring-[var(--accent-ring)]">
            R
          </div>
          <div className="chip chip-success !text-[9px] !tracking-[0.18em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--success)' }} />
            {step === 'credentials'
              ? (portalType === 'applicant' ? copy.applicantBadge : copy.staffBadge)
              : copy.secureAccess}
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)] tracking-tight">
            {step === 'code' || step === 'totp' ? copy.codeTitle : copy.title}
          </h1>
          {step === 'credentials' && (
            <p className="text-xs text-[var(--muted)]">
              {copy.subtitle}
            </p>
          )}
          {(step === 'code' || step === 'totp') && (
            <p className="text-xs text-[var(--muted)]">
              {step === 'totp' ? copy.codeSentToTOTP : copy.codeSentTo} <span className="font-bold text-[var(--foreground)]">{email}</span>
            </p>
          )}
        </div>

        {/* Portal Switcher (credentials mode) */}
        {step === 'credentials' && (
          <div className="space-y-3">
            <div className="segmented max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => setPortalType('applicant')}
                className={`!py-2 !px-3 flex items-center justify-center gap-1.5 ${
                  portalType === 'applicant' ? 'active' : ''
                }`}
              >
                <span aria-hidden="true">🧑‍💼</span>
                <span>{copy.applicantTab}</span>
              </button>

              <button
                type="button"
                onClick={() => setPortalType('staff')}
                className={`!py-2 !px-3 flex items-center justify-center gap-1.5 ${
                  portalType === 'staff' ? 'active' : ''
                }`}
              >
                <span aria-hidden="true">🏢</span>
                <span>{copy.staffTab}</span>
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] flex items-center gap-2.5 text-left">
              <span className="text-xl" aria-hidden="true">{portalType === 'applicant' ? '📄' : '🏢'}</span>
              <div>
                <h3 className="font-bold text-[var(--foreground)] text-xs">
                  {portalType === 'applicant' ? copy.applicantBadge : copy.staffBadge}
                </h3>
                <p className="text-[10px] text-[var(--muted)]">
                  {portalType === 'applicant' ? copy.applicantSub : copy.staffSub}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-lg border text-xs font-bold text-center"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--danger) 8%, var(--surface))',
              borderColor: 'color-mix(in srgb, var(--danger) 35%, transparent)',
              color: 'var(--danger)',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {justRegistered && !error && !emailNotVerified && step === 'credentials' && (
          <div
            className={
              emailDeliveryFailed
                ? 'p-3.5 rounded-lg border text-xs font-semibold text-center space-y-2 border-[color-mix(in_srgb,var(--warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--warning)_8%,var(--surface))] text-[var(--warning)]'
                : 'p-3.5 rounded-lg border text-xs font-semibold text-center border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[var(--accent-soft)] text-[var(--accent)]'
            }
          >
            {emailDeliveryFailed ? (
              <>
                <p>⚠️ {copy.registeredEmailFailed}</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendState === 'sending' || cooldownSeconds > 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition border !text-[var(--warning)] !border-[color-mix(in_srgb,var(--warning)_40%,transparent)] !bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] hover:!bg-[color-mix(in_srgb,var(--warning)_18%,transparent)] disabled:opacity-50"
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
              <p>✅ {copy.registeredSuccess}</p>
            )}
          </div>
        )}

        {emailNotVerified && (
          <div role="alert" className="p-3.5 rounded-lg border text-xs space-y-3 text-center border-[color-mix(in_srgb,var(--warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--warning)_8%,var(--surface))] text-[var(--warning)]">
            <p className="font-bold">⚠️ {copy.emailNotVerified}</p>
            <p className="font-medium opacity-90">{copy.emailNotVerifiedHint}</p>
            {activationState === 'done' ? (
              <p className="font-semibold text-[var(--success)]">✅ {copy.activationSuccess}</p>
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
                    className="w-40 field !rounded-lg !px-3 !py-2 text-center !text-lg !font-bold !tracking-[0.3em]"
                  />
                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={activationState === 'activating' || activationCode.length !== 6}
                    className="px-3 py-2 rounded-lg text-xs font-semibold transition border !text-[var(--warning)] !border-[color-mix(in_srgb,var(--warning)_40%,transparent)] !bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] hover:!bg-[color-mix(in_srgb,var(--warning)_18%,transparent)] disabled:opacity-50"
                  >
                    {activationState === 'activating' ? copy.verifying : copy.activate}
                  </button>
                </div>
                {resendState === 'delivery-failed' && (
                  <p className="font-medium text-amber-200">⚠️ {copy.codeDeliveryFailed}</p>
                )}
                {resendState === 'sent' ? (
                  <p className="font-semibold text-[var(--success)]">✅ {copy.resendSent}</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendState === 'sending' || cooldownSeconds > 0}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition border !text-[var(--warning)] !border-[color-mix(in_srgb,var(--warning)_40%,transparent)] !bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] hover:!bg-[color-mix(in_srgb,var(--warning)_18%,transparent)] disabled:opacity-50"
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
              <label htmlFor="signin-email" className="field-label">
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailFormatError) setEmailFormatError(false);
                }}
                placeholder={portalType === 'applicant' ? copy.applicantPlaceholder : copy.staffPlaceholder}
                aria-invalid={emailFormatError || undefined}
                aria-describedby={emailFormatError ? 'signin-email-format-error' : undefined}
                className={`w-full field !rounded-lg !px-4 !py-2.5 ${
                  emailFormatError
                    ? '!border-[var(--danger)]'
                    : ''
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
              <label htmlFor="signin-password" className="field-label">
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
                  className="w-full field !rounded-lg !px-4 !py-2.5 !pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 rounded-md text-[10px] font-bold text-[var(--muted)] hover:bg-[var(--surface-muted)] focus:outline-none"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full !py-3 btn btn-primary !rounded-lg !text-xs !font-bold"
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
              <label htmlFor="signin-code" className="field-label">
                {step === 'totp' ? 'Authenticator Code' : copy.codeLabel}
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
                className="w-full field !rounded-lg !px-4 !py-3 text-center !text-2xl !font-bold !tracking-[0.5em]"
              />
              <p className="mt-2 text-[11px] text-[var(--muted)]">{step === 'totp' ? copy.totpHint : copy.codeHint}</p>
            </div>

            {codeStatus === 'delivery-failed' && (
              <div role="alert" className="p-3.5 rounded-lg border text-xs font-semibold text-center border-[color-mix(in_srgb,var(--warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--warning)_8%,var(--surface))] text-[var(--warning)]">
                ⚠️ {copy.codeDeliveryFailed}
              </div>
            )}
            {codeStatus === 'resent' && (
              <div role="status" className="p-3.5 rounded-lg border text-xs font-semibold text-center border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[var(--accent-soft)] text-[var(--accent)]">
                ✅ {copy.codeResent}
              </div>
            )}

            <button
              type="submit"
              disabled={codeStatus === 'verifying' || code.length !== 6}
              className="w-full !py-3 btn btn-primary !rounded-lg !text-xs !font-bold"
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
                className="text-[var(--muted)] hover:text-[var(--foreground)] hover:underline"
              >
                {copy.backToCredentials}
              </button>
              {step === 'totp' ? (
                <span className="text-[11px] text-[var(--muted)]">
                  New code every 30 seconds
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={cooldownSeconds > 0}
                  className="text-[var(--muted)] hover:text-[var(--foreground)] hover:underline disabled:opacity-60 disabled:hover:no-underline"
                >
                  {cooldownSeconds > 0 ? `${copy.resendCode} (${cooldownSeconds}s)` : copy.resendCode}
                </button>
              )}
            </div>
          </form>
        )}

        {/* Forgot password (spec §6.1) */}
        <div className="pt-2 text-center text-xs">
          <a
            href="/auth/forgot-password"
            className="text-[var(--muted)] hover:text-[var(--foreground)] hover:underline"
          >
            {copy.forgotPassword}
          </a>
        </div>

        {/* Link to Registration */}
        <div className="pt-2 text-center text-xs text-[var(--muted)] border-t border-[var(--border)]">
          {portalType === 'applicant' ? (
            <div>
              <span>{copy.noAccount} </span>
              <Link href="/auth/signup?accountType=candidate" className="link font-bold">
                {copy.createAccount}
              </Link>
            </div>
          ) : (
            <div>
              <span>{copy.noStaffAccount} </span>
              <Link href="/auth/signup?accountType=worker" className="link font-bold">
                {copy.createStaffAccount}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SignInLoading() {
  const { language } = useLanguage();
  return (
    <div className="min-h-[85vh] flex items-center justify-center text-xs text-[var(--muted)]">
      {SIGN_IN_COPY[language].loadingText}
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInForm />
    </Suspense>
  );
}
