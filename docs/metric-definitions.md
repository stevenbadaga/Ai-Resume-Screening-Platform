# Metric Definitions (§6.10)

Every metric below is computed by `GET /api/analytics` and rendered on `/dashboard/analytics`
with the same definitions. The endpoint echoes these definitions back in each response
(`metricDefinitions` field), so dashboards and exports can never drift from this document.

## Scope and filters

Analytics are computed **only** over the permitted scope:

- Organization boundary: always the signed-in user's `organizationId` (§6.1).
- Hiring managers see only jobs they own (§6.7).
- Department restrictions always apply; a restricted query sets
  `summary.departmentAccessRestricted: true`.
- Filters: `from`/`to` (application created-at range), `jobId`, `department`, `recruiterId`,
  `stage`. All default to `ALL`. The same filter set is applied identically to every metric in
  the response, so cross-metric totals are comparable; CSV exports (`/api/export`) read the
  same tables so export totals match dashboard counts for the same filter set.

## Metrics

| Metric | Definition |
|---|---|
| `summary.totalApplications` | Count of applications matching the filter scope. |
| `summary.screenedCount` | Count of those applications that have at least one COMPLETED screening run. |
| `summary.timeToScreenHours` | **Median** hours from application `createdAt` to the first COMPLETED screening run's `createdAt` (per application; unscreened applications excluded). |
| `timeInStage[]` | Per stage: count of applications currently in that stage and the **median** hours they have spent there (measured from `updatedAt` to now). |
| `stageConversion[]` | Per stage: count of applications currently in the stage and their share of `totalApplications` (`conversionPct`, 1 decimal). Stage here means the application's **current** stage; decision history is retained separately for audit (§6.7). |
| `summary.interviewerCompletionPct` | Submitted scorecards (`structuredFeedback` set) ÷ assigned interview participants, for interviews matching the scope; 0 when no participants. |
| `summary.totalParticipants` / `summary.submittedParticipants` | The numerator/denominator of the completion metric, so the percentage is auditable. |
| `summary.failedProcessingCount` | Resume documents in `FAILED` processing status within scope. |
| `summary.needsReviewCount` | Resume documents in `NEEDS_REVIEW` (low-confidence extraction, < 80) within scope. |
| `recruiterWorkload[]` | Open applications (status not `REJECTED`, `WITHDRAWN`, `HIRED`) per assigned recruiter, sorted by load. Applications without an assigned recruiter are excluded. |

## Sensitive-demographics note

No demographic analytics are included in the core product (§6.10): screening scores are
computed from PII-redacted resume text, and no race, gender, ethnicity, or other protected
attribute is collected or reportable anywhere in the platform.

## Consistency guarantee

`/dashboard` funnel counters and `/api/analytics` both count by `Application.stage` — the
single field every decision route writes (see the stage vocabulary note in
`docs/specification-compliance-report.md`) — so the dashboard and the analytics view agree for
the same filter set.
