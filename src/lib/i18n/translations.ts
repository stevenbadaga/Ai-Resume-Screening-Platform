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
  profile_candidate_details: string;
  profile_extracted_skills: string;
  profile_work_history: string;
  profile_education: string;
  profile_quick_actions: string;
  profile_ai_match_rationale: string;
  profile_recruitment_decisions: string;

  // Jobs Directory & Requisitions
  jobs_title: string;
  jobs_subtitle: string;
  btn_create_job: string;
  active_requisitions_badge: string;
  view_details: string;
  apply_role: string;
  no_jobs_found: string;
  rubric_preview_title: string;
  rubric_preview_subtitle: string;
  rubric_scoring_formula: string;
  rubric_weight_distribution: string;
  create_job_modal_title: string;
  create_job_title_label: string;
  create_job_dept_label: string;
  create_job_desc_label: string;
  create_job_criteria_heading: string;
  create_job_add_criteria: string;
  create_job_submit_btn: string;
  create_job_weight_label: string;
  create_job_category_label: string;

  // Decisions
  decision_modal_title: string;
  decision_modal_subtitle: string;
  decision_action_label: string;
  decision_reason_label: string;
  decision_rationale_label: string;
  decision_submit_btn: string;
  decision_action_shortlist: string;
  decision_action_advance: string;
  decision_action_hold: string;
  decision_action_reject: string;
  decision_action_withdraw: string;
  decision_action_review: string;
  decision_history_title: string;

  // Scorecards
  scorecard_modal_title: string;
  scorecard_tech_rating: string;
  scorecard_comm_rating: string;
  scorecard_problem_rating: string;
  scorecard_recommendation: string;
  scorecard_notes: string;
  scorecard_submit_btn: string;
  scorecards_submitted_heading: string;
  scorecard_rec_strong_hire: string;
  scorecard_rec_hire: string;
  scorecard_rec_lean_hire: string;
  scorecard_rec_no_hire: string;

  // Compare & Benchmark
  compare_title: string;
  compare_subtitle: string;
  compare_badge: string;
  compare_full_eval: string;
  compare_criteria_breakdown: string;

  // Duplicates
  duplicates_title: string;
  duplicates_subtitle: string;
  duplicates_merge_btn: string;
  duplicates_dismiss_btn: string;
  duplicates_no_found: string;
  duplicates_match_confidence: string;
  duplicates_potential_matches: string;

  // My Applications
  my_apps_title: string;
  my_apps_subtitle: string;
  my_apps_empty: string;
  my_apps_browse_btn: string;
  my_apps_submissions: string;
  my_apps_applied_on: string;
  my_apps_general_app: string;

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

  // Privacy & GDPR
  privacy_title: string;
  privacy_subtitle: string;
  btn_export_data: string;
  btn_request_erasure: string;
  privacy_portability_title: string;
  privacy_portability_desc: string;
  privacy_erasure_title: string;
  privacy_erasure_desc: string;
  privacy_erasure_warning: string;

  // Command Palette & Notifications & Support
  cmd_palette_placeholder: string;
  cmd_palette_no_results: string;
  cmd_palette_navigation: string;
  cmd_palette_actions: string;
  notifications_empty: string;
  notifications_mark_all_read: string;
  support_widget_title: string;
  support_widget_placeholder: string;
  support_widget_send: string;

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
    profile_candidate_details: 'Candidate Contact & Details',
    profile_extracted_skills: 'Extracted Skills & Competencies',
    profile_work_history: 'Professional Experience',
    profile_education: 'Education & Certifications',
    profile_quick_actions: 'Recruiter Actions',
    profile_ai_match_rationale: 'Explainable AI Match Breakdown',
    profile_recruitment_decisions: 'Recruitment Decisions History',

    jobs_title: 'Job Requisitions & Scoring Rubrics',
    jobs_subtitle: 'Define open roles, target departments, and assign weighted criteria to build explainable AI screening rubrics.',
    btn_create_job: '+ Create Requisition',
    active_requisitions_badge: 'OPEN REQUISITIONS',
    view_details: 'View Details',
    apply_role: 'Apply for Role',
    no_jobs_found: 'No active job requisitions found.',
    rubric_preview_title: 'Pre-Screen Rubric Preview',
    rubric_preview_subtitle: 'Deterministic criteria weights and scoring configuration for this position.',
    rubric_scoring_formula: 'Deterministic Scoring Formula',
    rubric_weight_distribution: 'Criteria Weight Distribution',
    create_job_modal_title: 'Create New Job Requisition',
    create_job_title_label: 'Job Title',
    create_job_dept_label: 'Department',
    create_job_desc_label: 'Role Description & Responsibilities',
    create_job_criteria_heading: 'Screening Rubric Criteria',
    create_job_add_criteria: '+ Add Evaluation Criterion',
    create_job_submit_btn: 'Publish Requisition & Rubric',
    create_job_weight_label: 'Weight',
    create_job_category_label: 'Category',

    decision_modal_title: 'Record Human Recruitment Decision',
    decision_modal_subtitle: 'Audit-logged governance transition for this candidate application.',
    decision_action_label: 'Decision Action',
    decision_reason_label: 'Reason Category',
    decision_rationale_label: 'Decision Justification / Rationale',
    decision_submit_btn: 'Confirm & Apply Decision',
    decision_action_shortlist: 'Shortlist Candidate',
    decision_action_advance: 'Advance to Interview',
    decision_action_hold: 'Place on Hold',
    decision_action_reject: 'Reject Application',
    decision_action_withdraw: 'Candidate Withdrawn',
    decision_action_review: 'Flag for Needs Review',
    decision_history_title: 'Recruiter Decision Ledger',

    scorecard_modal_title: 'Submit Interview Scorecard',
    scorecard_tech_rating: 'Technical Competence (1-5)',
    scorecard_comm_rating: 'Communication & Teamwork (1-5)',
    scorecard_problem_rating: 'Problem Solving & Critical Thinking (1-5)',
    scorecard_recommendation: 'Hiring Recommendation',
    scorecard_notes: 'Interviewer Notes & Synthesis',
    scorecard_submit_btn: 'Submit Interview Scorecard',
    scorecards_submitted_heading: 'Completed Interview Evaluations',
    scorecard_rec_strong_hire: 'Strong Hire',
    scorecard_rec_hire: 'Hire',
    scorecard_rec_lean_hire: 'Lean Hire',
    scorecard_rec_no_hire: 'Do Not Hire',

    compare_title: 'Side-by-Side Candidate Benchmark',
    compare_subtitle: 'Compare top candidate scores, technical criteria breakdowns, and rubric evidence in a unified matrix.',
    compare_badge: 'EVALUATION MATRIX',
    compare_full_eval: 'Full Evaluation',
    compare_criteria_breakdown: 'Criteria Breakdown',

    duplicates_title: 'Candidate Deduplication & Merge',
    duplicates_subtitle: 'Detect identical applicant submissions across email addresses and candidate names.',
    duplicates_merge_btn: 'Merge Records',
    duplicates_dismiss_btn: 'Dismiss Match',
    duplicates_no_found: 'No duplicate candidate profiles detected.',
    duplicates_match_confidence: 'Match Confidence',
    duplicates_potential_matches: 'POTENTIAL DUPLICATES DETECTED',

    my_apps_title: 'Candidate Application Portal',
    my_apps_subtitle: 'Track real-time candidate screening status, stages, and next steps for your submitted applications.',
    my_apps_empty: 'You have not submitted any job applications yet.',
    my_apps_browse_btn: 'Browse Open Positions',
    my_apps_submissions: 'SUBMISSIONS',
    my_apps_applied_on: 'Applied on',
    my_apps_general_app: 'General Application',

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
    privacy_portability_title: 'Data Portability (Art. 20)',
    privacy_portability_desc: 'Download a complete JSON archive of your personal profile, submitted resumes, screening runs, assessments, and evaluation metrics.',
    privacy_erasure_title: 'Right to be Forgotten (Art. 17)',
    privacy_erasure_desc: 'Permanently erase your candidate profile, uploaded documents, OCR text indices, and submitted scorecards across all databases.',
    privacy_erasure_warning: 'Are you sure? This action is permanent and irreversible.',

    cmd_palette_placeholder: 'Search commands, candidates, jobs, audit logs...',
    cmd_palette_no_results: 'No matching results found.',
    cmd_palette_navigation: 'Navigation',
    cmd_palette_actions: 'Quick Actions',
    notifications_empty: 'No new notifications.',
    notifications_mark_all_read: 'Mark all as read',
    support_widget_title: 'RecruitAI Support Assistant',
    support_widget_placeholder: 'Ask any question about using the platform...',
    support_widget_send: 'Send',

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
    profile_candidate_details: 'Coordonnées & Informations Candidat',
    profile_extracted_skills: 'Compétences Extraites',
    profile_work_history: 'Expérience Professionnelle',
    profile_education: 'Formation & Certifications',
    profile_quick_actions: 'Actions Recruteur',
    profile_ai_match_rationale: 'Détail de la Correspondance IA',
    profile_recruitment_decisions: 'Historique des Décisions de Recrutement',

    jobs_title: 'Offres d’Emploi & Grilles de Compétences',
    jobs_subtitle: 'Définissez les postes ouverts, les départements cibles et assignez des critères pondérés pour l’évaluation automatique.',
    btn_create_job: '+ Créer un Poste',
    active_requisitions_badge: 'POSTES OUVERTS',
    view_details: 'Voir les Détails',
    apply_role: 'Postuler',
    no_jobs_found: 'Aucune offre active pour le moment.',
    rubric_preview_title: 'Aperçu de la Grille d’Évaluation',
    rubric_preview_subtitle: 'Pondération déterministe des critères et configuration du score pour ce poste.',
    rubric_scoring_formula: 'Formule Déterministe de Notation',
    rubric_weight_distribution: 'Répartition des Poids des Critères',
    create_job_modal_title: 'Créer une Nouvelle Offre d’Emploi',
    create_job_title_label: 'Intitulé du Poste',
    create_job_dept_label: 'Département',
    create_job_desc_label: 'Description du Poste & Responsabilités',
    create_job_criteria_heading: 'Critères de la Grille d’Évaluation',
    create_job_add_criteria: '+ Ajouter un Critère d’Évaluation',
    create_job_submit_btn: 'Publier l’Offre & la Grille',
    create_job_weight_label: 'Poids',
    create_job_category_label: 'Catégorie',

    decision_modal_title: 'Enregistrer une Décision de Recrutement',
    decision_modal_subtitle: 'Transition de statut tracée dans le journal d’audit pour cette candidature.',
    decision_action_label: 'Action Décisionnelle',
    decision_reason_label: 'Motif Principal',
    decision_rationale_label: 'Justification de la Décision',
    decision_submit_btn: 'Confirmer & Appliquer la Décision',
    decision_action_shortlist: 'Présélectionner le Candidat',
    decision_action_advance: 'Faire Passer en Entretien',
    decision_action_hold: 'Mettre en Attente',
    decision_action_reject: 'Rejeter la Candidature',
    decision_action_withdraw: 'Candidature Retirée',
    decision_action_review: 'Marquer pour Révision',
    decision_history_title: 'Registre des Décisions Humaines',

    scorecard_modal_title: 'Soumettre la Fiche d’Entretien',
    scorecard_tech_rating: 'Compétence Technique (1-5)',
    scorecard_comm_rating: 'Communication & Travail d’Équipe (1-5)',
    scorecard_problem_rating: 'Résolution de Problèmes (1-5)',
    scorecard_recommendation: 'Recommandation d’Embauche',
    scorecard_notes: 'Notes et Synthèse de l’Évaluateur',
    scorecard_submit_btn: 'Soumettre la Fiche d’Évaluation',
    scorecards_submitted_heading: 'Évaluations d’Entretien Complétées',
    scorecard_rec_strong_hire: 'Très Favorable',
    scorecard_rec_hire: 'Favorable',
    scorecard_rec_lean_hire: 'Réservé',
    scorecard_rec_no_hire: 'Défavorable',

    compare_title: 'Comparatif Direct des Candidats',
    compare_subtitle: 'Comparez les scores, la répartition des compétences et les preuves des candidats dans une matrice unifiée.',
    compare_badge: 'MATRICE D’ÉVALUATION',
    compare_full_eval: 'Évaluation Complète',
    compare_criteria_breakdown: 'Détail des Critères',

    duplicates_title: 'Dédoublonnage & Fusion des Candidats',
    duplicates_subtitle: 'Détectez les candidatures multiples issues de la même personne par e-mail ou nom.',
    duplicates_merge_btn: 'Fusionner les Dossiers',
    duplicates_dismiss_btn: 'Ignorer la Correspondance',
    duplicates_no_found: 'Aucun profil en double détecté.',
    duplicates_match_confidence: 'Indice de Correspondance',
    duplicates_potential_matches: 'DOUBLONS POTENTIELS DÉTECTÉS',

    my_apps_title: 'Portail des Candidatures',
    my_apps_subtitle: 'Suivez en temps réel le statut, les étapes et les prochaines actions pour vos candidatures.',
    my_apps_empty: 'Vous n’avez soumis aucune candidature pour le moment.',
    my_apps_browse_btn: 'Consulter les Postes Ouverts',
    my_apps_submissions: 'SOUMISSIONS',
    my_apps_applied_on: 'Postulé le',
    my_apps_general_app: 'Candidature Générale',

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
    privacy_portability_title: 'Portabilité des Données (Art. 20)',
    privacy_portability_desc: 'Téléchargez une archive JSON complète contenant vos informations, CV, évaluations IA et scores.',
    privacy_erasure_title: 'Droit à l’Oubli (Art. 17)',
    privacy_erasure_desc: 'Supprimez définitivement votre profil, documents stockés, index OCR et fiches d’évaluation de la plateforme.',
    privacy_erasure_warning: 'Êtes-vous sûr ? Cette action est irréversible et définitive.',

    cmd_palette_placeholder: 'Rechercher actions, candidats, offres, audits...',
    cmd_palette_no_results: 'Aucun résultat trouvé.',
    cmd_palette_navigation: 'Navigation',
    cmd_palette_actions: 'Actions Rapides',
    notifications_empty: 'Aucune nouvelle notification.',
    notifications_mark_all_read: 'Tout marquer comme lu',
    support_widget_title: 'Assistant Support RecruitAI',
    support_widget_placeholder: 'Posez votre question sur la plateforme...',
    support_widget_send: 'Envoyer',

    cancel: 'Annuler',
    save: 'Enregistrer',
    confirm: 'Confirmer',
    loading: 'Chargement des données système...',
    success: 'Opération réussie',
    error: 'Une erreur est survenue'
  },
  es: {
    nav_dashboard: 'Panel de Control',
    nav_candidates: 'Candidatos',
    nav_compare: 'Comparar Candidatos',
    nav_duplicates: 'Deduplicación',
    nav_jobs: 'Ofertas de Empleo',
    nav_audit: 'Registro de Auditoría',
    nav_privacy: 'Privacidad RGPD',
    nav_team: 'Equipo y Roles',
    nav_my_applications: 'Mis Solicitudes',
    nav_quick_apply: 'Ver Ofertas Abiertas',

    search_placeholder: 'Buscar candidatos, puestos, auditorías...',
    notifications: 'Notificaciones',
    copilot_title: 'Copiloto RecruitAI',
    copilot_subtitle: 'Asistente de Selección IA',
    theme_toggle: 'Cambiar tema',
    sign_out: 'Cerrar Sesión',
    active_session: 'Sesión Autenticada Activa',
    spotlight_search: 'Búsqueda Rápida',

    copilot_welcome: '👋 **¡Bienvenido a RecruitAI Copilot!**\n\nSoy tu asistente multilingüe de selección de talento. Pregúntame sobre el cribado de CVs, creación de rúbricas, permisos o cumplimiento RGPD.',
    copilot_input_placeholder: 'Pregunta sobre candidatos, rúbricas, roles...',
    copilot_ask_btn: 'Consultar',
    copilot_clear_btn: 'Borrar',
    qp_match_score: '🎯 Algoritmo de Puntuación',
    qp_roles: '🛡️ Roles y Permisos',
    qp_blind_screening: '🔒 Selección a Ciegas',
    qp_create_rubric: '💼 Crear Rúbrica',
    qp_questions: '🤖 Preguntas de Entrevista',

    total_candidates: 'Total de Candidatos',
    avg_match_rate: 'Tasa Media de Ajuste',
    open_requisitions: 'Puestos Vacantes',
    active_audits: 'Eventos Auditados',
    pipeline_distribution: 'Distribución del Pipeline ATS',
    recent_activity: 'Actividad Reciente de Auditoría',
    dashboard_subtitle: 'Telemetría en tiempo real sobre recepción de CVs, ajuste por rúbricas y procesos de selección.',
    stage_ingested: 'Recibido',
    stage_screening: 'En Evaluación',
    stage_shortlisted: 'Preseleccionado',
    stage_interviewing: 'En Entrevistas',
    stage_offered: 'Oferta Emitida',
    realtime_sync: 'Sincronizar',

    pipeline_title: 'Pipeline de Evaluación de Candidatos',
    pipeline_subtitle: 'Seguimiento por fases con rúbricas deterministas y evidencias comprobables en el CV.',
    view_kanban: 'Vista Kanban',
    view_table: 'Tabla Detallada',
    search_candidate_placeholder: 'Buscar por nombre o habilidad...',
    all_departments: 'Todos los Departamentos',
    match_score: 'Ajuste',
    no_candidates_stage: 'No hay candidatos en esta fase',
    candidate_name_col: 'Nombre del Candidato',
    position_applied_col: 'Puesto Solicitado',
    department_col: 'Departamento',
    stage_col: 'Fase del Pipeline',
    score_col: 'Puntuación de Ajuste',
    actions_col: 'Acciones',

    eval_title: 'Evaluación del Candidato',
    ocr_stream: 'Flujo de Texto OCR',
    parsed_resume_doc: 'CV Estructurado',
    explainable_score: 'Puntuación Explicable',
    deterministic_match: 'Ajuste determinista por rúbrica',
    overridden_badge: 'Ajustado Manualmente',
    scored_criteria: 'Criterios Evaluados de la Rúbrica',
    locate_evidence: 'Localizar en el CV',
    btn_ai_questions: 'Preguntas IA',
    btn_scorecard: 'Ficha de Entrevista',
    btn_schedule: 'Programar',
    btn_recalibrate: 'Ajustar Puntuación',
    btn_extend_offer: 'Emitir Oferta',
    btn_blind_mode: '🔒 Ocultar Identidad',
    btn_reveal_pii: '👁 Mostrar Identidad',
    profile_candidate_details: 'Datos de Contacto del Candidato',
    profile_extracted_skills: 'Habilidades y Competencias',
    profile_work_history: 'Experiencia Laboral',
    profile_education: 'Educación y Certificaciones',
    profile_quick_actions: 'Acciones de Selección',
    profile_ai_match_rationale: 'Desglose del Ajuste por IA',
    profile_recruitment_decisions: 'Historial de Decisiones de Selección',

    jobs_title: 'Puestos de Trabajo y Rúbricas de Evaluación',
    jobs_subtitle: 'Crea puestos, departamentos y asigna criterios ponderados para evaluación explicable con IA.',
    btn_create_job: '+ Crear Puesto',
    active_requisitions_badge: 'PUESTOS ABIERTOS',
    view_details: 'Ver Detalles',
    apply_role: 'Postularme',
    no_jobs_found: 'No se encontraron puestos activos.',
    rubric_preview_title: 'Vista Previa de la Rúbrica',
    rubric_preview_subtitle: 'Ponderación determinista y configuración de puntuación para esta vacante.',
    rubric_scoring_formula: 'Fórmula de Puntuación Determinista',
    rubric_weight_distribution: 'Distribución de Pesos de los Criterios',
    create_job_modal_title: 'Crear Nueva Oferta de Empleo',
    create_job_title_label: 'Título del Puesto',
    create_job_dept_label: 'Departamento',
    create_job_desc_label: 'Descripción del Puesto y Responsabilidades',
    create_job_criteria_heading: 'Criterios de la Rúbrica',
    create_job_add_criteria: '+ Añadir Criterio de Evaluación',
    create_job_submit_btn: 'Publicar Oferta y Rúbrica',
    create_job_weight_label: 'Peso',
    create_job_category_label: 'Categoría',

    decision_modal_title: 'Registrar Decisión de Selección',
    decision_modal_subtitle: 'Cambio de estado auditado para esta solicitud.',
    decision_action_label: 'Acción de Decisión',
    decision_reason_label: 'Categoría del Motivo',
    decision_rationale_label: 'Justificación de la Decisión',
    decision_submit_btn: 'Confirmar y Aplicar Decisión',
    decision_action_shortlist: 'Preseleccionar Candidato',
    decision_action_advance: 'Avanzar a Entrevista',
    decision_action_hold: 'Poner en Espera',
    decision_action_reject: 'Rechazar Solicitud',
    decision_action_withdraw: 'Candidatura Retirada',
    decision_action_review: 'Marcar para Revisión',
    decision_history_title: 'Registro de Decisiones Humanas',

    scorecard_modal_title: 'Enviar Evaluación de Entrevista',
    scorecard_tech_rating: 'Competencia Técnica (1-5)',
    scorecard_comm_rating: 'Comunicación y Trabajo en Equipo (1-5)',
    scorecard_problem_rating: 'Resolución de Problemas (1-5)',
    scorecard_recommendation: 'Recomendación de Contratación',
    scorecard_notes: 'Notas y Síntesis del Evaluador',
    scorecard_submit_btn: 'Guardar Evaluación',
    scorecards_submitted_heading: 'Evaluaciones de Entrevista Realizadas',
    scorecard_rec_strong_hire: 'Muy Recomendado',
    scorecard_rec_hire: 'Recomendado',
    scorecard_rec_lean_hire: 'Con Reservas',
    scorecard_rec_no_hire: 'No Recomendado',

    compare_title: 'Comparativa de Candidatos',
    compare_subtitle: 'Compara puntuaciones, desglose de competencias y evidencias en una matriz unificada.',
    compare_badge: 'MATRIZ DE EVALUACIÓN',
    compare_full_eval: 'Evaluación Completa',
    compare_criteria_breakdown: 'Desglose de Criterios',

    duplicates_title: 'Deduplicación de Candidatos',
    duplicates_subtitle: 'Detecta solicitudes duplicadas del mismo candidato por correo o nombre.',
    duplicates_merge_btn: 'Fusionar Registros',
    duplicates_dismiss_btn: 'Descartar Coincidencia',
    duplicates_no_found: 'No se detectaron perfiles duplicados.',
    duplicates_match_confidence: 'Nivel de Coincidencia',
    duplicates_potential_matches: 'DUPLICADOS DETECTADOS',

    my_apps_title: 'Portal de Solicitudes del Candidato',
    my_apps_subtitle: 'Sigue en tiempo real el estado y los siguientes pasos de tus postulaciones.',
    my_apps_empty: 'Aún no has enviado ninguna solicitud de empleo.',
    my_apps_browse_btn: 'Explorar Vacantes Abiertas',
    my_apps_submissions: 'SOLICITUDES',
    my_apps_applied_on: 'Postulado el',
    my_apps_general_app: 'Solicitud General',

    team_title: 'Gestión de Usuarios y Accesos',
    team_subtitle: 'Directorio estructurado que separa el personal interno de los candidatos externos.',
    tab_internal_staff: 'Personal Interno',
    tab_external_candidates: 'Candidatos Registrados',
    btn_invite_member: 'Invitar Colaborador',
    btn_edit_role: 'Editar Rol',
    promote_btn: 'Promover',

    audit_title: 'Registro de Auditoría y Seguridad Inmutable',
    audit_subtitle: 'Línea de tiempo inmutable verificada con SHA-256 de todas las evaluaciones IA y accesos.',
    sha256_verified: 'Verificado con SHA-256',
    timestamp_col: 'Fecha y Hora',
    action_col: 'Acción',
    actor_col: 'Usuario',
    affected_col: 'Registro Afectado',
    integrity_col: 'Estado de Integridad',

    privacy_title: 'Privacidad de Datos y Derechos RGPD',
    privacy_subtitle: 'Controles de exportación de datos y derecho al olvido (eliminación de cuenta).',
    btn_export_data: 'Exportar mis Datos (JSON)',
    btn_request_erasure: 'Ejercer Derecho al Olvido (Eliminar Cuenta)',
    privacy_portability_title: 'Portabilidad de Datos (Art. 20)',
    privacy_portability_desc: 'Descarga un archivo JSON con tu perfil, CVs enviados, evaluaciones IA y puntuaciones.',
    privacy_erasure_title: 'Derecho al Olvido (Art. 17)',
    privacy_erasure_desc: 'Elimina permanentemente tu cuenta, CVs, datos procesados y evaluaciones de la base de datos.',
    privacy_erasure_warning: '¿Estás seguro? Esta acción es permanente e irreversible.',

    cmd_palette_placeholder: 'Buscar comandos, candidatos, empleos, auditorías...',
    cmd_palette_no_results: 'No se encontraron resultados.',
    cmd_palette_navigation: 'Navegación',
    cmd_palette_actions: 'Acciones Rápidas',
    notifications_empty: 'No hay notificaciones nuevas.',
    notifications_mark_all_read: 'Marcar todo como leído',
    support_widget_title: 'Asistente de Soporte RecruitAI',
    support_widget_placeholder: 'Haz cualquier pregunta sobre la plataforma...',
    support_widget_send: 'Enviar',

    cancel: 'Cancelar',
    save: 'Guardar Cambios',
    confirm: 'Confirmar',
    loading: 'Cargando datos del sistema...',
    success: 'Operación realizada con éxito',
    error: 'Ocurrió un error'
  },
  de: {
    nav_dashboard: 'Dashboard',
    nav_candidates: 'Bewerber',
    nav_compare: 'Bewerber vergleichen',
    nav_duplicates: 'Duplikaterkennung',
    nav_jobs: 'Stellenangebote',
    nav_audit: 'Audit-Protokoll',
    nav_privacy: 'DSGVO-Datenschutz',
    nav_team: 'Team & Rollen',
    nav_my_applications: 'Meine Bewerbungen',
    nav_quick_apply: 'Offene Stellen ansehen',

    search_placeholder: 'Bewerber, Stellen, Audits durchsuchen...',
    notifications: 'Benachrichtigungen',
    copilot_title: 'RecruitAI Copilot',
    copilot_subtitle: 'KI-Recruiting-Assistent',
    theme_toggle: 'Design umschalten',
    sign_out: 'Abmelden',
    active_session: 'Aktive Authentifizierte Sitzung',
    spotlight_search: 'Schnellsuche',

    copilot_welcome: '👋 **Willkommen bei RecruitAI Copilot!**\n\nIch bin Ihr mehrsprachiger KI-Assistent für Talentprüfung. Fragen Sie mich nach Lebenslauf-Screening, Bewertungsrubriken, Rollenberechtigungen oder DSGVO-Konformität.',
    copilot_input_placeholder: 'Frage zu Bewerbern, Rubriken, Rollen stellen...',
    copilot_ask_btn: 'Fragen',
    copilot_clear_btn: 'Löschen',
    qp_match_score: '🎯 Bewertungsalgorithmus',
    qp_roles: '🛡️ Rollenberechtigungen',
    qp_blind_screening: '🔒 Anonyme Vorauswahl',
    qp_create_rubric: '💼 Rubrik erstellen',
    qp_questions: '🤖 Interviewfragen',

    total_candidates: 'Bewerber Gesamt',
    avg_match_rate: 'Durchschnittliche Eignung',
    open_requisitions: 'Offene Stellen',
    active_audits: 'Auditierte Ereignisse',
    pipeline_distribution: 'ATS-Pipeline-Verteilung',
    recent_activity: 'Letzte Audit-Aktivitäten',
    dashboard_subtitle: 'Echtzeit-Telemetrie über Bewerbungseingänge, Rubriken-Abgleich und Auswahlprozesse.',
    stage_ingested: 'Eingegangen',
    stage_screening: 'In Prüfung',
    stage_shortlisted: 'In der Vorauswahl',
    stage_interviewing: 'Im Interview',
    stage_offered: 'Angebot Unterbreitet',
    realtime_sync: 'Synchronisieren',

    pipeline_title: 'Bewerber-Bewertungs-Pipeline',
    pipeline_subtitle: 'Mehrstufiges Bewerbermanagement mit deterministischen Rubriken und belegbaren Nachweisen.',
    view_kanban: 'Kanban-Board',
    view_table: 'Detailtabelle',
    search_candidate_placeholder: 'Nach Name oder Qualifikation suchen...',
    all_departments: 'Alle Abteilungen',
    match_score: 'Eignung',
    no_candidates_stage: 'Keine Bewerber in dieser Phase',
    candidate_name_col: 'Bewerbername',
    position_applied_col: 'Beworbene Stelle',
    department_col: 'Abteilung',
    stage_col: 'Pipeline-Phase',
    score_col: 'Eignungsscore',
    actions_col: 'Aktionen',

    eval_title: 'Bewerberbewertung',
    ocr_stream: 'OCR-Textstrom',
    parsed_resume_doc: 'Analysierter Lebenslauf',
    explainable_score: 'Erklärbarer Eignungsscore',
    deterministic_match: 'Deterministischer Rubrik-Abgleich',
    overridden_badge: 'Manuell angepasst',
    scored_criteria: 'Bewertete Kriterien',
    locate_evidence: 'Im Lebenslauf anzeigen',
    btn_ai_questions: 'KI-Fragen',
    btn_scorecard: 'Bewertungsbogen',
    btn_schedule: 'Planen',
    btn_recalibrate: 'Score anpassen',
    btn_extend_offer: 'Angebot machen',
    btn_blind_mode: '🔒 Identität verbergen',
    btn_reveal_pii: '👁 Identität anzeigen',
    profile_candidate_details: 'Kontaktdaten des Bewerbers',
    profile_extracted_skills: 'Extrahierte Fähigkeiten',
    profile_work_history: 'Berufserfahrung',
    profile_education: 'Ausbildung & Zertifikate',
    profile_quick_actions: 'Recruiter-Aktionen',
    profile_ai_match_rationale: 'KI-Bewertungsdetails',
    profile_recruitment_decisions: 'Entscheidungsprotokoll',

    jobs_title: 'Stellenangebote & Bewertungsrubriken',
    jobs_subtitle: 'Definieren Sie offene Stellen und gewichtete Kriterien für die transparente KI-Vorauswahl.',
    btn_create_job: '+ Stelle erstellen',
    active_requisitions_badge: 'OFFENE STELLEN',
    view_details: 'Details anzeigen',
    apply_role: 'Bewerben',
    no_jobs_found: 'Keine aktiven Stellenangebote gefunden.',
    rubric_preview_title: 'Rubrik-Vorschau',
    rubric_preview_subtitle: 'Deterministische Kriteriengewichtung und Punktekonfiguration für diese Stelle.',
    rubric_scoring_formula: 'Deterministische Bewertungsformel',
    rubric_weight_distribution: 'Gewichtsverteilung der Kriterien',
    create_job_modal_title: 'Neues Stellenangebot erstellen',
    create_job_title_label: 'Stellenbezeichnung',
    create_job_dept_label: 'Abteilung',
    create_job_desc_label: 'Stellenbeschreibung & Aufgaben',
    create_job_criteria_heading: 'Kriterien der Bewertungsrubrik',
    create_job_add_criteria: '+ Bewertungskriterium hinzufügen',
    create_job_submit_btn: 'Stelle & Rubrik veröffentlichen',
    create_job_weight_label: 'Gewichtung',
    create_job_category_label: 'Kategorie',

    decision_modal_title: 'Einstellungsentscheidung festhalten',
    decision_modal_subtitle: 'Audit-protokollierte Statusänderung für diese Bewerbung.',
    decision_action_label: 'Entscheidungsaktion',
    decision_reason_label: 'Hauptgrund',
    decision_rationale_label: 'Begründung der Entscheidung',
    decision_submit_btn: 'Entscheidung anwenden',
    decision_action_shortlist: 'Bewerber in die engere Auswahl',
    decision_action_advance: 'Zum Interview einladen',
    decision_action_hold: 'Auf Eis legen',
    decision_action_reject: 'Bewerbung ablehnen',
    decision_action_withdraw: 'Bewerbung zurückgezogen',
    decision_action_review: 'Zur Überprüfung markieren',
    decision_history_title: 'Entscheidungsübersicht',

    scorecard_modal_title: 'Interview-Bewertungsbogen einreichen',
    scorecard_tech_rating: 'Fachliche Kompetenz (1-5)',
    scorecard_comm_rating: 'Kommunikation & Teamfähigkeit (1-5)',
    scorecard_problem_rating: 'Problemlösung & Analytik (1-5)',
    scorecard_recommendation: 'Einstellungsempfehlung',
    scorecard_notes: 'Notizen & Synthese des Interviewers',
    scorecard_submit_btn: 'Bewertung speichern',
    scorecards_submitted_heading: 'Eingereichte Interview-Bewertungen',
    scorecard_rec_strong_hire: 'Klare Einstellungsempfehlung',
    scorecard_rec_hire: 'Einstellen',
    scorecard_rec_lean_hire: 'Eher einstellen',
    scorecard_rec_no_hire: 'Nicht einstellen',

    compare_title: 'Direkter Bewerbervergleich',
    compare_subtitle: 'Vergleichen Sie Scores, Qualifikationen und Belege in einer einheitlichen Matrix.',
    compare_badge: 'BEWERTUNGSMATRIX',
    compare_full_eval: 'Vollständige Auswertung',
    compare_criteria_breakdown: 'Kriterienübersicht',

    duplicates_title: 'Duplikatprüfung & Zusammenführung',
    duplicates_subtitle: 'Erkennen Sie doppelte Bewerbungen derselben Person anhand von E-Mail oder Name.',
    duplicates_merge_btn: 'Datensätze zusammenführen',
    duplicates_dismiss_btn: 'Übereinstimmung verwerfen',
    duplicates_no_found: 'Keine doppelten Profile erkannt.',
    duplicates_match_confidence: 'Übereinstimmungsgrad',
    duplicates_potential_matches: 'POTENZIELLE DUPLIKATE ERKANNT',

    my_apps_title: 'Bewerberportal',
    my_apps_subtitle: 'Verfolgen Sie in Echtzeit den Status und die nächsten Schritte Ihrer Bewerbungen.',
    my_apps_empty: 'Sie haben noch keine Bewerbungen eingereicht.',
    my_apps_browse_btn: 'Offene Stellen ansehen',
    my_apps_submissions: 'BEWERBUNGEN',
    my_apps_applied_on: 'Beworben am',
    my_apps_general_app: 'Initiativbewerbung',

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
    privacy_portability_title: 'Datenübertragbarkeit (Art. 20)',
    privacy_portability_desc: 'Laden Sie ein JSON-Archiv mit Profildaten, Lebensläufen, KI-Bewertungen und Scores herunter.',
    privacy_erasure_title: 'Recht auf Vergessenwerden (Art. 17)',
    privacy_erasure_desc: 'Löschen Sie Ihr Profil, Dokumente, OCR-Indizes und Bewertungsbögen dauerhaft aus dem System.',
    privacy_erasure_warning: 'Sind Sie sicher? Diese Aktion ist unwiderruflich.',

    cmd_palette_placeholder: 'Befehle, Bewerber, Stellen, Audits suchen...',
    cmd_palette_no_results: 'Keine Treffer gefunden.',
    cmd_palette_navigation: 'Navigation',
    cmd_palette_actions: 'Schnellaktionen',
    notifications_empty: 'Keine neuen Benachrichtigungen.',
    notifications_mark_all_read: 'Alle als gelesen markieren',
    support_widget_title: 'RecruitAI Support-Assistent',
    support_widget_placeholder: 'Stellen Sie Ihre Frage zur Plattform...',
    support_widget_send: 'Senden',

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
    profile_candidate_details: 'Umwirondoro w’Umukandida',
    profile_extracted_skills: 'Ubumenyi n’Ubushobozi Bwagaragaye',
    profile_work_history: 'Uburambe mu Kazi',
    profile_education: 'Amashuri n’Impamyabumenyi',
    profile_quick_actions: 'Ibikorwa by’Ushinzwe Abakozi',
    profile_ai_match_rationale: 'Ibisobanuro by’Amanota ya AI',
    profile_recruitment_decisions: 'Amateka y’Ibyemezo Byafashwe',

    jobs_title: 'Imyanya y’Akazi n’Ibipimo Ngenderwaho',
    jobs_subtitle: 'Gushyiraho imyanya mishya no gutegura ibipimo bifite uburemere byifashishwa mu isuzuma rya AI.',
    btn_create_job: '+ Fungura Umwanya Mushya',
    active_requisitions_badge: 'IMYANYA IFUNGUYE',
    view_details: 'Reba Byose',
    apply_role: 'Saba uyu Mwanya',
    no_jobs_found: 'Nta myanya y’akazi ifunguye muri aka kanya.',
    rubric_preview_title: 'Isubiramo ry’Ibipimo Ngenderwaho',
    rubric_preview_subtitle: 'Uburemere bw’ibipimo n’uburyo amanota abarwa kuri uyu mwanya.',
    rubric_scoring_formula: 'Uburyo Amanota Abarwa',
    rubric_weight_distribution: 'Ikwirakwizwa ry’Uburemere bw’Ibipimo',
    create_job_modal_title: 'Fungura Umwanya Mushya w’Akazi',
    create_job_title_label: 'Izina ry’Umwanya',
    create_job_dept_label: 'Ishami',
    create_job_desc_label: 'Ibisobanuro by’Umwanya n’Inshingano',
    create_job_criteria_heading: 'Ibipimo Ngenderwaho by’Isuzuma',
    create_job_add_criteria: '+ Ongeraho Ikipimo cy’Isuzuma',
    create_job_submit_btn: 'Tangaza Umwanya n’Ibipimo',
    create_job_weight_label: 'Uburemere',
    create_job_category_label: 'Icyiciro',

    decision_modal_title: 'Fata Icyemezo ku Mukandida',
    decision_modal_subtitle: 'Guhindura icyiciro cy’umukandida byandikwa mu gitabo cy’igenzura.',
    decision_action_label: 'Icyemezo Gifashwe',
    decision_reason_label: 'Impamvu y’Icyemezo',
    decision_rationale_label: 'Ibisobanuro Byimbitse by’Icyemezo',
    decision_submit_btn: 'Emeza Icyemezo',
    decision_action_shortlist: 'Toranya Umukandida',
    decision_action_advance: 'Muhe Ikizamini',
    decision_action_hold: 'Mubike ku Ruhande',
    decision_action_reject: 'Muheteze Ubusabe',
    decision_action_withdraw: 'Yikuye mu Busabe',
    decision_action_review: 'Kugenzura Byimbitse',
    decision_history_title: 'Ibyemezo Byose Byafashwe',

    scorecard_modal_title: 'Tanga Amanota y’Ikizamini',
    scorecard_tech_rating: 'Ubumenyi mu Bya Tekiniki (1-5)',
    scorecard_comm_rating: 'Itumanaho n’Imikoranire (1-5)',
    scorecard_problem_rating: 'Gukemura Ibibazo (1-5)',
    scorecard_recommendation: 'Icyo Umusabiye',
    scorecard_notes: 'Ibyo Umunyamakuru Yabonye',
    scorecard_submit_btn: 'Bika Ikarita y’Amanota',
    scorecards_submitted_heading: 'Amanota y’Ibizamini Yatanzwe',
    scorecard_rec_strong_hire: 'Arakwiriye Cyane',
    scorecard_rec_hire: 'Namuhe Akazi',
    scorecard_rec_lean_hire: 'Bishoboka ko Aherwa Akazi',
    scorecard_rec_no_hire: 'Ntahebe Akazi',

    compare_title: 'Kugereranya Abakandida Imbonankubone',
    compare_subtitle: 'Gereranya amanota, ubumenyi n’ibimenyetso by’abakandida mu mbonerahamwe imwe.',
    compare_badge: 'IMBONERAHAMWE Y’ISUZUMA',
    compare_full_eval: 'Isuzuma Ryose',
    compare_criteria_breakdown: 'Ibipimo Byasuzumwe',

    duplicates_title: 'Gusuzuma Abakandida Bisubiyemo',
    duplicates_subtitle: 'Gushaka abakandida basabye akazi inshuro zirenze imwe hakoreshejwe imeyili cyangwa izina.',
    duplicates_merge_btn: 'Komatanya Dosiye',
    duplicates_dismiss_btn: 'Kureka Ibi',
    duplicates_no_found: 'Nta dosiye zisubiyemo zabonetse.',
    duplicates_match_confidence: 'Ikizere cy’Isano',
    duplicates_potential_matches: 'ABASUBIYEMO BABONETSE',

    my_apps_title: 'Urubuga rw’Usaba Akazi',
    my_apps_subtitle: 'Kurikirana aho ubusabe bwawe bugeze n’ibigiye gukurikiraho mu buryo bw’ako kanya.',
    my_apps_empty: 'Nta busabe bw’akazi urashyiraho kugeza ubu.',
    my_apps_browse_btn: 'Reba Imyanya Ifunguye',
    my_apps_submissions: 'UBUSABE BWATANZWE',
    my_apps_applied_on: 'Yatanzwe ku wa',
    my_apps_general_app: 'Ubusabe Rusange',

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
    privacy_portability_title: 'Gukuramo Amakuru Yanjye (Art. 20)',
    privacy_portability_desc: 'Kura hano amakuru yose yawe muri dosiye ya JSON, harimo CV, amanota n’ibizamini.',
    privacy_erasure_title: 'Gusiba Amakuru Burundu (Art. 17)',
    privacy_erasure_desc: 'Siba konti yawe, impapuro zose z’uburambe n’amanota byose bive muri sisitemu burundu.',
    privacy_erasure_warning: 'Uremeza neza? Iki gikorwa ntigishobora gusubizwa inyuma.',

    cmd_palette_placeholder: 'Shakisha amategeko, abakandida, imyanya...',
    cmd_palette_no_results: 'Nta bisubizo bibonetse.',
    cmd_palette_navigation: 'Kuyobora',
    cmd_palette_actions: 'Ibikorwa Byihuse',
    notifications_empty: 'Nta matangazo mashya ufite.',
    notifications_mark_all_read: 'Soma byose',
    support_widget_title: 'Umufasha wa RecruitAI',
    support_widget_placeholder: 'Baza ikibazo icyo ari cyo cyose kuri sisitemu...',
    support_widget_send: 'Ohereza',

    cancel: 'Kureka',
    save: 'Bika Impinduka',
    confirm: 'Emeza Igikorwa',
    loading: 'Gupakira amakuru ya sisitemu...',
    success: 'Igikorwa cyagenze neza',
    error: 'Habaye ikibazo'
  }
};