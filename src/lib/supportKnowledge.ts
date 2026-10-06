export const RECRUIT_AI_SYSTEM_PROMPT = `You are RecruitAI Copilot, the friendly talent intelligence assistant built into the RecruitAI Enterprise Platform for Codafriqa Tech Corp. You chat naturally — greetings, small talk, thanks, follow-ups — and you help every kind of user: job applicants (candidates), recruiters, hiring managers, interviewers, compliance auditors, and admins.

CONVERSATIONAL STYLE:
1. Chat like a helpful colleague. Simple questions get 1 to 3 warm, plain-language sentences; complex questions get a short, structured answer.
2. If a request is ambiguous, ask one short clarifying question instead of guessing.
3. It is fine to talk about yourself and what you can help with: platform navigation, applying for jobs, screening, interviews, roles and permissions, account and sign-in help, and data privacy.

COMMUNICATION & NAVIGATION GUIDELINES:
4. NEVER USE RAW URL PATHS (like /jobs, /candidates, /privacy, /audit, /dashboard/my-applications). Non-technical users find raw web paths confusing.
   - Instead, refer to exact, clear UI menu names in the sidebar, for example:
     - Instead of "/jobs": "Click **'Job Requisitions'** (or **'Explore Open Jobs'**) in the left sidebar menu"
     - Instead of "/dashboard/my-applications": "Click **'My Applications'** in the left sidebar menu"
     - Instead of "/candidates": "Click **'Candidates'** in the left sidebar menu"
     - Instead of "/candidates/compare": "Click **'Compare Benchmark'** in the sidebar"
     - Instead of "/audit": "Click **'Audit Trail'** in the sidebar"
     - Instead of "/privacy": "Click **'Data Privacy'** in the sidebar"
     - Instead of "/dashboard/team": "Click **'Team & RBAC'** in the sidebar"
     - Instead of "/dashboard/profile": "Click **'Profile'** in the dashboard sidebar"
5. Multilingual Fluency: Speak fluent, high-level English, French (Français), Spanish (Español), German (Deutsch), and Kinyarwanda (Ikinyarwanda).
6. Mirror User Brevity: For simple everyday questions, provide 1 to 3 friendly, helpful, and plain-language sentences.

ROLE AWARENESS — RecruitAI has 6 roles. Tailor your guidance to what the user's role can actually do:
- **Candidate (applicant)**: apply for open jobs, upload and update the resume on the Profile page, track application status in My Applications, and manage GDPR export/erasure in Data Privacy.
- **Recruiter**: post job requisitions, build weighted rubric criteria, run the candidate pipeline (Kanban or table), compare candidates, extend offers, and record decisions.
- **Hiring Manager**: review requisitions and applicants for their own departments and compare finalists in Compare Benchmark.
- **Interviewer**: run structured interviews, submit interview scorecards, and use AI-generated interview questions built from skill gaps.
- **Compliance Auditor**: read the immutable Audit Trail of decisions, score recalibrations, and data access.
- **Admin**: manage people and access in Team & RBAC (invites, role edits), plus Settings, Analytics, and Email Delivery.
If you cannot tell the user's role or need, ask one short question before answering in depth.

SCOPE GUARD — You only answer questions about the RecruitAI platform itself: its features, navigation, roles and permissions, job requisitions, applications, rubric scoring, AI screening, interviews, notifications, account and sign-in help, and data privacy/GDPR. If the user asks about anything outside this scope (general knowledge, other products or companies, coding help, news, personal advice, etc.), reply in one or two sentences: politely explain that you specialize in the RecruitAI platform, and invite them to ask about a platform topic or to contact human support for other matters. Never invent RecruitAI features that are not supported by the verified knowledge context.`;

export interface MultilingualKnowledgeItem {
  keywords: string[];
  answers: {
    en: string;
    fr: string;
    es: string;
    de: string;
    rw: string;
  };
}

export const RECRUIT_AI_MULTILINGUAL_KNOWLEDGE: MultilingualKnowledgeItem[] = [
  // Greetings
  {
    keywords: ['hi', 'hello', 'hey', 'hi there', 'hello there', 'good morning', 'good afternoon', 'good evening', 'good day', 'bonjour', 'bonsoir', 'salut', 'hola', 'buenas', 'buenos dias', 'hallo', 'guten tag', 'guten morgen', 'muraho', 'bite', 'mwiriwe', 'amakuru', 'hey there', 'hello recruitai'],
    answers: {
      en: "Hello! 👋 I am your RecruitAI Assistant. Whether you are an applicant, recruiter, hiring manager, interviewer, auditor, or admin — ask me how to apply for a job, review candidates, post new roles, submit scorecards, or understand our AI screening.",
      fr: "Bonjour ! 👋 Je suis votre assistant RecruitAI. Que vous soyez candidat, recruteur, manager, évaluateur, auditeur ou administrateur — demandez-moi comment postuler, évaluer des candidats, publier des offres ou comprendre notre criblage IA.",
      es: "¡Hola! 👋 Soy tu Asistente RecruitAI. Seas postulante, reclutador, gerente, entrevistador, auditor o administrador: pregúntame cómo postularte, evaluar candidatos, publicar vacantes o entender nuestro cribado con IA.",
      de: "Hallo! 👋 Ich bin Ihr RecruitAI-Assistent. Ob Bewerber, Recruiter, Hiring Manager, Interviewer, Auditor oder Admin — fragen Sie mich, wie Sie sich bewerben, Kandidaten prüfen, Stellen ausschreiben oder unser KI-Screening verstehen.",
      rw: "Muraho! 👋 Ndi umufasha wanyu wa RecruitAI. Uraba ari umusaba akazi, ushakisha abakozi, umuyobozi, ukora ikizamini, umugenzuzi cyangwa umuyobozi — Mumbaze uko basaba akazi, uko basuzuma abakandida, uko fungura imyanya, cyangwa uko isuzuma rya rya AI rikora."
    }
  },

  // Thanks & small talk
  {
    keywords: ['thank you', 'thanks', 'thx', 'merci', 'merci beaucoup', 'gracias', 'danke', 'vielen dank', 'murakoze', 'urakoze', 'appreciate it', 'well done', 'great job'],
    answers: {
      en: "You're welcome! Is there anything else about RecruitAI I can help you with — applying, screening, rubrics, roles, or privacy?",
      fr: "Avec plaisir ! Y a-t-il autre chose que je puisse faire pour vous sur RecruitAI — candidatures, criblage, grilles, rôles ou confidentialité ?",
      es: "¡De nada! ¿Hay algo más en lo que pueda ayudarte con RecruitAI — solicitudes, cribado, rúbricas, roles o privacidad?",
      de: "Gern geschehen! Kann ich Ihnen noch etwas bei RecruitAI helfen — Bewerbungen, Screening, Rubriken, Rollen oder Datenschutz?",
      rw: "Ni byo kororwa! Hari ikindi nshobora kubafasha kuri RecruitAI — ubusabe, isuzuma, ibipimo, inshingano cyangwa umutekano w'amakuru?"
    }
  },

  // Account access & verification (every role)
  {
    keywords: ['sign up', 'register', 'create account', 'verification code', 'verify email', 'email not verified', 'forgot password', 'forgot my password', 'reset password', 'reset my password', 'password', 'two step', 'cannot sign in', 'sign in problem', 'login problem', 'account locked', 'kwiyandikisha'],
    answers: {
      en: "Account help: new accounts confirm a 6-digit code we email at signup (valid 10 minutes — check your spam folder). Didn't get it? Use **Resend verification code** on the sign-in page, or **Forgot your password?** to reset it. If sign-in still fails, double-check your email and password.",
      fr: "Aide au compte : les nouveaux comptes confirment un code à 6 chiffres envoyé à l'inscription (valable 10 minutes — vérifiez vos indésirables). Vous ne l'avez pas reçu ? Utilisez **Renvoyer le code de vérification** sur la page de connexion, ou **Mot de passe oublié ?** pour le réinitialiser. Si la connexion échoue encore, vérifiez votre e-mail et votre mot de passe.",
      es: "Ayuda con la cuenta: las cuentas nuevas confirman un código de 6 dígitos que enviamos al registrarse (válido 10 minutos; revise el spam). ¿No llegó? Use **Reenviar código de verificación** en la página de inicio de sesión, u **¿Olvidó su contraseña?** para restablecerla. Si aún no puede entrar, revise su correo y contraseña.",
      de: "Konto-Hilfe: Neue Konten bestätigen einen 6-stelligen Code, den wir bei der Registrierung senden (10 Minuten gültig — prüfen Sie den Spam-Ordner). Nicht erhalten? Nutzen Sie **Bestätigungscode erneut senden** auf der Anmeldeseite oder **Passwort vergessen?** zum Zurücksetzen. Prüfen Sie bei weiteren Problemen E-Mail-Adresse und Passwort.",
      rw: "Ubufasha ku konti: konti nshya zemeza kode ibara 6 twohereje iyo wiyandikishije (imara iminota 10 — reba n'ububiko bw'ibaruwa). Ntibageze? Koresha **Ongera uwohereze kode yo kwemeza** ku rupapuro rwo kwinjira, cyangwa **Wibagiwe ijambo ry'ibanga?** kuyihindura. nibidatinze, Suzuma neza imeyili n'ijambo ry'ibanga."
    }
  },

  // Profile & resume (applicants, and anyone keeping their profile current)
  {
    keywords: ['my profile', 'profile', 'update resume', 'upload resume', 'my cv', 'update cv', 'resume upload', 'edit profile', 'my resume', 'replace resume'],
    answers: {
      en: "Your **Profile** page in the dashboard is where you keep your details and resume current: upload or replace your CV (PDF or DOCX), edit your name and contact info, and review what recruiters see. Your saved CV powers the AI match score for every application you submit.",
      fr: "Votre page **Profil** du tableau de bord centralise vos informations et votre CV : téléversez ou remplacez votre CV (PDF ou DOCX), modifiez votre nom et vos coordonnées, et vérifiez ce que voient les recruteurs. Votre CV alimente le score de correspondance IA de chaque candidature envoyée.",
      es: "Tu página de **Perfil** del panel centraliza tus datos y tu CV: sube o reemplaza tu CV (PDF o DOCX), edita tu nombre y contacto, y revisa lo que ven los reclutadores. Tu CV alimenta la puntuación de ajuste IA de cada solicitud que envías.",
      de: "Ihre **Profil**-Seite im Dashboard bündelt Ihre Angaben und Ihren Lebenslauf: Laden Sie Ihren CV (PDF oder DOCX) hoch oder ersetzen Sie ihn, passen Sie Name und Kontaktdaten an und prüfen Sie, was Recruiter sehen. Ihr CV speist den KI-Match-Score jeder Bewerbung.",
      rw: "Urupapuro rwawe rw'**Umwirondoro** mu kibaho kirimo amakuru yawe na CV: shyiraho cyangwa uhindure CV (PDF cyangwa DOCX), hindura amazina n'aho ubarizwa, ureba ibyo abashakisha abakozi babona. CV yawe ifasha amanota y'isuzuma rya AI kuri buri busabe bwoherejwe."
    }
  },

  // How to apply (applicants)
  {
    keywords: ['how to apply', 'apply', 'apply for a job', 'apply for job', 'job application', 'comment postuler', 'postuler', 'como postular', 'wie bewerben', 'bewerbung', 'uko basaba akazi', 'gusaba akazi'],
    answers: {
      en: "To apply for a job, click **Explore Open Jobs** in your left menu, select the role you want, and click **Apply for this Role**. Upload your resume and submit your details — you can then track everything under **My Applications**!",
      fr: "Pour postuler à une offre, cliquez sur **Explorer les postes** dans le menu de gauche, choisissez le poste souhaité et cliquez sur **Postuler à cette Offre**. Téléversez votre CV et validez vos informations — vous pourrez ensuite tout suivre dans **Mes candidatures** !",
      es: "Para postularte a un empleo, haz clic en **Ver Puestos Disponibles** en el menú lateral, selecciona la vacante deseada y presiona **Postularse al Puesto**. ¡Sube tu CV y completa tus datos — luego podrás seguirlo todo en **Mis Solicitudes**!",
      de: "Um sich zu bewerben, klicken Sie im linken Menü auf **Offene Stellen ansehen**, wählen Sie die gewünschte Stelle aus und klicken Sie auf **Jetzt bewerben**. Laden Sie Ihren Lebenslauf hoch und reichen Sie Ihre Angaben ein — den Status sehen Sie danach unter **Meine Bewerbungen**!",
      rw: "Kugira ngo usabe akazi, kanda kuri **Reba Imyanya Ihari** mu mwanya w’iburyo w’amahitamo, hitamo umwanya wifuza, hanyuma ukande **Saba uyu Mwanya**. Shyiraho impapuro z’uburambe (CV) wuzuze imyirondoro — ubwo ushobora kurikirana byose kuri **Ubusabe Bwanjye**!"
    }
  },

  // Where are applications (applicants)
  {
    keywords: ['my applications', 'application status', 'track my application', 'application status check', 'mes candidatures', 'mis solicitudes', 'meine bewerbungen', 'ubusabe bwanjye', 'suivi candidature'],
    answers: {
      en: "You can track the live status of all your submitted applications anytime by clicking **My Applications** in your left menu — stage, match score, and updates appear there.",
      fr: "Vous pouvez suivre l'état de toutes vos candidatures en temps réel en cliquant sur **Mes candidatures** dans le menu de gauche — étape, score et mises à jour s'y affichent.",
      es: "Puedes consultar el estado de tus solicitudes en cualquier momento haciendo clic en **Mis Solicitudes** en el menú de la izquierda: etapa, puntuación y novedades aparecen allí.",
      de: "Den aktuellen Status aller Ihrer eingereichten Bewerbungen können Sie jederzeit über **Meine Bewerbungen** in der linken Seitenleiste einsehen — Phase, Score und Updates erscheinen dort.",
      rw: "Ushobora kureba aho ubusabe bwawe bugeze igihe icyo ari cyo cyose ukanda kuri **Ubusabe Bwanjye** mu mahitamo ari ibumoso — iya mbere, amanota n'ibyahindutse birahaboneka."
    }
  },

  // Interviewers: scorecards, scheduling, AI questions
  {
    keywords: ['scorecard', 'scorecards', 'submit scorecard', 'interview scorecard', 'schedule interview', 'interview scheduling', 'structured interview', 'panelist', 'interview questions'],
    answers: {
      en: "Interviewers open the candidate's profile, run the interview, then press **Interview Scorecard** to rate Technical, Communication, and Problem-solving (1–5) plus a hire recommendation — submissions stay with the candidate's record. Use **Interview Scheduling** to send calendar invites and **AI Questions** for tailored questions generated from the candidate's skill gaps.",
      fr: "Les évaluateurs ouvrent le profil du candidat, mènent l'entretien, puis utilisent **Fiche d'entretien** pour noter Technique, Communication et Résolution de problèmes (1–5) avec une recommandation. **Planification d'entretien** envoie les invitations calendrier et **Questions IA** génère des questions adaptées aux écarts de compétences.",
      es: "Los entrevistadores abren el perfil del candidato, realizan la entrevista y usan **Evaluación de entrevista** para puntuar Técnica, Comunicación y Resolución de problemas (1–5) con una recomendación. **Programación de entrevista** envía invitaciones de calendario y **Preguntas IA** genera preguntas según las brechas de habilidades.",
      de: "Interviewer öffnen das Kandidatenprofil, führen das Interview und nutzen den **Bewertungsbogen**, um Technik, Kommunikation und Problemlösung (1–5) mit Empfehlung zu bewerten. **Interviewplanung** sendet Kalendereinladungen, **KI-Fragen** erzeugt passende Fragen aus den Kompetenzlücken.",
      rw: "Abakora ibizamini bafungura umwirondoro w'umukandida, bakora ikizamini, hanyuma bakoreshe **Urupapuro rw'Ikizamini** bacha Ubuhanga, Itumanaho na Gukemura ibibazo (1–5) hamwe n'icyemezo. **Iteganywa ry'Ibizamini** rohereza amatangazo ya kalendari, **Ibibazo bya AI** bikora ibibazo bijyanye n'ibura ry'ubuhanga bw'umukandida."
    }
  },

  // Hiring managers: departments & compare
  {
    keywords: ['hiring manager', 'my department', 'department requisitions', 'compare candidates', 'compare benchmark', 'benchmark', 'side by side'],
    answers: {
      en: "Hiring Managers see the requisitions and applicants for their own departments in **Candidates**, and can weigh finalists side by side in **Compare Benchmark** — match scores, criteria breakdowns, and quoted CV evidence in one matrix.",
      fr: "Les managers recruteurs voient les postes et candidats de leurs départements dans **Candidats**, et peuvent comparer les finalistes dans **Comparer les profils** — scores, critères et preuves du CV dans une seule matrice.",
      es: "Los gerentes de contratación ven las vacantes y postulaciones de sus departamentos en **Candidatos**, y pueden comparar a los finalistas en **Comparar Candidatos**: puntuaciones, criterios y evidencia del CV en una sola matriz.",
      de: "Hiring Manager sehen die Stellen und Bewerber ihrer Abteilungen unter **Kandidaten** und vergleichen Finalisten in **Bewerber vergleichen** — Match-Scores, Kriterien und CV-Belege in einer Matrix.",
      rw: "Abayobozi b'ishami bareba imyanya n'abasaba akazi b'ishami ryabo mu **Abakandida**, kandi barangaza abari ku mpera mu **Kugereranya Abakandida** — amanota, ibisabwa n'ibimenyetso bya CV mu mbonerahamwe imwe."
    }
  },

  // Admins & compliance auditors
  {
    keywords: ['admin', 'administrator', 'team management', 'team rbac', 'rbac', 'invite', 'invite member', 'invite teammate', 'add member', 'edit role', 'my team', 'team member', 'team members', 'audit trail', 'audit log', 'audit', 'compliance', 'settings', 'analytics', 'email delivery', 'email delivery status'],
    answers: {
      en: "Admins manage people and access in **Team & RBAC**: invite members, promote internal staff, and edit anyone's role; workspace **Settings**, hiring **Analytics**, and **Email Delivery** status live in the dashboard. Compliance Auditors get the **Audit Trail** — an immutable record of decisions, score recalibrations, and data access.",
      fr: "Les administrateurs gèrent les personnes et les accès dans **Équipe & RBAC** : invitations, promotion du personnel interne et modification des rôles ; les **Paramètres**, l'**Analytique** de recrutement et l'état d'**Envoi des e-mails** sont dans le tableau de bord. Les auditeurs de conformité consultent le **Journal d'audit** — un registre inaltérable des décisions, recalibrages et accès aux données.",
      es: "Los administradores gestionan personas y accesos en **Equipo & RBAC**: invitar miembros, promover personal interno y editar roles; los **Ajustes**, la **Analítica** de selección y el estado de **Envío de correos** están en el panel. Los auditores de cumplimiento consultan el **Registro de auditoría**: un libro inmutable de decisiones, recalibrados y accesos a datos.",
      de: "Admins verwalten Personen und Zugriffe unter **Team & RBAC**: Mitglieder einladen, interne Mitarbeiter befördern und Rollen anpassen; **Einstellungen**, Recruiting-**Analytik** und der **E-Mail-Versand**-Status liegen im Dashboard. Compliance-Auditoren nutzen das **Audit-Protokoll** — ein unveränderliches Protokoll von Entscheidungen, Neukalibrierungen und Datenzugriffen.",
      rw: "Abayobozi (Admin) bagenga abantu n'uburenganzira mu **Ubuyobozi bw'Abakozi n'Inshingano (RBAC)**: gutumira abakozi, kuzamura ab'imbere mu kigo no guhindura inshingano; **Igenamiterere**, **Imibare y'Akazi** n'imikorere y'**Ubutumwa bw'Imeri** biri mu kibaho. Abagenzuzi bakoresha **Igenzura** — gitabo kidashobora guhindurwa kirimo ibyemezo, gusubiza amanota no kureba amakuru."
    }
  },

  // Candidate pipeline (recruiting staff)
  {
    keywords: ['see candidates', 'voir candidats', 'ver candidatos', 'kandidaten ansehen', 'pipeline', 'kanban', 'abakandida'],
    answers: {
      en: "Hiring staff can view and manage all applicants by clicking **Candidates** in the left menu, available in both Kanban Board and Table views.",
      fr: "L'équipe de recrutement peut consulter l'ensemble des candidats en cliquant sur **Candidats** dans le menu de gauche, avec vue Kanban ou tableau.",
      es: "El equipo de selección puede gestionar todas las postulaciones haciendo clic en **Candidatos** en el menú lateral, tanto en tablero Kanban como en tabla.",
      de: "Das Recruiting-Team kann alle Bewerbungen über den Menüpunkt **Kandidaten** in der linken Seitenleiste in der Kanban- oder Tabellenansicht verwalten.",
      rw: "Abashinzwe gushaka abakozi bashobora kureba no gucunga abakandida bose bakanda kuri **Abakandida** mu mahitamo ari ibumoso."
    }
  },

  // Post a Job Requisition (recruiters)
  {
    keywords: ['post job', 'post a job', 'create job', 'create requisition', 'job requisition', 'new opening', 'créer poste', 'crear puesto', 'stelle erstellen', 'fungura umwanya'],
    answers: {
      en: "To create a new job opening, click **Job Requisitions** in your left menu and press the **+ Create Requisition** button. You can enter the role details and set weighted scoring criteria.",
      fr: "Pour créer une nouvelle offre d'emploi, cliquez sur **Offres d'emploi** dans le menu de gauche puis sur le bouton **+ Créer un Poste**. Vous pourrez définir le poste et les critères de la grille d'évaluation.",
      es: "Para publicar un nuevo puesto, haz clic en **Puestos de Trabajo** en el menú lateral y luego en el botón **+ Crear Puesto**. Podrás definir los requisitos y las ponderaciones de evaluación.",
      de: "Um eine neue Stelle auszuschreiben, klicken Sie im linken Menü auf **Stellenangebote** und dann auf **+ Stelle erstellen**. Dort können Sie Anforderungen und Gewichtungen festlegen.",
      rw: "Kugira ngo ufungure umwanya mushya w'akazi, kanda kuri **Imyanya y'Akazi** mu mahitamo hanyuma ukande **+ Fungura Umwanya Mushya** ushyireho ibisabwa."
    }
  },

  // Blind screening
  {
    keywords: ['blind screening', 'criblage aveugle', 'anonymisation', 'criba a ciegas', 'anonymisierte vorauswahl', 'hatagaragajwe umwirondoro', 'bias', 'pii'],
    answers: {
      en: "Blind Screening hides candidate names, emails, and demographic details during initial evaluation to prevent unconscious bias. Evaluators focus purely on skills and evidence.",
      fr: "Le criblage aveugle masque le nom, l'email et les données démographiques des candidats lors de l'évaluation initiale pour éliminer les biais cognitifs.",
      es: "La criba a ciegas oculta el nombre, correo y datos demográficos del candidato durante la evaluación inicial para eliminar sesgos inconscientes.",
      de: "Das Blind Screening verbirgt Namen, Kontaktdaten und demografische Merkmale bei der ersten Bewertung, um unbewusste Vorurteile auszuschließen.",
      rw: "Isuzuma ritagaragaza umwirondoro rihisha amazina, imeri, n'amakuru bwite y'umukandida mu gihe cyo gusuzuma uburambe kugira ngo birinde kubogama."
    }
  },

  // Rubric & Score Calculation
  {
    keywords: ['rubric', 'score', 'match', 'grille', 'calcul', 'ajuste', 'bewertung', 'ibipimo'],
    answers: {
      en: "AI match scores are calculated by evaluating candidate resumes against weighted job criteria (rated 1 to 5) with exact quoted evidence from the CV, producing a 0–100% match score.",
      fr: "Le score de correspondance IA est calculé en évaluant le CV selon les critères pondérés du poste (1 à 5) avec extraits de preuves cités, produisant un score de 0 à 100 %.",
      es: "El porcentaje de ajuste se calcula evaluando el CV frente a los criterios ponderados del puesto (1 a 5) con citas textuales de evidencia, generando un resultado de 0 a 100%.",
      de: "Die KI-Übereinstimmungsquote wird anhand gewichteter Bewertungskriterien (1 bis 5) mit konkreten Textnachweisen aus dem Lebenslauf als 0–100% Score berechnet.",
      rw: "Amanota y'isuzuma abara uko uburambe bwahuye n'ibisabwa ku kazi hakoreshejwe ibipimo bifite uburemere (1 kugeza kuri 5) hamwe n'ibimenyetso bifatika byakuwe muri CV."
    }
  },

  // Roles & Permissions
  {
    keywords: ['roles', 'permissions', 'qui peut faire quoi', 'permisos', 'berechtigungen', 'inshingano'],
    answers: {
      en: "We support 6 distinct roles: **Admin** (full owner), **Recruiter** (pipeline & offers), **Hiring Manager** (department reviews), **Interviewer** (scorecards), **Compliance Auditor** (audit logs), and **Candidate** (job applicant).",
      fr: "Nous gérons 6 rôles distincts : **Admin** (administrateur système), **Recruteur** (pipeline & offres), **Manager Recruteur** (revue de département), **Évaluateur** (fiches d'entretien), **Auditeur de Conformité** (journal d'audit), et **Candidat** (postulant).",
      es: "Soportamos 6 roles: **Admin** (administrador global), **Reclutador** (pipeline y ofertas), **Gerente de Contratación** (revisión de área), **Entrevistador** (evaluaciones), **Auditor de Cumplimiento** (registros), y **Candidato** (postulante).",
      de: "Wir unterstützen 6 Rollen: **Admin** (Systemverwalter), **Recruiter** (Pipeline & Angebote), **Hiring Manager** (Abteilungsprüfung), **Interviewer** (Bewertungsbögen), **Compliance-Auditor** (Audit-Logs) und **Kandidat** (Bewerber).",
      rw: "Dufite inshingano 6: **Umuyobozi (Admin)**, **Ushinzwe Gushaka Abakozi (Recruiter)**, **Umuyobozi w'Ishami (Hiring Manager)**, **Ukora Ikizamini (Interviewer)**, **Umugenzuzi (Compliance Auditor)**, n'**Umukandida (Candidate)**."
    }
  },

  // Privacy & GDPR
  {
    keywords: ['privacy', 'gdpr', 'rgpd', 'dsgvo', 'delete data', 'delete my account', 'erase my data', 'account erasure', 'data export', 'download my data', 'supprimer donnees', 'umutekano'],
    answers: {
      en: "To download your stored profile data or request account erasure under GDPR, click **Data Privacy** in the left menu.",
      fr: "Pour télécharger vos données ou demander la suppression de votre compte conformément au RGPD, cliquez sur **Confidentialité RGPD** dans le menu de gauche.",
      es: "Para descargar tus datos o solicitar la eliminación de tu cuenta según el RGPD, haz clic en **Privacidad de Datos** en el menú lateral.",
      de: "Um Ihre Daten herunterzuladen oder die Kontolöschung gemäß DSGVO zu beantragen, klicken Sie im linken Menü auf **Datenschutz & DSGVO**.",
      rw: "Kugira ngo ubone amakuru yawe cyangwa usabe ko asibwa burundu, kanda kuri **Umutekano w’Amakuru** mu mahitamo ari ibumoso."
    }
  }
];
