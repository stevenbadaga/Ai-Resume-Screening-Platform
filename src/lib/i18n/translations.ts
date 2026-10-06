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
  nav_analytics: string;
  nav_my_applications: string;
  nav_quick_apply: string;
  nav_profile: string;
  profile_title: string;
  profile_subtitle: string;
  profile_saved_cv: string;
  profile_no_cv: string;
  profile_upload_cv: string;
  profile_replace_cv: string;
  profile_remove_cv: string;
  profile_one_click_hint: string;
  profile_skills: string;
  profile_experience: string;
  profile_save: string;
  profile_saved: string;

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
  qp_apply_track: string;

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

  // Candidate profile detail (modals, fallbacks, toasts)
  cprofile_status_label: string;
  cprofile_no_resume_text: string;
  cprofile_summary_fallback: string;
  cprofile_active_badge: string;
  cprofile_interviewer_fallback: string;
  cprofile_scorecard_you: string;
  cprofile_tech_short: string;
  cprofile_comm_short: string;
  cprofile_problem_short: string;
  cprofile_questions_targeting: string;
  cprofile_questions_analyzing: string;
  cprofile_targeted_competency: string;
  cprofile_question_n: string;
  cprofile_copy_btn: string;
  cprofile_what_to_look_for: string;
  cprofile_notes_placeholder: string;
  cprofile_reason_qualifications_match: string;
  cprofile_reason_excellent_technical_fit: string;
  cprofile_reason_experience_gap: string;
  cprofile_reason_communication_fit: string;
  cprofile_reason_compensation_mismatch: string;
  cprofile_reason_talent_bench: string;
  cprofile_reason_candidate_withdrew: string;
  cprofile_reason_other: string;
  cprofile_justification_label: string;
  cprofile_justification_placeholder: string;
  cprofile_override_warning: string;
  cprofile_adjusted_score: string;
  cprofile_override_placeholder: string;
  cprofile_annual_compensation: string;
  cprofile_start_date: string;
  cprofile_uncertain_evidence: string;
  cprofile_candidate_code: string;
  cprofile_applicant_fallback: string;
  toast_score_recalibrated: string;
  toast_score_recalibrated_title: string;
  toast_score_recalibration_failed: string;
  toast_network_recalibration: string;
  toast_offer_sent: string;
  toast_offer_sent_title: string;
  toast_offer_failed: string;
  toast_network_offer: string;
  toast_scorecard_recorded: string;
  toast_scorecard_title: string;
  toast_scorecard_failed: string;
  toast_network_scorecard: string;
  toast_decision_rationale_required: string;
  toast_decision_recorded: string;
  toast_decision_title: string;
  toast_decision_failed: string;
  toast_network_decision: string;
  toast_question_copied: string;
  toast_evidence_located: string;
  toast_blind_enabled: string;
  toast_pii_revealed: string;

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
  dup_merge_failed: string;
  dup_merge_error_title: string;
  dup_merged_toast: string;
  dup_merged_title: string;
  dup_profiles_count: string;
  dup_merging: string;
  dup_applications_count: string;

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
  cmd_cat_navigation: string;
  cmd_cat_analytics: string;
  cmd_cat_requisitions: string;
  cmd_cat_compliance: string;
  cmd_cat_administration: string;
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

  // Apply form & requisition lifecycle
  first_name: string;
  last_name: string;
  email_addr: string;
  phone_number: string;
  upload_resume: string;
  gdpr_consent: string;
  submit_application: string;
  apply_job_missing_title: string;
  apply_job_missing_desc: string;
  apply_browse_open: string;
  apply_official_badge: string;
  apply_staff_title: string;
  apply_staff_desc: string;
  apply_redirecting: string;
  apply_cv_document: string;
  apply_use_saved_cv: string;
  apply_from_profile: string;
  apply_upload_different: string;
  apply_click_or_drop: string;
  apply_file_hint: string;
  apply_error_no_cv: string;
  apply_error_no_consent: string;

  // Erasure confirm & auth/session
  erasure_warning: string;
  sign_in: string;
  session_enforced: string;
  role_admin_desc: string;
  role_recruiter_desc: string;
  role_hiring_manager_desc: string;
  role_interviewer_desc: string;
  role_auditor_desc: string;
  role_candidate_desc: string;

  // Nav extras
  nav_settings: string;
  active_role: string;
  brand_tagline: string;

  // Dashboard extras
  workspace_overview: string;
  btn_review_applications: string;
  kpi_across_jobs: string;
  kpi_shortlisted_pool: string;
  kpi_active_rubrics: string;
  kpi_passed_threshold: string;
  kpi_sha_logs: string;
  stage_needs_review: string;
  stage_rejected: string;
  stage_new: string;
  stage_on_hold: string;
  stage_interview_scheduled: string;
  stage_hired: string;
  stage_withdrawn: string;
  processing_queued: string;
  processing_in_progress: string;
  processing_completed: string;
  processing_failed: string;
  audit_just_now: string;
  audit_verified: string;
  telemetry_quality_title: string;
  telemetry_quality_chip: string;
  telemetry_quality_hint: string;
  metric_low_confidence: string;
  metric_low_confidence_hint: string;
  metric_manual_corrections: string;
  metric_manual_corrections_hint: string;
  metric_score_overrides: string;
  metric_score_overrides_hint: string;
  metric_processing_failures: string;
  metric_processing_failures_hint: string;
  metric_upcoming_interviews: string;
  metric_upcoming_interviews_hint: string;
  metric_failed_emails: string;
  metric_failed_emails_hint: string;
  metric_failed_emails_latest: string;
  telemetry_email_banner: string;
  telemetry_email_banner_one: string;
  telemetry_email_review: string;

  // Candidates pipeline extras
  metric_visible_apps: string;
  metric_needs_review: string;
  metric_avg_match: string;
  metric_shortlisted: string;
  metric_rejected: string;
  filters: string;
  filter_job: string;
  filter_stage: string;
  filter_recruiter: string;
  filter_min_score: string;
  filter_max_score: string;
  filter_required_criteria: string;
  filter_processing: string;
  filter_tag: string;
  filter_applied_from: string;
  filter_applied_to: string;
  filter_all_jobs: string;
  filter_all_stages: string;
  filter_all_recruiters: string;
  filter_any_status: string;
  filter_missing_required: string;
  filter_uncertain_evidence: string;
  filter_any_tag: string;
  filter_clear_all: string;
  bulk_selected: string;
  bulk_shortlist: string;
  bulk_advance: string;
  bulk_hold: string;
  bulk_review: string;
  bulk_reject: string;
  bulk_withdraw: string;
  bulk_clear_selection: string;
  bulk_confirm_title: string;
  bulk_confirm_desc: string;
  bulk_confirm_aria: string;
  bulk_reason_label: string;
  bulk_reason_placeholder: string;
  bulk_error_required: string;
  bulk_error_failed: string;
  bulk_error_network: string;
  bulk_applying: string;
  bulk_confirm_action: string;
  pagination_showing: string;
  pagination_prev: string;
  pagination_next: string;
  aria_filter_department: string;
  aria_pipeline_view: string;
  aria_select_all: string;
  aria_pipeline_pagination: string;
  applicants_count: string;

  // Jobs extras
  status_closed: string;
  jobs_search_placeholder: string;
  aria_search_requisitions: string;
  aria_filter_status: string;
  filter_all_statuses: string;
  btn_apply_filters: string;
  btn_clear: string;
  edit_rubric: string;
  rubric_preview: string;
  criteria_more: string;
  applicants: string;
  btn_copy: string;
  btn_cloning: string;
  btn_close: string;
  btn_publish: string;
  btn_publishing: string;
  chip_applied: string;
  chip_match_pct: string;
  aria_latest_score: string;
  btn_one_click_apply: string;
  btn_applying: string;
  aria_apply_instant: string;
  aria_duplicate_requisition: string;
  aria_close_requisition: string;
  aria_close_dialog: string;
  aria_remove_criterion: string;
  aria_audit_pagination: string;
  edit_rubric_title: string;
  rubric_approved_warning: string;
  criteria_count: string;
  add_criterion: string;
  criterion_description: string;
  criterion_required: string;
  criterion_preferred: string;
  change_reason_label: string;
  change_reason_optional: string;
  change_reason_placeholder: string;
  save_rubric: string;
  location_label: string;
  employment_type_label: string;
  closes_at_label: string;
  employment_full_time: string;
  employment_part_time: string;
  employment_contract: string;
  employment_internship: string;
  desc_placeholder: string;
  criterion_example: string;
  title_placeholder: string;
  dept_engineering: string;
  dept_product: string;
  dept_data_ai: string;
  dept_sales: string;
  dept_operations: string;
  location_placeholder: string;
  toast_applied_saved_cv: string;
  toast_one_click_title: string;
  toast_one_click_failed: string;
  toast_title_desc_required: string;
  toast_requisition_published: string;
  toast_requisition_created_title: string;
  toast_create_failed: string;
  toast_network_create: string;
  toast_no_rubric: string;
  toast_rubric_min_one: string;
  toast_reason_required: string;
  toast_rubric_updated: string;
  toast_rubric_new_draft: string;
  toast_rubric_update_failed: string;
  toast_rubric_saved_title: string;
  toast_rubric_network: string;
  toast_no_rubric_approve: string;
  toast_requisition_visible: string;
  toast_requisition_published_title: string;
  toast_publish_failed: string;
  toast_network_publish: string;
  toast_requisition_duplicated: string;
  toast_requisition_cloned_title: string;
  toast_duplicate_failed: string;
  toast_network_duplicate: string;
  toast_requisition_closed: string;
  toast_requisition_closed_title: string;
  toast_close_failed: string;
  toast_network_close: string;
  toast_incomplete_response: string;

  // My applications extras
  my_apps_score_hint: string;
  my_apps_empty_tip: string;
  my_apps_profile_link: string;
  aria_app_score: string;
  match_band_strong: string;
  match_band_good: string;
  match_band_building: string;

  // Profile extras
  profile_workspace_candidate: string;
  profile_workspace_account: string;
  profile_display_name: string;
  profile_name_placeholder: string;
  profile_member_since: string;
  profile_department_access: string;
  profile_applications_count: string;
  profile_cv_saved_ok: string;
  profile_cv_removed_ok: string;
  profile_add: string;
  profile_skill_placeholder: string;
  profile_skill_remove_hint: string;
  profile_experience_placeholder: string;
  profile_about_you: string;
  profile_file_hint: string;
  profile_saving: string;
  profile_save_failed: string;
  profile_cv_save_failed: string;
  profile_cv_remove_failed: string;
  profile_cv_saved_on: string;
  aria_upload_cv: string;

  // Audit extras
  audit_search_actor: string;
  audit_search_actor_aria: string;
  audit_search_action: string;
  audit_search_action_aria: string;
  audit_from_date: string;
  audit_from_date_aria: string;
  audit_to_date: string;
  audit_to_date_aria: string;
  btn_search: string;
  audit_sealed: string;
  audit_logs_count: string;

  // Team extras
  team_accounts_badge: string;
  team_domain_title: string;
  team_domain_desc: string;
  team_domain_verified: string;
  team_domain_not_verified: string;
  team_domain_placeholder: string;
  team_btn_start_verification: string;
  team_btn_working: string;
  team_dns_step: string;
  team_btn_verify_now: string;
  team_btn_checking_dns: string;
  team_notice_staff: string;
  team_notice_candidates: string;
  team_col_employee: string;
  team_col_candidate_name: string;
  team_col_classification: string;
  team_col_assigned_role: string;
  team_col_account_status: string;
  team_col_permissions: string;
  team_col_portal_access: string;
  team_col_actions: string;
  team_empty_staff: string;
  team_empty_candidates: string;
  team_staff_user: string;
  team_applicant: string;
  team_badge_internal: string;
  team_badge_external: string;
  team_applicant_portal: string;
  team_view_applications: string;
  team_promote: string;
  team_promote_title: string;
  team_edit_role_title: string;
  team_select_role: string;
  team_invite_title: string;
  team_full_name: string;
  team_full_name_placeholder: string;
  team_work_email: string;
  team_work_email_placeholder: string;
  team_role_assignment: string;
  team_send_invite: string;
  team_role_admin: string;
  team_role_recruiter: string;
  team_role_manager: string;
  team_role_interviewer: string;
  team_role_auditor: string;
  team_role_candidate: string;
  toast_role_updated_title: string;
  toast_role_updated: string;
  toast_role_failed: string;
  toast_role_network: string;
  toast_invited_title: string;
  toast_invited: string;
  toast_invite_failed: string;
  toast_invite_network: string;
  team_domain_claim_failed: string;
  team_domain_network: string;
  team_verify_failed: string;
  team_verify_network: string;
  team_domain_already: string;
  team_user_fallback: string;

  // Settings extras
  settings_title: string;
  settings_subtitle: string;
  settings_tab_workflow: string;
  settings_tab_retention: string;
  settings_tab_branding: string;
  settings_reasons_title: string;
  settings_reasons_desc: string;
  settings_no_reasons: string;
  settings_reason_code_placeholder: string;
  settings_reason_label_placeholder: string;
  settings_add_reason: string;
  settings_categories_title: string;
  settings_no_categories: string;
  settings_category_placeholder: string;
  settings_boundaries_title: string;
  settings_strong_match: string;
  settings_manual_review: string;
  settings_save_workflow: string;
  settings_retention_desc: string;
  settings_days_suffix: string;
  settings_anonymize: string;
  settings_save_retention: string;
  settings_display_name: string;
  settings_logo_url: string;
  settings_primary_color: string;
  settings_save_branding: string;
  settings_saving: string;
  settings_saved_workflow: string;
  settings_saved_branding: string;
  settings_saved_retention: string;
  settings_failed_workflow: string;
  settings_failed_branding: string;
  settings_failed_retention: string;
  settings_remove_reason: string;
  settings_remove_category: string;

  // Analytics extras
  analytics_metrics_badge: string;
  analytics_subtitle: string;
  analytics_filter_from: string;
  analytics_filter_to: string;
  analytics_filter_job: string;
  analytics_filter_department: string;
  analytics_filter_recruiter: string;
  analytics_filter_stage: string;
  analytics_loading: string;
  analytics_metric_applications: string;
  analytics_metric_time_to_screen: string;
  analytics_metric_interviewer_completion: string;
  analytics_metric_processing_failures: string;
  analytics_metric_low_confidence: string;
  analytics_metric_active_recruiters: string;
  analytics_hint_screened: string;
  analytics_hint_median: string;
  analytics_hint_scorecards: string;
  analytics_hint_failed_processing: string;
  analytics_hint_needs_review: string;
  analytics_hint_open_workload: string;
  analytics_restricted_note: string;
  analytics_stage_distribution: string;
  analytics_time_in_stage: string;
  analytics_recruiter_workload: string;
  analytics_empty_period: string;
  analytics_empty_open: string;
  analytics_empty_assigned: string;
  analytics_col_stage: string;
  analytics_col_count: string;
  analytics_col_median: string;
  analytics_definitions: string;
  analytics_error: string;

  // Email delivery extras
  email_title: string;
  email_subtitle: string;
  email_back: string;
  email_empty_title: string;
  email_empty_desc: string;
  email_failed_heading: string;
  email_total_suffix: string;
  email_col_when: string;
  email_col_recipient: string;
  email_col_template: string;
  email_col_status: string;
  email_status_failed: string;
  email_hide_error: string;
  email_show_error: string;
  email_no_detail: string;
  btn_retry_delivery: string;
  email_retrying: string;
  email_retry_ok: string;
  email_retry_failed: string;
  email_retry_network: string;
  email_ops_badge: string;
  email_all_templates: string;

  // Privacy extras
  privacy_requests_title: string;
  privacy_requests_desc: string;
  privacy_request_correction: string;
  privacy_request_correction_hint: string;
  privacy_request_access: string;
  privacy_request_access_hint: string;
  privacy_request_withdrawal: string;
  privacy_request_withdrawal_hint: string;
  privacy_request_deletion: string;
  privacy_request_deletion_hint: string;
  privacy_change_placeholder: string;
  privacy_context_placeholder: string;
  privacy_submit_request: string;
  privacy_submitting: string;
  privacy_past_requests: string;
  privacy_network_error: string;
  privacy_submit_failed: string;
  privacy_request_recorded: string;
  privacy_portability_toast_title: string;
  privacy_erasure_toast_title: string;
  privacy_erasure_success: string;
  privacy_export_failed: string;
  privacy_erasure_failed: string;

  // Compare extras
  compare_matrix_title: string;
  compare_matrix_subtitle: string;
  compare_col_candidate: string;
  compare_col_requisition: string;
  compare_col_match_score: string;
  compare_col_stage: string;
  compare_col_skills: string;
  compare_col_action: string;
  compare_view: string;
  compare_restricted_badge: string;
  compare_restricted_title: string;
  compare_restricted_desc: string;
  compare_restricted_cta: string;
  compare_return_dashboard: string;

  // Errors & misc
  error_generic_title: string;
  btn_try_again: string;
  apply_legacy_title: string;
  apply_legacy_desc: string;
  apply_legacy_select: string;
  apply_legacy_first_name: string;
  apply_legacy_last_name: string;
  apply_legacy_email: string;
  apply_legacy_resume: string;
  apply_legacy_choose: string;
  apply_legacy_consent: string;
  apply_legacy_uploading: string;
  apply_legacy_status_uploading: string;
  apply_legacy_status_success: string;
  apply_legacy_upload_failed: string;
  interview_badge: string;
  interview_title: string;
  interview_subtitle: string;
  interview_success_title: string;
  interview_success_desc: string;
  interview_datetime: string;
  interview_duration: string;
  interview_platform: string;
  interview_30: string;
  interview_45: string;
  interview_60: string;
  interview_google_meet: string;
  interview_zoom: string;
  interview_in_person: string;
  interview_submit: string;
  interview_submitting: string;
  interview_back: string;
  interview_error: string;

  // Copilot conversation UX
  copilot_thinking: string;
  copilot_error_network: string;
  copilot_error_service: string;
  copilot_input_label: string;
  copilot_reset_title: string;
  copilot_greeting: string;
  copilot_acknowledge: string;
  copilot_handoff_note: string;
  copilot_chip_more: string;
  copilot_chip_apply: string;
  copilot_chip_track: string;
  copilot_chip_permissions: string;

  // AI score feedback loop
  feedback_thanks: string;
  feedback_question: string;
  feedback_placeholder: string;
  feedback_yes: string;
  feedback_no: string;
  toast_telemetry_refreshed: string;
  toast_telemetry_title: string;
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
    nav_analytics: 'Manager Analytics',
    nav_my_applications: 'My Applications',
    nav_quick_apply: 'Browse Open Roles',
    nav_profile: 'My Profile',
    profile_title: 'My Profile',
    profile_subtitle: 'Your account, your CV, and how you show up to employers',
    profile_saved_cv: 'Saved CV',
    profile_no_cv: 'No CV saved yet — upload one to unlock one-click applications.',
    profile_upload_cv: 'Upload CV',
    profile_replace_cv: 'Replace CV',
    profile_remove_cv: 'Remove',
    profile_one_click_hint: 'Your saved CV is reused for one-click applications. Each application still gets its own screening snapshot.',
    profile_skills: 'Skills',
    profile_experience: 'Experience summary',
    profile_save: 'Save profile',
    profile_saved: 'Profile saved',

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
    qp_apply_track: '📋 Apply & track',

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

    cprofile_status_label: 'Status',
    cprofile_no_resume_text: 'No plain text resume parsed for this application.',
    cprofile_summary_fallback: 'AI-assisted evaluation mapped against approved vacancy screening criteria.',
    cprofile_active_badge: 'ACTIVE',
    cprofile_interviewer_fallback: 'Interviewer',
    cprofile_scorecard_you: 'You (Current User)',
    cprofile_tech_short: 'Tech',
    cprofile_comm_short: 'Comm',
    cprofile_problem_short: 'Problem',
    cprofile_questions_targeting: 'Targeting candidate criteria gaps & evaluation signals',
    cprofile_questions_analyzing: 'Analyzing candidate skill gaps and synthesizing targeted questions...',
    cprofile_targeted_competency: 'Targeted Competency',
    cprofile_question_n: 'Question {count}',
    cprofile_copy_btn: 'Copy',
    cprofile_what_to_look_for: 'What to look for:',
    cprofile_notes_placeholder: 'Notes...',
    cprofile_reason_qualifications_match: 'Qualifications & Skills Match',
    cprofile_reason_excellent_technical_fit: 'Excellent Technical Fit',
    cprofile_reason_experience_gap: 'Experience / Skill Gap',
    cprofile_reason_communication_fit: 'Communication & Team Fit',
    cprofile_reason_compensation_mismatch: 'Compensation / Schedule Mismatch',
    cprofile_reason_talent_bench: 'Retained for Future Vacancy',
    cprofile_reason_candidate_withdrew: 'Candidate Withdrew Request',
    cprofile_reason_other: 'Other Job-Related Reason',
    cprofile_justification_label: 'Justification',
    cprofile_justification_placeholder: 'Justification...',
    cprofile_override_warning: 'Score recalibrations are permanently recorded in the immutable audit ledger.',
    cprofile_adjusted_score: 'Adjusted Score (0 - 100)',
    cprofile_override_placeholder: 'Demonstrated strong system architecture skills...',
    cprofile_annual_compensation: 'Annual Compensation Package',
    cprofile_start_date: 'Start Date',
    cprofile_uncertain_evidence: 'This result requires human review because the evidence is uncertain.',
    cprofile_candidate_code: 'Candidate #{code}',
    cprofile_applicant_fallback: 'Applicant',
    toast_score_recalibrated: 'Match score recalibrated to {score}%',
    toast_score_recalibrated_title: 'Score Recalibrated',
    toast_score_recalibration_failed: 'Failed to record score recalibration',
    toast_network_recalibration: 'Network error during recalibration',
    toast_offer_sent: 'Offer of {salary} extended to candidate',
    toast_offer_sent_title: 'Offer Sent',
    toast_offer_failed: 'Failed to extend formal offer',
    toast_network_offer: 'Network error while sending offer',
    toast_scorecard_recorded: 'Interview scorecard ({recommendation}) recorded successfully',
    toast_scorecard_title: 'Scorecard Saved',
    toast_scorecard_failed: 'Failed to submit scorecard',
    toast_network_scorecard: 'Network error while saving scorecard',
    toast_decision_rationale_required: 'Decision justification rationale is required',
    toast_decision_recorded: 'Decision "{decision}" recorded in audit trail',
    toast_decision_title: 'Decision Finalized',
    toast_decision_failed: 'Failed to record decision',
    toast_network_decision: 'Network error while recording decision',
    toast_question_copied: 'Question copied to clipboard',
    toast_evidence_located: 'Located evidence: "{evidence}"',
    toast_blind_enabled: 'Blind Screening enabled: PII hidden',
    toast_pii_revealed: 'PII revealed',

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
    dup_merge_failed: 'Merge failed — please try again.',
    dup_merge_error_title: 'Deduplication Error',
    dup_merged_toast: 'Merged duplicate candidate records for {email}',
    dup_merged_title: 'Deduplication Complete',
    dup_profiles_count: '{count} matching candidate profiles',
    dup_merging: 'Merging…',
    dup_applications_count: '{count} applications submitted',

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
    cmd_cat_navigation: 'Navigation',
    cmd_cat_analytics: 'Analytics',
    cmd_cat_requisitions: 'Requisitions',
    cmd_cat_compliance: 'Compliance',
    cmd_cat_administration: 'Administration',
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
    error: 'An error occurred',

    first_name: 'First Name',
    last_name: 'Last Name',
    email_addr: 'Email Address',
    phone_number: 'Phone Number',
    upload_resume: 'Resume Document (PDF, DOCX, TXT)',
    gdpr_consent: 'I agree to allow processing of my resume under GDPR data privacy policies.',
    submit_application: 'Submit Application',
    apply_job_missing_title: 'This requisition could not be found',
    apply_job_missing_desc: 'The position may have been closed, archived, or the link is out of date. Browse the current openings to find a live role.',
    apply_browse_open: 'Browse open positions',
    apply_official_badge: 'Official application',
    apply_staff_title: 'Logged in as hiring team member',
    apply_staff_desc: 'You are currently authenticated as an internal employee. Internal hiring staff review candidate applications rather than applying for open requisitions.',
    apply_redirecting: 'Redirecting to your candidate tracking portal…',
    apply_cv_document: 'CV document',
    apply_use_saved_cv: 'Use my saved CV',
    apply_from_profile: 'From your profile · no upload needed',
    apply_upload_different: 'Upload a different CV for this application',
    apply_click_or_drop: 'Click to select, or drag & drop your CV here',
    apply_file_hint: 'PDF, DOCX, TXT or MD · max 5 MB',
    apply_error_no_cv: 'Please attach your CV / Resume document.',
    apply_error_no_consent: 'Please provide GDPR consent for automated AI screening.',

    erasure_warning: 'Are you sure? This action is permanent and irreversible. All your applications, resume files, and account access will be destroyed.',
    sign_in: 'Sign In',
    session_enforced: 'Role permissions strictly enforced.',
    role_admin_desc: 'Full System Administrator: System telemetry, candidate pipeline, and user governance.',
    role_recruiter_desc: 'Lead Recruiter: ATS Pipeline ownership, score recalibration & offer extension.',
    role_hiring_manager_desc: 'Hiring Manager: Departmental candidate review, benchmarks & interview scheduling.',
    role_interviewer_desc: 'Technical Interviewer: Candidate evaluation, question viewer & scorecard submission.',
    role_auditor_desc: 'Compliance Auditor: Read-only access to immutable audit trails & compliance metrics.',
    role_candidate_desc: 'Job Applicant: Application tracking, job directory & GDPR self-service privacy.',

    nav_settings: 'Workspace Settings',
    active_role: 'Active Role:',
    brand_tagline: 'Enterprise ATS',

    workspace_overview: 'Workspace Overview',
    btn_review_applications: 'Review applications',
    kpi_across_jobs: 'Across active jobs',
    kpi_shortlisted_pool: 'Shortlisted Pool',
    kpi_active_rubrics: 'Active scoring rubrics',
    kpi_passed_threshold: 'Passed threshold benchmarks',
    kpi_sha_logs: 'SHA-256 timeline logs',
    stage_needs_review: 'Needs Review',
    stage_rejected: 'Rejected / Out of Scope',
    stage_new: 'New',
    stage_on_hold: 'On Hold',
    stage_interview_scheduled: 'Interview Scheduled',
    stage_hired: 'Hired',
    stage_withdrawn: 'Withdrawn',
    processing_queued: 'Queued',
    processing_in_progress: 'Processing',
    processing_completed: 'Completed',
    processing_failed: 'Failed',
    audit_just_now: 'Just now',
    audit_verified: '✓ VERIFIED',
    telemetry_quality_title: 'Screening Quality & Reliability Telemetry (§6.10)',
    telemetry_quality_chip: 'Audited Metrics',
    telemetry_quality_hint: 'Automated monitoring for extraction confidence, human overrides & system health',
    metric_low_confidence: 'Low-Confidence Flags',
    metric_low_confidence_hint: 'Confidence < 80% (Review required)',
    metric_manual_corrections: 'Manual Corrections',
    metric_manual_corrections_hint: 'Profiles corrected by recruiter',
    metric_score_overrides: 'Score Overrides',
    metric_score_overrides_hint: 'Human recalibrated scores',
    metric_processing_failures: 'Processing Failures',
    metric_processing_failures_hint: 'Safe retry available',
    metric_upcoming_interviews: 'Upcoming Interviews',
    metric_upcoming_interviews_hint: 'Scheduled & active',
    metric_failed_emails: 'Failed Emails (7d)',
    metric_failed_emails_hint: 'Transactional delivery health',
    metric_failed_emails_latest: 'Latest: {template}',
    telemetry_email_banner: '{count} email deliveries failed in the last 7 days — some recipients were never notified. Review delivery errors',
    telemetry_email_banner_one: '1 email delivery failed in the last 7 days — the recipient was never notified. Review delivery errors',
    telemetry_email_review: 'Review delivery errors',

    metric_visible_apps: 'Visible applications',
    metric_needs_review: 'Needs review',
    metric_avg_match: 'Average match',
    metric_shortlisted: 'Shortlisted',
    metric_rejected: 'Rejected',
    filters: 'Filters',
    filter_job: 'Job',
    filter_stage: 'Stage',
    filter_recruiter: 'Recruiter',
    filter_min_score: 'Min score (%)',
    filter_max_score: 'Max score (%)',
    filter_required_criteria: 'Required criteria',
    filter_processing: 'Processing',
    filter_tag: 'Tag',
    filter_applied_from: 'Applied from',
    filter_applied_to: 'Applied to',
    filter_all_jobs: 'All jobs',
    filter_all_stages: 'All stages',
    filter_all_recruiters: 'All recruiters',
    filter_any_status: 'Any status',
    filter_missing_required: 'Missing required',
    filter_uncertain_evidence: 'Uncertain evidence',
    filter_any_tag: 'Any tag',
    filter_clear_all: 'Clear all filters',
    bulk_selected: '{count} selected:',
    bulk_shortlist: 'Shortlist',
    bulk_advance: 'Advance',
    bulk_hold: 'Hold',
    bulk_review: 'Return to review',
    bulk_reject: 'Reject',
    bulk_withdraw: 'Withdraw',
    bulk_clear_selection: 'Clear selection',
    bulk_confirm_title: 'Confirm bulk “{action}” on {count} application(s)',
    bulk_confirm_desc: 'This records a decision on every selected application under your account and is written to the audit trail. It cannot be undone silently.',
    bulk_confirm_aria: 'Confirm bulk decision',
    bulk_reason_label: 'Reason (required)',
    bulk_reason_placeholder: 'Why is this bulk decision being applied?',
    bulk_error_required: 'A mandatory reason is required for bulk decisions.',
    bulk_error_failed: 'Bulk action failed.',
    bulk_error_network: 'Network error — the bulk action was not applied.',
    bulk_applying: 'Applying…',
    bulk_confirm_action: 'Confirm {action}',
    pagination_showing: '{from}–{to} of {total}',
    pagination_prev: '← Prev',
    pagination_next: 'Next →',
    aria_filter_department: 'Filter by department',
    aria_pipeline_view: 'Pipeline view',
    aria_select_all: 'Select all visible applications',
    aria_pipeline_pagination: 'Pipeline pagination',
    applicants_count: '{count} applicants',

    status_closed: 'Closed',
    jobs_search_placeholder: 'Search title, description, department…',
    aria_search_requisitions: 'Search requisitions',
    aria_filter_status: 'Filter by status',
    filter_all_statuses: 'All statuses',
    btn_apply_filters: 'Apply',
    btn_clear: 'Clear',
    edit_rubric: 'Edit rubric',
    rubric_preview: 'Preview',
    criteria_more: '+{count} more',
    applicants: 'applicants',
    btn_copy: 'Copy',
    btn_cloning: 'Cloning…',
    btn_close: 'Close',
    btn_publish: 'Publish',
    btn_publishing: 'Publishing…',
    chip_applied: '✓ Applied',
    chip_match_pct: '{score}% match',
    aria_latest_score: 'Latest AI screening score for your application',
    btn_one_click_apply: '⚡ 1-Click Apply',
    btn_applying: 'Applying…',
    aria_apply_instant: 'Apply instantly with the CV saved on your profile',
    aria_duplicate_requisition: 'Duplicate this requisition',
    aria_close_requisition: 'Close this requisition',
    aria_close_dialog: 'Close dialog',
    aria_remove_criterion: 'Remove criterion',
    aria_audit_pagination: 'Audit log pagination',
    edit_rubric_title: 'Edit Rubric — {title}',
    rubric_approved_warning: 'This rubric is approved. Saving will create a new DRAFT version — the current version keeps scoring applications until the new one is approved, and historical results are never altered.',
    criteria_count: 'Criteria ({count})',
    add_criterion: '+ Add criterion',
    criterion_description: 'Criterion description',
    criterion_required: 'Required',
    criterion_preferred: 'Preferred',
    change_reason_label: 'Change reason',
    change_reason_optional: 'Change reason (optional)',
    change_reason_placeholder: 'Why is the rubric changing? (recorded in the audit trail)',
    save_rubric: 'Save Rubric',
    location_label: 'Location',
    employment_type_label: 'Employment type',
    closes_at_label: 'Applications close (optional)',
    employment_full_time: 'Full-time',
    employment_part_time: 'Part-time',
    employment_contract: 'Contract',
    employment_internship: 'Internship',
    desc_placeholder: 'Responsibilities, stack requirements, and qualifications...',
    criterion_example: 'e.g. Distributed Systems (Go/Rust)',
    title_placeholder: 'e.g. Senior Frontend Architect',
    dept_engineering: 'Engineering',
    dept_product: 'Product & Design',
    dept_data_ai: 'Data & AI',
    dept_sales: 'Sales & Marketing',
    dept_operations: 'Operations & HR',
    location_placeholder: 'e.g. Kigali / Remote',
    toast_applied_saved_cv: 'Applied to “{title}” with your saved CV',
    toast_one_click_title: 'One-Click Apply',
    toast_one_click_failed: 'One-click apply failed',
    toast_title_desc_required: 'Title and description are required',
    toast_requisition_published: 'Job Requisition “{title}” published live',
    toast_requisition_created_title: 'Requisition Created',
    toast_create_failed: 'Failed to create job requisition',
    toast_network_create: 'Network error while creating requisition',
    toast_no_rubric: 'This requisition has no rubric to edit',
    toast_rubric_min_one: 'A rubric needs at least one criterion',
    toast_reason_required: 'A change reason is required when editing an approved rubric',
    toast_rubric_updated: 'Rubric criteria updated',
    toast_rubric_new_draft: 'New rubric version created as DRAFT — approve it to use it for screening',
    toast_rubric_update_failed: 'Failed to update the rubric',
    toast_rubric_saved_title: 'Rubric Saved',
    toast_rubric_network: 'Network error while updating the rubric',
    toast_no_rubric_approve: 'This requisition has no rubric to approve',
    toast_requisition_visible: '“{title}” is now visible to applicants',
    toast_requisition_published_title: 'Requisition Published',
    toast_publish_failed: 'Failed to publish requisition ({status})',
    toast_network_publish: 'Network error while publishing requisition',
    toast_requisition_duplicated: 'Requisition duplicated as “{title}”',
    toast_requisition_cloned_title: 'Requisition Cloned',
    toast_duplicate_failed: 'Failed to duplicate requisition',
    toast_network_duplicate: 'Network error while duplicating requisition',
    toast_requisition_closed: 'Job requisition “{title}” is now closed',
    toast_requisition_closed_title: 'Requisition Closed',
    toast_close_failed: 'Failed to close requisition',
    toast_network_close: 'Network error while closing requisition',
    toast_incomplete_response: 'The server returned an incomplete requisition response',

    my_apps_score_hint: 'Match % is your latest AI screening score against each role\'s rubric — it guides shortlisting, it is not a final decision.',
    my_apps_empty_tip: 'Tip: save your CV on your profile and every open role becomes a one-click apply.',
    my_apps_profile_link: 'profile',
    aria_app_score: 'Latest AI screening score for this application',
    match_band_strong: 'Strong match',
    match_band_good: 'Good match',
    match_band_building: 'Building',

    profile_workspace_candidate: 'Candidate workspace',
    profile_workspace_account: 'Workspace account',
    profile_display_name: 'Display name',
    profile_name_placeholder: 'Your full name',
    profile_member_since: '· member since {date}',
    profile_department_access: 'Department access:',
    profile_applications_count: '{count} applications',
    profile_cv_saved_ok: 'CV saved — one-click apply is now unlocked.',
    profile_cv_removed_ok: 'Saved CV removed.',
    profile_add: 'Add',
    profile_skill_placeholder: 'Type a skill and press Enter — e.g. React, SQL, Figma',
    profile_skill_remove_hint: 'Click to remove',
    profile_experience_placeholder: 'A short summary of your background — roles, years, notable work…',
    profile_about_you: 'About you',
    profile_file_hint: 'PDF, DOCX, TXT, MD · max 5 MB',
    profile_saving: 'Saving…',
    profile_save_failed: 'Failed to save profile',
    profile_cv_save_failed: 'Failed to save CV',
    profile_cv_remove_failed: 'Failed to remove CV',
    profile_cv_saved_on: 'saved {date}',
    aria_upload_cv: 'Upload CV',

    audit_search_actor: 'Search by actor email…',
    audit_search_actor_aria: 'Search audit log by actor email',
    audit_search_action: 'Action e.g. DECISION',
    audit_search_action_aria: 'Search audit log by action',
    audit_from_date: 'From date',
    audit_from_date_aria: 'From date',
    audit_to_date: 'To date',
    audit_to_date_aria: 'To date',
    btn_search: 'Search',
    audit_sealed: '✓ SEALED',
    audit_logs_count: '{count} LOGS',

    team_accounts_badge: '{count} TOTAL ACCOUNTS',
    team_domain_title: '🔐 Workspace identity',
    team_domain_desc: 'Staff with an email at your verified domain automatically join this workspace when they sign up.',
    team_domain_verified: '✓ {domain}',
    team_domain_not_verified: '⚠ NOT VERIFIED',
    team_domain_placeholder: 'yourcompany.com',
    team_btn_start_verification: 'Start verification',
    team_btn_working: 'Working…',
    team_dns_step: '1. Add this TXT record at your DNS provider:',
    team_btn_verify_now: 'Verify now',
    team_btn_checking_dns: 'Checking DNS…',
    team_notice_staff: 'Showing only authenticated company employees, recruiters, hiring managers, and system administrators.',
    team_notice_candidates: 'Showing external job applicants with registered accounts. To evaluate their submitted resumes, open the Candidate Pipeline.',
    team_col_employee: 'Employee / Staff Member',
    team_col_candidate_name: 'Candidate Name',
    team_col_classification: 'Classification',
    team_col_assigned_role: 'Assigned Role',
    team_col_account_status: 'Account Status',
    team_col_permissions: 'RBAC Permissions',
    team_col_portal_access: 'Portal Access',
    team_col_actions: 'Actions',
    team_empty_staff: 'No internal staff members found.',
    team_empty_candidates: 'No external candidate accounts registered yet.',
    team_staff_user: 'Staff User',
    team_applicant: 'Applicant',
    team_badge_internal: '🏢 INTERNAL STAFF',
    team_badge_external: '📄 EXTERNAL APPLICANT',
    team_applicant_portal: 'Applicant Portal (Apply & Track Status)',
    team_view_applications: 'View Applications',
    team_promote: 'Promote',
    team_promote_title: 'Promote to Internal Staff',
    team_edit_role_title: 'Edit Member Role',
    team_select_role: 'Select Role & Permissions *',
    team_invite_title: 'Invite Staff Member',
    team_full_name: 'Full Name',
    team_full_name_placeholder: 'e.g. Jane Doe',
    team_work_email: 'Work Email *',
    team_work_email_placeholder: 'jane@company.com',
    team_role_assignment: 'Staff Role Assignment *',
    team_send_invite: 'Send Invite',
    team_role_admin: 'Admin (Full Workspace Owner)',
    team_role_recruiter: 'Recruiter (ATS & Candidate Owner)',
    team_role_manager: 'Hiring Manager (Department Head)',
    team_role_interviewer: 'Interviewer (Technical Evaluator)',
    team_role_auditor: 'Compliance Auditor (Audit Inspector)',
    team_role_candidate: 'Candidate (Job Applicant Portal Only)',
    toast_role_updated_title: 'Role Updated',
    toast_role_updated: 'Updated role for {name} to {role}',
    toast_role_failed: 'Failed to update role',
    toast_role_network: 'Network error while updating role',
    toast_invited_title: 'Staff Member Invited',
    toast_invited: 'Invitation sent to {email}',
    toast_invite_failed: 'Failed to invite member',
    toast_invite_network: 'Network error while sending invite',
    team_domain_claim_failed: 'Failed to start the domain claim.',
    team_domain_network: 'Network error while starting the domain claim.',
    team_verify_failed: 'Verification failed.',
    team_verify_network: 'Network error while verifying.',
    team_domain_already: 'This domain is already verified.',
    team_user_fallback: 'User',

    settings_title: 'Workspace Settings',
    settings_subtitle: 'Configure the recruitment workflow, retention policy, and branding (spec §6.11/§6.12). Every change is recorded in the audit trail.',
    settings_tab_workflow: 'Workflow & Reasons',
    settings_tab_retention: 'Retention Policy',
    settings_tab_branding: 'Branding',
    settings_reasons_title: 'Decision reason catalog (§6.7)',
    settings_reasons_desc: 'Configurable decision reasons offered to recruiters when recording a screening decision. Irrelevant or discriminatory categories must not be added.',
    settings_no_reasons: 'No custom reasons yet.',
    settings_reason_code_placeholder: 'CODE (e.g. LACKS_EXPERIENCE)',
    settings_reason_label_placeholder: 'Displayed label',
    settings_add_reason: 'Add reason',
    settings_categories_title: 'Job categories (§6.12)',
    settings_no_categories: 'No custom categories yet.',
    settings_category_placeholder: 'New category (e.g. Engineering)',
    settings_boundaries_title: 'Scoring boundaries (§6.12)',
    settings_strong_match: 'Strong match ≥ (%)',
    settings_manual_review: 'Manual review ≤ (%)',
    settings_save_workflow: 'Save workflow configuration',
    settings_retention_desc: 'Retention periods per application status in days (spec §6.11). Empty = keep until manual action.',
    settings_days_suffix: '(days)',
    settings_anonymize: 'Anonymize instead of hard-deleting expired applications',
    settings_save_retention: 'Save retention policy',
    settings_display_name: 'Workspace display name',
    settings_logo_url: 'Logo URL (optional)',
    settings_primary_color: 'Primary color',
    settings_save_branding: 'Save branding',
    settings_saving: 'Saving…',
    settings_saved_workflow: 'Workflow configuration saved.',
    settings_saved_branding: 'Branding saved.',
    settings_saved_retention: 'Retention policy saved.',
    settings_failed_workflow: 'Failed to save workflow configuration.',
    settings_failed_branding: 'Failed to save branding.',
    settings_failed_retention: 'Failed to save retention policy.',
    settings_remove_reason: 'Remove reason {code}',
    settings_remove_category: 'Remove category {category}',

    analytics_metrics_badge: '§6.10 METRICS',
    analytics_subtitle: 'Time-to-screen, stage conversion, interviewer completion, and workload for permitted jobs.',
    analytics_filter_from: 'From',
    analytics_filter_to: 'To',
    analytics_filter_job: 'Job',
    analytics_filter_department: 'Department',
    analytics_filter_recruiter: 'Recruiter',
    analytics_filter_stage: 'Stage',
    analytics_loading: 'Loading analytics…',
    analytics_metric_applications: 'Applications',
    analytics_metric_time_to_screen: 'Time to Screen',
    analytics_metric_interviewer_completion: 'Interviewer Completion',
    analytics_metric_processing_failures: 'Processing Failures',
    analytics_metric_low_confidence: 'Low-Confidence',
    analytics_metric_active_recruiters: 'Active Recruiters',
    analytics_hint_screened: '{count} screened',
    analytics_hint_median: 'median, creation → screening',
    analytics_hint_scorecards: '{submitted}/{total} scorecards',
    analytics_hint_failed_processing: 'failed resume processing',
    analytics_hint_needs_review: 'needs manual review',
    analytics_hint_open_workload: 'with open workload',
    analytics_restricted_note: 'Note: some requested data is outside your department permissions and has been excluded.',
    analytics_stage_distribution: 'Stage Distribution',
    analytics_time_in_stage: 'Time in Stage',
    analytics_recruiter_workload: 'Recruiter Workload',
    analytics_empty_period: 'No applications in the selected period.',
    analytics_empty_open: 'No open applications.',
    analytics_empty_assigned: 'No assigned open applications.',
    analytics_col_stage: 'Stage',
    analytics_col_count: 'Count',
    analytics_col_median: 'Median',
    analytics_definitions: 'Metric Definitions',
    analytics_error: 'Failed to load analytics',

    email_title: 'Email Delivery Health',
    email_subtitle: 'Failed transactional deliveries in the last 7 days (spec §6.9). Click a row to see the provider error that caused the failure.',
    email_back: '← Back to dashboard',
    email_empty_title: 'No failed deliveries',
    email_empty_desc: 'Every transactional email in the last 7 days was recorded as SENT (or none were sent).',
    email_failed_heading: 'Failed Deliveries — {total} total',
    email_total_suffix: 'total',
    email_col_when: 'When',
    email_col_recipient: 'Recipient',
    email_col_template: 'Template',
    email_col_status: 'Status',
    email_status_failed: 'FAILED',
    email_hide_error: '▲ hide error',
    email_show_error: '▼ show error',
    email_no_detail: 'No provider error detail was recorded for this delivery.',
    btn_retry_delivery: '↻ Retry delivery',
    email_retrying: 'Retrying…',
    email_retry_ok: 'Retry succeeded — the email was delivered.',
    email_retry_failed: 'Retry failed: {detail}',
    email_retry_network: 'Network error — the retry was not attempted.',
    email_ops_badge: 'OPS TELEMETRY',
    email_all_templates: 'All templates',

    privacy_requests_title: 'Data requests (correction, access, withdrawal)',
    privacy_requests_desc: 'Submit a formal data request. It is recorded, tracked, and routed to our privacy team for review — you will be contacted with the outcome.',
    privacy_request_correction: 'Correct my data',
    privacy_request_correction_hint: 'Tell us what is inaccurate and what it should say (e.g. wrong phone number, misspelled name).',
    privacy_request_access: 'Get a copy of my data',
    privacy_request_access_hint: 'We will prepare and send you the personal data we hold about you.',
    privacy_request_withdrawal: 'Withdraw my consent',
    privacy_request_withdrawal_hint: 'Ask us to stop processing your application. Ongoing recruitment will stop.',
    privacy_request_deletion: 'Request deletion review',
    privacy_request_deletion_hint: 'For full immediate erasure, use the Right to be Forgotten control above — this asks the privacy team to review deletion of specific records.',
    privacy_change_placeholder: 'What should your data say instead?',
    privacy_context_placeholder: 'Additional context (optional)',
    privacy_submit_request: 'Submit request',
    privacy_submitting: 'Submitting…',
    privacy_past_requests: 'Your past requests',
    privacy_network_error: 'Network error — the request was not submitted.',
    privacy_submit_failed: 'Failed to submit request.',
    privacy_request_recorded: 'Your request has been recorded.',
    privacy_portability_toast_title: 'GDPR Export',
    privacy_erasure_toast_title: 'Right to be Forgotten',
    privacy_erasure_success: 'Your account and personal data have been completely erased',
    privacy_export_failed: 'Failed to export data',
    privacy_erasure_failed: 'Failed to submit erasure request',

    compare_matrix_title: 'Side-by-Side Candidate Benchmark Matrix',
    compare_matrix_subtitle: 'Direct comparison of weighted match scores, recruitment stages, and candidate qualifications.',
    compare_col_candidate: 'Candidate',
    compare_col_requisition: 'Requisition',
    compare_col_match_score: 'Match Score',
    compare_col_stage: 'Current Stage',
    compare_col_skills: 'Top Skills',
    compare_col_action: 'Action',
    compare_view: 'View',
    compare_restricted_badge: 'EVALUATION CLEARANCE REQUIRED',
    compare_restricted_title: 'Benchmark Tool Reserved for Evaluation Team',
    compare_restricted_desc: 'Side-by-side benchmark comparison is reserved for Recruiters, Hiring Managers, and Interviewers.',
    compare_restricted_cta: 'Return to Dashboard',
    compare_return_dashboard: 'Return to Dashboard',

    error_generic_title: 'Something went wrong!',
    btn_try_again: 'Try again',
    apply_legacy_title: 'Submit Application',
    apply_legacy_desc: 'Please fill out the form below and upload your resume (PDF or DOCX, max 5MB).',
    apply_legacy_select: 'Select Job Requisition',
    apply_legacy_first_name: 'First Name',
    apply_legacy_last_name: 'Last Name',
    apply_legacy_email: 'Email',
    apply_legacy_resume: 'Resume Document',
    apply_legacy_choose: '-- Choose a Job --',
    apply_legacy_consent: 'I consent to my data being processed for recruitment purposes, including automated AI screening support.',
    apply_legacy_uploading: 'Uploading...',
    apply_legacy_status_uploading: 'Uploading resume...',
    apply_legacy_status_success: 'Success! Your application has been submitted and is processing.',
    apply_legacy_upload_failed: 'Upload failed',
    interview_badge: 'INTERVIEW SCHEDULING',
    interview_title: 'Schedule Structured Interview',
    interview_subtitle: 'Dispatch calendar invitations, prepare technical scorecards, and reserve interview panelists.',
    interview_success_title: 'Interview Scheduled Successfully!',
    interview_success_desc: 'Calendar invitations and video room links have been dispatched. Redirecting to candidate profile...',
    interview_datetime: 'Date & Time (UTC) *',
    interview_duration: 'Interview Duration *',
    interview_platform: 'Meeting Platform *',
    interview_30: '30 Minutes',
    interview_45: '45 Minutes (Standard)',
    interview_60: '60 Minutes (Deep Dive)',
    interview_google_meet: 'Google Meet (Auto-generated)',
    interview_zoom: 'Zoom Meeting',
    interview_in_person: 'In-Person (Kigali HQ)',
    interview_submit: 'Confirm & Dispatch Interview Invitation',
    interview_submitting: 'Dispatching Calendar Invites...',
    interview_back: 'Back to candidate',
    interview_error: 'Could not schedule the interview. Please try again.',

    copilot_thinking: 'Thinking…',
    copilot_error_network: 'Network error. Please verify your connection and try again.',
    copilot_error_service: 'The support service is unreachable right now. Please try again in a moment.',
    copilot_input_label: 'Message the RecruitAI Copilot',
    copilot_reset_title: 'Reset Conversation',
    copilot_greeting: 'Hello',
    copilot_acknowledge: 'Got it',
    copilot_handoff_note: 'For anything beyond RecruitAI, our human support team can help — this assistant stays focused on the platform.',
    copilot_chip_more: 'Tell me more',
    copilot_chip_apply: 'How do I apply?',
    copilot_chip_track: 'Track my applications',
    copilot_chip_permissions: 'Role permissions',

    feedback_thanks: 'Thank you for your feedback! This helps train the AI.',
    feedback_question: 'Was the AI\'s score accurate?',
    feedback_placeholder: 'Optional comment...',
    feedback_yes: 'Yes, Accurate',
    feedback_no: 'No, Override Decision',
    toast_telemetry_refreshed: 'Pipeline telemetry refreshed from the database',
    toast_telemetry_title: 'Telemetry Updated'
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
    nav_analytics: 'Analytique',
    nav_my_applications: 'Mes candidatures',
    nav_quick_apply: 'Explorer les postes',
    nav_profile: 'Mon profil',
    profile_title: 'Mon profil',
    profile_subtitle: 'Votre compte, votre CV et votre image auprès des employeurs',
    profile_saved_cv: 'CV enregistré',
    profile_no_cv: 'Aucun CV enregistré — importez-en un pour postuler en un clic.',
    profile_upload_cv: 'Importer le CV',
    profile_replace_cv: 'Remplacer le CV',
    profile_remove_cv: 'Supprimer',
    profile_one_click_hint: 'Votre CV enregistré est réutilisé pour les candidatures en un clic. Chaque candidature reçoit toujours sa propre évaluation.',
    profile_skills: 'Compétences',
    profile_experience: "Résumé de l'expérience",
    profile_save: 'Enregistrer le profil',
    profile_saved: 'Profil enregistré',

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
    qp_apply_track: '📋 Postuler & suivre',

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

    cprofile_status_label: 'Statut',
    cprofile_no_resume_text: 'Aucun CV au format texte n’a été analysé pour cette candidature.',
    cprofile_summary_fallback: 'Évaluation assistée par IA comparée aux critères de criblage validés du poste.',
    cprofile_active_badge: 'ACTIF',
    cprofile_interviewer_fallback: 'Évaluateur',
    cprofile_scorecard_you: 'Vous (utilisateur actuel)',
    cprofile_tech_short: 'Tech',
    cprofile_comm_short: 'Comm',
    cprofile_problem_short: 'Résolution',
    cprofile_questions_targeting: 'Ciblage des écarts de critères et des signaux d’évaluation du candidat',
    cprofile_questions_analyzing: 'Analyse des écarts de compétences et synthèse de questions ciblées...',
    cprofile_targeted_competency: 'Compétence ciblée',
    cprofile_question_n: 'Question {count}',
    cprofile_copy_btn: 'Copier',
    cprofile_what_to_look_for: 'Ce qu’il faut rechercher :',
    cprofile_notes_placeholder: 'Notes...',
    cprofile_reason_qualifications_match: 'Correspondance des qualifications et compétences',
    cprofile_reason_excellent_technical_fit: 'Excellente adéquation technique',
    cprofile_reason_experience_gap: 'Écart d’expérience ou de compétences',
    cprofile_reason_communication_fit: 'Communication et esprit d’équipe',
    cprofile_reason_compensation_mismatch: 'Écart de rémunération ou de planning',
    cprofile_reason_talent_bench: 'Conservé pour un futur poste',
    cprofile_reason_candidate_withdrew: 'Retrait de la candidature par le candidat',
    cprofile_reason_other: 'Autre motif lié au poste',
    cprofile_justification_label: 'Justification',
    cprofile_justification_placeholder: 'Justification...',
    cprofile_override_warning: 'Les recalibrages de score sont enregistrés définitivement dans le journal d’audit inaltérable.',
    cprofile_adjusted_score: 'Score ajusté (0 - 100)',
    cprofile_override_placeholder: 'Solides compétences d’architecture système démontrées...',
    cprofile_annual_compensation: 'Rémunération annuelle',
    cprofile_start_date: 'Date de début',
    cprofile_uncertain_evidence: 'Ce résultat nécessite une revue humaine car les preuves sont incertaines.',
    cprofile_candidate_code: 'Candidat #{code}',
    cprofile_applicant_fallback: 'Postulant',
    toast_score_recalibrated: 'Score de correspondance recalibré à {score} %',
    toast_score_recalibrated_title: 'Score recalibré',
    toast_score_recalibration_failed: 'Échec de l’enregistrement du recalibrage du score',
    toast_network_recalibration: 'Erreur réseau lors du recalibrage',
    toast_offer_sent: 'Offre de {salary} envoyée au candidat',
    toast_offer_sent_title: 'Offre envoyée',
    toast_offer_failed: 'Échec de l’envoi de l’offre formelle',
    toast_network_offer: 'Erreur réseau lors de l’envoi de l’offre',
    toast_scorecard_recorded: 'Fiche d’entretien ({recommendation}) enregistrée avec succès',
    toast_scorecard_title: 'Fiche enregistrée',
    toast_scorecard_failed: 'Échec de l’envoi de la fiche d’entretien',
    toast_network_scorecard: 'Erreur réseau lors de l’enregistrement de la fiche',
    toast_decision_rationale_required: 'La justification de la décision est obligatoire',
    toast_decision_recorded: 'Décision « {decision} » enregistrée dans le journal d’audit',
    toast_decision_title: 'Décision finalisée',
    toast_decision_failed: 'Échec de l’enregistrement de la décision',
    toast_network_decision: 'Erreur réseau lors de l’enregistrement de la décision',
    toast_question_copied: 'Question copiée dans le presse-papiers',
    toast_evidence_located: 'Preuve localisée : « {evidence} »',
    toast_blind_enabled: 'Criblage aveugle activé : données personnelles masquées',
    toast_pii_revealed: 'Données personnelles affichées',

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
    dup_merge_failed: 'La fusion a échoué — veuillez réessayer.',
    dup_merge_error_title: 'Erreur de dédoublonnage',
    dup_merged_toast: 'Dossiers candidats en doublon fusionnés pour {email}',
    dup_merged_title: 'Dédoublonnage terminé',
    dup_profiles_count: '{count} profils candidats correspondants',
    dup_merging: 'Fusion…',
    dup_applications_count: '{count} candidatures envoyées',

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
    cmd_cat_navigation: 'Navigation',
    cmd_cat_analytics: 'Analytique',
    cmd_cat_requisitions: 'Offres',
    cmd_cat_compliance: 'Conformité',
    cmd_cat_administration: 'Administration',
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
    error: 'Une erreur est survenue',

    first_name: 'Prénom',
    last_name: 'Nom',
    email_addr: 'Adresse e-mail',
    phone_number: 'Téléphone',
    upload_resume: 'Document CV (PDF, DOCX, TXT)',
    gdpr_consent: 'J’accepte le traitement de mon CV conformément à la politique RGPD de confidentialité des données.',
    submit_application: 'Envoyer la candidature',
    apply_job_missing_title: 'Cette offre est introuvable',
    apply_job_missing_desc: 'Le poste a peut-être été clôturé, archivé, ou le lien est périmé. Parcourez les offres actuelles pour trouver un poste disponible.',
    apply_browse_open: 'Voir les postes ouverts',
    apply_official_badge: 'Candidature officielle',
    apply_staff_title: 'Connecté en tant que membre de l’équipe de recrutement',
    apply_staff_desc: 'Vous êtes authentifié comme employé interne. L’équipe interne évalue les candidatures au lieu de postuler aux offres.',
    apply_redirecting: 'Redirection vers votre portail de suivi…',
    apply_cv_document: 'Document CV',
    apply_use_saved_cv: 'Utiliser mon CV enregistré',
    apply_from_profile: 'Depuis votre profil · aucun téléversement requis',
    apply_upload_different: 'Téléverser un autre CV pour cette candidature',
    apply_click_or_drop: 'Cliquez pour sélectionner, ou glissez-déposez votre CV ici',
    apply_file_hint: 'PDF, DOCX, TXT ou MD · max 5 Mo',
    apply_error_no_cv: 'Veuillez joindre votre document CV.',
    apply_error_no_consent: 'Veuillez accorder le consentement RGPD pour le filtrage IA automatisé.',

    erasure_warning: 'Êtes-vous sûr(e) ? Cette action est permanente et irréversible. Toutes vos candidatures, CV et accès au compte seront détruits.',
    sign_in: 'Se connecter',
    session_enforced: 'Permissions de rôle strictement appliquées.',
    role_admin_desc: 'Administrateur système : télémétrie, pipeline candidats et gouvernance des utilisateurs.',
    role_recruiter_desc: 'Recruteur principal : pipeline ATS, recalibrage des scores et extension d’offres.',
    role_hiring_manager_desc: 'Manager recruteur : revue départementale, benchmarks et planification d’entretiens.',
    role_interviewer_desc: 'Évaluateur technique : évaluation des candidats, questions et fiches d’entretien.',
    role_auditor_desc: 'Auditeur de conformité : accès en lecture seule aux journaux d’audit immuables.',
    role_candidate_desc: 'Postulant : suivi des candidatures, offres et libre-service RGPD.',

    nav_settings: 'Paramètres de l’espace',
    active_role: 'Rôle actif :',
    brand_tagline: 'ATS Entreprise',

    workspace_overview: 'Vue d’ensemble',
    btn_review_applications: 'Examiner les candidatures',
    kpi_across_jobs: 'Sur les postes actifs',
    kpi_shortlisted_pool: 'Présélectionnés',
    kpi_active_rubrics: 'Grilles d’évaluation actives',
    kpi_passed_threshold: 'Seuils atteints',
    kpi_sha_logs: 'Journaux SHA-256',
    stage_needs_review: 'À réviser',
    stage_rejected: 'Rejetés / Hors périmètre',
    stage_new: 'Nouveau',
    stage_on_hold: 'En attente',
    stage_interview_scheduled: 'Entretien planifié',
    stage_hired: 'Recruté',
    stage_withdrawn: 'Retiré',
    processing_queued: 'En file',
    processing_in_progress: 'En cours',
    processing_completed: 'Terminé',
    processing_failed: 'Échec',
    audit_just_now: 'À l’instant',
    audit_verified: '✓ VÉRIFIÉ',
    telemetry_quality_title: 'Télémétrie qualité & fiabilité du criblage (§6.10)',
    telemetry_quality_chip: 'Métriques auditées',
    telemetry_quality_hint: 'Surveillance automatique de la confiance d’extraction, des overrides humains et de la santé système',
    metric_low_confidence: 'Signaux faible confiance',
    metric_low_confidence_hint: 'Confiance < 80 % (révision requise)',
    metric_manual_corrections: 'Corrections manuelles',
    metric_manual_corrections_hint: 'Profils corrigés par un recruteur',
    metric_score_overrides: 'Scores remplacés',
    metric_score_overrides_hint: 'Scores recalibrés par un humain',
    metric_processing_failures: 'Échecs de traitement',
    metric_processing_failures_hint: 'Nouvelle tentative sécurisée possible',
    metric_upcoming_interviews: 'Entretiens à venir',
    metric_upcoming_interviews_hint: 'Planifiés et actifs',
    metric_failed_emails: 'E-mails échoués (7 j)',
    metric_failed_emails_hint: 'Santé des envois transactionnels',
    metric_failed_emails_latest: 'Dernier : {template}',
    telemetry_email_banner: '{count} envois d’e-mails ont échoué ces 7 derniers jours — certains destinataires n’ont jamais été notifiés. Examiner les erreurs d’envoi',
    telemetry_email_banner_one: '1 envoi d’e-mail a échoué ces 7 derniers jours — le destinataire n’a jamais été notifié. Examiner les erreurs d’envoi',
    telemetry_email_review: 'Examiner les erreurs d’envoi',

    metric_visible_apps: 'Candidatures visibles',
    metric_needs_review: 'À réviser',
    metric_avg_match: 'Correspondance moy.',
    metric_shortlisted: 'Présélectionnés',
    metric_rejected: 'Rejetés',
    filters: 'Filtres',
    filter_job: 'Poste',
    filter_stage: 'Étape',
    filter_recruiter: 'Recruteur',
    filter_min_score: 'Score min (%)',
    filter_max_score: 'Score max (%)',
    filter_required_criteria: 'Critères requis',
    filter_processing: 'Traitement',
    filter_tag: 'Étiquette',
    filter_applied_from: 'Candidaté depuis',
    filter_applied_to: 'Candidaté jusqu’au',
    filter_all_jobs: 'Tous les postes',
    filter_all_stages: 'Toutes les étapes',
    filter_all_recruiters: 'Tous les recruteurs',
    filter_any_status: 'Tout statut',
    filter_missing_required: 'Critère requis manquant',
    filter_uncertain_evidence: 'Preuve incertaine',
    filter_any_tag: 'Toute étiquette',
    filter_clear_all: 'Effacer tous les filtres',
    bulk_selected: '{count} sélectionnée(s) :',
    bulk_shortlist: 'Présélectionner',
    bulk_advance: 'Faire avancer',
    bulk_hold: 'Mettre en attente',
    bulk_review: 'Retourner en révision',
    bulk_reject: 'Rejeter',
    bulk_withdraw: 'Retirer',
    bulk_clear_selection: 'Effacer la sélection',
    bulk_confirm_title: 'Confirmer l’action « {action} » sur {count} candidature(s)',
    bulk_confirm_desc: 'Ceci enregistre une décision pour chaque candidature sélectionnée sous votre compte et l’inscrit au journal d’audit. Non réversible silencieusement.',
    bulk_confirm_aria: 'Confirmer la décision groupée',
    bulk_reason_label: 'Motif (obligatoire)',
    bulk_reason_placeholder: 'Pourquoi cette décision groupée est-elle appliquée ?',
    bulk_error_required: 'Un motif est obligatoire pour les décisions groupées.',
    bulk_error_failed: 'L’action groupée a échoué.',
    bulk_error_network: 'Erreur réseau — l’action groupée n’a pas été appliquée.',
    bulk_applying: 'Application…',
    bulk_confirm_action: 'Confirmer : {action}',
    pagination_showing: '{from}–{to} sur {total}',
    pagination_prev: '← Précédent',
    pagination_next: 'Suivant →',
    aria_filter_department: 'Filtrer par département',
    aria_pipeline_view: 'Vue du pipeline',
    aria_select_all: 'Sélectionner toutes les candidatures visibles',
    aria_pipeline_pagination: 'Pagination du pipeline',
    applicants_count: '{count} candidats',

    status_closed: 'Clôturé',
    jobs_search_placeholder: 'Rechercher titre, description, département…',
    aria_search_requisitions: 'Rechercher des offres',
    aria_filter_status: 'Filtrer par statut',
    filter_all_statuses: 'Tous les statuts',
    btn_apply_filters: 'Appliquer',
    btn_clear: 'Effacer',
    edit_rubric: 'Modifier la grille',
    rubric_preview: 'Aperçu',
    criteria_more: '+{count} autres',
    applicants: 'candidats',
    btn_copy: 'Copier',
    btn_cloning: 'Clonage…',
    btn_close: 'Clôturer',
    btn_publish: 'Publier',
    btn_publishing: 'Publication…',
    chip_applied: '✓ Postulé',
    chip_match_pct: '{score}% de correspondance',
    aria_latest_score: 'Dernier score de criblage IA de votre candidature',
    btn_one_click_apply: '⚡ Candidature 1 clic',
    btn_applying: 'Envoi…',
    aria_apply_instant: 'Postuler instantanément avec le CV enregistré sur votre profil',
    aria_duplicate_requisition: 'Dupliquer cette offre',
    aria_close_requisition: 'Clôturer cette offre',
    aria_close_dialog: 'Fermer la fenêtre',
    aria_remove_criterion: 'Retirer le critère',
    aria_audit_pagination: 'Pagination du journal d’audit',
    edit_rubric_title: 'Modifier la grille — {title}',
    rubric_approved_warning: 'Cette grille est approuvée. L’enregistrement créera une nouvelle version BROUILLON — la version actuelle continue d’évaluer les candidatures jusqu’à l’approbation de la nouvelle ; les résultats historiques ne sont jamais altérés.',
    criteria_count: 'Critères ({count})',
    add_criterion: '+ Ajouter un critère',
    criterion_description: 'Description du critère',
    criterion_required: 'Requis',
    criterion_preferred: 'Souhaité',
    change_reason_label: 'Motif du changement',
    change_reason_optional: 'Motif du changement (facultatif)',
    change_reason_placeholder: 'Pourquoi la grille change-t-elle ? (consigné au journal d’audit)',
    save_rubric: 'Enregistrer la grille',
    location_label: 'Lieu',
    employment_type_label: 'Type de contrat',
    closes_at_label: 'Clôture des candidatures (facultatif)',
    employment_full_time: 'Temps plein',
    employment_part_time: 'Temps partiel',
    employment_contract: 'Contrat',
    employment_internship: 'Stage',
    desc_placeholder: 'Responsabilités, stack requis et qualifications...',
    criterion_example: 'ex. Systèmes distribués (Go/Rust)',
    title_placeholder: 'ex. Architecte Frontend Senior',
    dept_engineering: 'Ingénierie',
    dept_product: 'Produit & Design',
    dept_data_ai: 'Data & IA',
    dept_sales: 'Ventes & Marketing',
    dept_operations: 'Opérations & RH',
    location_placeholder: 'ex. Kigali / Télétravail',
    toast_applied_saved_cv: 'Candidature envoyée pour « {title} » avec votre CV enregistré',
    toast_one_click_title: 'Candidature 1 clic',
    toast_one_click_failed: 'Échec de la candidature en un clic',
    toast_title_desc_required: 'Le titre et la description sont requis',
    toast_requisition_published: 'Offre « {title} » publiée en ligne',
    toast_requisition_created_title: 'Offre créée',
    toast_create_failed: 'Échec de la création de l’offre',
    toast_network_create: 'Erreur réseau lors de la création de l’offre',
    toast_no_rubric: 'Cette offre n’a aucune grille à modifier',
    toast_rubric_min_one: 'Une grille exige au moins un critère',
    toast_reason_required: 'Un motif est requis pour modifier une grille approuvée',
    toast_rubric_updated: 'Critères de la grille mis à jour',
    toast_rubric_new_draft: 'Nouvelle version BROUILLON créée — approuvez-la pour l’utiliser en criblage',
    toast_rubric_update_failed: 'Échec de la mise à jour de la grille',
    toast_rubric_saved_title: 'Grille enregistrée',
    toast_rubric_network: 'Erreur réseau lors de la mise à jour de la grille',
    toast_no_rubric_approve: 'Cette offre n’a aucune grille à approuver',
    toast_requisition_visible: '« {title} » est désormais visible des candidats',
    toast_requisition_published_title: 'Offre publiée',
    toast_publish_failed: 'Échec de publication de l’offre ({status})',
    toast_network_publish: 'Erreur réseau lors de la publication de l’offre',
    toast_requisition_duplicated: 'Offre dupliquée sous « {title} »',
    toast_requisition_cloned_title: 'Offre clonée',
    toast_duplicate_failed: 'Échec de la duplication de l’offre',
    toast_network_duplicate: 'Erreur réseau lors de la duplication de l’offre',
    toast_requisition_closed: 'L’offre « {title} » est désormais clôturée',
    toast_requisition_closed_title: 'Offre clôturée',
    toast_close_failed: 'Échec de la clôture de l’offre',
    toast_network_close: 'Erreur réseau lors de la clôture de l’offre',
    toast_incomplete_response: 'Le serveur a renvoyé une réponse d’offre incomplète',

    my_apps_score_hint: 'Le % de correspondance est votre dernier score de criblage IA face à la grille de chaque poste — il guide la présélection, ce n’est pas une décision finale.',
    my_apps_empty_tip: 'Astuce : enregistrez votre CV sur votre profil et chaque poste ouvert devient une candidature en un clic.',
    my_apps_profile_link: 'profil',
    aria_app_score: 'Dernier score de criblage IA pour cette candidature',
    match_band_strong: 'Forte correspondance',
    match_band_good: 'Bonne correspondance',
    match_band_building: 'En construction',

    profile_workspace_candidate: 'Espace candidat',
    profile_workspace_account: 'Compte de l’espace',
    profile_display_name: 'Nom affiché',
    profile_name_placeholder: 'Votre nom complet',
    profile_member_since: '· membre depuis le {date}',
    profile_department_access: 'Accès départements :',
    profile_applications_count: '{count} candidatures',
    profile_cv_saved_ok: 'CV enregistré — la candidature en un clic est débloquée.',
    profile_cv_removed_ok: 'CV enregistré supprimé.',
    profile_add: 'Ajouter',
    profile_skill_placeholder: 'Saisissez une compétence puis Entrée — ex. React, SQL, Figma',
    profile_skill_remove_hint: 'Cliquer pour retirer',
    profile_experience_placeholder: 'Bref résumé de votre parcours — postes, années, réalisations…',
    profile_about_you: 'À propos de vous',
    profile_file_hint: 'PDF, DOCX, TXT, MD · max 5 Mo',
    profile_saving: 'Enregistrement…',
    profile_save_failed: 'Échec de l’enregistrement du profil',
    profile_cv_save_failed: 'Échec de l’enregistrement du CV',
    profile_cv_remove_failed: 'Échec de la suppression du CV',
    profile_cv_saved_on: 'enregistré le {date}',
    aria_upload_cv: 'Importer le CV',

    audit_search_actor: 'Rechercher par e-mail de l’acteur…',
    audit_search_actor_aria: 'Rechercher le journal par e-mail de l’acteur',
    audit_search_action: 'Action ex. DECISION',
    audit_search_action_aria: 'Rechercher le journal par action',
    audit_from_date: 'Date de début',
    audit_from_date_aria: 'Date de début',
    audit_to_date: 'Date de fin',
    audit_to_date_aria: 'Date de fin',
    btn_search: 'Rechercher',
    audit_sealed: '✓ SCELLÉ',
    audit_logs_count: '{count} ENTRÉES',

    team_accounts_badge: '{count} COMPTES AU TOTAL',
    team_domain_title: '🔐 Identité de l’espace',
    team_domain_desc: 'Le personnel disposant d’un e-mail sur votre domaine vérifié rejoint automatiquement cet espace à l’inscription.',
    team_domain_verified: '✓ {domain}',
    team_domain_not_verified: '⚠ NON VÉRIFIÉ',
    team_domain_placeholder: 'votreentreprise.com',
    team_btn_start_verification: 'Lancer la vérification',
    team_btn_working: 'Traitement…',
    team_dns_step: '1. Ajoutez cet enregistrement TXT chez votre fournisseur DNS :',
    team_btn_verify_now: 'Vérifier maintenant',
    team_btn_checking_dns: 'Vérification DNS…',
    team_notice_staff: 'Affichage des employés authentifiés uniquement : recruteurs, managers et administrateurs système.',
    team_notice_candidates: 'Affichage des candidats externes disposant d’un compte. Pour évaluer leurs CV, ouvrez le Pipeline Candidats.',
    team_col_employee: 'Employé / Membre du personnel',
    team_col_candidate_name: 'Nom du candidat',
    team_col_classification: 'Classification',
    team_col_assigned_role: 'Rôle assigné',
    team_col_account_status: 'Statut du compte',
    team_col_permissions: 'Permissions RBAC',
    team_col_portal_access: 'Accès portail',
    team_col_actions: 'Actions',
    team_empty_staff: 'Aucun membre du personnel interne trouvé.',
    team_empty_candidates: 'Aucun compte candidat externe enregistré pour le moment.',
    team_staff_user: 'Utilisateur interne',
    team_applicant: 'Postulant',
    team_badge_internal: '🏢 PERSONNEL INTERNE',
    team_badge_external: '📄 POSTULANT EXTERNE',
    team_applicant_portal: 'Portail postulant (postuler & suivre)',
    team_view_applications: 'Voir les candidatures',
    team_promote: 'Promouvoir',
    team_promote_title: 'Promouvoir en personnel interne',
    team_edit_role_title: 'Modifier le rôle du membre',
    team_select_role: 'Sélection du rôle & permissions *',
    team_invite_title: 'Inviter un membre',
    team_full_name: 'Nom complet',
    team_full_name_placeholder: 'ex. Jeanne Dupont',
    team_work_email: 'E-mail professionnel *',
    team_work_email_placeholder: 'jeanne@entreprise.com',
    team_role_assignment: 'Attribution du rôle *',
    team_send_invite: 'Envoyer l’invitation',
    team_role_admin: 'Admin (propriétaire complet de l’espace)',
    team_role_recruiter: 'Recruteur (ATS & responsable candidats)',
    team_role_manager: 'Manager recruteur (responsable département)',
    team_role_interviewer: 'Évaluateur (évaluateur technique)',
    team_role_auditor: 'Auditeur de conformité (inspecteur d’audit)',
    team_role_candidate: 'Candidat (portail postulant uniquement)',
    toast_role_updated_title: 'Rôle mis à jour',
    toast_role_updated: 'Rôle de {name} mis à jour : {role}',
    toast_role_failed: 'Échec de la mise à jour du rôle',
    toast_role_network: 'Erreur réseau lors de la mise à jour du rôle',
    toast_invited_title: 'Membre invité',
    toast_invited: 'Invitation envoyée à {email}',
    toast_invite_failed: 'Échec de l’invitation du membre',
    toast_invite_network: 'Erreur réseau lors de l’envoi de l’invitation',
    team_domain_claim_failed: 'Échec du lancement de la revendication de domaine.',
    team_domain_network: 'Erreur réseau lors du lancement de la revendication de domaine.',
    team_verify_failed: 'Échec de la vérification.',
    team_verify_network: 'Erreur réseau lors de la vérification.',
    team_domain_already: 'Ce domaine est déjà vérifié.',
    team_user_fallback: 'Utilisateur',

    settings_title: 'Paramètres de l’espace',
    settings_subtitle: 'Configurez le workflow de recrutement, la politique de rétention et l’image de marque (spec §6.11/§6.12). Chaque modification est consignée au journal d’audit.',
    settings_tab_workflow: 'Workflow & motifs',
    settings_tab_retention: 'Politique de rétention',
    settings_tab_branding: 'Image de marque',
    settings_reasons_title: 'Catalogue des motifs de décision (§6.7)',
    settings_reasons_desc: 'Motifs de décision configurables proposés aux recruteurs lors de l’enregistrement d’une décision. Les catégories hors sujet ou discriminatoires ne doivent pas être ajoutées.',
    settings_no_reasons: 'Aucun motif personnalisé pour le moment.',
    settings_reason_code_placeholder: 'CODE (ex. LACKS_EXPERIENCE)',
    settings_reason_label_placeholder: 'Libellé affiché',
    settings_add_reason: 'Ajouter un motif',
    settings_categories_title: 'Catégories de postes (§6.12)',
    settings_no_categories: 'Aucune catégorie personnalisée pour le moment.',
    settings_category_placeholder: 'Nouvelle catégorie (ex. Ingénierie)',
    settings_boundaries_title: 'Seuils de score (§6.12)',
    settings_strong_match: 'Forte correspondance ≥ (%)',
    settings_manual_review: 'Révision manuelle ≤ (%)',
    settings_save_workflow: 'Enregistrer la configuration du workflow',
    settings_retention_desc: 'Durées de rétention par statut de candidature en jours (spec §6.11). Vide = conservation jusqu’à action manuelle.',
    settings_days_suffix: '(jours)',
    settings_anonymize: 'Anonymiser plutôt que supprimer définitivement les candidatures expirées',
    settings_save_retention: 'Enregistrer la politique de rétention',
    settings_display_name: 'Nom affiché de l’espace',
    settings_logo_url: 'URL du logo (facultatif)',
    settings_primary_color: 'Couleur principale',
    settings_save_branding: 'Enregistrer l’image de marque',
    settings_saving: 'Enregistrement…',
    settings_saved_workflow: 'Configuration du workflow enregistrée.',
    settings_saved_branding: 'Image de marque enregistrée.',
    settings_saved_retention: 'Politique de rétention enregistrée.',
    settings_failed_workflow: 'Échec de l’enregistrement du workflow.',
    settings_failed_branding: 'Échec de l’enregistrement de l’image de marque.',
    settings_failed_retention: 'Échec de l’enregistrement de la politique de rétention.',
    settings_remove_reason: 'Retirer le motif {code}',
    settings_remove_category: 'Retirer la catégorie {category}',

    analytics_metrics_badge: 'MÉTRIQUES §6.10',
    analytics_subtitle: 'Délai de criblage, conversion par étape, complétude des évaluateurs et charge pour les postes autorisés.',
    analytics_filter_from: 'Du',
    analytics_filter_to: 'Au',
    analytics_filter_job: 'Poste',
    analytics_filter_department: 'Département',
    analytics_filter_recruiter: 'Recruteur',
    analytics_filter_stage: 'Étape',
    analytics_loading: 'Chargement des analyses…',
    analytics_metric_applications: 'Candidatures',
    analytics_metric_time_to_screen: 'Délai de criblage',
    analytics_metric_interviewer_completion: 'Complétude évaluateurs',
    analytics_metric_processing_failures: 'Échecs de traitement',
    analytics_metric_low_confidence: 'Faible confiance',
    analytics_metric_active_recruiters: 'Recruteurs actifs',
    analytics_hint_screened: '{count} criblées',
    analytics_hint_median: 'médiane, création → criblage',
    analytics_hint_scorecards: '{submitted}/{total} fiches',
    analytics_hint_failed_processing: 'échecs de traitement de CV',
    analytics_hint_needs_review: 'révision manuelle requise',
    analytics_hint_open_workload: 'avec charge en cours',
    analytics_restricted_note: 'Remarque : certaines données demandées sortent de vos permissions départementales et ont été exclues.',
    analytics_stage_distribution: 'Répartition par étape',
    analytics_time_in_stage: 'Temps par étape',
    analytics_recruiter_workload: 'Charge des recruteurs',
    analytics_empty_period: 'Aucune candidature sur la période sélectionnée.',
    analytics_empty_open: 'Aucune candidature ouverte.',
    analytics_empty_assigned: 'Aucune candidature assignée ouverte.',
    analytics_col_stage: 'Étape',
    analytics_col_count: 'Nombre',
    analytics_col_median: 'Médiane',
    analytics_definitions: 'Définitions des métriques',
    analytics_error: 'Échec du chargement des analyses',

    email_title: 'Santé des envois d’e-mails',
    email_subtitle: 'Envois transactionnels échoués ces 7 derniers jours (spec §6.9). Cliquez sur une ligne pour voir l’erreur du fournisseur.',
    email_back: '← Retour au tableau de bord',
    email_empty_title: 'Aucun envoi échoué',
    email_empty_desc: 'Chaque e-mail transactionnel des 7 derniers jours a été enregistré comme ENVOYÉ (ou aucun n’a été envoyé).',
    email_failed_heading: 'Envois échoués — {total} au total',
    email_total_suffix: 'au total',
    email_col_when: 'Quand',
    email_col_recipient: 'Destinataire',
    email_col_template: 'Modèle',
    email_col_status: 'Statut',
    email_status_failed: 'ÉCHEC',
    email_hide_error: '▲ masquer l’erreur',
    email_show_error: '▼ afficher l’erreur',
    email_no_detail: 'Aucun détail d’erreur fournisseur n’a été enregistré pour cet envoi.',
    btn_retry_delivery: '↻ Réessayer l’envoi',
    email_retrying: 'Nouvelle tentative…',
    email_retry_ok: 'Nouvelle tentative réussie — l’e-mail a été délivré.',
    email_retry_failed: 'Échec de la nouvelle tentative : {detail}',
    email_retry_network: 'Erreur réseau — la nouvelle tentative n’a pas été tentée.',
    email_ops_badge: 'TÉLÉMÉTRIE OPS',
    email_all_templates: 'Tous les modèles',

    privacy_requests_title: 'Demandes de données (rectification, accès, retrait)',
    privacy_requests_desc: 'Soumettez une demande formelle. Elle est enregistrée, suivie et transmise à notre équipe confidentialité pour examen — vous serez contacté(e) avec le résultat.',
    privacy_request_correction: 'Corriger mes données',
    privacy_request_correction_hint: 'Indiquez ce qui est inexact et ce que cela devrait dire (ex. numéro erroné, nom mal orthographié).',
    privacy_request_access: 'Obtenir une copie de mes données',
    privacy_request_access_hint: 'Nous préparerons et vous enverrons les données personnelles que nous détenons à votre sujet.',
    privacy_request_withdrawal: 'Retirer mon consentement',
    privacy_request_withdrawal_hint: 'Demandez l’arrêt du traitement de votre candidature. Le recrutement en cours s’arrêtera.',
    privacy_request_deletion: 'Demander une revue de suppression',
    privacy_request_deletion_hint: 'Pour une effacement immédiat complet, utilisez le contrôle Droit à l’oubli ci-dessus — ceci demande à l’équipe confidentialité d’examiner la suppression d’enregistrements précis.',
    privacy_change_placeholder: 'Que devraient dire vos données à la place ?',
    privacy_context_placeholder: 'Contexte additionnel (facultatif)',
    privacy_submit_request: 'Envoyer la demande',
    privacy_submitting: 'Envoi…',
    privacy_past_requests: 'Vos demandes précédentes',
    privacy_network_error: 'Erreur réseau — la demande n’a pas été soumise.',
    privacy_submit_failed: 'Échec de la soumission de la demande.',
    privacy_request_recorded: 'Votre demande a été enregistrée.',
    privacy_portability_toast_title: 'Export RGPD',
    privacy_erasure_toast_title: 'Droit à l’oubli',
    privacy_erasure_success: 'Votre compte et vos données personnelles ont été intégralement effacés',
    privacy_export_failed: 'Échec de l’export des données',
    privacy_erasure_failed: 'Échec de la soumission de la demande d’effacement',

    compare_matrix_title: 'Matrice comparative des candidats',
    compare_matrix_subtitle: 'Comparaison directe des scores pondérés, étapes de recrutement et qualifications.',
    compare_col_candidate: 'Candidat',
    compare_col_requisition: 'Offre',
    compare_col_match_score: 'Score de correspondance',
    compare_col_stage: 'Étape actuelle',
    compare_col_skills: 'Compétences clés',
    compare_col_action: 'Action',
    compare_view: 'Voir',
    compare_restricted_badge: 'HABILITATION ÉVALUATION REQUISE',
    compare_restricted_title: 'Outil comparatif réservé à l’équipe d’évaluation',
    compare_restricted_desc: 'La comparaison côte à côte est réservée aux Recruteurs, Managers recruteurs et Évaluateurs.',
    compare_restricted_cta: 'Retour au tableau de bord',
    compare_return_dashboard: 'Retour au tableau de bord',

    error_generic_title: 'Une erreur est survenue !',
    btn_try_again: 'Réessayer',
    apply_legacy_title: 'Envoyer la candidature',
    apply_legacy_desc: 'Veuillez remplir le formulaire ci-dessous et téléverser votre CV (PDF ou DOCX, max 5 Mo).',
    apply_legacy_select: 'Sélectionner l’offre',
    apply_legacy_first_name: 'Prénom',
    apply_legacy_last_name: 'Nom',
    apply_legacy_email: 'E-mail',
    apply_legacy_resume: 'Document CV',
    apply_legacy_choose: '-- Choisir un poste --',
    apply_legacy_consent: 'Je consens au traitement de mes données à des fins de recrutement, y compris l’aide au criblage automatisé par IA.',
    apply_legacy_uploading: 'Téléversement...',
    apply_legacy_status_uploading: 'Téléversement du CV en cours...',
    apply_legacy_status_success: 'Succès ! Votre candidature a été envoyée et est en cours de traitement.',
    apply_legacy_upload_failed: 'Échec du téléversement',
    interview_badge: 'PLANIFICATION D’ENTRETIEN',
    interview_title: 'Planifier un entretien structuré',
    interview_subtitle: 'Envoyez les invitations calendrier, préparez les fiches techniques et réservez les membres du jury.',
    interview_success_title: 'Entretien planifié avec succès !',
    interview_success_desc: 'Les invitations calendrier et les liens de visioconférence ont été envoyés. Redirection vers le profil candidat...',
    interview_datetime: 'Date & heure (UTC) *',
    interview_duration: 'Durée de l’entretien *',
    interview_platform: 'Plateforme de réunion *',
    interview_30: '30 minutes',
    interview_45: '45 minutes (standard)',
    interview_60: '60 minutes (approfondi)',
    interview_google_meet: 'Google Meet (généré automatiquement)',
    interview_zoom: 'Réunion Zoom',
    interview_in_person: 'En présentiel (siège de Kigali)',
    interview_submit: 'Confirmer et envoyer l’invitation d’entretien',
    interview_submitting: 'Envoi des invitations calendrier...',
    interview_back: 'Retour au candidat',
    interview_error: 'Impossible de planifier l’entretien. Veuillez réessayer.',

    copilot_thinking: 'Réflexion…',
    copilot_error_network: 'Erreur réseau. Vérifiez votre connexion et réessayez.',
    copilot_error_service: 'Le service d’assistance est injoignable pour le moment. Veuillez réessayer dans un instant.',
    copilot_input_label: 'Écrire au Copilote RecruitAI',
    copilot_reset_title: 'Réinitialiser la conversation',
    copilot_greeting: 'Bonjour',
    copilot_acknowledge: 'Compris',
    copilot_handoff_note: 'Pour tout ce qui dépasse RecruitAI, notre équipe humaine peut vous aider — cet assistant reste concentré sur la plateforme.',
    copilot_chip_more: 'Dites-m’en plus',
    copilot_chip_apply: 'Comment postuler ?',
    copilot_chip_track: 'Suivre mes candidatures',
    copilot_chip_permissions: 'Permissions des rôles',

    feedback_thanks: 'Merci pour votre retour ! Cela aide à entraîner l’IA.',
    feedback_question: 'Le score de l’IA était-il exact ?',
    feedback_placeholder: 'Commentaire facultatif...',
    feedback_yes: 'Oui, exact',
    feedback_no: 'Non, remplacer la décision',
    toast_telemetry_refreshed: 'Télémétrie du pipeline actualisée depuis la base de données',
    toast_telemetry_title: 'Télémétrie mise à jour'
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
    nav_analytics: 'Analítica',
    nav_my_applications: 'Mis Solicitudes',
    nav_quick_apply: 'Ver Ofertas Abiertas',
    nav_profile: 'Mi perfil',
    profile_title: 'Mi perfil',
    profile_subtitle: 'Tu cuenta, tu CV y cómo te presentas a los empleadores',
    profile_saved_cv: 'CV guardado',
    profile_no_cv: 'Aún no hay CV guardado — sube uno para postular con un clic.',
    profile_upload_cv: 'Subir CV',
    profile_replace_cv: 'Reemplazar CV',
    profile_remove_cv: 'Eliminar',
    profile_one_click_hint: 'Tu CV guardado se reutiliza para postular con un clic. Cada postulación recibe su propia evaluación.',
    profile_skills: 'Habilidades',
    profile_experience: 'Resumen de experiencia',
    profile_save: 'Guardar perfil',
    profile_saved: 'Perfil guardado',

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
    qp_apply_track: '📋 Postularme y seguir',

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

    cprofile_status_label: 'Estado',
    cprofile_no_resume_text: 'No se ha analizado ningún CV en texto plano para esta solicitud.',
    cprofile_summary_fallback: 'Evaluación asistida por IA comparada con los criterios de cribado aprobados de la vacante.',
    cprofile_active_badge: 'ACTIVO',
    cprofile_interviewer_fallback: 'Entrevistador',
    cprofile_scorecard_you: 'Tú (usuario actual)',
    cprofile_tech_short: 'Técnica',
    cprofile_comm_short: 'Comunic.',
    cprofile_problem_short: 'Resolución',
    cprofile_questions_targeting: 'Enfoque en las brechas de criterios y señales de evaluación del candidato',
    cprofile_questions_analyzing: 'Analizando brechas de habilidades y generando preguntas específicas...',
    cprofile_targeted_competency: 'Competencia específica',
    cprofile_question_n: 'Pregunta {count}',
    cprofile_copy_btn: 'Copiar',
    cprofile_what_to_look_for: 'Qué buscar:',
    cprofile_notes_placeholder: 'Notas...',
    cprofile_reason_qualifications_match: 'Coincidencia de cualificaciones y habilidades',
    cprofile_reason_excellent_technical_fit: 'Excelente encaje técnico',
    cprofile_reason_experience_gap: 'Brecha de experiencia o habilidades',
    cprofile_reason_communication_fit: 'Comunicación y encaje de equipo',
    cprofile_reason_compensation_mismatch: 'Desajuste de compensación o calendario',
    cprofile_reason_talent_bench: 'Reservado para una vacante futura',
    cprofile_reason_candidate_withdrew: 'El candidato retiró su solicitud',
    cprofile_reason_other: 'Otro motivo relacionado con el puesto',
    cprofile_justification_label: 'Justificación',
    cprofile_justification_placeholder: 'Justificación...',
    cprofile_override_warning: 'Los recalibrados de puntuación se registran permanentemente en el libro de auditoría inmutable.',
    cprofile_adjusted_score: 'Puntuación ajustada (0 - 100)',
    cprofile_override_placeholder: 'Sólidas habilidades de arquitectura de sistemas demostradas...',
    cprofile_annual_compensation: 'Paquete de compensación anual',
    cprofile_start_date: 'Fecha de inicio',
    cprofile_uncertain_evidence: 'Este resultado requiere revisión humana porque la evidencia es incierta.',
    cprofile_candidate_code: 'Candidato #{code}',
    cprofile_applicant_fallback: 'Postulante',
    toast_score_recalibrated: 'Puntuación de ajuste recalibrada a {score} %',
    toast_score_recalibrated_title: 'Puntuación recalibrada',
    toast_score_recalibration_failed: 'No se pudo registrar el recalibrado de la puntuación',
    toast_network_recalibration: 'Error de red durante el recalibrado',
    toast_offer_sent: 'Oferta de {salary} enviada al candidato',
    toast_offer_sent_title: 'Oferta enviada',
    toast_offer_failed: 'No se pudo extender la oferta formal',
    toast_network_offer: 'Error de red al enviar la oferta',
    toast_scorecard_recorded: 'Evaluación de entrevista ({recommendation}) registrada con éxito',
    toast_scorecard_title: 'Evaluación guardada',
    toast_scorecard_failed: 'No se pudo enviar la evaluación de entrevista',
    toast_network_scorecard: 'Error de red al guardar la evaluación',
    toast_decision_rationale_required: 'La justificación de la decisión es obligatoria',
    toast_decision_recorded: 'Decisión «{decision}» registrada en el registro de auditoría',
    toast_decision_title: 'Decisión finalizada',
    toast_decision_failed: 'No se pudo registrar la decisión',
    toast_network_decision: 'Error de red al registrar la decisión',
    toast_question_copied: 'Pregunta copiada al portapapeles',
    toast_evidence_located: 'Evidencia localizada: «{evidence}»',
    toast_blind_enabled: 'Criba a ciegas activada: datos personales ocultos',
    toast_pii_revealed: 'Datos personales visibles',

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
    dup_merge_failed: 'La fusión falló; inténtalo de nuevo.',
    dup_merge_error_title: 'Error de deduplicación',
    dup_merged_toast: 'Registros de candidatos duplicados fusionados para {email}',
    dup_merged_title: 'Deduplicación completada',
    dup_profiles_count: '{count} perfiles de candidatos coincidentes',
    dup_merging: 'Fusionando…',
    dup_applications_count: '{count} solicitudes enviadas',

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
    cmd_cat_navigation: 'Navegación',
    cmd_cat_analytics: 'Analítica',
    cmd_cat_requisitions: 'Vacantes',
    cmd_cat_compliance: 'Cumplimiento',
    cmd_cat_administration: 'Administración',
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
    error: 'Ocurrió un error',

    first_name: 'Nombre',
    last_name: 'Apellido',
    email_addr: 'Correo electrónico',
    phone_number: 'Teléfono',
    upload_resume: 'Documento de CV (PDF, DOCX, TXT)',
    gdpr_consent: 'Acepto el procesamiento de mi CV conforme a las políticas de privacidad de datos (RGPD).',
    submit_application: 'Enviar solicitud',
    apply_job_missing_title: 'No se pudo encontrar esta vacante',
    apply_job_missing_desc: 'El puesto pudo haberse cerrado, archivado o el enlace está desactualizado. Explora las vacantes actuales para encontrar una activa.',
    apply_browse_open: 'Ver puestos disponibles',
    apply_official_badge: 'Solicitud oficial',
    apply_staff_title: 'Conectado como miembro del equipo de contratación',
    apply_staff_desc: 'Estás autenticado como empleado interno. El personal interno revisa candidaturas en lugar de postularse a las vacantes.',
    apply_redirecting: 'Redirigiendo a tu portal de seguimiento…',
    apply_cv_document: 'Documento de CV',
    apply_use_saved_cv: 'Usar mi CV guardado',
    apply_from_profile: 'Desde tu perfil · sin carga necesaria',
    apply_upload_different: 'Subir un CV diferente para esta solicitud',
    apply_click_or_drop: 'Haz clic para seleccionar o arrastra y suelta tu CV aquí',
    apply_file_hint: 'PDF, DOCX, TXT o MD · máx. 5 MB',
    apply_error_no_cv: 'Adjunta tu documento de CV.',
    apply_error_no_consent: 'Otorga el consentimiento RGPD para el filtrado con IA automatizado.',

    erasure_warning: '¿Estás seguro? Esta acción es permanente e irreversible. Todas tus solicitudes, CV y el acceso a la cuenta serán destruidos.',
    sign_in: 'Iniciar sesión',
    session_enforced: 'Permisos de rol estrictamente aplicados.',
    role_admin_desc: 'Administrador del sistema: telemetría, pipeline de candidatos y gobernanza de usuarios.',
    role_recruiter_desc: 'Reclutador líder: propiedad del pipeline ATS, recalibración de puntuaciones y extensión de ofertas.',
    role_hiring_manager_desc: 'Gerente de contratación: revisión departamental, benchmarks y programación de entrevistas.',
    role_interviewer_desc: 'Entrevistador técnico: evaluación de candidatos, preguntas y tarjetas de evaluación.',
    role_auditor_desc: 'Auditor de cumplimiento: acceso de solo lectura a registros de auditoría inmutables.',
    role_candidate_desc: 'Postulante: seguimiento de solicitudes, directorio de empleos y autoservicio RGPD.',

    nav_settings: 'Configuración del espacio',
    active_role: 'Rol activo:',
    brand_tagline: 'ATS Empresarial',

    workspace_overview: 'Resumen del espacio',
    btn_review_applications: 'Revisar candidaturas',
    kpi_across_jobs: 'En empleos activos',
    kpi_shortlisted_pool: 'Preseleccionados',
    kpi_active_rubrics: 'Rúbricas activas',
    kpi_passed_threshold: 'Umbrales superados',
    kpi_sha_logs: 'Registros SHA-256',
    stage_needs_review: 'Necesita revisión',
    stage_rejected: 'Rechazados / Fuera de alcance',
    stage_new: 'Nuevo',
    stage_on_hold: 'En espera',
    stage_interview_scheduled: 'Entrevista programada',
    stage_hired: 'Contratado',
    stage_withdrawn: 'Retirado',
    processing_queued: 'En cola',
    processing_in_progress: 'Procesando',
    processing_completed: 'Completado',
    processing_failed: 'Error',
    audit_just_now: 'Justo ahora',
    audit_verified: '✓ VERIFICADO',
    telemetry_quality_title: 'Telemetría de calidad y fiabilidad del filtrado (§6.10)',
    telemetry_quality_chip: 'Métricas auditadas',
    telemetry_quality_hint: 'Monitoreo automático de la confianza de extracción, overrides humanos y salud del sistema',
    metric_low_confidence: 'Señales de baja confianza',
    metric_low_confidence_hint: 'Confianza < 80 % (revisión requerida)',
    metric_manual_corrections: 'Correcciones manuales',
    metric_manual_corrections_hint: 'Perfiles corregidos por reclutador',
    metric_score_overrides: 'Puntuaciones sustituidas',
    metric_score_overrides_hint: 'Puntuaciones recalibradas por humanos',
    metric_processing_failures: 'Fallos de procesamiento',
    metric_processing_failures_hint: 'Reintento seguro disponible',
    metric_upcoming_interviews: 'Próximas entrevistas',
    metric_upcoming_interviews_hint: 'Programadas y activas',
    metric_failed_emails: 'Correos fallidos (7 d)',
    metric_failed_emails_hint: 'Salud de envíos transaccionales',
    metric_failed_emails_latest: 'Último: {template}',
    telemetry_email_banner: '{count} envíos de correo fallaron en los últimos 7 días; algunos destinatarios nunca fueron notificados. Revisar errores de entrega',
    telemetry_email_banner_one: '1 envío de correo falló en los últimos 7 días; el destinatario nunca fue notificado. Revisar errores de entrega',
    telemetry_email_review: 'Revisar errores de entrega',

    metric_visible_apps: 'Solicitudes visibles',
    metric_needs_review: 'Necesita revisión',
    metric_avg_match: 'Coincidencia media',
    metric_shortlisted: 'Preseleccionados',
    metric_rejected: 'Rechazados',
    filters: 'Filtros',
    filter_job: 'Empleo',
    filter_stage: 'Etapa',
    filter_recruiter: 'Reclutador',
    filter_min_score: 'Puntuación mín. (%)',
    filter_max_score: 'Puntuación máx. (%)',
    filter_required_criteria: 'Criterios obligatorios',
    filter_processing: 'Procesamiento',
    filter_tag: 'Etiqueta',
    filter_applied_from: 'Postulado desde',
    filter_applied_to: 'Postulado hasta',
    filter_all_jobs: 'Todos los empleos',
    filter_all_stages: 'Todas las etapas',
    filter_all_recruiters: 'Todos los reclutadores',
    filter_any_status: 'Cualquier estado',
    filter_missing_required: 'Falta obligatorio',
    filter_uncertain_evidence: 'Evidencia incierta',
    filter_any_tag: 'Cualquier etiqueta',
    filter_clear_all: 'Limpiar todos los filtros',
    bulk_selected: '{count} seleccionadas:',
    bulk_shortlist: 'Preseleccionar',
    bulk_advance: 'Avanzar',
    bulk_hold: 'Poner en espera',
    bulk_review: 'Devolver a revisión',
    bulk_reject: 'Rechazar',
    bulk_withdraw: 'Retirar',
    bulk_clear_selection: 'Limpiar selección',
    bulk_confirm_title: 'Confirmar «{action}» en {count} solicitud(es)',
    bulk_confirm_desc: 'Esto registra una decisión en cada solicitud seleccionada bajo tu cuenta y se escribe en la pista de auditoría. No puede deshacerse silenciosamente.',
    bulk_confirm_aria: 'Confirmar decisión masiva',
    bulk_reason_label: 'Motivo (obligatorio)',
    bulk_reason_placeholder: '¿Por qué se aplica esta decisión masiva?',
    bulk_error_required: 'Se requiere un motivo obligatorio para las decisiones masivas.',
    bulk_error_failed: 'La acción masiva falló.',
    bulk_error_network: 'Error de red: la acción masiva no se aplicó.',
    bulk_applying: 'Aplicando…',
    bulk_confirm_action: 'Confirmar {action}',
    pagination_showing: '{from}–{to} de {total}',
    pagination_prev: '← Anterior',
    pagination_next: 'Siguiente →',
    aria_filter_department: 'Filtrar por departamento',
    aria_pipeline_view: 'Vista del pipeline',
    aria_select_all: 'Seleccionar todas las solicitudes visibles',
    aria_pipeline_pagination: 'Paginación del pipeline',
    applicants_count: '{count} postulantes',

    status_closed: 'Cerrada',
    jobs_search_placeholder: 'Buscar título, descripción, departamento…',
    aria_search_requisitions: 'Buscar vacantes',
    aria_filter_status: 'Filtrar por estado',
    filter_all_statuses: 'Todos los estados',
    btn_apply_filters: 'Aplicar',
    btn_clear: 'Limpiar',
    edit_rubric: 'Editar rúbrica',
    rubric_preview: 'Vista previa',
    criteria_more: '+{count} más',
    applicants: 'postulantes',
    btn_copy: 'Copiar',
    btn_cloning: 'Clonando…',
    btn_close: 'Cerrar',
    btn_publish: 'Publicar',
    btn_publishing: 'Publicando…',
    chip_applied: '✓ Postulado',
    chip_match_pct: '{score}% de coincidencia',
    aria_latest_score: 'Última puntuación de filtrado IA de tu solicitud',
    btn_one_click_apply: '⚡ Postulación 1 clic',
    btn_applying: 'Postulando…',
    aria_apply_instant: 'Postula al instante con el CV guardado en tu perfil',
    aria_duplicate_requisition: 'Duplicar esta vacante',
    aria_close_requisition: 'Cerrar esta vacante',
    aria_close_dialog: 'Cerrar diálogo',
    aria_remove_criterion: 'Quitar criterio',
    aria_audit_pagination: 'Paginación del registro de auditoría',
    edit_rubric_title: 'Editar rúbrica — {title}',
    rubric_approved_warning: 'Esta rúbrica está aprobada. Guardar creará una nueva versión BORRADOR: la versión actual sigue puntuando solicitudes hasta que se apruebe la nueva, y los resultados históricos nunca se alteran.',
    criteria_count: 'Criterios ({count})',
    add_criterion: '+ Añadir criterio',
    criterion_description: 'Descripción del criterio',
    criterion_required: 'Obligatorio',
    criterion_preferred: 'Deseable',
    change_reason_label: 'Motivo del cambio',
    change_reason_optional: 'Motivo del cambio (opcional)',
    change_reason_placeholder: '¿Por qué cambia la rúbrica? (quedará registrado en la auditoría)',
    save_rubric: 'Guardar rúbrica',
    location_label: 'Ubicación',
    employment_type_label: 'Tipo de empleo',
    closes_at_label: 'Cierre de solicitudes (opcional)',
    employment_full_time: 'Tiempo completo',
    employment_part_time: 'Medio tiempo',
    employment_contract: 'Contrato',
    employment_internship: 'Pasantía',
    desc_placeholder: 'Responsabilidades, stack requerido y calificaciones...',
    criterion_example: 'ej. Sistemas distribuidos (Go/Rust)',
    title_placeholder: 'ej. Arquitecto Frontend Senior',
    dept_engineering: 'Ingeniería',
    dept_product: 'Producto y Diseño',
    dept_data_ai: 'Datos e IA',
    dept_sales: 'Ventas y Marketing',
    dept_operations: 'Operaciones y RR. HH.',
    location_placeholder: 'ej. Kigali / Remoto',
    toast_applied_saved_cv: 'Postulado a «{title}» con tu CV guardado',
    toast_one_click_title: 'Postulación 1 clic',
    toast_one_click_failed: 'Falló la postulación de un clic',
    toast_title_desc_required: 'El título y la descripción son obligatorios',
    toast_requisition_published: 'Vacante «{title}» publicada en vivo',
    toast_requisition_created_title: 'Vacante creada',
    toast_create_failed: 'Error al crear la vacante',
    toast_network_create: 'Error de red al crear la vacante',
    toast_no_rubric: 'Esta vacante no tiene rúbrica para editar',
    toast_rubric_min_one: 'Una rúbrica necesita al menos un criterio',
    toast_reason_required: 'Se requiere un motivo al editar una rúbrica aprobada',
    toast_rubric_updated: 'Criterios de la rúbrica actualizados',
    toast_rubric_new_draft: 'Nueva versión BORRADOR creada: apruébala para usarla en el filtrado',
    toast_rubric_update_failed: 'Error al actualizar la rúbrica',
    toast_rubric_saved_title: 'Rúbrica guardada',
    toast_rubric_network: 'Error de red al actualizar la rúbrica',
    toast_no_rubric_approve: 'Esta vacante no tiene rúbrica para aprobar',
    toast_requisition_visible: '«{title}» ya es visible para los postulantes',
    toast_requisition_published_title: 'Vacante publicada',
    toast_publish_failed: 'Error al publicar la vacante ({status})',
    toast_network_publish: 'Error de red al publicar la vacante',
    toast_requisition_duplicated: 'Vacante duplicada como «{title}»',
    toast_requisition_cloned_title: 'Vacante clonada',
    toast_duplicate_failed: 'Error al duplicar la vacante',
    toast_network_duplicate: 'Error de red al duplicar la vacante',
    toast_requisition_closed: 'La vacante «{title}» ya está cerrada',
    toast_requisition_closed_title: 'Vacante cerrada',
    toast_close_failed: 'Error al cerrar la vacante',
    toast_network_close: 'Error de red al cerrar la vacante',
    toast_incomplete_response: 'El servidor devolvió una respuesta de vacante incompleta',

    my_apps_score_hint: 'El % de coincidencia es tu última puntuación de filtrado IA frente a la rúbrica de cada puesto: guía la preselección, no es una decisión final.',
    my_apps_empty_tip: 'Consejo: guarda tu CV en tu perfil y cada puesto abierto será una postulación de un clic.',
    my_apps_profile_link: 'perfil',
    aria_app_score: 'Última puntuación de filtrado IA para esta solicitud',
    match_band_strong: 'Coincidencia fuerte',
    match_band_good: 'Buena coincidencia',
    match_band_building: 'En desarrollo',

    profile_workspace_candidate: 'Espacio del candidato',
    profile_workspace_account: 'Cuenta del espacio',
    profile_display_name: 'Nombre visible',
    profile_name_placeholder: 'Tu nombre completo',
    profile_member_since: '· miembro desde {date}',
    profile_department_access: 'Acceso a departamentos:',
    profile_applications_count: '{count} solicitudes',
    profile_cv_saved_ok: 'CV guardado: la postulación de un clic está desbloqueada.',
    profile_cv_removed_ok: 'CV guardado eliminado.',
    profile_add: 'Añadir',
    profile_skill_placeholder: 'Escribe una habilidad y pulsa Enter — p. ej. React, SQL, Figma',
    profile_skill_remove_hint: 'Clic para quitar',
    profile_experience_placeholder: 'Un breve resumen de tu experiencia — puestos, años, logros…',
    profile_about_you: 'Sobre ti',
    profile_file_hint: 'PDF, DOCX, TXT, MD · máx. 5 MB',
    profile_saving: 'Guardando…',
    profile_save_failed: 'Error al guardar el perfil',
    profile_cv_save_failed: 'Error al guardar el CV',
    profile_cv_remove_failed: 'Error al eliminar el CV',
    profile_cv_saved_on: 'guardado el {date}',
    aria_upload_cv: 'Subir CV',

    audit_search_actor: 'Buscar por correo del actor…',
    audit_search_actor_aria: 'Buscar en el registro por correo del actor',
    audit_search_action: 'Acción p. ej. DECISION',
    audit_search_action_aria: 'Buscar en el registro por acción',
    audit_from_date: 'Desde',
    audit_from_date_aria: 'Fecha inicial',
    audit_to_date: 'Hasta',
    audit_to_date_aria: 'Fecha final',
    btn_search: 'Buscar',
    audit_sealed: '✓ SELLADO',
    audit_logs_count: '{count} REGISTROS',

    team_accounts_badge: '{count} CUENTAS EN TOTAL',
    team_domain_title: '🔐 Identidad del espacio',
    team_domain_desc: 'El personal con un correo de tu dominio verificado se une automáticamente a este espacio al registrarse.',
    team_domain_verified: '✓ {domain}',
    team_domain_not_verified: '⚠ NO VERIFICADO',
    team_domain_placeholder: 'tuempresa.com',
    team_btn_start_verification: 'Iniciar verificación',
    team_btn_working: 'Trabajando…',
    team_dns_step: '1. Añade este registro TXT en tu proveedor DNS:',
    team_btn_verify_now: 'Verificar ahora',
    team_btn_checking_dns: 'Verificando DNS…',
    team_notice_staff: 'Mostrando solo empleados autenticados: reclutadores, gerentes y administradores del sistema.',
    team_notice_candidates: 'Mostrando postulantes externos con cuentas registradas. Para evaluar sus CV, abre el Pipeline de Candidatos.',
    team_col_employee: 'Empleado / Miembro del personal',
    team_col_candidate_name: 'Nombre del candidato',
    team_col_classification: 'Clasificación',
    team_col_assigned_role: 'Rol asignado',
    team_col_account_status: 'Estado de la cuenta',
    team_col_permissions: 'Permisos RBAC',
    team_col_portal_access: 'Acceso al portal',
    team_col_actions: 'Acciones',
    team_empty_staff: 'No se encontró personal interno.',
    team_empty_candidates: 'Aún no hay cuentas de candidatos externos registradas.',
    team_staff_user: 'Usuario del personal',
    team_applicant: 'Postulante',
    team_badge_internal: '🏢 PERSONAL INTERNO',
    team_badge_external: '📄 POSTULANTE EXTERNO',
    team_applicant_portal: 'Portal del postulante (postular y seguir)',
    team_view_applications: 'Ver solicitudes',
    team_promote: 'Promover',
    team_promote_title: 'Promover a personal interno',
    team_edit_role_title: 'Editar rol del miembro',
    team_select_role: 'Seleccionar rol y permisos *',
    team_invite_title: 'Invitar miembro del personal',
    team_full_name: 'Nombre completo',
    team_full_name_placeholder: 'p. ej. Jane Doe',
    team_work_email: 'Correo de trabajo *',
    team_work_email_placeholder: 'jane@empresa.com',
    team_role_assignment: 'Asignación de rol *',
    team_send_invite: 'Enviar invitación',
    team_role_admin: 'Admin (propietario total del espacio)',
    team_role_recruiter: 'Reclutador (ATS y dueño de candidatos)',
    team_role_manager: 'Gerente de contratación (jefe de departamento)',
    team_role_interviewer: 'Entrevistador (evaluador técnico)',
    team_role_auditor: 'Auditor de cumplimiento (inspector de auditoría)',
    team_role_candidate: 'Candidato (solo portal de postulante)',
    toast_role_updated_title: 'Rol actualizado',
    toast_role_updated: 'Rol de {name} actualizado a {role}',
    toast_role_failed: 'Error al actualizar el rol',
    toast_role_network: 'Error de red al actualizar el rol',
    toast_invited_title: 'Miembro invitado',
    toast_invited: 'Invitación enviada a {email}',
    toast_invite_failed: 'Error al invitar al miembro',
    toast_invite_network: 'Error de red al enviar la invitación',
    team_domain_claim_failed: 'Error al iniciar la reclamación del dominio.',
    team_domain_network: 'Error de red al iniciar la reclamación del dominio.',
    team_verify_failed: 'Falló la verificación.',
    team_verify_network: 'Error de red durante la verificación.',
    team_domain_already: 'Este dominio ya está verificado.',
    team_user_fallback: 'Usuario',

    settings_title: 'Configuración del espacio',
    settings_subtitle: 'Configura el flujo de reclutamiento, la política de retención y la marca (espec §6.11/§6.12). Cada cambio se registra en la pista de auditoría.',
    settings_tab_workflow: 'Flujo y motivos',
    settings_tab_retention: 'Política de retención',
    settings_tab_branding: 'Marca',
    settings_reasons_title: 'Catálogo de motivos de decisión (§6.7)',
    settings_reasons_desc: 'Motivos configurables que se ofrecen a los reclutadores al registrar una decisión. No deben añadirse categorías irrelevantes o discriminatorias.',
    settings_no_reasons: 'Aún no hay motivos personalizados.',
    settings_reason_code_placeholder: 'CÓDIGO (p. ej. LACKS_EXPERIENCE)',
    settings_reason_label_placeholder: 'Etiqueta visible',
    settings_add_reason: 'Añadir motivo',
    settings_categories_title: 'Categorías de empleo (§6.12)',
    settings_no_categories: 'Aún no hay categorías personalizadas.',
    settings_category_placeholder: 'Nueva categoría (p. ej. Ingeniería)',
    settings_boundaries_title: 'Umbrales de puntuación (§6.12)',
    settings_strong_match: 'Coincidencia fuerte ≥ (%)',
    settings_manual_review: 'Revisión manual ≤ (%)',
    settings_save_workflow: 'Guardar configuración del flujo',
    settings_retention_desc: 'Períodos de retención por estado de solicitud en días (espec §6.11). Vacío = conservar hasta acción manual.',
    settings_days_suffix: '(días)',
    settings_anonymize: 'Anonimizar en lugar de eliminar definitivamente las solicitudes vencidas',
    settings_save_retention: 'Guardar política de retención',
    settings_display_name: 'Nombre visible del espacio',
    settings_logo_url: 'URL del logotipo (opcional)',
    settings_primary_color: 'Color principal',
    settings_save_branding: 'Guardar marca',
    settings_saving: 'Guardando…',
    settings_saved_workflow: 'Configuración del flujo guardada.',
    settings_saved_branding: 'Marca guardada.',
    settings_saved_retention: 'Política de retención guardada.',
    settings_failed_workflow: 'Error al guardar la configuración del flujo.',
    settings_failed_branding: 'Error al guardar la marca.',
    settings_failed_retention: 'Error al guardar la política de retención.',
    settings_remove_reason: 'Quitar motivo {code}',
    settings_remove_category: 'Quitar categoría {category}',

    analytics_metrics_badge: 'MÉTRICAS §6.10',
    analytics_subtitle: 'Tiempo hasta el filtrado, conversión por etapa, finalización de entrevistadores y carga para los empleos permitidos.',
    analytics_filter_from: 'Desde',
    analytics_filter_to: 'Hasta',
    analytics_filter_job: 'Empleo',
    analytics_filter_department: 'Departamento',
    analytics_filter_recruiter: 'Reclutador',
    analytics_filter_stage: 'Etapa',
    analytics_loading: 'Cargando análisis…',
    analytics_metric_applications: 'Solicitudes',
    analytics_metric_time_to_screen: 'Tiempo hasta filtrado',
    analytics_metric_interviewer_completion: 'Finalización de entrevistadores',
    analytics_metric_processing_failures: 'Fallos de procesamiento',
    analytics_metric_low_confidence: 'Baja confianza',
    analytics_metric_active_recruiters: 'Reclutadores activos',
    analytics_hint_screened: '{count} filtradas',
    analytics_hint_median: 'mediana, creación → filtrado',
    analytics_hint_scorecards: '{submitted}/{total} tarjetas',
    analytics_hint_failed_processing: 'procesamiento de CV fallido',
    analytics_hint_needs_review: 'requiere revisión manual',
    analytics_hint_open_workload: 'con carga abierta',
    analytics_restricted_note: 'Nota: algunos datos solicitados están fuera de tus permisos de departamento y fueron excluidos.',
    analytics_stage_distribution: 'Distribución por etapa',
    analytics_time_in_stage: 'Tiempo en etapa',
    analytics_recruiter_workload: 'Carga de reclutadores',
    analytics_empty_period: 'No hay solicitudes en el período seleccionado.',
    analytics_empty_open: 'No hay solicitudes abiertas.',
    analytics_empty_assigned: 'No hay solicitudes abiertas asignadas.',
    analytics_col_stage: 'Etapa',
    analytics_col_count: 'Cantidad',
    analytics_col_median: 'Mediana',
    analytics_definitions: 'Definiciones de métricas',
    analytics_error: 'Error al cargar los análisis',

    email_title: 'Salud de envíos de correo',
    email_subtitle: 'Envíos transaccionales fallidos en los últimos 7 días (espec §6.9). Haz clic en una fila para ver el error del proveedor.',
    email_back: '← Volver al panel',
    email_empty_title: 'No hay envíos fallidos',
    email_empty_desc: 'Cada correo transaccional de los últimos 7 días quedó registrado como ENVIADO (o no se envió ninguno).',
    email_failed_heading: 'Envíos fallidos — {total} en total',
    email_total_suffix: 'en total',
    email_col_when: 'Cuándo',
    email_col_recipient: 'Destinatario',
    email_col_template: 'Plantilla',
    email_col_status: 'Estado',
    email_status_failed: 'FALLIDO',
    email_hide_error: '▲ ocultar error',
    email_show_error: '▼ mostrar error',
    email_no_detail: 'No se registró detalle del error del proveedor para este envío.',
    btn_retry_delivery: '↻ Reintentar envío',
    email_retrying: 'Reintentando…',
    email_retry_ok: 'Reintento exitoso: el correo fue entregado.',
    email_retry_failed: 'Falló el reintento: {detail}',
    email_retry_network: 'Error de red: no se intentó el reintento.',
    email_ops_badge: 'TELEMETRÍA OPS',
    email_all_templates: 'Todas las plantillas',

    privacy_requests_title: 'Solicitudes de datos (rectificación, acceso, retiro)',
    privacy_requests_desc: 'Envía una solicitud formal. Se registra, se da seguimiento y se deriva a nuestro equipo de privacidad para revisión: te contactaremos con el resultado.',
    privacy_request_correction: 'Corregir mis datos',
    privacy_request_correction_hint: 'Indica qué es inexacto y qué debería decir (p. ej. teléfono erróneo, nombre mal escrito).',
    privacy_request_access: 'Obtener copia de mis datos',
    privacy_request_access_hint: 'Prepararemos y te enviaremos los datos personales que tenemos sobre ti.',
    privacy_request_withdrawal: 'Retirar mi consentimiento',
    privacy_request_withdrawal_hint: 'Pide detener el procesamiento de tu solicitud. El reclutamiento en curso se detendrá.',
    privacy_request_deletion: 'Solicitar revisión de eliminación',
    privacy_request_deletion_hint: 'Para el borrado inmediato completo, usa el control Derecho al Olvido de arriba: esto pide al equipo de privacidad revisar la eliminación de registros específicos.',
    privacy_change_placeholder: '¿Qué deberían decir tus datos en su lugar?',
    privacy_context_placeholder: 'Contexto adicional (opcional)',
    privacy_submit_request: 'Enviar solicitud',
    privacy_submitting: 'Enviando…',
    privacy_past_requests: 'Tus solicitudes anteriores',
    privacy_network_error: 'Error de red: la solicitud no se envió.',
    privacy_submit_failed: 'Error al enviar la solicitud.',
    privacy_request_recorded: 'Tu solicitud ha sido registrada.',
    privacy_portability_toast_title: 'Exportación RGPD',
    privacy_erasure_toast_title: 'Derecho al Olvido',
    privacy_erasure_success: 'Tu cuenta y datos personales han sido borrados por completo',
    privacy_export_failed: 'Error al exportar los datos',
    privacy_erasure_failed: 'Error al enviar la solicitud de borrado',

    compare_matrix_title: 'Matriz comparativa de candidatos',
    compare_matrix_subtitle: 'Comparación directa de puntuaciones ponderadas, etapas de reclutamiento y calificaciones.',
    compare_col_candidate: 'Candidato',
    compare_col_requisition: 'Vacante',
    compare_col_match_score: 'Puntuación de coincidencia',
    compare_col_stage: 'Etapa actual',
    compare_col_skills: 'Habilidades principales',
    compare_col_action: 'Acción',
    compare_view: 'Ver',
    compare_restricted_badge: 'SE REQUIERE AUTORIZACIÓN DE EVALUACIÓN',
    compare_restricted_title: 'Herramienta comparativa reservada al equipo de evaluación',
    compare_restricted_desc: 'La comparación lado a lado está reservada a Reclutadores, Gerentes de Contratación y Entrevistadores.',
    compare_restricted_cta: 'Volver al Panel de Control',
    compare_return_dashboard: 'Volver al panel',

    error_generic_title: '¡Algo salió mal!',
    btn_try_again: 'Intentar de nuevo',
    apply_legacy_title: 'Enviar solicitud',
    apply_legacy_desc: 'Completa el formulario y sube tu CV (PDF o DOCX, máx. 5 MB).',
    apply_legacy_select: 'Seleccionar vacante',
    apply_legacy_first_name: 'Nombre',
    apply_legacy_last_name: 'Apellido',
    apply_legacy_email: 'Correo',
    apply_legacy_resume: 'Documento de CV',
    apply_legacy_choose: '-- Elegir un puesto --',
    apply_legacy_consent: 'Consiento que mis datos se procesen con fines de selección, incluida la asistencia de cribado automatizado con IA.',
    apply_legacy_uploading: 'Subiendo...',
    apply_legacy_status_uploading: 'Subiendo el CV...',
    apply_legacy_status_success: '¡Éxito! Tu solicitud ha sido enviada y se está procesando.',
    apply_legacy_upload_failed: 'Error al subir',
    interview_badge: 'PROGRAMACIÓN DE ENTREVISTAS',
    interview_title: 'Programar entrevista estructurada',
    interview_subtitle: 'Envía invitaciones de calendario, prepara tarjetas técnicas y reserva al panel de entrevistadores.',
    interview_success_title: '¡Entrevista programada con éxito!',
    interview_success_desc: 'Las invitaciones y enlaces de video fueron enviados. Redirigiendo al perfil del candidato...',
    interview_datetime: 'Fecha y hora (UTC) *',
    interview_duration: 'Duración de la entrevista *',
    interview_platform: 'Plataforma de reunión *',
    interview_30: '30 minutos',
    interview_45: '45 minutos (estándar)',
    interview_60: '60 minutos (profundo)',
    interview_google_meet: 'Google Meet (generado automáticamente)',
    interview_zoom: 'Reunión Zoom',
    interview_in_person: 'Presencial (sede Kigali)',
    interview_submit: 'Confirmar y enviar invitación de entrevista',
    interview_submitting: 'Enviando invitaciones de calendario...',
    interview_back: 'Volver al candidato',
    interview_error: 'No se pudo programar la entrevista. Inténtalo de nuevo.',

    copilot_thinking: 'Pensando…',
    copilot_error_network: 'Error de red. Verifica tu conexión e inténtalo de nuevo.',
    copilot_error_service: 'El servicio de soporte no está disponible ahora. Inténtalo en un momento.',
    copilot_input_label: 'Escribe al Copiloto RecruitAI',
    copilot_reset_title: 'Reiniciar conversación',
    copilot_greeting: 'Hola',
    copilot_acknowledge: 'Entendido',
    copilot_handoff_note: 'Para temas fuera de RecruitAI, nuestro equipo humano puede ayudarte; este asistente se centra en la plataforma.',
    copilot_chip_more: 'Cuéntame más',
    copilot_chip_apply: '¿Cómo me postulo?',
    copilot_chip_track: 'Seguir mis solicitudes',
    copilot_chip_permissions: 'Permisos por rol',

    feedback_thanks: '¡Gracias por tus comentarios! Esto ayuda a entrenar la IA.',
    feedback_question: '¿La puntuación de la IA fue precisa?',
    feedback_placeholder: 'Comentario opcional...',
    feedback_yes: 'Sí, precisa',
    feedback_no: 'No, anular la decisión',
    toast_telemetry_refreshed: 'Telemetría del pipeline actualizada desde la base de datos',
    toast_telemetry_title: 'Telemetría actualizada'
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
    nav_analytics: 'Analytik',
    nav_my_applications: 'Meine Bewerbungen',
    nav_quick_apply: 'Offene Stellen ansehen',
    nav_profile: 'Mein Profil',
    profile_title: 'Mein Profil',
    profile_subtitle: 'Dein Konto, dein CV und wie du dich Arbeitgebern präsentierst',
    profile_saved_cv: 'Gespeicherter Lebenslauf',
    profile_no_cv: 'Noch kein Lebenslauf gespeichert — lade einen hoch, um dich mit einem Klick zu bewerben.',
    profile_upload_cv: 'Lebenslauf hochladen',
    profile_replace_cv: 'Lebenslauf ersetzen',
    profile_remove_cv: 'Entfernen',
    profile_one_click_hint: 'Dein gespeicherter Lebenslauf wird für Bewerbungen mit einem Klick wiederverwendet. Jede Bewerbung erhält weiterhin eine eigene Bewertung.',
    profile_skills: 'Fähigkeiten',
    profile_experience: 'Erfahrungszusammenfassung',
    profile_save: 'Profil speichern',
    profile_saved: 'Profil gespeichert',

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
    qp_apply_track: '📋 Bewerben & verfolgen',

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

    cprofile_status_label: 'Status',
    cprofile_no_resume_text: 'Für diese Bewerbung wurde kein Lebenslauf als Klartext analysiert.',
    cprofile_summary_fallback: 'KI-gestützte Bewertung anhand der freigegebenen Screening-Kriterien der Stelle.',
    cprofile_active_badge: 'AKTIV',
    cprofile_interviewer_fallback: 'Interviewer',
    cprofile_scorecard_you: 'Sie (aktueller Nutzer)',
    cprofile_tech_short: 'Tech',
    cprofile_comm_short: 'Kommun.',
    cprofile_problem_short: 'Problemlösung',
    cprofile_questions_targeting: 'Fokus auf Kriterienlücken und Bewertungssignale des Kandidaten',
    cprofile_questions_analyzing: 'Kompetenzlücken werden analysiert und gezielte Fragen erstellt...',
    cprofile_targeted_competency: 'Gezielte Kompetenz',
    cprofile_question_n: 'Frage {count}',
    cprofile_copy_btn: 'Kopieren',
    cprofile_what_to_look_for: 'Worauf zu achten ist:',
    cprofile_notes_placeholder: 'Notizen...',
    cprofile_reason_qualifications_match: 'Übereinstimmung von Qualifikationen und Fähigkeiten',
    cprofile_reason_excellent_technical_fit: 'Hervorragende technische Passung',
    cprofile_reason_experience_gap: 'Erfahrungs- bzw. Kompetenzlücke',
    cprofile_reason_communication_fit: 'Kommunikation und Team-Passung',
    cprofile_reason_compensation_mismatch: 'Abweichung bei Vergütung oder Zeitplan',
    cprofile_reason_talent_bench: 'Für künftige Vakanz vorgemerkt',
    cprofile_reason_candidate_withdrew: 'Kandidat hat Bewerbung zurückgezogen',
    cprofile_reason_other: 'Anderer berufsbezogener Grund',
    cprofile_justification_label: 'Begründung',
    cprofile_justification_placeholder: 'Begründung...',
    cprofile_override_warning: 'Score-Neukalibrierungen werden dauerhaft im unveränderlichen Audit-Ledger erfasst.',
    cprofile_adjusted_score: 'Angepasster Score (0 - 100)',
    cprofile_override_placeholder: 'Ausgeprägte Kenntnisse in Systemarchitektur nachgewiesen...',
    cprofile_annual_compensation: 'Jahresvergütungspaket',
    cprofile_start_date: 'Startdatum',
    cprofile_uncertain_evidence: 'Dieses Ergebnis erfordert eine manuelle Prüfung, da die Belege unsicher sind.',
    cprofile_candidate_code: 'Kandidat #{code}',
    cprofile_applicant_fallback: 'Bewerber',
    toast_score_recalibrated: 'Match-Score auf {score} % neukalibriert',
    toast_score_recalibrated_title: 'Score neukalibriert',
    toast_score_recalibration_failed: 'Score-Neukalibrierung konnte nicht erfasst werden',
    toast_network_recalibration: 'Netzwerkfehler bei der Neukalibrierung',
    toast_offer_sent: 'Angebot über {salary} an Kandidaten gesendet',
    toast_offer_sent_title: 'Angebot gesendet',
    toast_offer_failed: 'Formelles Angebot konnte nicht gesendet werden',
    toast_network_offer: 'Netzwerkfehler beim Senden des Angebots',
    toast_scorecard_recorded: 'Interview-Bewertungsbogen ({recommendation}) erfolgreich erfasst',
    toast_scorecard_title: 'Bewertungsbogen gespeichert',
    toast_scorecard_failed: 'Bewertungsbogen konnte nicht gesendet werden',
    toast_network_scorecard: 'Netzwerkfehler beim Speichern des Bewertungsbogens',
    toast_decision_rationale_required: 'Die Begründung der Entscheidung ist erforderlich',
    toast_decision_recorded: 'Entscheidung „{decision}“ im Audit-Protokoll erfasst',
    toast_decision_title: 'Entscheidung abgeschlossen',
    toast_decision_failed: 'Entscheidung konnte nicht erfasst werden',
    toast_network_decision: 'Netzwerkfehler beim Erfassen der Entscheidung',
    toast_question_copied: 'Frage in die Zwischenablage kopiert',
    toast_evidence_located: 'Beleg gefunden: „{evidence}“',
    toast_blind_enabled: 'Blind Screening aktiviert: personenbezogene Daten verborgen',
    toast_pii_revealed: 'Personenbezogene Daten sichtbar',

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
    dup_merge_failed: 'Zusammenführung fehlgeschlagen — bitte erneut versuchen.',
    dup_merge_error_title: 'Fehler bei der Duplikatprüfung',
    dup_merged_toast: 'Duplizierte Kandidatenakten für {email} zusammengeführt',
    dup_merged_title: 'Duplikatprüfung abgeschlossen',
    dup_profiles_count: '{count} übereinstimmende Kandidatenprofile',
    dup_merging: 'Wird zusammengeführt…',
    dup_applications_count: '{count} Bewerbungen eingereicht',

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
    cmd_cat_navigation: 'Navigation',
    cmd_cat_analytics: 'Analytik',
    cmd_cat_requisitions: 'Ausschreibungen',
    cmd_cat_compliance: 'Compliance',
    cmd_cat_administration: 'Verwaltung',
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
    error: 'Ein Fehler ist aufgetreten',

    first_name: 'Vorname',
    last_name: 'Nachname',
    email_addr: 'E-Mail-Adresse',
    phone_number: 'Telefonnummer',
    upload_resume: 'Lebenslauf-Dokument (PDF, DOCX, TXT)',
    gdpr_consent: 'Ich stimme der Verarbeitung meines Lebenslaufs gemäß den DSGVO-Datenschutzrichtlinien zu.',
    submit_application: 'Bewerbung absenden',
    apply_job_missing_title: 'Diese Stelle wurde nicht gefunden',
    apply_job_missing_desc: 'Die Stelle wurde möglicherweise geschlossen, archiviert oder der Link ist veraltet. Sehen Sie sich die aktuellen Ausschreibungen an.',
    apply_browse_open: 'Offene Stellen ansehen',
    apply_official_badge: 'Offizielle Bewerbung',
    apply_staff_title: 'Als Mitglied des Recruiting-Teams angemeldet',
    apply_staff_desc: 'Sie sind als interner Mitarbeiter authentifiziert. Internes Personal prüft Bewerbungen, statt sich auf Stellen zu bewerben.',
    apply_redirecting: 'Weiterleitung zu Ihrem Bewerbungsportal…',
    apply_cv_document: 'Lebenslauf-Dokument',
    apply_use_saved_cv: 'Gespeicherten Lebenslauf verwenden',
    apply_from_profile: 'Aus Ihrem Profil · kein Upload nötig',
    apply_upload_different: 'Anderen Lebenslauf für diese Bewerbung hochladen',
    apply_click_or_drop: 'Zum Auswählen klicken oder Lebenslauf hierher ziehen',
    apply_file_hint: 'PDF, DOCX, TXT oder MD · max. 5 MB',
    apply_error_no_cv: 'Bitte hängen Sie Ihr Lebenslauf-Dokument an.',
    apply_error_no_consent: 'Bitte erteilen Sie die DSGVO-Einwilligung für das automatisierte KI-Screening.',

    erasure_warning: 'Sind Sie sicher? Diese Aktion ist dauerhaft und unumkehrbar. Alle Ihre Bewerbungen, Lebenslauf-Dateien und der Kontozugang werden gelöscht.',
    sign_in: 'Anmelden',
    session_enforced: 'Rollenberechtigungen werden strikt durchgesetzt.',
    role_admin_desc: 'Systemadministrator: Systemtelemetrie, Kandidaten-Pipeline und Benutzerverwaltung.',
    role_recruiter_desc: 'Lead-Recruiter: ATS-Pipeline, Score-Kalibrierung und Angebotsversand.',
    role_hiring_manager_desc: 'Hiring Manager: Abteilungsprüfung, Benchmarks und Interviewplanung.',
    role_interviewer_desc: 'Technischer Interviewer: Kandidatenbewertung, Fragen und Bewertungsbögen.',
    role_auditor_desc: 'Compliance-Auditor: Lesezugriff auf unveränderliche Audit-Trails.',
    role_candidate_desc: 'Bewerber: Bewerbungsverfolgung, Stellenverzeichnis und DSGVO-Selbstservice.',

    nav_settings: 'Arbeitsbereich-Einstellungen',
    active_role: 'Aktive Rolle:',
    brand_tagline: 'Enterprise-ATS',

    workspace_overview: 'Arbeitsbereich-Übersicht',
    btn_review_applications: 'Bewerbungen prüfen',
    kpi_across_jobs: 'Über aktive Stellen',
    kpi_shortlisted_pool: 'Shortlist-Pool',
    kpi_active_rubrics: 'Aktive Bewertungsrubriken',
    kpi_passed_threshold: 'Schwellenwerte erreicht',
    kpi_sha_logs: 'SHA-256-Protokolle',
    stage_needs_review: 'Überprüfung nötig',
    stage_rejected: 'Abgelehnt / Außerhalb',
    stage_new: 'Neu',
    stage_interview_scheduled: 'Interview geplant',
    stage_hired: 'Eingestellt',
    stage_withdrawn: 'Zurückgezogen',
    processing_queued: 'In Warteschlange',
    processing_in_progress: 'In Bearbeitung',
    processing_completed: 'Abgeschlossen',
    processing_failed: 'Fehlgeschlagen',
    stage_on_hold: 'Warteschleife',
    audit_just_now: 'Gerade eben',
    audit_verified: '✓ VERIFIZIERT',
    telemetry_quality_title: 'Qualitäts- & Zuverlässigkeits-Telemetrie (§6.10)',
    telemetry_quality_chip: 'Auditierte Kennzahlen',
    telemetry_quality_hint: 'Automatische Überwachung von Extraktions-Konfidenz, manuellen Overrides und Systemzustand',
    metric_low_confidence: 'Weniger vertrauenswürdige Treffer',
    metric_low_confidence_hint: 'Konfidenz < 80 % (Prüfung erforderlich)',
    metric_manual_corrections: 'Manuelle Korrekturen',
    metric_manual_corrections_hint: 'Von Recruiter korrigierte Profile',
    metric_score_overrides: 'Score-Overrides',
    metric_score_overrides_hint: 'Manuell kalibrierte Scores',
    metric_processing_failures: 'Verarbeitungsfehler',
    metric_processing_failures_hint: 'Sicherer Wiederholungsversand möglich',
    metric_upcoming_interviews: 'Kommende Interviews',
    metric_upcoming_interviews_hint: 'Geplant & aktiv',
    metric_failed_emails: 'Fehlgeschlagene E-Mails (7 T)',
    metric_failed_emails_hint: 'Zustellhealth transaktionaler Mails',
    metric_failed_emails_latest: 'Neueste: {template}',
    telemetry_email_banner: '{count} E-Mail-Zustellungen sind in den letzten 7 Tagen fehlgeschlagen — einige Empfänger wurden nie benachrichtigt. Zustellfehler prüfen',
    telemetry_email_banner_one: '1 E-Mail-Zustellung ist in den letzten 7 Tagen fehlgeschlagen — der Empfänger wurde nie benachrichtigt. Zustellfehler prüfen',
    telemetry_email_review: 'Zustellfehler prüfen',

    metric_visible_apps: 'Sichtbare Bewerbungen',
    metric_needs_review: 'Prüfung nötig',
    metric_avg_match: 'Ø Übereinstimmung',
    metric_shortlisted: 'Shortlisted',
    metric_rejected: 'Abgelehnt',
    filters: 'Filter',
    filter_job: 'Stelle',
    filter_stage: 'Phase',
    filter_recruiter: 'Recruiter',
    filter_min_score: 'Min-Score (%)',
    filter_max_score: 'Max-Score (%)',
    filter_required_criteria: 'Pflichtkriterien',
    filter_processing: 'Verarbeitung',
    filter_tag: 'Tag',
    filter_applied_from: 'Beworben ab',
    filter_applied_to: 'Beworben bis',
    filter_all_jobs: 'Alle Stellen',
    filter_all_stages: 'Alle Phasen',
    filter_all_recruiters: 'Alle Recruiter',
    filter_any_status: 'Beliebiger Status',
    filter_missing_required: 'Pflichtkriterium fehlt',
    filter_uncertain_evidence: 'Unsicherer Nachweis',
    filter_any_tag: 'Beliebiges Tag',
    filter_clear_all: 'Alle Filter löschen',
    bulk_selected: '{count} ausgewählt:',
    bulk_shortlist: 'Shortlisten',
    bulk_advance: 'Weiterleiten',
    bulk_hold: 'Warteschleife',
    bulk_review: 'Zurück zur Prüfung',
    bulk_reject: 'Ablehnen',
    bulk_withdraw: 'Zurückziehen',
    bulk_clear_selection: 'Auswahl aufheben',
    bulk_confirm_title: 'Sammelaktion „{action}“ für {count} Bewerbung(en) bestätigen',
    bulk_confirm_desc: 'Für jede ausgewählte Bewerbung wird eine Entscheidung unter Ihrem Konto protokolliert und im Audit-Trail festgehalten. Lässt sich nicht lautlos rückgängig machen.',
    bulk_confirm_aria: 'Sammelentscheidung bestätigen',
    bulk_reason_label: 'Grund (erforderlich)',
    bulk_reason_placeholder: 'Warum wird diese Sammelentscheidung angewendet?',
    bulk_error_required: 'Für Sammelentscheidungen ist ein Grund erforderlich.',
    bulk_error_failed: 'Die Sammelaktion ist fehlgeschlagen.',
    bulk_error_network: 'Netzwerkfehler — die Sammelaktion wurde nicht angewendet.',
    bulk_applying: 'Wird angewendet…',
    bulk_confirm_action: '{action} bestätigen',
    pagination_showing: '{from}–{to} von {total}',
    pagination_prev: '← Zurück',
    pagination_next: 'Weiter →',
    aria_filter_department: 'Nach Abteilung filtern',
    aria_pipeline_view: 'Pipeline-Ansicht',
    aria_select_all: 'Alle sichtbaren Bewerbungen auswählen',
    aria_pipeline_pagination: 'Pipeline-Paginierung',
    applicants_count: '{count} Bewerber',

    status_closed: 'Geschlossen',
    jobs_search_placeholder: 'Titel, Beschreibung, Abteilung suchen…',
    aria_search_requisitions: 'Ausschreibungen suchen',
    aria_filter_status: 'Nach Status filtern',
    filter_all_statuses: 'Alle Status',
    btn_apply_filters: 'Anwenden',
    btn_clear: 'Löschen',
    edit_rubric: 'Rubrik bearbeiten',
    rubric_preview: 'Vorschau',
    criteria_more: '+{count} weitere',
    applicants: 'Bewerber',
    btn_copy: 'Kopieren',
    btn_cloning: 'Wird geklont…',
    btn_close: 'Schließen',
    btn_publish: 'Veröffentlichen',
    btn_publishing: 'Wird veröffentlicht…',
    chip_applied: '✓ Beworben',
    chip_match_pct: '{score}% Übereinstimmung',
    aria_latest_score: 'Neuester KI-Screening-Score Ihrer Bewerbung',
    btn_one_click_apply: '⚡ 1-Klick-Bewerbung',
    btn_applying: 'Bewerbung läuft…',
    aria_apply_instant: 'Sofort mit dem im Profil gespeicherten Lebenslauf bewerben',
    aria_duplicate_requisition: 'Diese Ausschreibung duplizieren',
    aria_close_requisition: 'Diese Ausschreibung schließen',
    aria_close_dialog: 'Dialog schließen',
    aria_remove_criterion: 'Kriterium entfernen',
    aria_audit_pagination: 'Paginierung des Audit-Logs',
    edit_rubric_title: 'Rubrik bearbeiten — {title}',
    rubric_approved_warning: 'Diese Rubrik ist genehmigt. Beim Speichern wird eine neue ENTWURF-Version erstellt — die aktuelle Version bewertet weiter Bewerbungen, bis die neue genehmigt ist; historische Ergebnisse werden nie verändert.',
    criteria_count: 'Kriterien ({count})',
    add_criterion: '+ Kriterium hinzufügen',
    criterion_description: 'Kriteriumsbeschreibung',
    criterion_required: 'Erforderlich',
    criterion_preferred: 'Wünschenswert',
    change_reason_label: 'Änderungsgrund',
    change_reason_optional: 'Änderungsgrund (optional)',
    change_reason_placeholder: 'Warum ändert sich die Rubrik? (wird im Audit-Trail protokolliert)',
    save_rubric: 'Rubrik speichern',
    location_label: 'Standort',
    employment_type_label: 'Beschäftigungsart',
    closes_at_label: 'Bewerbungsschluss (optional)',
    employment_full_time: 'Vollzeit',
    employment_part_time: 'Teilzeit',
    employment_contract: 'Befristet',
    employment_internship: 'Praktikum',
    desc_placeholder: 'Verantwortlichkeiten, Stack-Anforderungen und Qualifikationen...',
    criterion_example: 'z. B. Verteilte Systeme (Go/Rust)',
    title_placeholder: 'z. B. Senior Frontend Architect',
    dept_engineering: 'Engineering',
    dept_product: 'Produkt & Design',
    dept_data_ai: 'Data & KI',
    dept_sales: 'Vertrieb & Marketing',
    dept_operations: 'Operations & HR',
    location_placeholder: 'z. B. Kigali / Remote',
    toast_applied_saved_cv: 'Auf „{title}“ mit Ihrem gespeicherten Lebenslauf beworben',
    toast_one_click_title: '1-Klick-Bewerbung',
    toast_one_click_failed: '1-Klick-Bewerbung fehlgeschlagen',
    toast_title_desc_required: 'Titel und Beschreibung sind erforderlich',
    toast_requisition_published: 'Stelle „{title}“ live veröffentlicht',
    toast_requisition_created_title: 'Ausschreibung erstellt',
    toast_create_failed: 'Ausschreibung konnte nicht erstellt werden',
    toast_network_create: 'Netzwerkfehler beim Erstellen der Ausschreibung',
    toast_no_rubric: 'Diese Ausschreibung hat keine Rubrik zum Bearbeiten',
    toast_rubric_min_one: 'Eine Rubrik benötigt mindestens ein Kriterium',
    toast_reason_required: 'Beim Bearbeiten einer genehmigten Rubrik ist ein Änderungsgrund erforderlich',
    toast_rubric_updated: 'Rubrikkriterien aktualisiert',
    toast_rubric_new_draft: 'Neue ENTWURF-Version erstellt — zur Verwendung im Screening genehmigen',
    toast_rubric_update_failed: 'Rubrik konnte nicht aktualisiert werden',
    toast_rubric_saved_title: 'Rubrik gespeichert',
    toast_rubric_network: 'Netzwerkfehler beim Aktualisieren der Rubrik',
    toast_no_rubric_approve: 'Diese Ausschreibung hat keine Rubrik zur Genehmigung',
    toast_requisition_visible: '„{title}“ ist jetzt für Bewerber sichtbar',
    toast_requisition_published_title: 'Ausschreibung veröffentlicht',
    toast_publish_failed: 'Ausschreibung konnte nicht veröffentlicht werden ({status})',
    toast_network_publish: 'Netzwerkfehler beim Veröffentlichen der Ausschreibung',
    toast_requisition_duplicated: 'Ausschreibung als „{title}“ dupliziert',
    toast_requisition_cloned_title: 'Ausschreibung geklont',
    toast_duplicate_failed: 'Ausschreibung konnte nicht dupliziert werden',
    toast_network_duplicate: 'Netzwerkfehler beim Duplizieren der Ausschreibung',
    toast_requisition_closed: 'Stelle „{title}“ ist jetzt geschlossen',
    toast_requisition_closed_title: 'Ausschreibung geschlossen',
    toast_close_failed: 'Ausschreibung konnte nicht geschlossen werden',
    toast_network_close: 'Netzwerkfehler beim Schließen der Ausschreibung',
    toast_incomplete_response: 'Der Server hat eine unvollständige Antwort zurückgegeben',

    my_apps_score_hint: 'Der Übereinstimmungs-% ist Ihr neuester KI-Screening-Score gegenüber der Rubrik jeder Stelle — er lenkt die Shortlist, ist aber keine finale Entscheidung.',
    my_apps_empty_tip: 'Tipp: Speichern Sie Ihren Lebenslauf in Ihrem Profil, und jede offene Stelle wird zur 1-Klick-Bewerbung.',
    my_apps_profile_link: 'Profil',
    aria_app_score: 'Neuester KI-Screening-Score für diese Bewerbung',
    match_band_strong: 'Starke Übereinstimmung',
    match_band_good: 'Gute Übereinstimmung',
    match_band_building: 'Im Aufbau',

    profile_workspace_candidate: 'Kandidaten-Bereich',
    profile_workspace_account: 'Arbeitsbereich-Konto',
    profile_display_name: 'Anzeigename',
    profile_name_placeholder: 'Ihr vollständiger Name',
    profile_member_since: '· Mitglied seit {date}',
    profile_department_access: 'Abteilungszugriff:',
    profile_applications_count: '{count} Bewerbungen',
    profile_cv_saved_ok: 'Lebenslauf gespeichert — 1-Klick-Bewerbung ist freigeschaltet.',
    profile_cv_removed_ok: 'Gespeicherter Lebenslauf entfernt.',
    profile_add: 'Hinzufügen',
    profile_skill_placeholder: 'Skill eingeben und Enter drücken — z. B. React, SQL, Figma',
    profile_skill_remove_hint: 'Zum Entfernen klicken',
    profile_experience_placeholder: 'Kurze Zusammenfassung Ihres Werdegangs — Rollen, Jahre, Highlights…',
    profile_about_you: 'Über Sie',
    profile_file_hint: 'PDF, DOCX, TXT, MD · max. 5 MB',
    profile_saving: 'Speichern…',
    profile_save_failed: 'Profil konnte nicht gespeichert werden',
    profile_cv_save_failed: 'Lebenslauf konnte nicht gespeichert werden',
    profile_cv_remove_failed: 'Lebenslauf konnte nicht entfernt werden',
    profile_cv_saved_on: 'gespeichert am {date}',
    aria_upload_cv: 'Lebenslauf hochladen',

    audit_search_actor: 'Nach Actor-E-Mail suchen…',
    audit_search_actor_aria: 'Audit-Log nach Actor-E-Mail durchsuchen',
    audit_search_action: 'Aktion z. B. DECISION',
    audit_search_action_aria: 'Audit-Log nach Aktion durchsuchen',
    audit_from_date: 'Von-Datum',
    audit_from_date_aria: 'Von-Datum',
    audit_to_date: 'Bis-Datum',
    audit_to_date_aria: 'Bis-Datum',
    btn_search: 'Suchen',
    audit_sealed: '✓ VERSIEGELT',
    audit_logs_count: '{count} EINTRÄGE',

    team_accounts_badge: '{count} KONTEN GESAMT',
    team_domain_title: '🔐 Arbeitsbereich-Identität',
    team_domain_desc: 'Mitarbeiter mit einer E-Mail Ihrer verifizierten Domain treten bei der Registrierung automatisch diesem Arbeitsbereich bei.',
    team_domain_verified: '✓ {domain}',
    team_domain_not_verified: '⚠ NICHT VERIFIZIERT',
    team_domain_placeholder: 'ihrunternehmen.com',
    team_btn_start_verification: 'Verifizierung starten',
    team_btn_working: 'Wird bearbeitet…',
    team_dns_step: '1. Fügen Sie diesen TXT-Eintrag bei Ihrem DNS-Anbieter hinzu:',
    team_btn_verify_now: 'Jetzt verifizieren',
    team_btn_checking_dns: 'DNS wird geprüft…',
    team_notice_staff: 'Zeigt nur authentifizierte Mitarbeitende: Recruiter, Hiring Manager und Systemadministratoren.',
    team_notice_candidates: 'Zeigt externe Bewerber mit registrierten Konten. Zur Bewertung ihrer Lebensläufe öffnen Sie die Kandidaten-Pipeline.',
    team_col_employee: 'Mitarbeiter / Teammitglied',
    team_col_candidate_name: 'Kandidatenname',
    team_col_classification: 'Klassifizierung',
    team_col_assigned_role: 'Zugewiesene Rolle',
    team_col_account_status: 'Kontostatus',
    team_col_permissions: 'RBAC-Berechtigungen',
    team_col_portal_access: 'Portalzugriff',
    team_col_actions: 'Aktionen',
    team_empty_staff: 'Keine internen Teammitglieder gefunden.',
    team_empty_candidates: 'Noch keine externen Kandidatenkonten registriert.',
    team_staff_user: 'Team-Benutzer',
    team_applicant: 'Bewerber',
    team_badge_internal: '🏢 INTERNES TEAM',
    team_badge_external: '📄 EXTERNER BEWERBER',
    team_applicant_portal: 'Bewerberportal (Bewerben & Status verfolgen)',
    team_view_applications: 'Bewerbungen ansehen',
    team_promote: 'Befördern',
    team_promote_title: 'Zum internen Team befördern',
    team_edit_role_title: 'Rolle bearbeiten',
    team_select_role: 'Rolle & Berechtigungen wählen *',
    team_invite_title: 'Teammitglied einladen',
    team_full_name: 'Vollständiger Name',
    team_full_name_placeholder: 'z. B. Jane Doe',
    team_work_email: 'Geschäftliche E-Mail *',
    team_work_email_placeholder: 'jane@firma.com',
    team_role_assignment: 'Rollenzuweisung *',
    team_send_invite: 'Einladung senden',
    team_role_admin: 'Admin (Vollbesitzer des Arbeitsbereichs)',
    team_role_recruiter: 'Recruiter (ATS & Kandidatenverantwortung)',
    team_role_manager: 'Hiring Manager (Abteilungsleiter)',
    team_role_interviewer: 'Interviewer (Technischer Bewerter)',
    team_role_auditor: 'Compliance-Auditor (Audit-Inspektor)',
    team_role_candidate: 'Kandidat (nur Bewerberportal)',
    toast_role_updated_title: 'Rolle aktualisiert',
    toast_role_updated: 'Rolle von {name} auf {role} aktualisiert',
    toast_role_failed: 'Rolle konnte nicht aktualisiert werden',
    toast_role_network: 'Netzwerkfehler beim Aktualisieren der Rolle',
    toast_invited_title: 'Teammitglied eingeladen',
    toast_invited: 'Einladung an {email} gesendet',
    toast_invite_failed: 'Mitglied konnte nicht eingeladen werden',
    toast_invite_network: 'Netzwerkfehler beim Senden der Einladung',
    team_domain_claim_failed: 'Start der Domain-Beanspruchung fehlgeschlagen.',
    team_domain_network: 'Netzwerkfehler beim Start der Domain-Beanspruchung.',
    team_verify_failed: 'Verifizierung fehlgeschlagen.',
    team_verify_network: 'Netzwerkfehler während der Verifizierung.',
    team_domain_already: 'Diese Domain ist bereits verifiziert.',
    team_user_fallback: 'Benutzer',

    settings_title: 'Arbeitsbereich-Einstellungen',
    settings_subtitle: 'Konfigurieren Sie Recruiting-Workflow, Aufbewahrungsrichtlinie und Branding (Spez §6.11/§6.12). Jede Änderung wird im Audit-Trail aufgezeichnet.',
    settings_tab_workflow: 'Workflow & Gründe',
    settings_tab_retention: 'Aufbewahrungsrichtlinie',
    settings_tab_branding: 'Branding',
    settings_reasons_title: 'Entscheidungsgrund-Katalog (§6.7)',
    settings_reasons_desc: 'Konfigurierbare Entscheidungsgründe für Recruiter bei der Protokollierung einer Screening-Entscheidung. Irrelevante oder diskriminierende Kategorien dürfen nicht hinzugefügt werden.',
    settings_no_reasons: 'Noch keine benutzerdefinierten Gründe.',
    settings_reason_code_placeholder: 'CODE (z. B. LACKS_EXPERIENCE)',
    settings_reason_label_placeholder: 'Angezeigter Name',
    settings_add_reason: 'Grund hinzufügen',
    settings_categories_title: 'Stellenkategorien (§6.12)',
    settings_no_categories: 'Noch keine benutzerdefinierten Kategorien.',
    settings_category_placeholder: 'Neue Kategorie (z. B. Engineering)',
    settings_boundaries_title: 'Score-Grenzen (§6.12)',
    settings_strong_match: 'Starke Übereinstimmung ≥ (%)',
    settings_manual_review: 'Manuelle Prüfung ≤ (%)',
    settings_save_workflow: 'Workflow-Konfiguration speichern',
    settings_retention_desc: 'Aufbewahrungsfristen je Bewerbungsstatus in Tagen (Spez §6.11). Leer = bis zur manuellen Aktion aufbewahren.',
    settings_days_suffix: '(Tage)',
    settings_anonymize: 'Abgelaufene Bewerbungen anonymisieren statt endgültig löschen',
    settings_save_retention: 'Aufbewahrungsrichtlinie speichern',
    settings_display_name: 'Anzeigename des Arbeitsbereichs',
    settings_logo_url: 'Logo-URL (optional)',
    settings_primary_color: 'Primärfarbe',
    settings_save_branding: 'Branding speichern',
    settings_saving: 'Speichern…',
    settings_saved_workflow: 'Workflow-Konfiguration gespeichert.',
    settings_saved_branding: 'Branding gespeichert.',
    settings_saved_retention: 'Aufbewahrungsrichtlinie gespeichert.',
    settings_failed_workflow: 'Workflow-Konfiguration konnte nicht gespeichert werden.',
    settings_failed_branding: 'Branding konnte nicht gespeichert werden.',
    settings_failed_retention: 'Aufbewahrungsrichtlinie konnte nicht gespeichert werden.',
    settings_remove_reason: 'Grund {code} entfernen',
    settings_remove_category: 'Kategorie {category} entfernen',

    analytics_metrics_badge: '§6.10 KENNZAHLEN',
    analytics_subtitle: 'Zeit bis zum Screening, Phasenkonversion, Interviewer-Completeness und Workload für erlaubte Stellen.',
    analytics_filter_from: 'Von',
    analytics_filter_to: 'Bis',
    analytics_filter_job: 'Stelle',
    analytics_filter_department: 'Abteilung',
    analytics_filter_recruiter: 'Recruiter',
    analytics_filter_stage: 'Phase',
    analytics_loading: 'Analysen werden geladen…',
    analytics_metric_applications: 'Bewerbungen',
    analytics_metric_time_to_screen: 'Zeit bis Screening',
    analytics_metric_interviewer_completion: 'Interviewer-Abschluss',
    analytics_metric_processing_failures: 'Verarbeitungsfehler',
    analytics_metric_low_confidence: 'Geringe Konfidenz',
    analytics_metric_active_recruiters: 'Aktive Recruiter',
    analytics_hint_screened: '{count} gescreent',
    analytics_hint_median: 'Median, Erstellung → Screening',
    analytics_hint_scorecards: '{submitted}/{total} Bewertungsbögen',
    analytics_hint_failed_processing: 'fehlgeschlagene Lebenslauf-Verarbeitung',
    analytics_hint_needs_review: 'manuelle Prüfung erforderlich',
    analytics_hint_open_workload: 'mit offenem Workload',
    analytics_restricted_note: 'Hinweis: Einige angeforderte Daten liegen außerhalb Ihrer Abteilungsberechtigungen und wurden ausgeschlossen.',
    analytics_stage_distribution: 'Phasenverteilung',
    analytics_time_in_stage: 'Zeit in Phase',
    analytics_recruiter_workload: 'Recruiter-Workload',
    analytics_empty_period: 'Keine Bewerbungen im ausgewählten Zeitraum.',
    analytics_empty_open: 'Keine offenen Bewerbungen.',
    analytics_empty_assigned: 'Keine zugewiesenen offenen Bewerbungen.',
    analytics_col_stage: 'Phase',
    analytics_col_count: 'Anzahl',
    analytics_col_median: 'Median',
    analytics_definitions: 'Kennzahlendefinitionen',
    analytics_error: 'Analysen konnten nicht geladen werden',

    email_title: 'E-Mail-Zustellungsstatus',
    email_subtitle: 'Fehlgeschlagene transaktionale Zustellungen der letzten 7 Tage (Spez §6.9). Klicken Sie auf eine Zeile, um den Anbieterfehler zu sehen.',
    email_back: '← Zurück zum Dashboard',
    email_empty_title: 'Keine fehlgeschlagenen Zustellungen',
    email_empty_desc: 'Jede transaktionale E-Mail der letzten 7 Tage wurde als GESENDET erfasst (oder es wurden keine gesendet).',
    email_failed_heading: 'Fehlgeschlagene Zustellungen — {total} insgesamt',
    email_total_suffix: 'insgesamt',
    email_col_when: 'Wann',
    email_col_recipient: 'Empfänger',
    email_col_template: 'Vorlage',
    email_col_status: 'Status',
    email_status_failed: 'FEHLGESCHLAGEN',
    email_hide_error: '▲ Fehler verbergen',
    email_show_error: '▼ Fehler anzeigen',
    email_no_detail: 'Für diese Zustellung wurde kein Anbieterfehler protokolliert.',
    btn_retry_delivery: '↻ Zustellung wiederholen',
    email_retrying: 'Wird wiederholt…',
    email_retry_ok: 'Wiederholung erfolgreich — die E-Mail wurde zugestellt.',
    email_retry_failed: 'Wiederholung fehlgeschlagen: {detail}',
    email_retry_network: 'Netzwerkfehler — die Wiederholung wurde nicht versucht.',
    email_ops_badge: 'OPS-TELEMETRIE',
    email_all_templates: 'Alle Vorlagen',

    privacy_requests_title: 'Datenanfragen (Berichtigung, Auskunft, Widerruf)',
    privacy_requests_desc: 'Reichen Sie eine formelle Datenanfrage ein. Sie wird erfasst, nachverfolgt und zur Prüfung an unser Datenschutzteam weitergeleitet — Sie werden über das Ergebnis informiert.',
    privacy_request_correction: 'Meine Daten korrigieren',
    privacy_request_correction_hint: 'Teilen Sie uns mit, was unzutreffend ist und wie es lauten sollte (z. B. falsche Telefonnummer, falsch geschriebener Name).',
    privacy_request_access: 'Kopie meiner Daten erhalten',
    privacy_request_access_hint: 'Wir bereiten die persönlichen Daten, die wir über Sie haben, auf und senden sie Ihnen.',
    privacy_request_withdrawal: 'Meine Einwilligung widerrufen',
    privacy_request_withdrawal_hint: 'Bitten Sie uns, die Verarbeitung Ihrer Bewerbung zu stoppen. Laufende Einstellungen werden beendet.',
    privacy_request_deletion: 'Löschungsprüfung anfordern',
    privacy_request_deletion_hint: 'Für vollständige sofortige Löschung nutzen Sie oben die Kontrolle „Recht auf Vergessenwerden“ — hier bittet das Datenschutzteam um Prüfung der Löschung einzelner Datensätze.',
    privacy_change_placeholder: 'Wie sollten Ihre Daten stattdessen lauten?',
    privacy_context_placeholder: 'Zusätzlicher Kontext (optional)',
    privacy_submit_request: 'Anfrage senden',
    privacy_submitting: 'Wird gesendet…',
    privacy_past_requests: 'Ihre bisherigen Anfragen',
    privacy_network_error: 'Netzwerkfehler — die Anfrage wurde nicht gesendet.',
    privacy_submit_failed: 'Anfrage konnte nicht gesendet werden.',
    privacy_request_recorded: 'Ihre Anfrage wurde erfasst.',
    privacy_portability_toast_title: 'DSGVO-Export',
    privacy_erasure_toast_title: 'Recht auf Vergessenwerden',
    privacy_erasure_success: 'Ihr Konto und Ihre persönlichen Daten wurden vollständig gelöscht',
    privacy_export_failed: 'Datenexport fehlgeschlagen',
    privacy_erasure_failed: 'Löschanfrage konnte nicht gesendet werden',

    compare_matrix_title: 'Kandidaten-Vergleichsmatrix',
    compare_matrix_subtitle: 'Direkter Vergleich gewichteter Match-Scores, Recruiting-Phasen und Qualifikationen.',
    compare_col_candidate: 'Kandidat',
    compare_col_requisition: 'Ausschreibung',
    compare_col_match_score: 'Match-Score',
    compare_col_stage: 'Aktuelle Phase',
    compare_col_skills: 'Top-Skills',
    compare_col_action: 'Aktion',
    compare_view: 'Ansehen',
    compare_restricted_badge: 'EVALUIERUNGSFREIGABE ERFORDERLICH',
    compare_restricted_title: 'Benchmark-Tool nur für das Evaluierungsteam',
    compare_restricted_desc: 'Der Seiten-an-Seite-Vergleich ist Recruitern, Hiring Managern und Interviewern vorbehalten.',
    compare_restricted_cta: 'Zurück zum Dashboard',
    compare_return_dashboard: 'Zurück zum Dashboard',

    error_generic_title: 'Etwas ist schiefgelaufen!',
    btn_try_again: 'Erneut versuchen',
    apply_legacy_title: 'Bewerbung absenden',
    apply_legacy_desc: 'Bitte füllen Sie das Formular aus und laden Sie Ihren Lebenslauf hoch (PDF oder DOCX, max. 5 MB).',
    apply_legacy_select: 'Ausschreibung wählen',
    apply_legacy_first_name: 'Vorname',
    apply_legacy_last_name: 'Nachname',
    apply_legacy_email: 'E-Mail',
    apply_legacy_resume: 'Lebenslauf-Dokument',
    apply_legacy_choose: '-- Stelle auswählen --',
    apply_legacy_consent: 'Ich stimme der Verarbeitung meiner Daten zu Recruiting-Zwecken zu, einschließlich der Unterstützung durch automatisierte KI-Vorauswahl.',
    apply_legacy_uploading: 'Wird hochgeladen...',
    apply_legacy_status_uploading: 'Lebenslauf wird hochgeladen...',
    apply_legacy_status_success: 'Erfolg! Ihre Bewerbung wurde übermittelt und wird verarbeitet.',
    apply_legacy_upload_failed: 'Upload fehlgeschlagen',
    interview_badge: 'INTERVIEWPLANUNG',
    interview_title: 'Strukturiertes Interview planen',
    interview_subtitle: 'Kalendereinladungen versenden, technische Bewertungsbögen vorbereiten und Interviewpanel reservieren.',
    interview_success_title: 'Interview erfolgreich geplant!',
    interview_success_desc: 'Kalendereinladungen und Videoraum-Links wurden versendet. Weiterleitung zum Kandidatenprofil...',
    interview_datetime: 'Datum & Uhrzeit (UTC) *',
    interview_duration: 'Interviewdauer *',
    interview_platform: 'Meeting-Plattform *',
    interview_30: '30 Minuten',
    interview_45: '45 Minuten (Standard)',
    interview_60: '60 Minuten (Vertiefung)',
    interview_google_meet: 'Google Meet (automatisch erstellt)',
    interview_zoom: 'Zoom-Meeting',
    interview_in_person: 'Vor Ort (Kigali-Zentrale)',
    interview_submit: 'Bestätigen & Intervieweinladung senden',
    interview_submitting: 'Kalendereinladungen werden gesendet...',
    interview_back: 'Zurück zum Kandidaten',
    interview_error: 'Das Interview konnte nicht geplant werden. Bitte versuchen Sie es erneut.',

    copilot_thinking: 'Denkt nach…',
    copilot_error_network: 'Netzwerkfehler. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    copilot_error_service: 'Der Support-Dienst ist gerade nicht erreichbar. Bitte versuchen Sie es gleich noch einmal.',
    copilot_input_label: 'Nachricht an den RecruitAI Copilot',
    copilot_reset_title: 'Konversation zurücksetzen',
    copilot_greeting: 'Hallo',
    copilot_acknowledge: 'Verstanden',
    copilot_handoff_note: 'Für alles außerhalb von RecruitAI hilft Ihnen unser menschliches Support-Team — dieser Assistent bleibt auf der Plattform fokussiert.',
    copilot_chip_more: 'Erzählen Sie mir mehr',
    copilot_chip_apply: 'Wie bewerbe ich mich?',
    copilot_chip_track: 'Bewerbungen verfolgen',
    copilot_chip_permissions: 'Rollenberechtigungen',

    feedback_thanks: 'Danke für Ihr Feedback! Das hilft bei der Verbesserung der KI.',
    feedback_question: 'War der KI-Score genau?',
    feedback_placeholder: 'Optionaler Kommentar...',
    feedback_yes: 'Ja, genau',
    feedback_no: 'Nein, Entscheidung überstimmen',
    toast_telemetry_refreshed: 'Pipeline-Telemetrie aus der Datenbank aktualisiert',
    toast_telemetry_title: 'Telemetrie aktualisiert'
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
    nav_analytics: 'Imibare y’Akazi',
    nav_my_applications: 'Ubusabe Bwanjye',
    nav_quick_apply: 'Reba Imyanya Ihari',
    nav_profile: 'Umwirondoro wanjye',
    profile_title: 'Umwirondoro wanjye',
    profile_subtitle: 'Konti yawe, CV yawe nuko ujyira abakora akazi',
    profile_saved_cv: 'CV ibitswe',
    profile_no_cv: 'Nta CV ibitswe na none — shyiramo imwe kugira ngo usabe ukanda rimwe.',
    profile_upload_cv: 'Shyiraho CV',
    profile_replace_cv: 'Kora CV nshya',
    profile_remove_cv: 'Kuraho',
    profile_one_click_hint: 'CV ibitswe ikoreshwa mu kusaba akazi ukanda rimwe. Buri gusaba kigira isuzuma ryaryo.',
    profile_skills: 'Ubuhanga',
    profile_experience: "Incamake y'uburambe",
    profile_save: 'Bika umwirondoro',
    profile_saved: 'Umwirondoro byabitswe',

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
    qp_apply_track: '📋 Gusaba & kurikirana',

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

    cprofile_status_label: 'Imiterere',
    cprofile_no_resume_text: 'Nta CV yanditse mu nyandiko isanzwe yisuzumwe muri iyi sagutanwa.',
    cprofile_summary_fallback: 'Isuzuma rufasha rwa AI ryagereranijwe n’ibipimo byemewe byo gutanga akazi.',
    cprofile_active_badge: 'GIKORA',
    cprofile_interviewer_fallback: 'Ukora ikizamini',
    cprofile_scorecard_you: 'Uwe (uwakoresha ubu)',
    cprofile_tech_short: 'Ubuhanga',
    cprofile_comm_short: 'Itumanaho',
    cprofile_problem_short: 'Gukemura',
    cprofile_questions_targeting: 'Gushyira ku rwego ibibazo by’ibisabwa n’ibimenyetso by’isuzuma ry’umukandida',
    cprofile_questions_analyzing: 'Gusuzuma ibura ry’ubuhanga no gutunganya ibibazo byihariye...',
    cprofile_targeted_competency: 'Ubuhanga bwihariwe',
    cprofile_question_n: 'Ikibazo {count}',
    cprofile_copy_btn: 'Koporora',
    cprofile_what_to_look_for: 'Ibyo ugomba kurondera:',
    cprofile_notes_placeholder: 'Ibisobanuro...',
    cprofile_reason_qualifications_match: 'Ubwumenyi n’ubushobozi bihuye',
    cprofile_reason_excellent_technical_fit: 'Ihuza rikomeye mu buhanga',
    cprofile_reason_experience_gap: 'Ibura ry’urugo cyangwa ubuhanga',
    cprofile_reason_communication_fit: 'Itumanaho n’imibanire n’itsinda',
    cprofile_reason_compensation_mismatch: 'Amahitamo ku mushahara cyangwa ku gihe',
    cprofile_reason_talent_bench: 'Yagumishijwe ku mwanya uzaza',
    cprofile_reason_candidate_withdrew: 'Umukandida yasabye kureka ubusabe',
    cprofile_reason_other: 'Impamvu ikomoka ku kazi',
    cprofile_justification_label: 'Impamvu',
    cprofile_justification_placeholder: 'Impamvu...',
    cprofile_override_warning: 'Gusubiza ku rwego amanota birandikwa burundu mu gitabo cy’igenzura kidashobora guhindurwa.',
    cprofile_adjusted_score: 'Amanota yahinduwe (0 - 100)',
    cprofile_override_placeholder: 'Yerekanye ubushobozi bukomeye bwo gutunganya sisitemu...',
    cprofile_annual_compensation: 'Umushahara w’umwaka',
    cprofile_start_date: 'Itariki yo gutangira',
    cprofile_uncertain_evidence: 'Iyi nyandiko igena ko igihe cyo kurebwa n’abantu bisabwa kuko ibimenyetso bidasobanutse.',
    cprofile_candidate_code: 'Umukandida #{code}',
    cprofile_applicant_fallback: 'Umusaba',
    toast_score_recalibrated: 'Amanota y’isuzuma yashyizwe ku {score} %',
    toast_score_recalibrated_title: 'Amanota yasubijeho ku rwego',
    toast_score_recalibration_failed: 'Byanze kwandika gusubiza amanota ku rwego',
    toast_network_recalibration: 'Ikosa rya urubuga mu gusubiza amanota',
    toast_offer_sent: 'Itangazo ry’akazi rya {salary} ryoherejwe umukandida',
    toast_offer_sent_title: 'Itangazo ryoherejwe',
    toast_offer_failed: 'Byanze kohereza itangazo nyarucuro',
    toast_network_offer: 'Ikosa rya urubuga mu kohereza itangazo',
    toast_scorecard_recorded: 'Urupapuro rw’ikizamini ({recommendation}) ryanditswe neza',
    toast_scorecard_title: 'Urupapuro rwabitswe',
    toast_scorecard_failed: 'Byanze kohereza urupapuro rw’ikizamini',
    toast_network_scorecard: 'Ikosa rya urubuga mu kubika urupapuro',
    toast_decision_rationale_required: 'Impamvu y’icyemezo ni ngombwa',
    toast_decision_recorded: 'Icyemezo "{decision}" cyanditse mu gitabo cy’igenzura',
    toast_decision_title: 'Icyemezo cyarangiye',
    toast_decision_failed: 'Byanze kwandika icyemezo',
    toast_network_decision: 'Ikosa rya urubuga mu kwandika icyemezo',
    toast_question_copied: 'Ikibazo cyakopororwe mu bubiko',
    toast_evidence_located: 'Ibimenyetso byabonetse: "{evidence}"',
    toast_blind_enabled: 'Isuzuma ritagaragaza umwirondoro ryakoreshejwe: amakuru bwite ahishwe',
    toast_pii_revealed: 'Amakuru bwite agaragajwe',

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
    dup_merge_failed: 'Komatanya byanze — ongera ugerageze.',
    dup_merge_error_title: 'Ikosa mu gusuzuma abasubiyemo',
    dup_merged_toast: 'Dosiye z’abakandida basubiyemo zigeze ku {email} zaratanywe',
    dup_merged_title: 'Gusuzuma abasubiyemo byarangiye',
    dup_profiles_count: 'Amadosiye y’abakandida yujuje ibisabwa: {count}',
    dup_merging: 'Birimo komatanywa…',
    dup_applications_count: 'Ubusabe bwoherejwe: {count}',

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
    cmd_cat_navigation: 'Kugendagenda',
    cmd_cat_analytics: 'Imibare y’Akazi',
    cmd_cat_requisitions: 'Imyanya',
    cmd_cat_compliance: 'Kubahiriza amategeko',
    cmd_cat_administration: 'Ubuyobozi',
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
    error: 'Habaye ikibazo',

    first_name: 'Izina ry’ambere',
    last_name: 'Izina ry’umuryango',
    email_addr: 'Aderesi ya imeri',
    phone_number: 'Nimero ya telefoni',
    upload_resume: 'Inyandiko ya CV (PDF, DOCX, TXT)',
    gdpr_consent: 'Nemeranya ko CV yanjye ikorwamo ibikorwa hakurikijwe amategeko agenga umutekano w’amakuru (RGPD).',
    submit_application: 'Ohereza ubusabe',
    apply_job_missing_title: 'Iyi myanya ntibonetse',
    apply_job_missing_desc: 'Umwanya washobora kufungwa, kubikwa, cyangwa urubuga rwarangiye. Reba imyanya ihari uhiture imwanya rifunguye.',
    apply_browse_open: 'Reba imyanya ifunguye',
    apply_official_badge: 'Ubusabe bwemewe',
    apply_staff_title: 'Uwinjije nka umunyamuryango w’itsinda rishaka abakozi',
    apply_staff_desc: 'Uri winjijwe nka umukozi wa ndende. Abakozi ba ndende basuzuma ubusabe aho kwisaba imyanya.',
    apply_redirecting: 'Kohereza ku rubuga rukurikiranya ubusabe bwawe…',
    apply_cv_document: 'Inyandiko ya CV',
    apply_use_saved_cv: 'Koresha CV yanjye yabitswe',
    apply_from_profile: 'Muri profil yawe · nta kwo kwinjiza gikenewe',
    apply_upload_different: 'Injiza indi CV kuri ubu busabe',
    apply_click_or_drop: 'Kanda uhiture, cyangwa kurura CV hano',
    apply_file_hint: 'PDF, DOCX, TXT cyangwa MD · hejuru ya 5 MB',
    apply_error_no_cv: 'Banza wambikishe inyandiko ya CV yawe.',
    apply_error_no_consent: 'Banza wemeze uruhushya rwa RGPD kuri isuzuma rya AI.',

    erasure_warning: 'Uremeza neza? Iki gikorwa ni cy’imiterere kandi ntigishobora kugaruka. Ubusabe bwawe bwose, CV n’uburyo bwo kwinjira mu konti bizasibwa.',
    sign_in: 'Injira',
    session_enforced: 'Uburenganzira bwa role bugenzurwa bukaze.',
    role_admin_desc: 'Umuyobozi mukuru wa sisitemu: iteganyagaruka, pipeline y’abakandida n’imicungire y’abakozi.',
    role_recruiter_desc: 'Umushinzwe gushakisha: pipeline ya ATS, guhindura amanota no gutanga amasezerano.',
    role_hiring_manager_desc: 'Umuyobozi w’ishami: kureba abakandida b’ishami, imipaka n’iteganywa ry’ibizamini.',
    role_interviewer_desc: 'Usuzuma mu buryo bw’imikorere: gusuzuma abakandida, ibibazo no gutanga amanota.',
    role_auditor_desc: 'Umugenzuzi w’ibikorwa: kureba gusa amateka y’igenzura adashobora guhindurwa.',
    role_candidate_desc: 'Umukandida: gukurikirana ubusabe, reba imyanya n’ubwisanzure bwa RGPD.',

    nav_settings: 'Igenamiterere ry’urubuga',
    active_role: 'Role ikora:',
    brand_tagline: 'ATS ya Kigo',

    workspace_overview: 'Ishusho rusange',
    btn_review_applications: 'Suzuma ubusabe',
    kpi_across_jobs: 'Ku myanya ikora',
    kpi_shortlisted_pool: 'Abatoranijwe',
    kpi_active_rubrics: 'Ibipimo ngenderwaho bikora',
    kpi_passed_threshold: 'Barenze urugero',
    kpi_sha_logs: 'Ibitekerezo SHA-256',
    stage_needs_review: 'Ikeneye kurebwa',
    stage_rejected: 'Byanze / Hanze y’umushinga',
    stage_new: 'Gishya',
    stage_interview_scheduled: 'Ikizamini cyateganijwe',
    stage_hired: 'Yemewe akazi',
    stage_withdrawn: 'Yavanyweho',
    processing_queued: 'Mu murongo',
    processing_in_progress: 'Birakorwa',
    processing_completed: 'Byarangiye',
    processing_failed: 'Byanze',
    stage_on_hold: 'Birindira',
    audit_just_now: 'Nonaha',
    audit_verified: '✓ YEMEWE',
    telemetry_quality_title: 'Igipimo cy’umwuga n’ubudbwavuye mu isuzuma (§6.10)',
    telemetry_quality_chip: 'Ibipimo byagenzuwe',
    telemetry_quality_hint: 'Gukurikirana kw’ikimenyetso cya AI, guhindurwa n’abantu n’imikorere ya sisitemu',
    metric_low_confidence: 'Ibimenyetso bidafite umwuga',
    metric_low_confidence_hint: 'Umwuga < 80% (isuzuma rirakenewe)',
    metric_manual_corrections: 'Ibiwandikisho byakorewe intoki',
    metric_manual_corrections_hint: 'Profil zasubitswe n’umushakisha',
    metric_score_overrides: 'Amanota yahinduwe',
    metric_score_overrides_hint: 'Amanota yatunganijwe n’umuntu',
    metric_processing_failures: 'Ibyazo by’umushinga',
    metric_processing_failures_hint: 'Kongera gereranya biraboneka',
    metric_upcoming_interviews: 'Ibizamini biri imbere',
    metric_upcoming_interviews_hint: 'Biteganywe kandi bikora',
    metric_failed_emails: 'Imeri y_byanze (7 iminsi)',
    metric_failed_emails_hint: 'Imikorere y’ohereza imeri',
    metric_failed_emails_latest: 'Iheruka: {template}',
    telemetry_email_banner: '{count} imeri byanze mu minsi 7 ishize — abandi banyamuryango ntibamenyeshejwe. Reba ibyazo by’ohereza',
    telemetry_email_banner_one: 'Imeri 1 yanze mu minsi 7 ishize — uwayoherejwe ntibamenyeshejwe. Reba ibyazo by’ohereza',
    telemetry_email_review: 'Reba ibyazo by’ohereza',

    metric_visible_apps: 'Ubusabe bwagaragarira',
    metric_needs_review: 'Ikeneye kurebwa',
    metric_avg_match: 'Impuzandengo y’umwanya',
    metric_shortlisted: 'Abatoranijwe',
    metric_rejected: 'Byanze',
    filters: 'Muyunguruzi',
    filter_job: 'Umwanya',
    filter_stage: 'Icyiciro',
    filter_recruiter: 'Umushakisha',
    filter_min_score: 'Amanota ntarengwa (%)',
    filter_max_score: 'Amanota ntarengwa (%)',
    filter_required_criteria: 'Ibipimo ngenderwaho',
    filter_processing: 'Umushinga',
    filter_tag: 'Ikimenyetso',
    filter_applied_from: 'Yasabiye kuva',
    filter_applied_to: 'Yasabiye kugera',
    filter_all_jobs: 'Imyanya yose',
    filter_all_stages: 'Ibyiciro byose',
    filter_all_recruiters: 'Abashakisha bose',
    filter_any_status: 'Imiterere iyo ari yo',
    filter_missing_required: 'Ibipimo ngenderwaho bibura',
    filter_uncertain_evidence: 'Ibimenyetso bidasobanutse',
    filter_any_tag: 'Ikimenyetso icyo ari cyo',
    filter_clear_all: 'Siba muyunguruzi yose',
    bulk_selected: '{count} byatoranyijwe:',
    bulk_shortlist: 'Tora',
    bulk_advance: 'Shyira imbere',
    bulk_hold: 'Shyira ku mugereka',
    bulk_review: 'Subira mu kurebwa',
    bulk_reject: 'Jyanya',
    bulk_withdraw: 'Kura',
    bulk_clear_selection: 'Siba ihitamo',
    bulk_confirm_title: 'Emeza igikorwa “{action}” ku busabe {count}',
    bulk_confirm_desc: 'Ibi birandika umwanzuro kuri buri busabe watoranyijwe kuri konti yawe kandi bigashyirwa mu mateka y’igenzura. Ntibishobora kugarukaho mu buryo bwihishe.',
    bulk_confirm_aria: 'Emeza icyemezo cy’imwe',
    bulk_reason_label: 'Impamvu (irakenewe)',
    bulk_reason_placeholder: 'Mpamvu iki cyemezo cy’imwe kirakoreshwa?',
    bulk_error_required: 'Impamvu ngenderwaho irakenewe ku cyemezo cy’imwe.',
    bulk_error_failed: 'Icyo gikorwa cy’imwe cyaranze.',
    bulk_error_network: 'Ikosa rya murandasi — icyo gikorwa cy’imwe nticyakoreshejwe.',
    bulk_applying: 'Gukoresha…',
    bulk_confirm_action: 'Emeza {action}',
    pagination_showing: '{from}–{to} muri {total}',
    pagination_prev: '← Ibanjirije',
    pagination_next: 'Ikurikira →',
    aria_filter_department: 'Yunguruzisha ishami',
    aria_pipeline_view: 'Igaragariza pipeline',
    aria_select_all: 'Hitamo ubusabe bwose bureba',
    aria_pipeline_pagination: 'Igaragariza pipeline ku rupapuro',
    applicants_count: 'Abasabye {count}',

    status_closed: 'Gufungwa',
    jobs_search_placeholder: 'Shakisha umutwe, ibisobanuro, ishami…',
    aria_search_requisitions: 'Shakisha imyanya',
    aria_filter_status: 'Yunguruzisha imiterere',
    filter_all_statuses: 'Imiterere yose',
    btn_apply_filters: 'Koresha',
    btn_clear: 'Siba',
    edit_rubric: 'Hindura igipimo',
    rubric_preview: 'Reba mbere',
    criteria_more: '+{count} ibindi',
    applicants: 'abasabye',
    btn_copy: 'Koporora',
    btn_cloning: 'Koporora…',
    btn_close: 'Funga',
    btn_publish: 'Menyekanisha',
    btn_publishing: 'Kumenyekanisha…',
    chip_applied: '✓ Yasabye',
    chip_match_pct: 'Umwanya wa {score}%',
    aria_latest_score: 'Amanota ya nyuma ya AI ya ubu busabe',
    btn_one_click_apply: '⚡ Kanda rimwe usabe',
    btn_applying: 'Kwisaba…',
    aria_apply_instant: 'Saba ako kanya ukoresheje CV ibitswe muri profil yawe',
    aria_duplicate_requisition: 'Koporora iyi myanya',
    aria_close_requisition: 'Funga iyi myanya',
    aria_close_dialog: 'Funga ekranu',
    aria_remove_criterion: 'Kuraho igipimo',
    aria_audit_pagination: 'Igaragariza iteka ku rupapuro',
    edit_rubric_title: 'Hindura igipimo — {title}',
    rubric_approved_warning: 'Iki gipimo cyemejwe. Kubika kizakora verisiyo nshya ya DRAFT — iyo uri yo ikomeza gutanga amanota kugeza iyo nshya yemejwe, kandi amanota yashyizeho ntayaciyemo umuco.',
    criteria_count: 'Ibipimo ({count})',
    add_criterion: '+ Ongeraho igipimo',
    criterion_description: 'Ibisobanuro by’igipimo',
    criterion_required: 'Birakenewe',
    criterion_preferred: 'Birifuza',
    change_reason_label: 'Impamvu y’impinduka',
    change_reason_optional: 'Impamvu y’impinduka (ubushake)',
    change_reason_placeholder: 'Mpamvu iki gipimo cyahindutse? (kirandikwa mu iteka ry’igenzura)',
    save_rubric: 'Bika igipimo',
    location_label: 'Aho giherereye',
    employment_type_label: 'Ubwoko bw’akazi',
    closes_at_label: 'Igihe cyo gusaba kirangira (ubushake)',
    employment_full_time: 'Akazi kazwi gusa',
    employment_part_time: 'Akazi gatoya',
    employment_contract: 'Amasezerano',
    employment_internship: 'Akazi ko kwigisha',
    desc_placeholder: 'Inshingano, ibisabwa muri sisitemu, n’ubushobozi...',
    criterion_example: 'urugero: Sisitemu zitandukanye (Go/Rust)',
    title_placeholder: 'urugero: Umwubatsi Mukuru wa Frontend',
    dept_engineering: 'Ingengo',
    dept_product: 'Ibicuruzwa & Imiterere',
    dept_data_ai: 'Amakuru & AI',
    dept_sales: 'Kugurisha & Kwamamaza',
    dept_operations: 'Ibikorwa & Ubwananyu',
    location_placeholder: 'urugero: Kigali / Kure',
    toast_applied_saved_cv: 'Wasabye “{title}” ukoresheje CV yawe yabitswe',
    toast_one_click_title: 'Kanda rimwe usabe',
    toast_one_click_failed: 'Kwisaba kanda rimwe byanze',
    toast_title_desc_required: 'Umutwe n’ibisobanuro birakenewe',
    toast_requisition_published: 'Umwanya “{title}” wamenyekanishije',
    toast_requisition_created_title: 'Umwanya wakorewe',
    toast_create_failed: 'Byanze gukora umwanya',
    toast_network_create: 'Ikosa rya murandasi mu gukora umwanya',
    toast_no_rubric: 'Uyu mwanya ntagipimo gifite wo guhindura',
    toast_rubric_min_one: 'Igipimo gisaba igipimo kimwe cya mbere',
    toast_reason_required: 'Impamvu irakenewe iyo uhindura igipimo cyemejwe',
    toast_rubric_updated: 'Ibipimo by’igipimo byavuguruwe',
    toast_rubric_new_draft: 'Verisiyo nshya ya DRAFT yashyizweho — yemeze kugira ngo ifate ku isuzuma',
    toast_rubric_update_failed: 'Byanze kuvugurura igipimo',
    toast_rubric_saved_title: 'Igipimo cyabitswe',
    toast_rubric_network: 'Ikosa rya murandasi mu kuvugurura igipimo',
    toast_no_rubric_approve: 'Uyu mwanya ntagipimo gifite cyemeza',
    toast_requisition_visible: '“{title}” ubu kireba abasabye',
    toast_requisition_published_title: 'Umwanya wamenyekanishije',
    toast_publish_failed: 'Byanze kumenyekanisha umwanya ({status})',
    toast_network_publish: 'Ikosa rya murandasi mu kumenyekanisha umwanya',
    toast_requisition_duplicated: 'Umwanya wakopororejwe nk “{title}”',
    toast_requisition_cloned_title: 'Umwanya wakopororejwe',
    toast_duplicate_failed: 'Byanze koporora umwanya',
    toast_network_duplicate: 'Ikosa rya murandasi mu koporora umwanya',
    toast_requisition_closed: 'Umwanya “{title}” ubu warafunze',
    toast_requisition_closed_title: 'Umwanya wafunze',
    toast_close_failed: 'Byanze gufunga umwanya',
    toast_network_close: 'Ikosa rya murandasi mu gufunga umwanya',
    toast_incomplete_response: 'Seriveri yatanze igisubizo kituzuye',

    my_apps_score_hint: 'Icyiciro cya % ni amanota ya nyuma ya AI yerekeye igipimo cya buri mwanya — bigenga gutoranya, ariko ntibigenga umwanzuro w’imwe.',
    my_apps_empty_tip: 'Inama: bika CV yawe kuri profil yawe kandi buri mwanya rifunguye rizaba risaba kanda rimwe.',
    my_apps_profile_link: 'profil',
    aria_app_score: 'Amanota ya nyuma ya AI kuri ubu busabe',
    match_band_strong: 'Umwanya mwinshi',
    match_band_good: 'Umwanya mwiza',
    match_band_building: 'Arahuza',

    profile_workspace_candidate: 'Ikigega cya umukandida',
    profile_workspace_account: 'Konti y’ikigega',
    profile_display_name: 'Izina ryerekanwa',
    profile_name_placeholder: 'Izina ryawe ryuzuye',
    profile_member_since: '· umunyamuryango kuva {date}',
    profile_department_access: 'Uburenganzira ku mashami:',
    profile_applications_count: 'Ubusabe {count}',
    profile_cv_saved_ok: 'CV yabitswe — kwisaba kanda rimwe warafunguye.',
    profile_cv_removed_ok: 'CV yari yabitswe yakuyeho.',
    profile_add: 'Ongeraho',
    profile_skill_placeholder: 'Andika ubushobozi wanda Enter — urugero: React, SQL, Figma',
    profile_skill_remove_hint: 'Kanda ukureho',
    profile_experience_placeholder: 'Incamake y’uburambe bwawe — ibyakozwe, imyaka, ibyagezweho…',
    profile_about_you: 'Ibyerekeye wowe',
    profile_file_hint: 'PDF, DOCX, TXT, MD · hejuru ya 5 MB',
    profile_saving: 'Kubika…',
    profile_save_failed: 'Byanze kubika profil',
    profile_cv_save_failed: 'Byanze kubika CV',
    profile_cv_remove_failed: 'Byanze gukuraho CV',
    profile_cv_saved_on: 'kibitswe kuwa {date}',
    aria_upload_cv: 'Injiza CV',

    audit_search_actor: 'Shakisha kuri imeri y’uwakoze…',
    audit_search_actor_aria: 'Shakisha iteka kuri imeri y’uwakoze',
    audit_search_action: 'Ikorwa urugero DECISION',
    audit_search_action_aria: 'Shakisha iteka kuri ikikorwa',
    audit_from_date: 'Itariki y’itangiriro',
    audit_from_date_aria: 'Itariki y’itangiriro',
    audit_to_date: 'Itariki y’impera',
    audit_to_date_aria: 'Itariki y’impera',
    btn_search: 'Shakisha',
    audit_sealed: '✓ KIDASIBWA',
    audit_logs_count: 'Ibitekerezo {count}',

    team_accounts_badge: 'Konti zose {count}',
    team_domain_title: '🔐 Ikimenyetso cya urubuga',
    team_domain_desc: 'Abakozi bafite imeri kuri domaine yawe yemejwe binjira muri uru rubuga mu buryo bwikora igihe bwinjira.',
    team_domain_verified: '✓ {domain}',
    team_domain_not_verified: '⚠ NTIYEMEJWE',
    team_domain_placeholder: 'isociete.com',
    team_btn_start_verification: 'Tangira kwemeza',
    team_btn_working: 'Birakorwa…',
    team_dns_step: '1. Ongeraho iyi TXT muri ruganda rwa DNS yawe:',
    team_btn_verify_now: 'Kanda kuri kwegemeza',
    team_btn_checking_dns: 'Kureba DNS…',
    team_notice_staff: 'Erekana abakozi b’imbere gusa: abashakisha, abayobozi n’abayobozi ba sisitemu.',
    team_notice_candidates: 'Erekana abasabye b’hanze bafite konti. Kugira ngo usuzume CV zabo, fungura Pipeline y’Abakandida.',
    team_col_employee: 'Umukozi / Umunyamuryango',
    team_col_candidate_name: 'Izina ry’umukandida',
    team_col_classification: 'Icyiciro',
    team_col_assigned_role: 'Role yahawe',
    team_col_account_status: 'Imiterere ya konti',
    team_col_permissions: 'Uburenganzira bwa RBAC',
    team_col_portal_access: 'Uburenganzira bwa portali',
    team_col_actions: 'Ibikorwa',
    team_empty_staff: 'Nta mukozi w’imbere abonetse.',
    team_empty_candidates: 'Nta konti y’abasabye b’hanze yanditse.',
    team_staff_user: 'Umukozi wa sisitemu',
    team_applicant: 'Usabye',
    team_badge_internal: '🏢 ABAKOZI B’IMBERE',
    team_badge_external: '📄 USABYE W’HANZE',
    team_applicant_portal: 'Portali y’usabye (Kwisaba & Gukurikirana)',
    team_view_applications: 'Reba ubusabe',
    team_promote: 'Kuzamura',
    team_promote_title: 'Kuzamura mu bakozi b’imbere',
    team_edit_role_title: 'Hindura role ya umunyamuryango',
    team_select_role: 'Hitamo role & uburenganzira *',
    team_invite_title: 'Hamagara umukozi',
    team_full_name: 'Izina ryuzuye',
    team_full_name_placeholder: 'urugero: Jane Doe',
    team_work_email: 'Imeri y’akazi *',
    team_work_email_placeholder: 'jane@isociete.com',
    team_role_assignment: 'Gutanga role *',
    team_send_invite: 'Ohereza itangazo',
    team_role_admin: 'Admin (Nyobora urubuga rwose)',
    team_role_recruiter: 'Umushakisha (ATS & ukuyobora abakandida)',
    team_role_manager: 'Umuyobozi w’ishami (Umunyamuryango w’ishami)',
    team_role_interviewer: 'Usuzuma (Usuzuma mu bw’imikorere)',
    team_role_auditor: 'Umugenzuzi w’ibikorwa (Inspekora y’igenzura)',
    team_role_candidate: 'Umukandida (Portali y’usabye gusa)',
    toast_role_updated_title: 'Role yavuguruwe',
    toast_role_updated: 'Role ya {name} yahindutse {role}',
    toast_role_failed: 'Byanze guhindura role',
    toast_role_network: 'Ikosa rya murandasi mu guhindura role',
    toast_invited_title: 'Umukozi yahamagawe',
    toast_invited: 'Itangazo ryoherejwe kuri {email}',
    toast_invite_failed: 'Byanze guhamagara umukozi',
    toast_invite_network: 'Ikosa rya murandasi mu kohereza itangazo',
    team_domain_claim_failed: 'Byanze gutangira kureba domaine.',
    team_domain_network: 'Ikosa rya murandasi mu kutangira kureba domaine.',
    team_verify_failed: 'Kwemeza byanze.',
    team_verify_network: 'Ikosa rya murandasi mu kwemeza.',
    team_domain_already: 'Iyi domaine yemewe already.',
    team_user_fallback: 'Umukoresha',

    settings_title: 'Igenamiterere ry’urubuga',
    settings_subtitle: 'Shiraho umwanya w’akazi, politiki y’imikorere, n’ikimenyetso cya kigo (spec §6.11/§6.12). Buri mpinduka irandikwa mu iteka ry’igenzura.',
    settings_tab_workflow: 'Umwanya & impamvu',
    settings_tab_retention: 'Politiki y’imikorere',
    settings_tab_branding: 'Ikimenyetso cya kigo',
    settings_reasons_title: 'Urutonde rw’impamvu z’icyemezo (§6.7)',
    settings_reasons_desc: 'Impamvu z’icyemezo zishobora guhindurwa zitangwa ku bashakisha igihe cyo kwandika icyemezo. Ibyiciro bidafite akamaro cyangwa bidaharanira abantu ntibigomba kongerwamo.',
    settings_no_reasons: 'Nta mpamvu zihariye zirahari.',
    settings_reason_code_placeholder: 'CODE (urugero: LACKS_EXPERIENCE)',
    settings_reason_label_placeholder: 'Izina rerekanwa',
    settings_add_reason: 'Ongeraho impamvu',
    settings_categories_title: 'Ibyiciro by’imyanya (§6.12)',
    settings_no_categories: 'Nta byiciro bihariye birahari.',
    settings_category_placeholder: 'Icyiciro gishya (urugero: Ingengo)',
    settings_boundaries_title: 'Impaka z’amanota (§6.12)',
    settings_strong_match: 'Umwanya mwinshi ≥ (%)',
    settings_manual_review: 'Kurebwa n’intoki ≤ (%)',
    settings_save_workflow: 'Bika igenamiterere ry’umwanya',
    settings_retention_desc: 'Igihe cy’imikorere kuri buri miterere y’ubusabe mu minsi (spec §6.11). Isubizweho = kubika gushika ku gikorwa cy’intoki.',
    settings_days_suffix: '(iminsi)',
    settings_anonymize: 'Kubahisha izina aho kusiba burundu ubusabe bwarenze igihe',
    settings_save_retention: 'Bika politiki y’imikorere',
    settings_display_name: 'Izina ryerekanwa ry’urubuga',
    settings_logo_url: 'URL y’ikimenyetso (ubushake)',
    settings_primary_color: 'Ibara ry’imbere',
    settings_save_branding: 'Bika ikimenyetso cya kigo',
    settings_saving: 'Kubika…',
    settings_saved_workflow: 'Igenamiterere ry’umwanya ryabitswe.',
    settings_saved_branding: 'Ikimenyetso cya kigo cyabitswe.',
    settings_saved_retention: 'Politiki y’imikorere yabitswe.',
    settings_failed_workflow: 'Byanze kubika igenamiterere ry’umwanya.',
    settings_failed_branding: 'Byanze kubika ikimenyetso cya kigo.',
    settings_failed_retention: 'Byanze kubika politiki y’imikorere.',
    settings_remove_reason: 'Kuraho impamvu {code}',
    settings_remove_category: 'Kuraho icyiciro {category}',

    analytics_metrics_badge: 'IBIPIMO §6.10',
    analytics_subtitle: 'Igihe cy’isuzuma, impinduka ku byiciro, kuraswa kw’abasuzuma n’ibiranga kuri myanya yemerewe.',
    analytics_filter_from: 'Kuva',
    analytics_filter_to: 'Kugera',
    analytics_filter_job: 'Umwanya',
    analytics_filter_department: 'Ishami',
    analytics_filter_recruiter: 'Umushakisha',
    analytics_filter_stage: 'Icyiciro',
    analytics_loading: 'Gupakira ibipimo…',
    analytics_metric_applications: 'Ubusabe',
    analytics_metric_time_to_screen: 'Igihe cy’isuzuma',
    analytics_metric_interviewer_completion: 'Kurangiza kw’abasuzuma',
    analytics_metric_processing_failures: 'Ibyazo by’umushinga',
    analytics_metric_low_confidence: 'Umwuga muke',
    analytics_metric_active_recruiters: 'Abashakisha bakora',
    analytics_hint_screened: '{count} byasuzumwe',
    analytics_hint_median: 'impuzandengo, gukora → isuzuma',
    analytics_hint_scorecards: '{submitted}/{total} ibipimo',
    analytics_hint_failed_processing: 'gukora CV byanze',
    analytics_hint_needs_review: 'gusaba kurebwa n’intoki',
    analytics_hint_open_workload: 'biriko birakorwa',
    analytics_restricted_note: 'Icyitonderwa: amakuru amwe yasabye angana y’uburenganzira bw’ishami yanjye kandi yavanyweho.',
    analytics_stage_distribution: 'Igaragariza ku byiciro',
    analytics_time_in_stage: 'Igihe mu cyiciro',
    analytics_recruiter_workload: 'Ibikorwa by’abashakisha',
    analytics_empty_period: 'Nta busabe mu gihe cyatoranyijwe.',
    analytics_empty_open: 'Nta busabe rifunguye.',
    analytics_empty_assigned: 'Nta busabe rifunguye ryahawe.',
    analytics_col_stage: 'Icyiciro',
    analytics_col_count: 'Umubare',
    analytics_col_median: 'Impuzandengo',
    analytics_definitions: 'Ibisobanuro by’ibipimo',
    analytics_error: 'Byanze gupakira ibipimo',

    email_title: 'Imikorere y’ohereza imeri',
    email_subtitle: 'Imeri ya sisitemu yoherejwe kandi ibanze mu minsi 7 ishize (spec §6.9). Kanda ku murongo urebe ikosa rya mbere.',
    email_back: '← Subira ku kibaho',
    email_empty_title: 'Nta meri yoherejwe byanze',
    email_empty_desc: 'Buri meri ya sisitemu mu minsi 7 ishize yanditse nka YOHEREJWE (cyangwa nta na yo yoherejwe).',
    email_failed_heading: 'Ibyoherejwe byanze — {total} byose',
    email_total_suffix: 'byose',
    email_col_when: 'Ighe',
    email_col_recipient: 'Uwo cyoherejwe',
    email_col_template: 'Inyandimwe',
    email_col_status: 'Imiterere',
    email_status_failed: 'BYANZE',
    email_hide_error: '▲ hisha ikosa',
    email_show_error: '▼ eresha ikosa',
    email_no_detail: 'Nta bisobanuro by’ikosa rya mbere byanditse kuri iyi meri.',
    btn_retry_delivery: '↻ Gerageza kandi',
    email_retrying: 'Kugerageza…',
    email_retry_ok: 'Kugerageza byagenze neza — imeri yagejejwe.',
    email_retry_failed: 'Kugerageza byanze: {detail}',
    email_retry_network: 'Ikosa rya murandasi — kugerageza nticyageragejwe.',
    email_ops_badge: 'ITEGANYAGARIKA OPS',
    email_all_templates: 'Inyandimwe zose',

    privacy_requests_title: 'Ibisaba ku makuru (kwandika, kureba, kwiruka)',
    privacy_requests_desc: 'Tanga isaba ryemewe. Kirandikwa, kirakurikiranwa kandi kigendereza ku itsinda ryacu ry’umutekano w’amakuru kugira ngo rirebe — uzahamagarwa n’umusanzu.',
    privacy_request_correction: 'Kosora amakuru yanjye',
    privacy_request_correction_hint: 'Tubwire iki kitari icyo kandi igihe cyagombaga kuba iki (urugero: nimero ya telefoni ikosa, izina ryanditse nabi).',
    privacy_request_access: 'Habona kop inyandiko y’amakuru yanjye',
    privacy_request_access_hint: 'Tuzategura kandi tukoohereze amakuru bwite dufite ku buryo bwawe.',
    privacy_request_withdrawal: 'Kura uruhushya rwanjye',
    privacy_request_withdrawal_hint: 'Saba ko duhagarika ibikorwa ku busabe bwawe. Gushaka abakozi kurikira bizahagarara.',
    privacy_request_deletion: 'Saba kurebwa kwa gusibwa',
    privacy_request_deletion_hint: 'Kugira ngo usibe burundu ako kanya, koresha urubuga rwa “Droite à l’Oubli” hejuru — ibi bisaba itsinda ry’umutekano ryemeze gusiba ibyanditse byihariye.',
    privacy_change_placeholder: 'Amakuru yawe yagombaga kuba iki mu buryo bwo kwibandaho?',
    privacy_context_placeholder: 'Amakuru y’inyongera (ubushake)',
    privacy_submit_request: 'Ohereza isaba',
    privacy_submitting: 'Kwohereza…',
    privacy_past_requests: 'Ibisaba byawe byashize',
    privacy_network_error: 'Ikosa rya murandasi — isaba ntiryoherejwe.',
    privacy_submit_failed: 'Byanze kohereza isaba.',
    privacy_request_recorded: 'Isaba ryawe ryanditse.',
    privacy_portability_toast_title: 'Koporora amakuru ya RGPD',
    privacy_erasure_toast_title: 'Uburenganzira bwo kwibagirwa',
    privacy_erasure_success: 'Konti yawe n’amakuru yawe bwite byasibwe burundu',
    privacy_export_failed: 'Byanze kohereza amakuru',
    privacy_erasure_failed: 'Byanze kohereza isaba ryo gusibwa',

    compare_matrix_title: 'Imbonerahamwe y’abakandida',
    compare_matrix_subtitle: 'Kugereranya amanota y’imikorere, ibyiciro by’ishakisha n’ubushobozi.',
    compare_col_candidate: 'Umukandida',
    compare_col_requisition: 'Umwanya',
    compare_col_match_score: 'Amanota y’umwanya',
    compare_col_stage: 'Icyiciro cya none',
    compare_col_skills: 'Ubushobozi bw’ingenzi',
    compare_col_action: 'Ikorwa',
    compare_view: 'Reba',
    compare_restricted_badge: 'KENYEGURA KUREBA KENEGUWE',
    compare_restricted_title: 'Igikoresho cy’igereranya kirazwe abasuzuma',
    compare_restricted_desc: 'Kugereranya hakurya-hakurya kubanza ku Bashakisha, Abayobozi b’Ishami n’Abasuzuma.',
    compare_restricted_cta: 'Subira ku Kibaho cy’Ibanze',
    compare_return_dashboard: 'Subira ku kibaho',

    error_generic_title: 'Habaye ikibazo!',
    btn_try_again: 'Gerageza kandi',
    apply_legacy_title: 'Ohereza ubusabe',
    apply_legacy_desc: 'Uzuza ifishi hanyuma winjize CV yawe (PDF cyangwa DOCX, hejuru ya 5 MB).',
    apply_legacy_select: 'Hitamo umwanya',
    apply_legacy_first_name: 'Izina ry’ambere',
    apply_legacy_last_name: 'Izina ry’umuryango',
    apply_legacy_email: 'Imeri',
    apply_legacy_resume: 'Inyandiko ya CV',
    apply_legacy_choose: '-- Hitamo Umwanya --',
    apply_legacy_consent: 'Nemeranya ko amakuru yanjye akorwaho mu rwego rwo gushakisha abakozi, harimo n’ifasha rya AI mu isuzuma.',
    apply_legacy_uploading: 'Birimo koherezwa...',
    apply_legacy_status_uploading: 'CV irimo koherezwa...',
    apply_legacy_status_success: 'Byagenze neza! Ubusabe bwawe bwoherejwe kandi burimo gukorwa.',
    apply_legacy_upload_failed: 'Kohereza byanze',
    interview_badge: 'ITEGANYWA RY’IBIZAMINI',
    interview_title: 'Tegeanya ikizamini cya nyuma',
    interview_subtitle: 'Ohereza amatangazo ya kalendari, tegura ibipimo by’imikorere, hanyuma hita abasuzuma.',
    interview_success_title: 'Ikizamini cyategeanywe neza!',
    interview_success_desc: 'Amatangazo n’imbonankubone byoherejwe. Kohereza ku profil y’umukandida...',
    interview_datetime: 'Itariki & Igihe (UTC) *',
    interview_duration: 'Igihe cy’ikizamini *',
    interview_platform: 'Urubuga rw’inama *',
    interview_30: 'Iminota 30',
    interview_45: 'Iminota 45 (bisanzwe)',
    interview_60: 'Iminota 60 (byimbitse)',
    interview_google_meet: 'Google Meet (yashyizweho iyonyine)',
    interview_zoom: 'Inama ya Zoom',
    interview_in_person: 'Mu bantu (Kigali HQ)',
    interview_submit: 'Emeza & Kohereza itangazo ry’ikizamini',
    interview_submitting: 'Kohereza amatangazo ya kalendari...',
    interview_back: 'Subira ku mukandida',
    interview_error: 'Ntibyakunze gutegura ikigambiriro. Ongera ugerageze.',

    copilot_thinking: 'Aratekereza…',
    copilot_error_network: 'Ikosa rya murandasi. Suzuma umuryango wawe hanyuma gerageza kandi.',
    copilot_error_service: 'Serivisi y’ubufasha ntiboneka ubu. Mugerageze ako kanya gato.',
    copilot_input_label: 'Andika umuburo kuri Copilote RecruitAI',
    copilot_reset_title: 'Kuraho ikiganiro',
    copilot_greeting: 'Muraho',
    copilot_acknowledge: 'Byumvikanye',
    copilot_handoff_note: 'Kuri ibi byose bidakora na RecruitAI, itsinda ryacu ry’abantu irashobora kubafasha — uyu mufasha aguma yibanda ku rubuga.',
    copilot_chip_more: 'Mbimenyeshe byinshi',
    copilot_chip_apply: 'Nasaba nte akazi?',
    copilot_chip_track: 'Kurikirana ubusabe bwanjye',
    copilot_chip_permissions: 'Uburenganzira bw’ inshingano',

    feedback_thanks: 'Murakoze kubitanga! Ibi bifasha kwigisha AI.',
    feedback_question: 'Amanota ya AI yari yagaragara?',
    feedback_placeholder: 'Icyo uvuga (ubushake)...',
    feedback_yes: 'Yego, yagaragara',
    feedback_no: 'Oya, hindura icyemezo',
    toast_telemetry_refreshed: 'Ibipimo bya pipeline byavuguruwe muri database',
    toast_telemetry_title: 'Ibipimo byavuguruwe'
  }
};