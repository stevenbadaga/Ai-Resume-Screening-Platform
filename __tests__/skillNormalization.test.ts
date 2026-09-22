import { describe, it, expect } from 'vitest';
import {
  canonicalSkillName,
  normalizeSkill,
  normalizeSkillList,
  classifySkillsAgainstCriterion,
  CANONICAL_SKILL_NAMES,
  getSkillTaxonomy,
} from '../src/lib/skillNormalization';
import { renderSkillKnowledge, getGroundedKnowledgeContext } from '../src/lib/supportBrain';

describe('skill normalization (spec §6.6)', () => {
  it('maps common abbreviations to canonical names', () => {
    expect(canonicalSkillName('JS')).toBe('JavaScript');
    expect(canonicalSkillName('k8s')).toBe('Kubernetes');
    expect(canonicalSkillName('postgres')).toBe('PostgreSQL');
    expect(canonicalSkillName('AWS')).toBe('AWS');
    expect(canonicalSkillName('amazon web services')).toBe('AWS');
    expect(canonicalSkillName('golang')).toBe('Go');
  });

  it('is case-insensitive and ignores separators (Node.js === node js)', () => {
    expect(canonicalSkillName('Node.JS')).toBe('Node.js');
    expect(canonicalSkillName('node js')).toBe('Node.js');
    expect(canonicalSkillName('NODEJS')).toBe('Node.js');
    expect(canonicalSkillName('ci-cd')).toBe('CI/CD');
  });

  it('returns null for unknown skills', () => {
    expect(canonicalSkillName('Quantum Weaving')).toBeNull();
    expect(canonicalSkillName('')).toBeNull();
  });

  it('normalizeSkill preserves the original wording', () => {
    const result = normalizeSkill('  JS  ');
    expect(result.original).toBe('JS');
    expect(result.canonical).toBe('JavaScript');
    expect(result.wasNormalized).toBe(true);
  });

  it('normalizeSkill leaves unknown skills as-is', () => {
    const result = normalizeSkill('Quantum Weaving');
    expect(result.canonical).toBe('Quantum Weaving');
    expect(result.wasNormalized).toBe(false);
  });

  it('normalizeSkillList deduplicates after normalization, keeping first wording', () => {
    const results = normalizeSkillList(['JS', 'JavaScript', 'React', 'react js', 'Weird Thing']);
    const canonicals = results.map((r) => r.canonical);
    expect(canonicals).toEqual(['JavaScript', 'React', 'Weird Thing']);
    // Original wording of the first occurrence is preserved
    expect(results[0].original).toBe('JS');
  });

  it('classifySkillsAgainstCriterion separates exact, related, and missing', () => {
    const related = { Kubernetes: ['Docker'], PostgreSQL: ['MySQL'] };
    const result = classifySkillsAgainstCriterion(
      ['JS', 'React', 'docker', 'postgres'],
      ['JavaScript', 'PostgreSQL', 'Kubernetes'],
      related
    );
    expect(result.exact).toEqual(['JavaScript', 'PostgreSQL']);
    expect(result.related).toEqual(['Kubernetes']); // via transferable Docker experience
    expect(result.missing).toEqual([]);
  });

  it('classifySkillsAgainstCriterion reports related for transferable-only matches', () => {
    const related = { JavaScript: ['TypeScript'] };
    const result = classifySkillsAgainstCriterion(['TypeScript'], ['JavaScript'], related);
    expect(result.exact).toEqual([]);
    expect(result.related).toEqual(['JavaScript']);
  });

  it('classifySkillsAgainstCriterion treats unmatched skills as missing', () => {
    const result = classifySkillsAgainstCriterion(['Excel'], ['Kubernetes']);
    expect(result.missing).toEqual(['Kubernetes']);
    expect(result.exact).toEqual([]);
  });

  it('exposes the canonical taxonomy sorted and consistent with the alias table', () => {
    expect(CANONICAL_SKILL_NAMES.length).toBeGreaterThan(40);
    const sorted = [...CANONICAL_SKILL_NAMES].sort((a, b) => a.localeCompare(b));
    expect(CANONICAL_SKILL_NAMES).toEqual(sorted);
    // Every canonical name must resolve to itself through the alias lookup
    for (const name of CANONICAL_SKILL_NAMES) {
      expect(canonicalSkillName(name)).toBe(name);
    }
    const taxonomy = getSkillTaxonomy();
    expect(taxonomy.map((t) => t.canonical)).toEqual(CANONICAL_SKILL_NAMES);
    // No alias maps to two different canonical names
    const seen = new Map<string, string>();
    for (const entry of taxonomy) {
      for (const alias of [entry.canonical, ...entry.aliases]) {
        const key = alias.toLowerCase().replace(/[\s.\-/&+]+/g, '');
        const previous = seen.get(key);
        expect(previous === undefined || previous === entry.canonical).toBe(true);
        seen.set(key, entry.canonical);
      }
    }
  });

  it('support copilot renders its skill knowledge from the shared screening taxonomy', () => {
    const knowledge = renderSkillKnowledge();
    // Grounded in the same table the screening engine consumes
    expect(knowledge).toContain(`RecruitAI screening recognizes ${CANONICAL_SKILL_NAMES.length} canonical skills`);
    for (const name of ['JavaScript', 'PostgreSQL', 'Kubernetes']) {
      expect(knowledge).toContain(name);
    }
    // Alias mappings are surfaced so users can verify recognition
    expect(knowledge).toContain('js');
    expect(knowledge).toContain('k8s');
    // The grounded context embeds the same skill knowledge
    expect(getGroundedKnowledgeContext('en')).toContain('canonical skills');
  });

  it('keeps the copilot skill list in sync with what screening normalizes', () => {
    // Any skill the copilot advertises must be resolvable by screening —
    // this is the drift guard between the two consumers.
    for (const name of CANONICAL_SKILL_NAMES) {
      expect(canonicalSkillName(name)).not.toBeNull();
      const normalized = normalizeSkillList([name.toUpperCase()]);
      expect(normalized[0].canonical).toBe(name);
    }
  });
});
