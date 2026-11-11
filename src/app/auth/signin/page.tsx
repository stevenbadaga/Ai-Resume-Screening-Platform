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
  applicantTitle: string;
  staffTitle: string;
  applicantSub: string;
  staffSub: string;
  applicantPlaceholder: string;
  staffPlaceholder: string;
  noStaffAccount: string;
  createStaffAccount: string;
  applicantOverlayTitle: string;
  applicantOverlaySub: string;
  applicantOverlayBtn: string;
  staffOverlayTitle: string;
  staffOverlaySub: string;
  staffOverlayBtn: string;
  emailNotVerified: string;
  emailNotVerifiedHint: string;
  resendVerification: string;
  resendSent: string;
  resending: string;
  emailInvalidPrompt: string;
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
  demoCandidatePill: string;
  demoRecruiterPill: string;
  demoAdminPill: string;
}> = {
  en: {
    title: 'Sign In to RecruitAI',
    subtitle: 'Human-centered recruitment & applicant tracking.',
    email: 'Email Address',
    password: 'Password',
    secureAccess: 'Secure workspace access',
    signIn: 'Sign In →',
    authenticating: 'Authenticating...',
    invalidCredentials: 'Invalid email or password credentials.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    noAccount: "Don't have an applicant account?",
    createAccount: 'Create Applicant Account →',
    applicantTab: 'Candidate Portal',
    staffTab: 'Company & Staff',
    applicantBadge: 'Candidate Workspace',
    staffBadge: 'Company Staff Workspace',
    applicantTitle: 'Candidate Sign In',
    staffTitle: 'Staff Workspace Sign In',
    applicantSub: 'Sign in to track your job applications, CV status, and interview invites.',
    staffSub: 'Sign in to access resume screening pipelines, scoring rubrics, and team analytics.',
    applicantPlaceholder: 'candidate@example.com',
    staffPlaceholder: 'recruiter@company.com',
    noStaffAccount: 'Registering a company or joining a team?',
    createStaffAccount: 'Create Staff Account →',
    applicantOverlayTitle: 'Hiring Team or Staff?',
    applicantOverlaySub: 'Are you managing candidate pipelines or reviewing requisitions? Access your corporate workspace with structured scorecards and audit trails.',
    applicantOverlayBtn: 'Switch to Staff Portal →',
    staffOverlayTitle: 'Applying for a Job?',
    staffOverlaySub: 'Looking to submit your CV, check your screening status, or review interview invitations? Head over to the candidate portal.',
    staffOverlayBtn: 'Switch to Candidate Portal →',
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
    verify: 'Verify & Sign In →',
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
    activate: 'Activate →',
    activationSuccess: 'Email verified! Continuing to sign-in…',
    registeredEmailFailed: 'Account created, but the verification email could not be sent (email delivery is not working right now).',
    registeredSuccess: 'Account created. Sign in with your email and password — you will then be asked for the verification code we emailed you.',
    forgotPassword: 'Forgot your password?',
    loadingText: 'Loading…',
    demoCandidatePill: 'Demo Candidate',
    demoRecruiterPill: 'Demo Recruiter',
    demoAdminPill: 'Demo Admin',
  },
  fr: {
    title: 'Se connecter à RecruitAI',
    subtitle: 'Plateforme moderne de recrutement et suivi des candidatures.',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    secureAccess: 'Accès sécurisé à l’espace de travail',
    signIn: 'Se connecter →',
    authenticating: 'Authentification...',
    invalidCredentials: 'Adresse e-mail ou mot de passe incorrect.',
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
    noAccount: "Vous n'avez pas de compte candidat ?",
    createAccount: 'Créer un compte candidat →',
    applicantTab: 'Portail Candidat',
    staffTab: 'Entreprise & Équipe',
    applicantBadge: 'Espace Candidat',
    staffBadge: 'Espace Entreprise & Équipe',
    applicantTitle: 'Connexion Candidat',
    staffTitle: 'Connexion Espace Entreprise',
    applicantSub: 'Connectez-vous pour suivre vos candidatures, vos CV et vos invitations d’entretien.',
    staffSub: 'Connectez-vous pour accéder au criblage de CV, aux grilles de notation et aux métriques.',
    applicantPlaceholder: 'candidat@exemple.com',
    staffPlaceholder: 'recruteur@entreprise.com',
    noStaffAccount: 'Vous enregistrez une entreprise ou rejoignez une équipe ?',
    createStaffAccount: 'Créer un compte entreprise →',
    applicantOverlayTitle: 'Entreprise ou Recruteur ?',
    applicantOverlaySub: 'Vous recrutez ou gérez des candidatures ? Accédez à votre espace entreprise pour évaluer les candidats et collaborer sur les grilles.',
    applicantOverlayBtn: 'Passer à l’espace entreprise →',
    staffOverlayTitle: 'Vous postulez ?',
    staffOverlaySub: 'Vous souhaitez suivre vos candidatures, vos entretiens ou mettre à jour votre CV ? Accédez au portail candidat.',
    staffOverlayBtn: 'Passer au portail candidat →',
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
    verify: 'Vérifier et se connecter →',
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
    activate: 'Activer →',
    activationSuccess: 'E-mail vérifié ! Continuation de la connexion…',
    registeredEmailFailed: 'Compte créé, mais l’e-mail de vérification n’a pas pu être envoyé (l’envoi d’e-mails ne fonctionne pas pour le moment).',
    registeredSuccess: 'Compte créé. Connectez-vous avec votre e-mail et votre mot de passe — le code de vérification qui vous a été envoyé vous sera ensuite demandé.',
    forgotPassword: 'Mot de passe oublié ?',
    loadingText: 'Chargement…',
    demoCandidatePill: 'Démo Candidat',
    demoRecruiterPill: 'Démo Recruteur',
    demoAdminPill: 'Démo Admin',
  },
  es: {
    title: 'Iniciar sesión en RecruitAI',
    subtitle: 'Plataforma moderna de selección de talento y gestión de postulaciones.',
    email: 'Dirección de correo',
    password: 'Contraseña',
    secureAccess: 'Acceso seguro al espacio de trabajo',
    signIn: 'Iniciar sesión →',
    authenticating: 'Autenticando...',
    invalidCredentials: 'El correo o la contraseña no son válidos.',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
    noAccount: '¿No tienes una cuenta de candidato?',
    createAccount: 'Crear cuenta de candidato →',
    applicantTab: 'Portal de Candidato',
    staffTab: 'Empresa y Personal',
    applicantBadge: 'Espacio del Candidato',
    staffBadge: 'Espacio de Empresa y Equipo',
    applicantTitle: 'Iniciar Sesión Candidato',
    staffTitle: 'Iniciar Sesión Empresa',
    applicantSub: 'Inicia sesión para revisar tus solicitudes, estado de CV e invitaciones a entrevistas.',
    staffSub: 'Inicia sesión para acceder al cribado de CVs, rúbricas de evaluación y análisis de equipo.',
    applicantPlaceholder: 'candidato@ejemplo.com',
    staffPlaceholder: 'reclutador@empresa.com',
    noStaffAccount: '¿Registras una empresa o te unes a un equipo?',
    createStaffAccount: 'Crear cuenta de personal →',
    applicantOverlayTitle: '¿Empresa o Equipo?',
    applicantOverlaySub: '¿Estás contratando o gestionando candidatos? Accede a tu espacio de empresa para evaluar postulantes y colaborar en rúbricas.',
    applicantOverlayBtn: 'Ir al portal de empresa →',
    staffOverlayTitle: '¿Buscas empleo?',
    staffOverlaySub: '¿Deseas dar seguimiento a tus postulaciones, entrevistas o actualizar tu CV? Accede al portal de candidatos.',
    staffOverlayBtn: 'Ir al portal de candidatos →',
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
    verify: 'Verificar e iniciar sesión →',
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
    activate: 'Activar →',
    activationSuccess: '¡Correo verificado! Continuando con el inicio de sesión…',
    registeredEmailFailed: 'Cuenta creada, pero no se pudo enviar el correo de verificación (el envío de correos no funciona en este momento).',
    registeredSuccess: 'Cuenta creada. Inicie sesión con su correo y contraseña; después se le pedirá el código de verificación que le enviamos.',
    forgotPassword: '¿Olvidó su contraseña?',
    loadingText: 'Cargando…',
    demoCandidatePill: 'Demo Candidato',
    demoRecruiterPill: 'Demo Reclutador',
    demoAdminPill: 'Demo Admin',
  },
  de: {
    title: 'Bei RecruitAI anmelden',
    subtitle: 'Moderne Talentakquise und Bewerbermanagement-Plattform.',
    email: 'E-Mail-Adresse',
    password: 'Passwort',
    secureAccess: 'Sicherer Zugriff auf den Arbeitsbereich',
    signIn: 'Anmelden →',
    authenticating: 'Authentifizierung...',
    invalidCredentials: 'Ungültige E-Mail-Adresse oder ungültiges Passwort.',
    showPassword: 'Passwort anzeigen',
    hidePassword: 'Passwort ausblenden',
    noAccount: 'Noch kein Bewerberkonto?',
    createAccount: 'Bewerberkonto erstellen →',
    applicantTab: 'Bewerberportal',
    staffTab: 'Unternehmen & Team',
    applicantBadge: 'Bewerber-Arbeitsbereich',
    staffBadge: 'Unternehmens-Arbeitsbereich',
    applicantTitle: 'Bewerber-Anmeldung',
    staffTitle: 'Mitarbeiter-Anmeldung',
    applicantSub: 'Melden Sie sich an, um Ihre Bewerbungen, Lebenslauf-Status und Einladungen einzusehen.',
    staffSub: 'Melden Sie sich an, um Lebenslauf-Prüfungen, Bewertungsrubriken und Team-Analysen zu verwalten.',
    applicantPlaceholder: 'bewerber@beispiel.de',
    staffPlaceholder: 'recruiter@unternehmen.de',
    noStaffAccount: 'Unternehmen registrieren oder Team beitreten?',
    createStaffAccount: 'Mitarbeiterkonto erstellen →',
    applicantOverlayTitle: 'Unternehmen & Team?',
    applicantOverlaySub: 'Rekrutieren oder verwalten Sie Bewerber? Nutzen Sie Ihren Unternehmensarbeitsbereich für strukturierte Bewertungen und Auswertungen.',
    applicantOverlayBtn: 'Zum Unternehmensportal →',
    staffOverlayTitle: 'Bewerben Sie sich?',
    staffOverlaySub: 'Möchten Sie Ihre Bewerbungen, Interviewtermine oder Ihren Lebenslauf verwalten? Wechseln Sie zum Bewerberportal.',
    staffOverlayBtn: 'Zum Bewerberportal →',
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
    verify: 'Verifizieren und anmelden →',
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
    activate: 'Aktivieren →',
    activationSuccess: 'E-Mail bestätigt! Anmeldung wird fortgesetzt…',
    registeredEmailFailed: 'Konto erstellt, aber die Bestätigungs-E-Mail konnte nicht gesendet werden (der E-Mail-Versand funktioniert derzeit nicht).',
    registeredSuccess: 'Konto erstellt. Melden Sie sich mit E-Mail und Passwort an — anschließend werden Sie nach dem per E-Mail gesendeten Bestätigungscode gefragt.',
    forgotPassword: 'Passwort vergessen?',
    loadingText: 'Wird geladen…',
    demoCandidatePill: 'Demo Bewerber',
    demoRecruiterPill: 'Demo Recruiter',
    demoAdminPill: 'Demo Admin',
  },
  rw: {
    title: 'Injira muri RecruitAI',
    subtitle: 'Urubuga rugezweho rwo gushaka no gukurikirana abakozi.',
    email: 'Aderesi ya imeyili',
    password: 'Ijambo ry’ibanga',
    secureAccess: 'Kwinjira mu mwanya w’akazi mu buryo bwizewe',
    signIn: 'Injira →',
    authenticating: 'Birimo kugenzurwa...',
    invalidCredentials: 'Imeyili/ijambo ry’ibanga si byo.',
    showPassword: 'Erekana ijambo ry’ibanga',
    hidePassword: 'Hisha ijambo ry’ibanga',
    noAccount: 'Nta konti y’usaba akazi ufite?',
    createAccount: 'Fungura konti y’usaba akazi →',
    applicantTab: 'Umwanya w’Usaba Akazi',
    staffTab: 'Ikigo n’Abakozi',
    applicantBadge: 'Umwanya w’Usaba Akazi',
    staffBadge: 'Umwanya w’Ikigo n’Abakozi',
    applicantTitle: 'Kwinjira kw’Usaba Akazi',
    staffTitle: 'Kwinjira kw’Ikigo n’Abakozi',
    applicantSub: 'Injira kugira ngo ukurikirane ubusabe bwawe, imiterere ya CV, n’ubutumire bw’ibazwa.',
    staffSub: 'Injira kugira ngo ubashe gukoresha isuzuma rya CV, ibipimo byo gusuzuma, n’ibarurishamibare.',
    applicantPlaceholder: 'usaba@urugero.rw',
    staffPlaceholder: 'umukozi@ikigo.rw',
    noStaffAccount: 'Ukeneye kwandikisha ikigo cyangwa kwinjira mu ikipe?',
    createStaffAccount: 'Fungura konti y’ikigo →',
    applicantOverlayTitle: 'Ikigo n’Abakozi?',
    applicantOverlaySub: 'Urashaka abakozi cyangwa uragenzura ubusabe? Injira mu mwanya w’ikigo kugira ngo usuzume abakandida ku buryo bwizewe.',
    applicantOverlayBtn: 'Jya ku mwanya w’ikigo →',
    staffOverlayTitle: 'Urasaba akazi?',
    staffOverlaySub: 'Urashaka gukurikirana ubusabe bwawe, gahunda y’ibazwa, cyangwa kuvugurura CV? Injira ku rubuga rw’abasaba akazi.',
    staffOverlayBtn: 'Jya ku rubuga rw’abasaba →',
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
    verify: 'Emeza & winjire →',
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
    activate: 'Emeza konti →',
    activationSuccess: 'Imeyili yemejwe! Birimo gukomeza kwinjira…',
    registeredEmailFailed: 'Konti yafunguwe, ariko imeyili yo kwemeza ntishobora koherezwa (kohereza imeyili ntikora ubu).',
    registeredSuccess: 'Konti yafunguwe. Injira ukoresha imeyili n’ijambo ry’ibanga — hanyuma ugasabwa kode yo kwemeza twoherejwe.',
    forgotPassword: 'Wibagiwe ijambo ry’ibanga?',
    loadingText: 'Birimo gupakura…',
    demoCandidatePill: 'Demo Usaba Akazi',
    demoRecruiterPill: 'Demo Ushakisha',
    demoAdminPill: 'Demo Admin',
  },
};

function SignInForm() {
  const { language } = useLanguage();
  const copy = SIGN_IN_COPY[language] || SIGN_IN_COPY.en;
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
        setEmailFormatError(true);
        setResendState('idle');
        return;
      }
      if (typeof data?.cooldownSeconds === 'number' && data.cooldownSeconds > 0) {
        setCooldownSeconds(data.cooldownSeconds);
        setResendState('idle');
        return;
      }
      if (data?.delivered === false) {
        setResendState('delivery-failed');
        return;
      }
      setResendState('sent');
    } catch {
      setResendState('idle');
    }
  };

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
        if (data.next === 'totp') {
          setStep('totp');
        } else {
          setStep('code');
        }
        setCodeStatus('idle');
      } else if (data.error === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(true);
      } else if (res.status === 429) {
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

  const handleResendCode = async () => {
    if (step === 'totp') return;
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

  const fillCredentials = (targetEmail: string) => {
    setEmail(targetEmail);
    setPassword('Password123!');
    setError('');
    setEmailFormatError(false);
  };

  // Reusable credential form markup
  const renderCredentialsForm = (portal: 'applicant' | 'staff') => (
    <form onSubmit={handleCredentialsSubmit} className="space-y-4 text-xs">
      <div>
        <label htmlFor={`signin-email-${portal}`} className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5 text-xs">
          {portal === 'applicant' ? copy.email : copy.email}
        </label>
        <div className="relative">
          <input
            type="email"
            id={`signin-email-${portal}`}
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailFormatError) setEmailFormatError(false);
            }}
            placeholder={portal === 'applicant' ? copy.applicantPlaceholder : copy.staffPlaceholder}
            aria-invalid={emailFormatError || undefined}
            aria-describedby={emailFormatError ? `signin-email-format-error-${portal}` : undefined}
            className={`w-full rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all ${
              emailFormatError ? '!border-rose-500 !ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'
            }`}
          />
        </div>
        {emailFormatError && (
          <p
            id={`signin-email-format-error-${portal}`}
            role="alert"
            className="mt-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{copy.emailInvalidPrompt}</span>
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={`signin-password-${portal}`} className="block text-slate-700 dark:text-slate-300 font-semibold text-xs">
            {copy.password}
          </label>
          <a
            href="/auth/forgot-password"
            className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            {copy.forgotPassword}
          </a>
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id={`signin-password-${portal}`}
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full rounded-xl px-4 py-2.5 pr-14 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? copy.hidePassword : copy.showPassword}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 active:scale-[0.99] transition-all duration-200 shadow-md shadow-teal-900/20 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            <span>{copy.authenticating}</span>
          </>
        ) : (
          <span>{portal === 'applicant' ? copy.signIn : copy.signIn}</span>
        )}
      </button>
    </form>
  );

  // Reusable 2FA challenge markup
  const renderMfaForm = () => (
    <form onSubmit={handleCodeSubmit} className="space-y-4 text-xs">
      <div className="text-center pb-2">
        <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
          {step === 'totp' ? 'Authenticator Code' : copy.codeTitle}
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {step === 'totp' ? copy.codeSentToTOTP : copy.codeSentTo}{' '}
          <strong className="text-slate-900 dark:text-slate-200">{email}</strong>
        </p>
      </div>

      <div>
        <label htmlFor="signin-code-input" className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-center text-xs">
          {step === 'totp' ? 'Authenticator Code' : copy.codeLabel}
        </label>
        <input
          type="text"
          id="signin-code-input"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder={copy.codePlaceholder}
          className="w-full rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono"
        />
        <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 text-center">
          {step === 'totp' ? copy.totpHint : copy.codeHint}
        </p>
      </div>

      {codeStatus === 'delivery-failed' && (
        <div role="alert" className="p-3 rounded-xl border text-xs font-semibold text-center flex items-center justify-center gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{copy.codeDeliveryFailed}</span>
        </div>
      )}
      {codeStatus === 'resent' && (
        <div role="status" className="p-3 rounded-xl border text-xs font-semibold text-center flex items-center justify-center gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <svg className="w-4 h-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{copy.codeResent}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={codeStatus === 'verifying' || code.length !== 6}
        className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 active:scale-[0.99] transition-all duration-200 shadow-md shadow-teal-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {codeStatus === 'verifying' ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            <span>{copy.verifying}</span>
          </>
        ) : (
          <span>{copy.verify}</span>
        )}
      </button>

      <div className="flex items-center justify-between text-[11px] pt-1">
        <button
          type="button"
          onClick={() => {
            setStep('credentials');
            setCode('');
            setError('');
          }}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {copy.backToCredentials}
        </button>
        {step === 'totp' ? (
          <span className="text-slate-400 dark:text-slate-500">
            Auto-refreshes every 30s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResendCode}
            disabled={cooldownSeconds > 0}
            className="text-teal-600 dark:text-teal-400 hover:underline disabled:opacity-50 disabled:no-underline font-medium"
          >
            {cooldownSeconds > 0 ? `${copy.resendCode} (${cooldownSeconds}s)` : copy.resendCode}
          </button>
        )}
      </div>
    </form>
  );

  // Common notification banner block
  const renderAlerts = () => (
    <>
      {error && (
        <div
          role="alert"
          className="p-3 rounded-xl border text-xs font-semibold text-center flex items-center justify-center gap-1.5 border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {justRegistered && !error && !emailNotVerified && step === 'credentials' && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold text-center space-y-2 ${
            emailDeliveryFailed
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {emailDeliveryFailed ? (
            <>
              <p className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{copy.registeredEmailFailed}</span>
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendState === 'sending' || cooldownSeconds > 0}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition border border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200 hover:bg-amber-500/25 disabled:opacity-50"
              >
                {cooldownSeconds > 0
                  ? `${cooldownSeconds}s`
                  : resendState === 'sending'
                    ? copy.resending
                    : copy.resendVerification}
              </button>
              {resendState === 'delivery-failed' && (
                <p className="font-medium text-amber-600 dark:text-amber-300 flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{copy.codeDeliveryFailed}</span>
                </p>
              )}
              {resendState === 'sent' && (
                <p className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{copy.resendSent}</span>
                </p>
              )}
            </>
          ) : (
            <p className="flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{copy.registeredSuccess}</span>
            </p>
          )}
        </div>
      )}

      {emailNotVerified && (
        <div role="alert" className="p-3.5 rounded-xl border text-xs space-y-2.5 text-center border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
          <p className="font-bold flex items-center justify-center gap-1.5">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{copy.emailNotVerified}</span>
          </p>
          <p className="text-[11px] opacity-90">{copy.emailNotVerifiedHint}</p>
          {activationState === 'done' ? (
            <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{copy.activationSuccess}</span>
            </p>
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
                  className="w-36 rounded-lg px-3 py-1.5 text-center text-base font-bold tracking-[0.3em] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleActivate}
                  disabled={activationState === 'activating' || activationCode.length !== 6}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 transition-colors disabled:opacity-50"
                >
                  {activationState === 'activating' ? copy.verifying : copy.activate}
                </button>
              </div>
              {resendState === 'delivery-failed' && (
                <p className="font-medium text-amber-600 dark:text-amber-300 flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{copy.codeDeliveryFailed}</span>
                </p>
              )}
              {resendState === 'sent' ? (
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{copy.resendSent}</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendState === 'sending' || cooldownSeconds > 0}
                  className="px-3 py-1 rounded-lg text-[11px] font-semibold transition border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 disabled:opacity-50"
                >
                  {cooldownSeconds > 0
                    ? `${cooldownSeconds}s`
                    : resendState === 'sending'
                      ? copy.resending
                      : copy.resendVerification}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="w-full flex-1 flex flex-col justify-center items-center py-6 px-3 sm:px-6">
      {/* Main Interactive Stage */}
      <div className="max-w-5xl w-full mx-auto flex flex-col items-center">
        {/* Interactive Segmented Switcher Tabs (Clicking triggers the smooth slide!) */}
        <div className="mb-6 inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-[#121B2B] border border-slate-200 dark:border-slate-800/80 shadow-inner">
          <button
            type="button"
            onClick={() => setPortalType('applicant')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
              portalType === 'applicant'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{copy.applicantTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setPortalType('staff')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
              portalType === 'staff'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>{copy.staffTab}</span>
          </button>
        </div>

        {/* Double Slider Card (Matches the reference animation perfectly) */}
        <div
          className={`sliding-auth-card border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1522] shadow-2xl transition-all duration-300 ${
            portalType === 'staff' ? 'staff-mode-active' : ''
          }`}
        >
          {/* ──────────────────────────────────────────────────────────
              PANE 1: Candidate / Applicant Side (Visible on Left)
             ────────────────────────────────────────────────────────── */}
          <div className={`sliding-form-pane pane-applicant p-6 sm:p-10 flex flex-col justify-between overflow-y-auto ${
            portalType !== 'applicant' ? 'max-md:hidden' : ''
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  {copy.applicantBadge}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">PORTAL ACCESS</span>
              </div>

              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {step === 'credentials' ? copy.applicantTitle : copy.codeTitle}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {step === 'credentials' ? copy.applicantSub : copy.codeSentTo}
                </p>
              </div>

              {/* Demo Quick-Fill helper */}
              {step === 'credentials' && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Quick Demo Test:</span>
                  <button
                    type="button"
                    onClick={() => fillCredentials('john.doe@example.com')}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 border border-teal-500/30 transition-colors"
                  >
                    {copy.demoCandidatePill}
                  </button>
                </div>
              )}

              {portalType === 'applicant' && renderAlerts()}

              {step === 'credentials' ? renderCredentialsForm('applicant') : renderMfaForm()}
            </div>

            {/* Bottom Registration Link */}
            <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
              <span>{copy.noAccount} </span>
              <Link
                href="/auth/signup?accountType=candidate"
                className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
              >
                {copy.createAccount}
              </Link>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
              PANE 2: Company & Staff Side (Visible on Right when Active)
             ────────────────────────────────────────────────────────── */}
          <div className={`sliding-form-pane pane-staff p-6 sm:p-10 flex flex-col justify-between overflow-y-auto ${
            portalType !== 'staff' ? 'max-md:hidden' : ''
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {copy.staffBadge}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">STAFF LOGIN</span>
              </div>

              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {step === 'credentials' ? copy.staffTitle : copy.codeTitle}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {step === 'credentials' ? copy.staffSub : copy.codeSentTo}
                </p>
              </div>

              {/* Staff Demo Quick-Fill options */}
              {step === 'credentials' && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Demo Staff:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => fillCredentials('recruiter@codafriqa.rw')}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/30 transition-colors"
                    >
                      {copy.demoRecruiterPill}
                    </button>
                    <button
                      type="button"
                      onClick={() => fillCredentials('admin@codafriqa.rw')}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/30 transition-colors"
                    >
                      {copy.demoAdminPill}
                    </button>
                  </div>
                </div>
              )}

              {portalType === 'staff' && renderAlerts()}

              {step === 'credentials' ? renderCredentialsForm('staff') : renderMfaForm()}
            </div>

            {/* Bottom Staff Registration Link */}
            <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
              <span>{copy.noStaffAccount} </span>
              <Link
                href="/auth/signup?accountType=worker"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {copy.createStaffAccount}
              </Link>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
              SLIDING OVERLAY CONTAINER (Desktop >= 768px)
              Transforms horizontally between left and right!
             ────────────────────────────────────────────────────────── */}
          <div className="sliding-overlay-box hidden md:block" aria-hidden="true">
            <div className="sliding-overlay-inner bg-gradient-to-br from-[#0F766E] via-[#0E7490] to-[#4338CA] text-white shadow-2xl relative">
              {/* Subtle background glow rings */}
              <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

              {/* Left Overlay Content: Visible when Staff Form is active on right */}
              <div className="sliding-overlay-panel overlay-panel-left space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-xl font-bold shadow-md">
                  R
                </div>
                <div className="space-y-2 max-w-xs mx-auto">
                  <span className="text-[10px] font-mono tracking-widest uppercase bg-white/15 px-3 py-1 rounded-full border border-white/20">
                    CANDIDATE PORTAL
                  </span>
                  <h2 className="text-2xl font-black tracking-tight leading-tight">
                    {copy.staffOverlayTitle}
                  </h2>
                  <p className="text-xs text-teal-100 leading-relaxed">
                    {copy.staffOverlaySub}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setPortalType('applicant')}
                    className="border-2 border-white/90 text-white rounded-full px-7 py-2.5 font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-slate-900 active:scale-95 transition-all duration-300 shadow-xl"
                  >
                    {copy.staffOverlayBtn}
                  </button>
                </div>

                <div className="pt-4 flex items-center justify-center gap-3 text-[10px] text-teal-100/90 font-mono">
                  <span>Track Progress</span>
                  <span>•</span>
                  <span>1-Click Apply</span>
                  <span>•</span>
                  <span>Direct Invites</span>
                </div>
              </div>

              {/* Right Overlay Content: Visible when Applicant Form is active on left */}
              <div className="sliding-overlay-panel overlay-panel-right space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-xl font-bold shadow-md">
                  R
                </div>
                <div className="space-y-2 max-w-xs mx-auto">
                  <span className="text-[10px] font-mono tracking-widest uppercase bg-white/15 px-3 py-1 rounded-full border border-white/20">
                    COMPANY WORKSPACE
                  </span>
                  <h2 className="text-2xl font-black tracking-tight leading-tight">
                    {copy.applicantOverlayTitle}
                  </h2>
                  <p className="text-xs text-indigo-100 leading-relaxed">
                    {copy.applicantOverlaySub}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setPortalType('staff')}
                    className="border-2 border-white/90 text-white rounded-full px-7 py-2.5 font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-slate-900 active:scale-95 transition-all duration-300 shadow-xl"
                  >
                    {copy.applicantOverlayBtn}
                  </button>
                </div>

                <div className="pt-4 flex items-center justify-center gap-3 text-[10px] text-indigo-100/90 font-mono">
                  <span>Structured Rubrics</span>
                  <span>•</span>
                  <span>Tamper-Evident Audit</span>
                  <span>•</span>
                  <span>Scorecards</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Switcher Footer (Below card on mobile screens) */}
        <div className="md:hidden mt-4 w-full max-w-sm text-center">
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            {portalType === 'applicant' ? (
              <p>
                Hiring or managing team pipelines?{' '}
                <button
                  type="button"
                  onClick={() => setPortalType('staff')}
                  className="font-bold text-teal-600 dark:text-teal-400 underline ml-1"
                >
                  Switch to Staff Portal →
                </button>
              </p>
            ) : (
              <p>
                Applying for open job positions?{' '}
                <button
                  type="button"
                  onClick={() => setPortalType('applicant')}
                  className="font-bold text-indigo-600 dark:text-indigo-400 underline ml-1"
                >
                  Switch to Candidate Portal →
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Trust & Security Footnote */}
      <footer className="max-w-5xl w-full mx-auto pt-6 text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center justify-center gap-2">
        <svg className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>256-bit TLS Encryption • Role-Based Access Control • Tamper-Evident Audit Verification</span>
      </footer>
    </div>
  );
}

function SignInLoading() {
  const { language } = useLanguage();
  return (
    <div className="min-h-[85vh] flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
      {SIGN_IN_COPY[language]?.loadingText || 'Loading…'}
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
