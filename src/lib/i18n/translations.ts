export type SupportedLanguage = 'en' | 'fr' | 'es' | 'de' | 'rw';

export interface TranslationDictionary {
  // Navigation
  nav_dashboard: string;
  nav_candidates: string;
  nav_compare: string;
  nav_duplicates: string;
  nav_jobs: string;
  nav_audit: string;
  nav_privacy: string;
  nav_team: string;
  nav_my_applications: string;
  nav_quick_apply: string;

  // Header & Global
  search_placeholder: string;
  notifications: string;
  copilot_title: string;
  copilot_subtitle: string;
  theme_toggle: string;
  sign_out: string;
  active_session: string;
  spotlight_search: string;

  // AI Copilot UI
  copilot_welcome: string;
  copilot_input_placeholder: string;
  copilot_ask_btn: string;
  copilot_clear_btn: string;
  qp_match_score: string;
  qp_roles: string;
  qp_blind_screening: string;
  qp_create_rubric: string;
  qp_questions: string;

  // Dashboard KPI & Funnel
  total_candidates: string;
  avg_match_rate: string;
  open_requisitions: string;
  active_audits: string;
  pipeline_distribution: string;
  recent_activity: string;
  dashboard_subtitle: string;
  stage_ingested: string;
  stage_screening: string;
  stage_shortlisted: string;
  stage_interviewing: string;
  stage_offered: string;
  realtime_sync: string;

  // Candidates Pipeline
  pipeline_title: string;
  pipeline_subtitle: string;
  view_kanban: string;
  view_table: string;
  search_candidate_placeholder: string;
  all_departments: string;
  match_score: string;
  no_candidates_stage: string;
  candidate_name_col: string;
  position_applied_col: string;
  department_col: string;
  stage_col: string;
  score_col: string;
  actions_col: string;

  // Candidate Profile / Evaluation
  eval_title: string;
  ocr_stream: string;
  parsed_resume_doc: string;
  explainable_score: string;
  deterministic_match: string;
  overridden_badge: string;
  scored_criteria: string;
  locate_evidence: string;
  btn_ai_questions: string;
  btn_scorecard: string;
  btn_schedule: string;
  btn_recalibrate: string;
  btn_extend_offer: string;
  btn_blind_mode: string;
  btn_reveal_pii: string;

  // Jobs Directory
  jobs_title: string;
  jobs_subtitle: string;
  btn_create_job: string;
  active_requisitions_badge: string;
  view_details: string;
  apply_role: string;
  no_jobs_found: string;

  // Team & RBAC
  team_title: string;
  team_subtitle: string;
  tab_internal_staff: string;
  tab_external_candidates: string;
  btn_invite_member: string;
  btn_edit_role: string;
  promote_btn: string;

  // Audit
  audit_title: string;
  audit_subtitle: string;
  sha256_verified: string;
  timestamp_col: string;
  action_col: string;
  actor_col: string;
  affected_col: string;
  integrity_col: string;

  // Privacy
  privacy_title: string;
  privacy_subtitle: string;
  btn_export_data: string;
  btn_request_erasure: string;

  // Common UI
  cancel: string;
  save: string;
  confirm: string;
  loading: string;
  success: string;
  error: string;
}

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    nav_dashboard: 'Dashboard',
    nav_candidates: 'Candidates',
    nav_compare: 'Compare Benchmark',
    nav_duplicates: 'Deduplication',
    nav_jobs: 'Job Requisitions',
    nav_audit: 'Audit Trail',
    nav_privacy: 'Data Privacy',
    nav_team: 'Team & RBAC',
    nav_my_applications: 'My Applications',
    nav_quick_apply: 'Browse Open Roles',

    search_placeholder: 'Search candidates, jobs, audit logs...',
    notifications: 'Notifications',
    copilot_title: 'RecruitAI Copilot',
    copilot_subtitle: 'Talent Intelligence Assistant',
    theme_toggle: 'Toggle theme',
    sign_out: 'Sign Out',
    active_session: 'Active Authenticated Session',
    spotlight_search: 'Spotlight Search',

    copilot_welcome: '👋 **Welcome to RecruitAI Copilot!**\n\nI am your multilingual talent intelligence assistant. Ask me anything about candidate screening, rubric construction, role permissions, or privacy compliance.',
    copilot_input_placeholder: 'Ask anything about candidates, rubrics, roles...',
    copilot_ask_btn: 'Ask',
    copilot_clear_btn: 'Clear',
    qp_match_score: '🎯 Match Score Algorithm',
    qp_roles: '🛡️ Role Permissions',
    qp_blind_screening: '🔒 Blind Screening',
    qp_create_rubric: '💼 Create Rubric',
    qp_questions: '🤖 Interview Questions',

    total_candidates: 'Total Applicants',
    avg_match_rate: 'Average Match Rate',
    open_requisitions: 'Open Requisitions',
    active_audits: 'Audited Screening Events',
    pipeline_distribution: 'ATS Pipeline Distribution',
    recent_activity: 'Recent Audit Activity',
    dashboard_subtitle: 'Real-time telemetry on candidate ingestion, rubric matching, and evaluation pipelines.',
    stage_ingested: 'Ingested',
    stage_screening: 'Screening',
    stage_shortlisted: 'Shortlisted',
    stage_interviewing: 'Interviewing',
    stage_offered: 'Offered',
    realtime_sync: 'Sync Telemetry',

    pipeline_title: 'Candidate Evaluation Pipeline',
    pipeline_subtitle: 'Multi-stage applicant tracking with deterministic rubric criteria and evidence explainability.',
    view_kanban: 'Kanban Board',
    view_table: 'Data Table',
    search_candidate_placeholder: 'Search candidate name or skill...',
    all_departments: 'All Departments',
    match_score: 'Match',
    no_candidates_stage: 'No applicants in this stage',
    candidate_name_col: 'Candidate Name',
    position_applied_col: 'Position Applied',
    department_col: 'Department',
    stage_col: 'Pipeline Stage',
    score_col: 'Match Score',
    actions_col: 'Actions',

    eval_title: 'Candidate Evaluation',
    ocr_stream: 'OCR Text Stream',
    parsed_resume_doc: 'Parsed Resume Document',
    explainable_score: 'Explainable Match Score',
    deterministic_match: 'Deterministic rubric match',
    overridden_badge: 'Overridden',
    scored_criteria: 'Scored Rubric Criteria',
    locate_evidence: 'Locate in resume',
    btn_ai_questions: 'AI Questions',
    btn_scorecard: 'Scorecard',
    btn_schedule: 'Schedule',
    btn_recalibrate: 'Recalibrate',
    btn_extend_offer: 'Extend Offer',
    btn_blind_mode: '🔒 Blind Screen',
    btn_reveal_pii: '👁 Reveal PII',

    jobs_title: 'Job Requisitions & Scoring Rubrics',
    jobs_subtitle: 'Define open roles, target departments, and assign weighted criteria to build explainable AI screening rubrics.',
    btn_create_job: '+ Create Requisition',
    active_requisitions_badge: 'OPEN REQUISITIONS',
    view_details: 'View Details',
    apply_role: 'Apply for Role',
    no_jobs_found: 'No active job requisitions found.',

    team_title: 'User & Access Governance',
    team_subtitle: 'Strictly segregated directory distinguishing internal workspace staff from external job seekers.',
    tab_internal_staff: 'Internal Staff Directory',
    tab_external_candidates: 'External Job Seekers (Candidates)',
    btn_invite_member: 'Invite Staff Member',
    btn_edit_role: 'Edit Role',
    promote_btn: 'Promote',

    audit_title: 'Tamper-Evident Security & Audit Ledger',
    audit_subtitle: 'Cryptographically referenced immutable timeline of all AI screenings, score overrides, and data access.',
    sha256_verified: 'SHA-256 Verified',
    timestamp_col: 'Timestamp',
    action_col: 'Action',
    actor_col: 'Actor',
    affected_col: 'Affected Record',
    integrity_col: 'Integrity Status',

    privacy_title: 'GDPR Data Privacy & User Rights',
    privacy_subtitle: 'Self-service data export and Right to be Forgotten account erasure controls.',
    btn_export_data: 'Export My Profile Data (JSON)',
    btn_request_erasure: 'Execute Right to be Forgotten (Erase Account)',

    cancel: 'Cancel',
    save: 'Save Changes',
    confirm: 'Confirm Action',
    loading: 'Loading system telemetry...',
    success: 'Operation completed successfully',
    error: 'An error occurred'
  },
  fr: {
    nav_dashboard: 'Tableau de bord',
    nav_candidates: 'Candidats',
    nav_compare: 'Comparer les profils',
    nav_duplicates: 'Dédoublonnage',
    nav_jobs: 'Offres d’emploi',
    nav_audit: 'Journal d’audit',
    nav_privacy: 'Confidentialité RGPD',
    nav_team: 'Équipe & Rôles',
    nav_my_applications: 'Mes candidatures',
    nav_quick_apply: 'Explorer les postes',

    search_placeholder: 'Rechercher candidats, postes, audits...',
    notifications: 'Notifications',
    copilot_title: 'Copilote RecruitAI',
    copilot_subtitle: 'Assistant Recrutement IA',
    theme_toggle: 'Changer le thème',
    sign_out: 'Se déconnecter',
    active_session: 'Session Authentifiée Active',
    spotlight_search: 'Recherche Rapide',

    copilot_welcome: '👋 **Bienvenue sur le Copilote RecruitAI !**\n\nJe suis votre assistant multilingue en recrutement et évaluation. Posez-moi vos questions sur le filtrage des CV, la création de grilles d’évaluation, les permissions ou la conformité RGPD.',
    copilot_input_placeholder: 'Posez une question sur les candidats, grilles, rôles...',
    copilot_ask_btn: 'Envoyer',
    copilot_clear_btn: 'Effacer',
    qp_match_score: '🎯 Algorithme de Score',
    qp_roles: '🛡️ Rôles & Permissions',
    qp_blind_screening: '🔒 Évaluation Aveugle',
    qp_create_rubric: '💼 Créer une Grille',
    qp_questions: '🤖 Questions d’Entretien',

    total_candidates: 'Total des Candidats',
    avg_match_rate: 'Taux de Correspondance Moyen',
    open_requisitions: 'Postes Ouverts',
    active_audits: 'Événements d’Audit',
    pipeline_distribution: 'Distribution du Pipeline ATS',
    recent_activity: 'Activité Récente d’Audit',
    dashboard_subtitle: 'Télémétrie en temps réel sur la réception des candidatures, les scores d’adéquation et le pipeline.',
    stage_ingested: 'Reçu',
    stage_screening: 'Évaluation',
    stage_shortlisted: 'Présélectionné',
    stage_interviewing: 'En Entretien',
    stage_offered: 'Offre Émise',
    realtime_sync: 'Synchroniser',

    pipeline_title: 'Pipeline d’Évaluation des Candidats',
    pipeline_subtitle: 'Suivi des candidatures multi-étapes avec grilles déterministes et preuves textuelles vérifiables.',
    view_kanban: 'Tableau Kanban',
    view_table: 'Tableau Détaillé',
    search_candidate_placeholder: 'Rechercher par nom ou compétence...',
    all_departments: 'Tous les Départements',
    match_score: 'Score',
    no_candidates_stage: 'Aucun candidat à cette étape',
    candidate_name_col: 'Nom du Candidat',
    position_applied_col: 'Poste Demandé',
    department_col: 'Département',
    stage_col: 'Étape du Pipeline',
    score_col: 'Score d’Adéquation',
    actions_col: 'Actions',

    eval_title: 'Évaluation du Candidat',
    ocr_stream: 'Flux Texte OCR',
    parsed_resume_doc: 'Document CV Analysé',
    explainable_score: 'Score d’Adéquation Détaillé',
    deterministic_match: 'Correspondance déterministe',
    overridden_badge: 'Ajusté Manuellement',
    scored_criteria: 'Critères de la Grille Évalués',
    locate_evidence: 'Localiser dans le CV',
    btn_ai_questions: 'Questions IA',
    btn_scorecard: 'Fiche d’Entretien',
    btn_schedule: 'Planifier',
    btn_recalibrate: 'Ajuster le Score',
    btn_extend_offer: 'Émettre une Offre',
    btn_blind_mode: '🔒 Masquer l’Identité',
    btn_reveal_pii: '👁 Afficher l’Identité',

    jobs_title: 'Offres d’Emploi & Grilles de Compétences',
    jobs_subtitle: 'Définissez les postes ouverts, les départements cibles et assignez des critères pondérés pour l’évaluation automatique.',
    btn_create_job: '+ Créer un Poste',
    active_requisitions_badge: 'POSTES OUVERTS',
    view_details: 'Voir les Détails',
    apply_role: 'Postuler',
    no_jobs_found: 'Aucune offre active pour le moment.',

    team_title: 'Gestion des Rôles & Utilisateurs',
    team_subtitle: 'Annuaire strictement séparé distinguant les collaborateurs internes des candidats externes.',
    tab_internal_staff: 'Collaborateurs Internes',
    tab_external_candidates: 'Candidats Enregistrés',
    btn_invite_member: 'Inviter un Collaborateur',
    btn_edit_role: 'Modifier le Rôle',
    promote_btn: 'Promouvoir',

    audit_title: 'Journal d’Audit & Sécurité Infalsifiable',
    audit_subtitle: 'Chronologie immuable vérifiée cryptographiquement pour chaque évaluation IA, ajustement et accès aux données.',
    sha256_verified: 'Vérifié SHA-256',
    timestamp_col: 'Horodatage',
    action_col: 'Action',
    actor_col: 'Auteur',
    affected_col: 'Enregistrement Concerné',
    integrity_col: 'État d’Intégrité',

    privacy_title: 'Confidentialité des Données & Droits RGPD',
    privacy_subtitle: 'Exportation de données et exercice du Droit à l’Oubli (suppression de compte).',
    btn_export_data: 'Exporter mes Données (JSON)',
    btn_request_erasure: 'Exercer le Droit à l’Oubli (Supprimer mon Compte)',

    cancel: 'Annuler',
    save: 'Enregistrer',
    confirm: 'Confirmer',
    loading: 'Chargement des données en cours...',
    success: 'Opération réussie',
    error: 'Une erreur est survenue'
  },
  es: {
    nav_dashboard: 'Panel de Control',
    nav_candidates: 'Candidatos',
    nav_compare: 'Comparativa de Perfiles',
    nav_duplicates: 'Deduplicación',
    nav_jobs: 'Puestos de Trabajo',
    nav_audit: 'Registro de Auditoría',
    nav_privacy: 'Privacidad de Datos',
    nav_team: 'Equipo y Roles',
    nav_my_applications: 'Mis Solicitudes',
    nav_quick_apply: 'Ver Puestos Disponibles',

    search_placeholder: 'Buscar candidatos, empleos, registros...',
    notifications: 'Notificaciones',
    copilot_title: 'Copiloto RecruitAI',
    copilot_subtitle: 'Asistente de Talento IA',
    theme_toggle: 'Cambiar tema',
    sign_out: 'Cerrar Sesión',
    active_session: 'Sesión Autenticada Activa',
    spotlight_search: 'Búsqueda Rápida',

    copilot_welcome: '👋 **¡Bienvenido al Copiloto RecruitAI!**\n\nSoy tu asistente multilingüe de talento y contratación. Pregúntame sobre la evaluación de CVs, la creación de rúbricas, permisos de usuario o privacidad de datos.',
    copilot_input_placeholder: 'Pregunta sobre candidatos, rúbricas, roles...',
    copilot_ask_btn: 'Preguntar',
    copilot_clear_btn: 'Limpiar',
    qp_match_score: '🎯 Algoritmo de Ajuste',
    qp_roles: '🛡️ Roles y Permisos',
    qp_blind_screening: '🔒 Criba a Ciegas',
    qp_create_rubric: '💼 Crear Rúbrica',
    qp_questions: '🤖 Preguntas de Entrevista',

    total_candidates: 'Total de Candidatos',
    avg_match_rate: 'Tasa de Ajuste Promedio',
    open_requisitions: 'Puestos Abiertos',
    active_audits: 'Eventos Auditados',
    pipeline_distribution: 'Distribución del Pipeline ATS',
    recent_activity: 'Actividad de Auditoría Reciente',
    dashboard_subtitle: 'Telemetría en tiempo real sobre postulaciones, puntuaciones de rúbricas y fases de evaluación.',
    stage_ingested: 'Recibido',
    stage_screening: 'En Evaluación',
    stage_shortlisted: 'Preseleccionado',
    stage_interviewing: 'En Entrevistas',
    stage_offered: 'Oferta Emitida',
    realtime_sync: 'Sincronizar',

    pipeline_title: 'Pipeline de Evaluación de Candidatos',
    pipeline_subtitle: 'Gestión integral de candidatos con criterios de rúbrica deterministas y evidencia verificable.',
    view_kanban: 'Tablero Kanban',
    view_table: 'Tabla de Datos',
    search_candidate_placeholder: 'Buscar por nombre o habilidad...',
    all_departments: 'Todos los Departamentos',
    match_score: 'Ajuste',
    no_candidates_stage: 'Sin postulantes en esta fase',
    candidate_name_col: 'Nombre del Candidato',
    position_applied_col: 'Puesto Solicitado',
    department_col: 'Departamento',
    stage_col: 'Fase del Pipeline',
    score_col: 'Puntuación de Ajuste',
    actions_col: 'Acciones',

    eval_title: 'Evaluación del Candidato',
    ocr_stream: 'Texto Extraído por OCR',
    parsed_resume_doc: 'Documento CV Analizado',
    explainable_score: 'Puntuación de Ajuste Explicable',
    deterministic_match: 'Ajuste determinista de rúbrica',
    overridden_badge: 'Ajustado Manualmente',
    scored_criteria: 'Criterios de Rúbrica Evaluados',
    locate_evidence: 'Localizar en el CV',
    btn_ai_questions: 'Preguntas IA',
    btn_scorecard: 'Ficha de Evaluación',
    btn_schedule: 'Programar',
    btn_recalibrate: 'Ajustar Puntuación',
    btn_extend_offer: 'Emitir Oferta',
    btn_blind_mode: '🔒 Modo Ciego (PII Oculto)',
    btn_reveal_pii: '👁 Revelar Datos Personales',

    jobs_title: 'Puestos de Trabajo y Rúbricas',
    jobs_subtitle: 'Crea puestos vacantes, asigna departamentos y define ponderaciones para la evaluación inteligente.',
    btn_create_job: '+ Crear Puesto',
    active_requisitions_badge: 'PUESTOS ABIERTOS',
    view_details: 'Ver Detalles',
    apply_role: 'Postularse',
    no_jobs_found: 'No hay puestos vacantes activos.',

    team_title: 'Gestión de Equipo y Permisos',
    team_subtitle: 'Directorio estructurado que separa al personal interno de los candidatos registrados.',
    tab_internal_staff: 'Personal Interno',
    tab_external_candidates: 'Candidatos Registrados',
    btn_invite_member: 'Invitar Empleado',
    btn_edit_role: 'Editar Rol',
    promote_btn: 'Promover',

    audit_title: 'Registro de Seguridad y Auditoría Inmutable',
    audit_subtitle: 'Línea de tiempo inmutable con verificación criptográfica para cada decisión y acceso a datos.',
    sha256_verified: 'Verificado SHA-256',
    timestamp_col: 'Fecha y Hora',
    action_col: 'Acción',
    actor_col: 'Usuario / Agente',
    affected_col: 'Registro Afectado',
    integrity_col: 'Estado de Integridad',

    privacy_title: 'Privacidad de Datos y Derechos RGPD',
    privacy_subtitle: 'Descarga de datos personales y derecho al olvido (eliminación de cuenta).',
    btn_export_data: 'Exportar mis Datos (JSON)',
    btn_request_erasure: 'Ejercer Derecho al Olvido (Eliminar Cuenta)',

    cancel: 'Cancelar',
    save: 'Guardar',
    confirm: 'Confirmar',
    loading: 'Cargando datos del sistema...',
    success: 'Operación realizada con éxito',
    error: 'Ocurrió un error'
  },
  de: {
    nav_dashboard: 'Dashboard',
    nav_candidates: 'Kandidaten',
    nav_compare: 'Benchmark-Vergleich',
    nav_duplicates: 'Deduplizierung',
    nav_jobs: 'Stellenangebote',
    nav_audit: 'Audit-Protokoll',
    nav_privacy: 'Datenschutz & DSGVO',
    nav_team: 'Team & Rollen',
    nav_my_applications: 'Meine Bewerbungen',
    nav_quick_apply: 'Offene Stellen ansehen',

    search_placeholder: 'Kandidaten, Jobs, Logs durchsuchen...',
    notifications: 'Benachrichtigungen',
    copilot_title: 'RecruitAI Copilot',
    copilot_subtitle: 'KI-Talentassistent',
    theme_toggle: 'Design umschalten',
    sign_out: 'Abmelden',
    active_session: 'Aktive Authentifizierte Sitzung',
    spotlight_search: 'Schnellsuche',

    copilot_welcome: '👋 **Willkommen beim RecruitAI Copilot!**\n\nIch bin Ihr mehrsprachiger KI-Assistent für Recruiting und Talentbewertung. Fragen Sie mich nach Lebenslauf-Screening, Bewertungsrubriken, Rollenberechtigungen oder DSGVO-Konformität.',
    copilot_input_placeholder: 'Fragen Sie nach Kandidaten, Rubriken, Rollen...',
    copilot_ask_btn: 'Fragen',
    copilot_clear_btn: 'Löschen',
    qp_match_score: '🎯 Bewertungsalgorithmus',
    qp_roles: '🛡️ Rollenberechtigungen',
    qp_blind_screening: '🔒 Anonymisierte Auswahl',
    qp_create_rubric: '💼 Rubrik erstellen',
    qp_questions: '🤖 Interviewfragen',

    total_candidates: 'Bewerber Gesamt',
    avg_match_rate: 'Durchschnittliche Übereinstimmung',
    open_requisitions: 'Offene Stellen',
    active_audits: 'Geprüfte Audit-Ereignisse',
    pipeline_distribution: 'ATS-Pipeline-Verteilung',
    recent_activity: 'Neueste Audit-Aktivitäten',
    dashboard_subtitle: 'Echtzeit-Telemetrie zu Bewerbungseingängen, Rubrik-Matches und Bewertungsstufen.',
    stage_ingested: 'Eingegangen',
    stage_screening: 'In Prüfung',
    stage_shortlisted: 'In der engeren Auswahl',
    stage_interviewing: 'Im Interview',
    stage_offered: 'Angebot erstellt',
    realtime_sync: 'Synchronisieren',

    pipeline_title: 'Kandidaten-Evaluierungs-Pipeline',
    pipeline_subtitle: 'Mehrstufiges Bewerbermanagement mit deterministischen Rubriken und nachweisbarer Evidenz.',
    view_kanban: 'Kanban-Board',
    view_table: 'Datentabelle',
    search_candidate_placeholder: 'Nach Name oder Qualifikation suchen...',
    all_departments: 'Alle Abteilungen',
    match_score: 'Match',
    no_candidates_stage: 'Keine Bewerber in dieser Phase',
    candidate_name_col: 'Kandidatenname',
    position_applied_col: 'Angestrebte Stelle',
    department_col: 'Abteilung',
    stage_col: 'Pipeline-Status',
    score_col: 'Übereinstimmung',
    actions_col: 'Aktionen',

    eval_title: 'Kandidatenbewertung',
    ocr_stream: 'OCR-Textstrom',
    parsed_resume_doc: 'Analysierter Lebenslauf',
    explainable_score: 'Erklärbare Übereinstimmungsquote',
    deterministic_match: 'Deterministischer Rubrikenabgleich',
    overridden_badge: 'Manuell angepasst',
    scored_criteria: 'Bewertete Kriterien',
    locate_evidence: 'Im Lebenslauf lokalisieren',
    btn_ai_questions: 'KI-Fragen',
    btn_scorecard: 'Bewertungsbogen',
    btn_schedule: 'Terminieren',
    btn_recalibrate: 'Quote anpassen',
    btn_extend_offer: 'Angebot senden',
    btn_blind_mode: '🔒 Blind Screening',
    btn_reveal_pii: '👁 Persönliche Daten anzeigen',

    jobs_title: 'Stellenangebote & Bewertungsrubriken',
    jobs_subtitle: 'Erstellen Sie offene Stellen und definieren Sie gewichtete Kriterien für die KI-gestützte Vorauswahl.',
    btn_create_job: '+ Stelle erstellen',
    active_requisitions_badge: 'OFFENE STELLEN',
    view_details: 'Details anzeigen',
    apply_role: 'Bewerben',
    no_jobs_found: 'Keine aktiven Stellenangebote gefunden.',

    team_title: 'Benutzer- & Rollenverwaltung',
    team_subtitle: 'Strikt getrenntes Verzeichnis zwischen internen Mitarbeitern und registrierten Bewerbern.',
    tab_internal_staff: 'Interne Mitarbeiter',
    tab_external_candidates: 'Registrierte Bewerber',
    btn_invite_member: 'Mitarbeiter einladen',
    btn_edit_role: 'Rolle bearbeiten',
    promote_btn: 'Befördern',

    audit_title: 'Manipulationssicheres Audit-Protokoll',
    audit_subtitle: 'Kryptografisch verifizierte, unveränderliche Zeitleiste aller KI-Vorauswahlen und Datenzugriffe.',
    sha256_verified: 'SHA-256 Verifiziert',
    timestamp_col: 'Zeitstempel',
    action_col: 'Aktion',
    actor_col: 'Akteur',
    affected_col: 'Betroffener Datensatz',
    integrity_col: 'Integritätsstatus',

    privacy_title: 'Datenschutz & DSGVO-Rechte',
    privacy_subtitle: 'Selbstbedienungs-Datenexport und Recht auf Löschung (Kontoentfernung).',
    btn_export_data: 'Meine Daten exportieren (JSON)',
    btn_request_erasure: 'Recht auf Vergessenwerden ausüben (Konto löschen)',

    cancel: 'Abbrechen',
    save: 'Speichern',
    confirm: 'Bestätigen',
    loading: 'Systemtelemetrie wird geladen...',
    success: 'Vorgang erfolgreich abgeschlossen',
    error: 'Ein Fehler ist aufgetreten'
  },
  rw: {
    nav_dashboard: 'Ikibaho cy’Ibanze',
    nav_candidates: 'Abakandida',
    nav_compare: 'Kugereranya Abakandida',
    nav_duplicates: 'Gusuzuma Abisubiyemo',
    nav_jobs: 'Imyanya y’Akazi',
    nav_audit: 'Inyandiko z’Igenzura',
    nav_privacy: 'Umutekano w’Amakuru',
    nav_team: 'Ikipe n’Inshingano',
    nav_my_applications: 'Ubusabe Bwanjye',
    nav_quick_apply: 'Reba Imyanya Ihari',

    search_placeholder: 'Shakisha abakandida, akazi, igenzura...',
    notifications: 'Amatangazo',
    copilot_title: 'Umufasha wa RecruitAI',
    copilot_subtitle: 'Ubuhanga bwa AI mu Gushaka Abakozi',
    theme_toggle: 'Guhindura ibara',
    sign_out: 'Gusohoka',
    active_session: 'Kwinjira Byemejwe',
    spotlight_search: 'Gushakisha Byihuse',

    copilot_welcome: '👋 **Murakaza neza kuri RecruitAI Copilot!**\n\nNdi umufasha wanyu mu gushaka no gusesengura abakandida. Mumbaze ibijyanye no gusuzuma impapuro z’uburambe, gutegura ibipimo ngenderwaho, inshingano, cyangwa umutekano w’amakuru.',
    copilot_input_placeholder: 'Baza ibijyanye n’abakandida, akazi, inshingano...',
    copilot_ask_btn: 'Baza',
    copilot_clear_btn: 'Siba',
    qp_match_score: '🎯 Imibare y’Isuzuma',
    qp_roles: '🛡️ Inshingano n’Ububasha',
    qp_blind_screening: '🔒 Gusuzuma Hatagaragajwe Umwirondoro',
    qp_create_rubric: '💼 Gushyiraho Ibipimo',
    qp_questions: '🤖 Ibibazo by’Ibizamini',

    total_candidates: 'Abakandida Bose',
    avg_match_rate: 'Ikigereranyo cy’Ubumenyi',
    open_requisitions: 'Imyanya Ifunguye',
    active_audits: 'Ibyakozwe Byagenzuwe',
    pipeline_distribution: 'Uko Abakandida Bahagaze',
    recent_activity: 'Iheruka mu Igenzura',
    dashboard_subtitle: 'Amakuru y’ako kanya ku bakandida bakiriwe, amanota bahawe n’aho bageze basuzumwa.',
    stage_ingested: 'Bakiriwe',
    stage_screening: 'Bari mu Isuzuma',
    stage_shortlisted: 'Batoranyijwe',
    stage_interviewing: 'Bari mu Bizamini',
    stage_offered: 'Bahawe Akazi',
    realtime_sync: 'Vugurura',

    pipeline_title: 'Urugendo rwo Gusuzuma Abakandida',
    pipeline_subtitle: 'Gukurikirana abakandida mu byiciro bitandukanye hakoreshejwe ibipimo bifatika by’uburambe.',
    view_kanban: 'Imiterere ya Kanban',
    view_table: 'Imbonerahamwe',
    search_candidate_placeholder: 'Shakisha izina cyangwa ubumenyi...',
    all_departments: 'Amashami Yose',
    match_score: 'Amanota',
    no_candidates_stage: 'Nta mukandida uri muri iki cyiciro',
    candidate_name_col: 'Izina ry’Umukandida',
    position_applied_col: 'Umwanya Yasabye',
    department_col: 'Ishami',
    stage_col: 'Icyiciro Agezemo',
    score_col: 'Amanota y’Ubumenyi',
    actions_col: 'Ibyo Wakora',

    eval_title: 'Isuzuma ry’Umukandida',
    ocr_stream: 'Inyandiko Yakuwe muri CV',
    parsed_resume_doc: 'Impapuro z’Uburambe Zasesenguwe',
    explainable_score: 'Amanota Asomwa neza',
    deterministic_match: 'Isuzuma rishingiye ku bipimo nyabyo',
    overridden_badge: 'Yakosowe n’Umuntu',
    scored_criteria: 'Ibipimo Byasuzumwe',
    locate_evidence: 'Kureba ikimenyetso muri CV',
    btn_ai_questions: 'Ibibazo bya AI',
    btn_scorecard: 'Ikarita y’Amanota',
    btn_schedule: 'Gushyiraho Gahunda',
    btn_recalibrate: 'Gukosora Amanota',
    btn_extend_offer: 'Guha Umukandida Akazi',
    btn_blind_mode: '🔒 Hisha Umwirondoro',
    btn_reveal_pii: '👁 Garagaza Umwirondoro',

    jobs_title: 'Imyanya y’Akazi n’Ibipimo Ngenderwaho',
    jobs_subtitle: 'Gushyiraho imyanya mishya no gutegura ibipimo bifite uburemere byifashishwa mu isuzuma rya AI.',
    btn_create_job: '+ Fungura Umwanya Mushya',
    active_requisitions_badge: 'IMYANYA IFUNGUYE',
    view_details: 'Reba Byose',
    apply_role: 'Saba uyu Mwanya',
    no_jobs_found: 'Nta myanya y’akazi ifunguye muri aka kanya.',

    team_title: 'Ubuyobozi bw’Abakozi n’Inshingano',
    team_subtitle: 'Urutonde rutandukanya abakozi b’imbere mu kigo n’abakandida basaba akazi.',
    tab_internal_staff: 'Abakozi b’Imbere mu Kigo',
    tab_external_candidates: 'Abasaba Akazi (Abakandida)',
    btn_invite_member: 'Tumira Umukozi Mushya',
    btn_edit_role: 'Hindura Inshingano',
    promote_btn: 'Muhe Akazi k’Imbere',

    audit_title: 'Inyandiko z’Igenzura n’Umutekano Zidasibwa',
    audit_subtitle: 'Inyandiko z’amateka zifite ikimenyetso cya SHA-256 zigaragaza buri kintu cyose cyakozwe na AI.',
    sha256_verified: 'Byemejwe na SHA-256',
    timestamp_col: 'Igihe Byakorewe',
    action_col: 'Igikorwa',
    actor_col: 'Uwakoze Igikorwa',
    affected_col: 'Icyakozweho',
    integrity_col: 'Umutekano w’Amakuru',

    privacy_title: 'Umutekano w’Amakuru n’Uburenganzira bwa RGPD',
    privacy_subtitle: 'Gukuramo amakuru yawe cyangwa gusaba ko konti yawe isibwa burundu.',
    btn_export_data: 'Kura hano Amakuru Yanjye (JSON)',
    btn_request_erasure: 'Siba Konti Yanjye Burundu',

    cancel: 'Kureka',
    save: 'Bika Impinduka',
    confirm: 'Emeza Igikorwa',
    loading: 'Gupakira amakuru ya sisitemu...',
    success: 'Igikorwa cyagenze neza',
    error: 'Habaye ikibazo'
  }
};