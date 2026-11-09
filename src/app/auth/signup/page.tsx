'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SupportedLanguage } from '@/lib/i18n/translations';

const SIGNUP_COPY: Record<SupportedLanguage, {
  title: string;
  subtitle: string;
  applicant: string;
  worker: string;
  candidateHeading: string;
  workerHeading: string;
  candidateDescription: string;
  workerDescription: string;
  company: string;
  companyPlaceholder: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  workEmail: string;
  password: string;
  passwordHint: string;
  create: string;
  creating: string;
  registerCandidate: string;
  registerWorker: string;
  alreadyHaveAccount: string;
  signIn: string;
  requiredError: string;
  failedError: string;
  registrationError: string;
  staffRoleNote: string;
  emailInvalidError: string;
  emailExistsError: string;
  rateLimitError: string;
  mailDomainError: string;
  disposableEmailError: string;
  loadingText: string;
}> = {
  en: {
    title: 'Create your RecruitAI account',
    subtitle: 'Choose your workspace access to get started.',
    applicant: 'Job applicant',
    worker: 'Company staff',
    candidateHeading: 'Candidate workspace',
    workerHeading: 'Recruiting workspace',
    candidateDescription: 'Apply for open positions, upload your CV, and track application status.',
    workerDescription: 'Review candidates, manage requisitions, and collaborate with your hiring team.',
    company: 'Company or organization',
    companyPlaceholder: 'e.g. Codafriqa Tech Corp',
    role: 'Workspace role',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email address',
    workEmail: 'Work email address',
    password: 'Password',
    passwordHint: 'Minimum 8 characters',
    create: 'Create account',
    creating: 'Creating account...',
    registerCandidate: 'Create applicant account',
    registerWorker: 'Join as company staff',
    alreadyHaveAccount: 'Already have an account?',
    signIn: 'Sign in',
    requiredError: 'Company and name fields are required.',
    failedError: 'Failed to create account.',
    registrationError: 'Registration failed. Please try again.',
    staffRoleNote: "Founding a new organization? You become its Admin. Joining an existing workspace? You start as a Recruiter — that workspace's Admin can adjust your role later.",
    emailInvalidError: "That email address doesn't look valid. Check it for typos — a missing '@', stray spaces, or an incomplete domain — then try again.",
    emailExistsError: 'An account with this email already exists. Sign in instead — you can request a new verification code there.',
    rateLimitError: 'Too many attempts. Please wait a minute and try again.',
    mailDomainError: 'This email domain cannot receive mail. Check the address for typos.',
    disposableEmailError: 'Disposable email addresses are not allowed. Please use a permanent email address.',
    loadingText: 'Loading…',
  },
  fr: {
    title: 'Créer votre compte RecruitAI',
    subtitle: 'Choisissez votre accès à l’espace de travail pour commencer.',
    applicant: 'Candidat',
    worker: 'Personnel de l’entreprise',
    candidateHeading: 'Espace candidat',
    workerHeading: 'Espace recrutement',
    candidateDescription: 'Postulez aux postes ouverts, téléversez votre CV et suivez vos candidatures.',
    workerDescription: 'Évaluez les candidats, gérez les postes et collaborez avec votre équipe.',
    company: 'Entreprise ou organisation',
    companyPlaceholder: 'ex. Codafriqa Tech Corp',
    role: 'Rôle dans l’espace',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Adresse e-mail',
    workEmail: 'Adresse e-mail professionnelle',
    password: 'Mot de passe',
    passwordHint: '8 caractères minimum',
    create: 'Créer le compte',
    creating: 'Création du compte...',
    registerCandidate: 'Créer un compte candidat',
    registerWorker: 'Rejoindre comme personnel',
    alreadyHaveAccount: 'Vous avez déjà un compte ?',
    signIn: 'Se connecter',
    requiredError: 'Le nom de l’entreprise et les noms sont requis.',
    failedError: 'Impossible de créer le compte.',
    registrationError: 'Échec de l’inscription. Réessayez.',
    staffRoleNote: 'Vous créez une nouvelle organisation ? Vous en devenez l’administrateur. Vous rejoignez un espace existant ? Vous commencez comme recruteur — l’administrateur peut ajuster votre rôle plus tard.',
    emailInvalidError: "Cette adresse e-mail ne semble pas valide. Vérifiez l'absence de fautes de frappe — un « @ » manquant, des espaces ou un domaine incomplet — puis réessayez.",
    emailExistsError: 'Un compte avec cette adresse e-mail existe déjà. Connectez-vous — vous pourrez y demander un nouveau code de vérification.',
    rateLimitError: 'Trop de tentatives. Veuillez patienter une minute et réessayer.',
    mailDomainError: 'Ce domaine e-mail ne peut pas recevoir de messages. Vérifiez l’adresse pour des fautes de frappe.',
    disposableEmailError: 'Les adresses e-mail jetables ne sont pas autorisées. Veuillez utiliser une adresse permanente.',
    loadingText: 'Chargement…',
  },
  es: {
    title: 'Crea tu cuenta de RecruitAI',
    subtitle: 'Elige tu acceso al espacio de trabajo para comenzar.',
    applicant: 'Candidato',
    worker: 'Personal de la empresa',
    candidateHeading: 'Espacio del candidato',
    workerHeading: 'Espacio de selección',
    candidateDescription: 'Postúlate a puestos abiertos, sube tu CV y sigue el estado de tus solicitudes.',
    workerDescription: 'Evalúa candidatos, gestiona vacantes y colabora con tu equipo.',
    company: 'Empresa u organización',
    companyPlaceholder: 'p. ej. Codafriqa Tech Corp',
    role: 'Rol en el espacio',
    firstName: 'Nombre',
    lastName: 'Apellidos',
    email: 'Correo electrónico',
    workEmail: 'Correo profesional',
    password: 'Contraseña',
    passwordHint: 'Mínimo 8 caracteres',
    create: 'Crear cuenta',
    creating: 'Creando cuenta...',
    registerCandidate: 'Crear cuenta de candidato',
    registerWorker: 'Unirse como personal',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    signIn: 'Iniciar sesión',
    requiredError: 'La empresa y los nombres son obligatorios.',
    failedError: 'No se pudo crear la cuenta.',
    registrationError: 'No se pudo completar el registro. Inténtalo de nuevo.',
    staffRoleNote: '¿Crea una nueva organización? Será su administrador. ¿Se une a un espacio existente? Empieza como reclutador; el administrador puede ajustar su rol después.',
    emailInvalidError: 'Esa dirección de correo no parece válida. Revise si hay errores tipográficos — una «@» ausente, espacios o un dominio incompleto — e inténtelo de nuevo.',
    emailExistsError: 'Ya existe una cuenta con este correo. Inicie sesión — allí puede solicitar un nuevo código de verificación.',
    rateLimitError: 'Demasiados intentos. Espere un minuto e inténtelo de nuevo.',
    mailDomainError: 'Este dominio de correo no puede recibir mensajes. Revise la dirección por errores tipográficos.',
    disposableEmailError: 'No se permiten direcciones de correo desechables. Use una dirección permanente.',
    loadingText: 'Cargando…',
  },
  de: {
    title: 'RecruitAI-Konto erstellen',
    subtitle: 'Wählen Sie Ihren Arbeitsbereich-Zugang, um zu beginnen.',
    applicant: 'Bewerber',
    worker: 'Mitarbeiter',
    candidateHeading: 'Bewerberbereich',
    workerHeading: 'Recruiting-Arbeitsbereich',
    candidateDescription: 'Bewerben Sie sich, laden Sie Ihren Lebenslauf hoch und verfolgen Sie Ihre Bewerbungen.',
    workerDescription: 'Prüfen Sie Kandidaten, verwalten Sie Stellen und arbeiten Sie mit Ihrem Team zusammen.',
    company: 'Unternehmen oder Organisation',
    companyPlaceholder: 'z. B. Codafriqa Tech Corp',
    role: 'Arbeitsbereichsrolle',
    firstName: 'Vorname',
    lastName: 'Nachname',
    email: 'E-Mail-Adresse',
    workEmail: 'Geschäftliche E-Mail-Adresse',
    password: 'Passwort',
    passwordHint: 'Mindestens 8 Zeichen',
    create: 'Konto erstellen',
    creating: 'Konto wird erstellt...',
    registerCandidate: 'Bewerberkonto erstellen',
    registerWorker: 'Als Mitarbeiter beitreten',
    alreadyHaveAccount: 'Sie haben bereits ein Konto?',
    signIn: 'Anmelden',
    requiredError: 'Unternehmen und Namen sind erforderlich.',
    failedError: 'Konto konnte nicht erstellt werden.',
    registrationError: 'Registrierung fehlgeschlagen. Bitte erneut versuchen.',
    staffRoleNote: 'Neue Organisation? Sie werden deren Admin. Treten Sie einem bestehenden Arbeitsbereich bei? Sie starten als Recruiter — der Admin kann Ihre Rolle später anpassen.',
    emailInvalidError: 'Diese E-Mail-Adresse scheint nicht gültig zu sein. Prüfen Sie auf Tippfehler — fehlendes „@", Leerzeichen oder eine unvollständige Domain — und versuchen Sie es erneut.',
    emailExistsError: 'Ein Konto mit dieser E-Mail-Adresse existiert bereits. Melden Sie sich an — dort können Sie einen neuen Bestätigungscode anfordern.',
    rateLimitError: 'Zu viele Versuche. Bitte warten Sie eine Minute und versuchen Sie es erneut.',
    mailDomainError: 'Diese E-Mail-Domain kann keine Nachrichten empfangen. Prüfen Sie die Adresse auf Tippfehler.',
    disposableEmailError: 'Wegwerf-E-Mail-Adressen sind nicht erlaubt. Bitte verwenden Sie eine permanente Adresse.',
    loadingText: 'Wird geladen…',
  },
  rw: {
    title: 'Fungura konti ya RecruitAI',
    subtitle: 'Hitamo uburyo bwo gukoresha umwanya w’akazi utangire.',
    applicant: 'Usaba akazi',
    worker: 'Umukozi w’ikigo',
    candidateHeading: 'Umwanya w’usaba akazi',
    workerHeading: 'Umwanya w’abashinzwe gushaka abakozi',
    candidateDescription: 'Saba imyanya ihari, shyiraho CV yawe kandi ukurikirane ubusabe bwawe.',
    workerDescription: 'Suzuma abakandida, ucunge imyanya kandi mukorere hamwe n’ikipe ishinzwe abakozi.',
    company: 'Ikigo cyangwa umuryango',
    companyPlaceholder: 'urugero: Codafriqa Tech Corp',
    role: 'Inshingano mu mwanya w’akazi',
    firstName: 'Izina',
    lastName: 'Izina ry’umuryango',
    email: 'Aderesi ya imeyili',
    workEmail: 'Aderesi ya imeyili y’akazi',
    password: 'Ijambo ry’ibanga',
    passwordHint: 'Inyuguti 8 cyangwa zirenga',
    create: 'Fungura konti',
    creating: 'Konti iri gufungurwa...',
    registerCandidate: 'Fungura konti y’usaba akazi',
    registerWorker: 'Injira nk’umukozi w’ikigo',
    alreadyHaveAccount: 'Usanzwe ufite konti?',
    signIn: 'Injira',
    requiredError: 'Ikigo n’amazina birakenewe.',
    failedError: 'Konti ntiyafunguwe.',
    registrationError: 'Kwiyandikisha byanze. Ongera ugerageze.',
    staffRoleNote: 'Ufungura ikigo gishya? Uzaba umuyobozi wacyo. Winjira umwanya usanzwe uhari? Utangira nka Recruiter — umuyobozi wacyo ashobora kubihindura nyuma.',
    emailInvalidError: 'Aderesi ya imeyili ntiyoneka nk’iy’ukuri. Isuzume amakosa yo kwandika — @ ibura, umwanya utariyo, cyangwa urudomo ruranganye —ongera ugerageze.',
    emailExistsError: 'Hari konti ifite aderesi ya imeyili. Injira — ubwo ushobora gusaba kode nshya yo kwemeza.',
    rateLimitError: 'Ongeraneza bwinshi. Tegereza umunota wongera ugerageze.',
    mailDomainError: 'Iyi domain ya imeyili ntishobora kwakira ubutumwa. Isuzume aderesi ku makosa yo kwandika.',
    disposableEmailError: 'Aderesi za imeyili zo gukoresha rimwe gusa ntizemewe. Koresha aderesi ihoraho.',
    loadingText: 'Birimo gupakura…',
  },
};

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const copy = SIGNUP_COPY[language];

  const initialAccountType =
    searchParams.get('accountType') === 'worker' ||
    searchParams.get('type') === 'worker' ||
    searchParams.get('portal') === 'staff'
      ? 'worker'
      : 'candidate';

  const [accountType, setAccountType] = useState<'candidate' | 'worker'>(initialAccountType);
  const [companyName, setCompanyName] = useState('');

  // Credentials
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (accountType === 'worker' && !companyName.trim()) {
      setError(copy.requiredError);
      return;
    }

    setLoading(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          accountType,
          companyName: accountType === 'worker' ? companyName.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const rawError: string = data?.error || copy.failedError;
        if (res.status === 400 && rawError.startsWith('Validation failed')) {
          setError(copy.emailInvalidError);
        } else if (res.status === 409) {
          setError(copy.emailExistsError);
        } else if (res.status === 429) {
          setError(copy.rateLimitError);
        } else if (res.status === 422 && rawError.includes('valid mail domain')) {
          setError(copy.mailDomainError);
        } else if (res.status === 422 && rawError.includes('Disposable email')) {
          setError(copy.disposableEmailError);
        } else {
          setError(rawError);
        }
        setLoading(false);
        return;
      }

      const emailDelivered = data?.emailDelivered !== false;
      const portalParam = accountType === 'worker' ? '&portal=staff' : '';
      const deliveryParam = emailDelivered ? '' : '&emailDelivery=failed';
      router.push(`/auth/signin?registered=1${portalParam}${deliveryParam}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || copy.registrationError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-1.5">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white dark:text-[#0B0F14] text-lg font-extrabold mx-auto shadow-md">
          R
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
          {copy.title}
        </h1>
        <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
          {copy.subtitle}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 rounded-lg text-xs font-semibold text-center max-w-md mx-auto border"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--danger) 8%, var(--surface))',
            borderColor: 'color-mix(in srgb, var(--danger) 35%, transparent)',
            color: 'var(--danger)',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Segmented Switcher */}
      <div className="segmented max-w-xs mx-auto">
        <button
          type="button"
          onClick={() => setAccountType('candidate')}
          className={`!py-2 !px-3 flex items-center justify-center gap-1.5 font-semibold ${
            accountType === 'candidate' ? 'active' : ''
          }`}
        >
          <span>{copy.applicant}</span>
        </button>

        <button
          type="button"
          onClick={() => setAccountType('worker')}
          className={`!py-2 !px-3 flex items-center justify-center gap-1.5 font-semibold ${
            accountType === 'worker' ? 'active' : ''
          }`}
        >
          <span>{copy.worker}</span>
        </button>
      </div>

      {/* Registration Card Form */}
      <div className="panel-raised rounded-2xl max-w-xl mx-auto p-6 sm:p-7 space-y-4 text-xs">
        {/* Type Context Header */}
        <div className="p-3 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] text-left">
          <div>
            <h3 className="font-bold text-[var(--foreground)] text-xs">
              {accountType === 'candidate' ? copy.candidateHeading : copy.workerHeading}
            </h3>
            <p className="text-[10px] text-[var(--muted)]">
              {accountType === 'candidate'
                ? copy.candidateDescription
                : copy.workerDescription}
            </p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-3.5">
          {/* Worker Specific Fields: Company Name and Staff Role */}
          {accountType === 'worker' && (
            <div className="space-y-3 p-3.5 rounded-lg bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)]">
              <div>
                <label className="field-label !mb-1">
                  {copy.company} *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={copy.companyPlaceholder}
                  className="field"
                />
              </div>

              <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                {copy.staffRoleNote}
              </p>
            </div>
          )}

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="field-label !mb-1">{copy.firstName} *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={copy.firstName}
                className="field"
              />
            </div>
            <div>
              <label className="field-label !mb-1">{copy.lastName} *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={copy.lastName}
                className="field"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="field-label !mb-1">
              {accountType === 'worker' ? `${copy.workEmail} *` : `${copy.email} *`}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={accountType === 'worker' ? 'you@company.com' : 'you@example.com'}
              className="field"
            />
          </div>

          {/* Password */}
          <div>
            <label className="field-label !mb-1">{copy.password} *</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={copy.passwordHint}
              className="field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full !py-2.5 btn btn-primary !font-semibold"
          >
            <span>
              {loading
                ? copy.creating
                : accountType === 'candidate'
                ? copy.registerCandidate
                : `${copy.registerWorker}${companyName ? ` — ${companyName}` : ''}`}
            </span>
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-[var(--muted)] border-t border-[var(--border)]">
          {copy.alreadyHaveAccount}{' '}
          <Link
            href={`/auth/signin?portal=${accountType === 'worker' ? 'staff' : 'applicant'}`}
            className="link font-bold"
          >
            {copy.signIn} &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

function SignupLoading() {
  const { language } = useLanguage();
  return (
    <div className="min-h-[85vh] flex items-center justify-center text-xs text-[var(--muted)]">
      {SIGNUP_COPY[language].loadingText}
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoading />}>
      <SignupForm />
    </Suspense>
  );
}
