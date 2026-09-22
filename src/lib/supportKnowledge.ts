export const RECRUIT_AI_SYSTEM_PROMPT = `You are RecruitAI Copilot, the elite talent intelligence assistant built into the RecruitAI Enterprise Platform for Codafriqa Tech Corp.

COMMUNICATION & NAVIGATION GUIDELINES:
1. NEVER USE RAW URL PATHS (like /jobs, /candidates, /privacy, /audit, /dashboard/my-applications). Non-technical users find raw web paths confusing.
   - Instead, refer to exact, clear UI menu names in the sidebar, for example:
     - Instead of "/jobs": "Click **'Job Requisitions'** (or **'Explore Open Jobs'**) in the left sidebar menu"
     - Instead of "/dashboard/my-applications": "Click **'My Applications'** in the left sidebar menu"
     - Instead of "/candidates": "Click **'Candidates'** in the left sidebar menu"
     - Instead of "/candidates/compare": "Click **'Compare Benchmark'** in the sidebar"
     - Instead of "/audit": "Click **'Audit Trail'** in the sidebar"
     - Instead of "/privacy": "Click **'Data Privacy'** in the sidebar"
     - Instead of "/dashboard/team": "Click **'Team & RBAC'** in the sidebar"
2. Multilingual Fluency: Speak fluent, high-level English, French (Français), Spanish (Español), German (Deutsch), and Kinyarwanda (Ikinyarwanda).
3. Mirror User Brevity: For simple everyday questions, provide 1 to 3 friendly, helpful, and plain-language sentences.`;

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
    keywords: ['hi', 'hello', 'hey', 'bonjour', 'salut', 'hola', 'hallo', 'guten tag', 'muraho', 'bite', 'mwiriwe'],
    answers: {
      en: "Hello! 👋 I am your RecruitAI Assistant. How can I help you today? You can ask me how to apply for a job, review candidates, post new roles, or understand our AI screening features.",
      fr: "Bonjour ! 👋 Je suis votre assistant RecruitAI. Comment puis-je vous aider aujourd'hui ? Vous pouvez me demander comment postuler, évaluer des candidats ou créer une grille de compétences.",
      es: "¡Hola! 👋 Soy tu Asistente RecruitAI. ¿En qué puedo ayudarte hoy? Puedes preguntarme cómo postularte a un empleo, evaluar candidatos o configurar rúbricas de selección.",
      de: "Hallo! 👋 Ich bin Ihr RecruitAI-Assistent. Wie kann ich Ihnen heute helfen? Sie können mich fragen, wie Sie sich bewerben, Kandidaten prüfen oder Bewertungsrubriken erstellen.",
      rw: "Muraho! 👋 Ndi umufasha wanyu wa RecruitAI. Nabafasha iki uyu munsi? Mumbaze uko basaba akazi, uko basuzuma abakandida, cyangwa gushyiraho imyanya mishya."
    }
  },

  // How to apply
  {
    keywords: ['how to apply', 'comment postuler', 'postuler', 'como postular', 'wie bewerben', 'bewerbung', 'uko basaba akazi', 'gusaba akazi', 'apply for job'],
    answers: {
      en: "To apply for a job, click **Explore Open Jobs** in your left menu, select the role you want, and click **Apply for this Role**. Upload your resume and submit your details!",
      fr: "Pour postuler à une offre, cliquez sur **Explorer les postes** dans le menu de gauche, choisissez le poste souhaité et cliquez sur **Postuler à cette Offre**. Téléversez votre CV et validez vos informations !",
      es: "Para postularte a un empleo, haz clic en **Ver Puestos Disponibles** en el menú lateral, selecciona la vacante deseada y presiona **Postularse al Puesto**. ¡Sube tu CV y completa tus datos!",
      de: "Um sich zu bewerben, klicken Sie im linken Menü auf **Offene Stellen ansehen**, wählen Sie die gewünschte Stelle aus und klicken Sie auf **Jetzt bewerben**. Laden Sie Ihren Lebenslauf hoch und reichen Sie Ihre Bewerbung ein!",
      rw: "Kugira ngo usabe akazi, kanda kuri **Reba Imyanya Ihari** mu mwanya w’iburyo w’amahitamo, hitamo umwanya wifuza, hanyuma ukande **Saba uyu Mwanya**. Shyiraho impapuro z’uburambe (CV) wuzuze imyirondoro!"
    }
  },

  // Where are applications
  {
    keywords: ['my applications', 'mes candidatures', 'mis solicitudes', 'meine bewerbungen', 'ubusabe bwanjye', 'suivi candidature'],
    answers: {
      en: "You can track the live status of all your submitted applications anytime by clicking **My Applications** in your left menu.",
      fr: "Vous pouvez suivre l'état de toutes vos candidatures en temps réel en cliquant sur **Mes candidatures** dans le menu de gauche.",
      es: "Puedes consultar el estado de tus solicitudes en cualquier momento haciendo clic en **Mis Solicitudes** en el menú de la izquierda.",
      de: "Den aktuellen Status aller Ihrer eingereichten Bewerbungen können Sie jederzeit über den Menüpunkt **Meine Bewerbungen** in der linken Seitenleiste einsehen.",
      rw: "Ushobora kureba aho ubusabe bwawe bugeze igihe icyo ari cyo cyose ukanda kuri **Ubusabe Bwanjye** mu mahitamo ari ibumoso."
    }
  },

  // Candidate pipeline
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

  // Post a Job Requisition
  {
    keywords: ['post job', 'create job', 'créer poste', 'crear puesto', 'stelle erstellen', 'fungura umwanya'],
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
    keywords: ['privacy', 'gdpr', 'rgpd', 'dsgvo', 'delete data', 'supprimer donnees', 'umutekano'],
    answers: {
      en: "To download your stored profile data or request account erasure under GDPR, click **Data Privacy** in the left menu.",
      fr: "Pour télécharger vos données ou demander la suppression de votre compte conformément au RGPD, cliquez sur **Confidentialité RGPD** dans le menu de gauche.",
      es: "Para descargar tus datos o solicitar la eliminación de tu cuenta según el RGPD, haz clic en **Privacidad de Datos** en el menú lateral.",
      de: "Um Ihre Daten herunterzuladen oder die Kontolöschung gemäß DSGVO zu beantragen, klicken Sie im linken Menü auf **Datenschutz & DSGVO**.",
      rw: "Kugira ngo ubone amakuru yawe cyangwa usabe ko asibwa burundu, kanda kuri **Umutekano w’Amakuru** mu mahitamo ari ibumoso."
    }
  }
];