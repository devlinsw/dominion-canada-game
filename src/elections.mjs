// V2 elections: mandate classes (majority/minority/opposition) + opposition agency.
// Decision (2026-08): mandate classes only for now — regional seat model deferred.
// Opposition actions: small metric deltas, large approval/credibility deltas.

import { rng } from './engine.mjs';

export const MANDATE_CLASSES = ['majority', 'minority', 'opposition'];

/**
 * Resolve an election deterministically from state + run seed.
 * approval: national approval 0..100. approvalNeeded: authored gate (V1 parity).
 * credibility: player party's credibility reservoir.
 * Returns { result: 'win-majority'|'win-minority'|'lose', seats } where seats is
 * a transparent, explainable score — not fake riding granularity.
 */
export function resolveElection(state, { approvalNeeded = 40 }) {
  const r = rng(state);
  const m = state.metrics;
  const performance =
    (m.economy - 50) * 0.8 +
    (m.unity - 50) * 0.5 +
    (m.social - 50) * 0.4 +
    (m.rights - 50) * 0.3;
  const support = state.government.approval ?? 50;
  const score = support + performance * 0.3 + (state.government.credibility ?? 50) * 0.2
              + (r - 0.5) * 6;                       // seeded noise, ±3

  if (score < approvalNeeded) {
    return { result: 'lose', mandate: 'opposition', score };
  }
  // above the gate: majority only if the score clears the gate by a wide margin
  // relative to how strong support itself is (credibility/performance alone
  // can't carry a weak-support government to a majority)
  const margin = score - approvalNeeded;
  const supportStrength = support - approvalNeeded;
  return margin >= 12 && supportStrength >= 8
    ? { result: 'win', mandate: 'majority', score }
    : { result: 'win', mandate: 'minority', score };
}

/** Apply an election result to state: transfer government, log history. */
export function applyElectionResult(state, outcome, winnerParty = null) {
  const lost = outcome.result === 'lose';
  state.elections.push({
    year: state.year,
    result: outcome.result,
    mandate: outcome.mandate,
    winnerParty: lost ? (winnerParty ?? 'opposition-authored') : state.government.party,
  });
  if (lost) {
    state.government.mandate = 'opposition';
    state.government.partyControlsGovernment = false;
  } else {
    state.government.mandate = outcome.mandate;
    state.government.partyControlsGovernment = true;
  }
  return state.elections[state.elections.length - 1];
}

/**
 * Opposition agency (V2-03): an opposition action has SMALL policy effects and
 * LARGE political-position effects. Enforce the shape here so content can't
 * quietly become "opposition governs anyway".
 *   metrics deltas are applied at full authored value but must be small;
 *   approval/credibility deltas are doubled relative to their authored weight.
 */
const OPPOSITION_MAX_METRIC_DELTA = 6;

export function applyOppositionAction(state, action) {
  for (const [k, v] of Object.entries(action.metrics || {})) {
    if (Math.abs(v) > OPPOSITION_MAX_METRIC_DELTA) {
      throw new Error(`opposition action "${action.id}": metric ${k} delta ${v} exceeds max ${OPPOSITION_MAX_METRIC_DELTA}`);
    }
    state.metrics[k] = Math.max(0, Math.min(100, state.metrics[k] + v));
  }
  if (action.approvalDelta) {
    state.government.approval = (state.government.approval ?? 50) + action.approvalDelta * 1.5;
  }
  if (action.credibilityDelta) {
    state.government.credibility = (state.government.credibility ?? 50) + action.credibilityDelta * 1.5;
  }
}
