'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SupportedLanguage } from '@/lib/i18n/translations';

const WORKER_ROLES = [
  { role: 'Recruiter', title: 'Lead Recruiter', desc: 'Manage candidate pipeline, score overrides & offers', icon: '🎯', badge: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
  { role: 'HiringManager', title: 'Hiring Manager', desc: 'Departmental review, candidate benchmarks & hiring decisions', icon: '👔', badge: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
  { role: 'Interviewer', title: 'Technical Interviewer', desc: 'Interview questions, evaluations & candidate scorecards', icon: '🎤', badge: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
  { role: 'ComplianceAuditor', title: 'Compliance Auditor', desc: 'Audit log inspection, bias monitoring & GDPR compliance', icon: '⚖️', badge: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
  { role: 'Admin', title: 'Workspace Admin', desc: 'Full organization management, team RBAC & system telemetry', icon: '👑', badge: 'border-rose-500/40 text-rose-400 bg-rose-500/10' }
];

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
}>
 = {
  en: {
    title: 'Create your RecruitAI account', subtitle: 'Choose your workspace access to get started.', applicant: 'Job applicant', worker: 'Company staff',
    candidateHeading: 'Candidate workspace', workerHeading: 'Recruiting workspace', candidateDescription: 'Apply for open positions, upload your CV, and track application status.', workerDescription: 'Review candidates, manage requisitions, and collaborate with your hiring team.',
    company: 'Company or organization', companyPlaceholder: 'e.g. Codafriqa Tech Corp', role: 'Workspace role', firstName: 'First name', lastName: 'Last name', email: 'Email address', workEmail: 'Work email address', password: 'Password', passwordHint: 'Minimum 8 characters', create: 'Create account', creating: 'Creating account...', registerCandidate: 'Create applicant account', registerWorker: 'Join as', alreadyHaveAccount: 'Already have an account?', signIn: 'Sign in', requiredError: 'Title and name fields are required.', failedError: 'Failed to create account.', registrationError: 'Registration failed. Please try again.'
  },
  fr: {
    title: 'Créer votre compte RecruitAI', subtitle: 'Choisissez votre accès à l’espace de travail pour commencer.', applicant: 'Candidat', worker: 'Personnel de l’entreprise',
    candidateHeading: 'Espace candidat', workerHeading: 'Espace recrutement', candidateDescription: 'Postulez aux postes ouverts, téléversez votre CV et suivez vos candidatures.', workerDescription: 'Évaluez les candidats, gérez les postes et collaborez avec votre équipe.',
    company: 'Entreprise ou organisation', companyPlaceholder: 'ex. Codafriqa Tech Corp', role: 'Rôle dans l’espace', firstName: 'Prénom', lastName: 'Nom', email: 'Adresse e-mail', workEmail: 'Adresse e-mail professionnelle', password: 'Mot de passe', passwordHint: '8 caractères minimum', create: 'Créer le compte', creating: 'Création du compte...', registerCandidate: 'Créer un compte candidat', registerWorker: 'Rejoindre comme', alreadyHaveAccount: 'Vous avez déjà un compte ?', signIn: 'Se connecter', requiredError: 'Le titre et le nom sont requis.', failedError: 'Impossible de créer le compte.', registrationError: 'Échec de l’inscription. Réessayez.'
  },
  es: {
    title: 'Crea tu cuenta de RecruitAI', subtitle: 'Elige tu acceso al espacio de trabajo para comenzar.', applicant: 'Candidato', worker: 'Personal de la empresa',
    candidateHeading: 'Espacio del candidato', workerHeading: 'Espacio de selección', candidateDescription: 'Postúlate a puestos abiertos, sube tu CV y sigue el estado de tus solicitudes.', workerDescription: 'Evalúa candidatos, gestiona vacantes y colabora con tu equipo.',
    company: 'Empresa u organización', companyPlaceholder: 'p. ej. Codafriqa Tech Corp', role: 'Rol en el espacio', firstName: 'Nombre', lastName: 'Apellidos', email: 'Correo electrónico', workEmail: 'Correo profesional', password: 'Contraseña', passwordHint: 'Mínimo 8 caracteres', create: 'Crear cuenta', creating: 'Creando cuenta...', registerCandidate: 'Crear cuenta de candidato', registerWorker: 'Unirse como', alreadyHaveAccount: '¿Ya tienes una cuenta?', signIn: 'Iniciar sesión', requiredError: 'El título y el nombre son obligatorios.', failedError: 'No se pudo crear la cuenta.', registrationError: 'No se pudo completar el registro. Inténtalo de nuevo.'
  },
  de: {
    title: 'RecruitAI-Konto erstellen', subtitle: 'Wählen Sie Ihren Arbeitsbereich-Zugang, um zu beginnen.', applicant: 'Bewerber', worker: 'Mitarbeiter',
    candidateHeading: 'Bewerberbereich', workerHeading: 'Recruiting-Arbeitsbereich', candidateDescription: 'Bewerben Sie sich, laden Sie Ihren Lebenslauf hoch und verfolgen Sie Ihre Bewerbungen.', workerDescription: 'Prüfen Sie Kandidaten, verwalten Sie Stellen und arbeiten Sie mit Ihrem Team zusammen.',
    company: 'Unternehmen oder Organisation', companyPlaceholder: 'z. B. Codafriqa Tech Corp', role: 'Arbeitsbereichsrolle', firstName: 'Vorname', lastName: 'Nachname', email: 'E-Mail-Adresse', workEmail: 'Geschäftliche E-Mail-Adresse', password: 'Passwort', passwordHint: 'Mindestens 8 Zeichen', create: 'Konto erstellen', creating: 'Konto wird erstellt...', registerCandidate: 'Bewerberkonto erstellen', registerWorker: 'Beitreten als', alreadyHaveAccount: 'Sie haben bereits ein Konto?', signIn: 'Anmelden', requiredError: 'Titel und Name sind erforderlich.', failedError: 'Konto konnte nicht erstellt werden.', registrationError: 'Registrierung fehlgeschlagen. Bitte erneut versuchen.'
  },
  rw: {
    title: 'Fungura konti ya RecruitAI', subtitle: 'Hitamo uburyo bwo gukoresha umwanya w’akazi utangire.', applicant: 'Usaba akazi', worker: 'Umukozi w’ikigo',
    candidateHeading: 'Umwanya w’usaba akazi', workerHeading: 'Umwanya w’abashinzwe gushaka abakozi', candidateDescription: 'Saba imyanya ihari, shyiraho CV yawe kandi ukurikirane ubusabe bwawe.', workerDescription: 'Suzuma abakandida, ucunge imyanya kandi mukorere hamwe n’ikipe ishinzwe abakozi.',
    company: 'Ikigo cyangwa umuryango', companyPlaceholder: 'urugero: Codafriqa Tech Corp', role: 'Inshingano mu mwanya w’akazi', firstName: 'Izina', lastName: 'Izina ry’umuryango', email: 'Aderesi ya imeyili', workEmail: 'Aderesi ya imeyili y’akazi', password: 'Ijambo ry’ibanga', passwordHint: 'Inyuguti 8 cyangwa zirenga', create: 'Fungura konti', creating: 'Konti iri gufungurwa...', registerCandidate: 'Fungura konti y’usaba akazi', registerWorker: 'Injira nka', alreadyHaveAccount: 'Usanzwe ufite konti?', signIn: 'Injira', requiredError: 'Umutwe n’amazina birakenewe.', failedError: 'Konti ntiyafunguwe.', registrationError: 'Kwiyandikisha byanze. Ongera ugerageze.'
  }
};

export default function SignupPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = SIGNUP_COPY[language];

  // Account Type: 'candidate' (Applicant) vs 'worker' (Company Staff)
  const [accountType, setAccountType] = useState<'candidate' | 'worker'>('candidate');
  const [companyName, setCompanyName] = useState('Codafriqa Tech Corp');
  const [selectedRole, setSelectedRole] = useState('Recruiter');

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
          companyName: accountType === 'worker' ? companyName : undefined,
          role: accountType === 'worker' ? selectedRole : 'Candidate'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || copy.failedError);
        setLoading(false);
        return;
      }

      // Auto sign-in
      const signInRes = await signIn('credentials', {
        redirect: false,
        email,
        password
      });

      if (signInRes?.error) {
        router.push('/auth/signin');
      } else {
        if (accountType === 'candidate') {
          router.push('/dashboard/my-applications');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || copy.registrationError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-1.5">
        <div className="w-10 h-10 rounded-xl bg-teal-700 dark:bg-teal-500 flex items-center justify-center text-white dark:text-slate-950 text-lg font-extrabold mx-auto shadow-md shadow-teal-900/20">
          R
        </div>
        <h1 className="text-2xl font-bold dark:text-white text-slate-900 tracking-tight">
          {copy.title}
        </h1>
        <p className="text-xs dark:text-slate-400 text-slate-500 max-w-sm mx-auto">
          {copy.subtitle}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs font-semibold text-center max-w-md mx-auto">
          ⚠️ {error}
        </div>
      )}

      {/* Account Type Classification Switcher */}
      <div className="max-w-md mx-auto grid grid-cols-2 p-1 dark:bg-[#17242B] bg-[#E9E4D9] dark:border-[#30424A] border-[#D8D2C6] border rounded-xl text-xs">
        <button
          type="button"
          onClick={() => setAccountType('candidate')}
          className={`py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
            accountType === 'candidate'
              ? 'dark:bg-teal-500 bg-white text-slate-900 dark:text-slate-950 shadow-xs'
              : 'dark:text-slate-400 text-slate-600 hover:dark:text-white'
          }`}
        >
          <span>🧑‍💼</span>
          <span>{copy.applicant}</span>
        </button>

        <button
          type="button"
          onClick={() => setAccountType('worker')}
          className={`py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
            accountType === 'worker'
              ? 'dark:bg-teal-500 bg-white text-slate-900 dark:text-slate-950 shadow-xs'
              : 'dark:text-slate-400 text-slate-600 hover:dark:text-white'
          }`}
        >
          <span>🏢</span>
          <span>{copy.worker}</span>
        </button>
      </div>

      {/* Registration Card Form */}
      <div className="max-w-xl mx-auto dark:bg-[#17242B]/95 bg-[#FFFDF8]/95 dark:border-[#30424A] border-[#D8D2C6] border rounded-2xl p-6 sm:p-7 shadow-xl space-y-4 text-xs">
        {/* Type Context Header */}
        <div className="p-3 rounded-xl dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border flex items-center gap-2.5">
          <span className="text-xl">{accountType === 'candidate' ? '📄' : '🏢'}</span>
          <div>
            <h3 className="font-bold dark:text-white text-slate-900 text-xs">
              {accountType === 'candidate' ? copy.candidateHeading : copy.workerHeading}
            </h3>
            <p className="text-[10px] dark:text-slate-400 text-slate-500">
              {accountType === 'candidate'
                ? copy.candidateDescription
                : copy.workerDescription}
            </p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-3.5">
          {/* Worker Specific Fields: Company Name and Staff Role */}
          {accountType === 'worker' && (
                  <div className="space-y-3 p-3.5 dark:bg-[#101A20]/70 bg-teal-50/50 dark:border-[#30424A] border-teal-100 border rounded-xl">
              <div>
                <label className="block dark:text-slate-300 text-slate-700 font-semibold mb-1">
                  {copy.company} *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={copy.companyPlaceholder}
                  className="w-full dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block dark:text-slate-300 text-slate-700 font-semibold mb-1">
                  {copy.role} *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 dark:text-white text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                >
                  {WORKER_ROLES.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.icon} {r.title} — {r.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">{copy.firstName} *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={copy.firstName}
                className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">{copy.lastName} *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={copy.lastName}
                className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">
              {accountType === 'worker' ? `${copy.workEmail} *` : `${copy.email} *`}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={accountType === 'worker' ? 'you@company.com' : 'you@example.com'}
              className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Password */}
          <div>
              <label className="block dark:text-slate-400 text-slate-600 font-semibold mb-1">{copy.password} *</label>
            <input
              type="password"
              required
                minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
                placeholder={copy.passwordHint}
              className="w-full dark:bg-slate-950 bg-slate-50 dark:border-slate-800 border-slate-200 border rounded-lg px-3 py-1.5 dark:text-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-slate-950 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>✨</span>
            <span>
              {loading
                ? copy.creating
                : accountType === 'candidate'
                ? copy.registerCandidate
                : `${copy.registerWorker} ${selectedRole} ${companyName ? `at ${companyName}` : ''}`}
            </span>
          </button>
        </form>

        <div className="pt-2 text-center text-xs dark:text-slate-400 text-slate-500 border-t dark:border-slate-800 border-slate-100">
          {copy.alreadyHaveAccount}{' '}
          <Link href="/auth/signin" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            {copy.signIn} &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}