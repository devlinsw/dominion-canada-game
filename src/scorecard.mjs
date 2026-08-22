// V2-05 scorecard: plural success criteria, weights exposed, not hidden.
// Five scores answer five different questions. A party can succeed electorally
// while failing national outcomes, or vice versa.

import { METRIC_IDS } from './schema.mjs';

// Public, inspectable weights — deliberately NOT hidden (backlog acceptance:
// "the end screen explains what each score measures and does not hide weights").
export const COMMONWEALTH_WEIGHTS = {
  unity: 1, economy: 1, rights: 1, enviro: 1, sovereign: 1, social: 1,
};

/**
 * National outcome vs the historical benchmark.
 * Returns 0..100+; >50 means you beat the historical path on the same rules.
 */
export function nationalOutcome(metrics, historicalMetrics) {
  const mine = meanWeighted(metrics);
  const hist = meanWeighted(historicalMetrics);
  return Math.round(((mine - hist) / 100) * 200 + 50); // +25 avg metric pts over history = 100
}

function meanWeighted(m) {
  const total = METRIC_IDS.reduce((s, k) => s + (COMMONWEALTH_WEIGHTS[k] ?? 0) * (m[k] ?? 50), 0);
  const wsum = METRIC_IDS.reduce((s, k) => s + (COMMONWEALTH_WEIGHTS[k] ?? 0), 0);
  return total / wsum;
}

/**
 * Democratic legitimacy: consent, rights, constitutional stability.
 * Penalizes rights erosion and unresolved constitutional rupture.
 */
export function democraticLegitimacy(state) {
  let score = state.metrics.rights;
  if (state.world.quebecStatus === 'independent') score -= 20;         // country broke
  else if (state.world.quebecStatus === 'independent-negotiating') score -= 10;
  if (state.world.constitutionalSettlement === 'contested') score -= 8;
  for (const e of state.elections) {
    if (e.result === 'lose' && e.winnerParty === 'opposition-authored') score -= 4; // instability cost, small
  }
  return clamp(score);
}

/** Party mandate: promises kept + caucus/coalition credibility. */
export function partyMandate(state, promisesKept = 0, promisesMade = 0) {
  const kept = promisesMade > 0 ? promisesKept / promisesMade : 0.5;
  const credibility = state.government.credibility ?? 50;
  return clamp(Math.round(kept * 50 + credibility * 0.5));
}

/** Electoral durability: could your party win again? */
export function electoralDurability(state) {
  const wins = state.elections.filter(e => e.result === 'win').length;
  const losses = state.elections.filter(e => e.result === 'lose').length;
  const lastMandate = state.government.mandate;
  let score = 40 + wins * 15 - losses * 10;
  if (lastMandate === 'majority') score += 15;
  else if (lastMandate === 'minority') score += 5;
  return clamp(score);
}

/**
 * Regional / Indigenous legitimacy placeholder: consent vs mere compliance.
 * Full regional model deferred; uses world flags authored so far.
 */
export function regionalIndigenousLegitimacy(state) {
  let score = 55;   // neutral start — most of Canada merely complies, historically
  if (state.world.quebecStatus === 'renewed-federalism') score += 20;   // genuine consent
  if (state.world.quebecStatus === 'independent') score -= 15;
  if (state.world.westernAlienation === 'high') score -= 15;
  if (state.world.indigenousConsent === 'earned') score += 15;
  if (state.world.indigenousConsent === 'ignored') score -= 20;
  return clamp(score);
}

/** The full end-screen card. Every component explains its own question. */
export function buildScorecard(state, historicalMetrics, promises = { kept: 0, made: 0 }) {
  return [
    { key: 'national', label: 'National outcome',
      question: 'Did Canada outperform the historical benchmark?',
      value: nationalOutcome(state.metrics, historicalMetrics) },
    { key: 'democracy', label: 'Democratic legitimacy',
      question: 'Did you maintain consent, rights, and constitutional legitimacy?',
      value: democraticLegitimacy(state) },
    { key: 'mandate', label: 'Party mandate',
      question: 'Did you deliver what voters elected your party to do?',
      value: partyMandate(state, promises.kept, promises.made) },
    { key: 'durability', label: 'Electoral durability',
      question: 'Could your party win again?',
      value: electoralDurability(state) },
    { key: 'regional', label: 'Regional & Indigenous legitimacy',
      question: 'Did affected nations and regions consent, or merely comply?',
      value: regionalIndigenousLegitimacy(state) },
  ];
}

function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }
