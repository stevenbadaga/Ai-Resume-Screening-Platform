/**
 * Spec §6.6 — skill and qualification matching support.
 *
 * The platform must normalize common skill variations and abbreviations while
 * preserving the wording found in the candidate document. This utility maps a
 * raw skill string (as extracted from a resume) to a canonical name so that
 * "JS", "Javascript", and "java script" all match a rubric criterion for
 * "JavaScript" — while the UI keeps showing the candidate's original wording.
 */

/**
 * Canonical name → recognized aliases (lowercase). Matching is case-insensitive
 * and ignores spaces, dots, hyphens, and ampersands, so "Node.js" matches
 * "nodejs" and "Node JS".
 */
const SKILL_ALIASES: Record<string, string[]> = {
  JavaScript: ['js', 'javascript', 'java script', 'java-script', 'ecmascript', 'es6'],
  TypeScript: ['ts', 'typescript', 'typescrippt'],
  'Node.js': ['nodejs', 'node js', 'node', 'node.js'],
  React: ['react', 'reactjs', 'react js', 'react.js'],
  'React Native': ['reactnative', 'react native', 'rn'],
  'Next.js': ['nextjs', 'next js', 'next.js', 'next'],
  Vue: ['vue', 'vuejs', 'vue js', 'vue.js'],
  Angular: ['angular', 'angularjs', 'angular js'],
  Python: ['python', 'py'],
  Java: ['java'],
  'C++': ['c++', 'cpp'],
  'C#': ['c#', 'csharp', 'c sharp'],
  Go: ['go', 'golang'],
  Rust: ['rust', 'rs'],
  Ruby: ['ruby', 'rb'],
  PHP: ['php'],
  Kotlin: ['kotlin'],
  Swift: ['swift'],
  SQL: ['sql'],
  PostgreSQL: ['postgresql', 'postgres', 'psql', 'pg'],
  MySQL: ['mysql', 'my sql'],
  MongoDB: ['mongodb', 'mongo'],
  Redis: ['redis'],
  GraphQL: ['graphql', 'gql'],
  REST: ['rest', 'restful', 'rest api'],
  Docker: ['docker', 'containers'],
  Kubernetes: ['kubernetes', 'k8s'],
  AWS: ['aws', 'amazon web services'],
  GCP: ['gcp', 'google cloud', 'google cloud platform'],
  Azure: ['azure', 'microsoft azure'],
  Terraform: ['terraform', 'tf'],
  Git: ['git', 'github', 'gitlab', 'version control'],
  'CI/CD': ['ci/cd', 'cicd', 'ci cd', 'continuous integration', 'continuous delivery'],
  HTML: ['html', 'html5'],
  CSS: ['css', 'css3'],
  'Machine Learning': ['machine learning', 'ml', 'mlai'],
  'Deep Learning': ['deep learning', 'dl'],
  NLP: ['nlp', 'natural language processing'],
  Django: ['django'],
  Flask: ['flask'],
  'Spring Boot': ['spring boot', 'springboot', 'spring'],
  '.NET': ['.net', 'dotnet'],
  Laravel: ['laravel'],
  Rails: ['rails', 'ruby on rails', 'ror'],
  Prisma: ['prisma'],
  Tailwind: ['tailwind', 'tailwindcss', 'tailwind css'],
  Figma: ['figma'],
  Excel: ['excel', 'ms excel', 'microsoft excel'],
  'Project Management': ['project management', 'pm'],
  Agile: ['agile', 'scrum', 'kanban'],
};

/** Normalized alias → canonical name, built once at module load. */
const ALIAS_TO_CANONICAL: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    map.set(normalizeKey(canonical), canonical);
    for (const alias of aliases) {
      map.set(normalizeKey(alias), canonical);
    }
  }
  return map;
})();

/**
 * The canonical skill taxonomy — THE single shared skill list for the whole
 * platform (spec §6.6). Screening (resume parsing, rubric matching) and the
 * support copilot both render from this table so they can never drift apart.
 */
export const CANONICAL_SKILL_NAMES: readonly string[] =
  Object.keys(SKILL_ALIASES).sort((a, b) => a.localeCompare(b));

export interface SkillTaxonomyEntry {
  canonical: string;
  aliases: string[];
}

/**
 * Full taxonomy (canonical name + recognized aliases) for UI hints and for
 * grounding the support copilot.
 */
export function getSkillTaxonomy(): SkillTaxonomyEntry[] {
  return Object.entries(SKILL_ALIASES)
    .map(([canonical, aliases]) => ({ canonical, aliases: [...aliases] }))
    .sort((a, b) => a.canonical.localeCompare(b.canonical));
}

/** Reduce a skill string to a comparable key: lowercase, no separators. */
function normalizeKey(skill: string): string {
  return skill.toLowerCase().replace(/[\s.\-/&+]+/g, '');
}

/**
 * Returns the canonical skill name for a raw extracted skill, or null when
 * the skill is not in the alias table (unknown skills are returned as-is by
 * the higher-level helpers — this function is the pure lookup).
 */
export function canonicalSkillName(rawSkill: string): string | null {
  const key = normalizeKey(rawSkill.trim());
  if (!key) return null;
  return ALIAS_TO_CANONICAL.get(key) ?? null;
}

export interface SkillMatchResult {
  /** Canonical name when recognized, otherwise the original input. */
  canonical: string;
  /** True when the input mapped through the alias table. */
  wasNormalized: boolean;
  /** The original wording found in the candidate document. */
  original: string;
}

/**
 * Normalize a single skill, preserving the original wording (spec §6.6).
 */
export function normalizeSkill(rawSkill: string): SkillMatchResult {
  const original = rawSkill.trim();
  const canonical = canonicalSkillName(original);
  return {
    canonical: canonical ?? original,
    wasNormalized: canonical !== null && canonical.toLowerCase() !== normalizeKey(original),
    original,
  };
}

/**
 * Normalize a whole skills list. Duplicates (after normalization) are removed,
 * keeping the first occurrence's original wording.
 */
export function normalizeSkillList(skills: string[]): SkillMatchResult[] {
  const seen = new Set<string>();
  const results: SkillMatchResult[] = [];
  for (const skill of skills ?? []) {
    if (typeof skill !== 'string') continue;
    const normalized = normalizeSkill(skill);
    const dedupeKey = normalizeKey(normalized.canonical);
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    results.push(normalized);
  }
  return results;
}

/**
 * Classify a candidate's normalized skills against a rubric criterion that
 * expects certain skills, separating exact matches from related/transferable
 * matches (spec §6.6: exact, related, transferable, and missing must be
 * presented separately).
 */
export function classifySkillsAgainstCriterion(
  candidateSkills: string[],
  criterionSkills: string[],
  relatedMap: Record<string, string[]> = {}
): { exact: string[]; related: string[]; missing: string[] } {
  const candidateCanonical = new Set(
    (candidateSkills ?? [])
      .map((s) => {
        const canonical = canonicalSkillName(s) ?? s;
        return normalizeKey(canonical);
      })
      .filter(Boolean)
  );

  const exact: string[] = [];
  const related: string[] = [];
  const missing: string[] = [];

  for (const expected of criterionSkills ?? []) {
    const expectedCanonical = canonicalSkillName(expected) ?? expected;
    if (candidateCanonical.has(normalizeKey(expectedCanonical))) {
      exact.push(expectedCanonical);
      continue;
    }
    const relatedForExpected = (relatedMap[expectedCanonical] ?? []).some((rel) =>
      candidateCanonical.has(normalizeKey(canonicalSkillName(rel) ?? rel))
    );
    if (relatedForExpected) {
      related.push(expectedCanonical);
    } else {
      missing.push(expectedCanonical);
    }
  }

  return { exact, related, missing };
}
