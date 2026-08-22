// Deterministic V2 engine: event selection + choice application.
// Same seed + same choices => identical state. No DOM, runs in Node and browser.

import { newGameState, METRIC_IDS } from './schema.mjs';

// Mulberry32 — tiny, fast, reproducible.
export function rng(state) {
  state.rngState = (state.rngState + 0x6D2B79F5) | 0;
  let t = state.rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const cmp = { '>=': (a, b) => a >= b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '<': (a, b) => a < b, '==': (a, b) => a == b };

/** Evaluate a predicate ref like "flag:quebecStatus=independent" or "metric:economy>=40". */
export function testPredicate(state, ref) {
  const [kind, rest] = ref.split(':');
  if (kind === 'flag') {
    const m = rest.match(/^(\w+)(=|!=)(.+)$/);
    if (!m) throw new Error(`bad flag predicate "${ref}"`);
    const val = state.world[m[1]];
    return m[2] === '=' ? String(val) === m[3] : String(val) !== m[3];
  }
  if (kind === 'metric' || kind === 'financial') {
    const m = rest.match(/^(\w+)(>=|<=|>|<|==)(-?[\d.]+)$/);
    if (!m) throw new Error(`bad ${kind} predicate "${ref}"`);
    return cmp[m[2]](state[kind === 'metric' ? 'metrics' : 'financial'][m[1]], Number(m[3]));
  }
  throw new Error(`unknown predicate kind in "${ref}"`);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/** Events whose year window is open, requirements met, not blocked/resolved. */
export function eligibleEvents(state, events, year = state.year) {
  return events.filter(e =>
    !state.blocked.has(e.id) &&
    !state.resolved.has(e.id) &&
    year >= e.yearWindow[0] && year <= e.yearWindow[1] &&
    (e.requires || []).every(r => testPredicate(state, r)) &&
    (e.excludes || []).every(r => !testPredicate(state, r))
  );
}

/**
 * Pick the next event for this time step. Priority order:
 * constitutional/existential > election > scheduled anchor > party/conditional > reactive.
 */
export function selectNextEvent(state, events, year = state.year) {
  const pool = eligibleEvents(state, events, year);
  if (!pool.length) return null;
  const rank = e =>
    (e.type === 'conditional' ? 5 : 0) +
    (e.isElection ? 4 : 0) +
    (e.priority ?? 2);
  // deterministic seeded tie-break so shuffles are reproducible
  const noise = e => rng(state) * 0.01 * ((e.id.charCodeAt(0) % 7) + 1);
  return [...pool].sort((a, b) => (rank(b) + noise(b)) - (rank(a) + noise(a)))[0];
}

/** Apply a chosen ChoiceSpec to state. Returns a transparent history record. */
export function applyChoice(state, event, choice) {
  const before = JSON.parse(JSON.stringify({
    metrics: state.metrics, financial: state.financial,
  }));
  for (const [k, v] of Object.entries(choice.metrics || {})) {
    state.metrics[k] = clamp(state.metrics[k] + v, 0, 100);
  }
  for (const [k, v] of Object.entries(choice.financial || {})) {
    state.financial[k] += v;   // financial indicators are unclamped real-world numbers
  }
  Object.assign(state.world, choice.setsFlags || {});
  for (const id of choice.unlocks || []) state.unlocked.add(id);
  for (const id of choice.blocks || []) state.blocked.add(id);
  state.resolved.add(event.id);

  const record = {
    year: state.year, eventId: event.id, choiceId: choice.id,
    before, after: JSON.parse(JSON.stringify({
      metrics: state.metrics, financial: state.financial, world: state.world,
    })),
    flagsSet: choice.setsFlags ? Object.keys(choice.setsFlags) : [],
  };
  state.history.push(record);
  return record;
}

/** Advance the clock to the next event's window. Returns the new year. */
export function advanceYear(state, targetYear) {
  state.year = Math.max(state.year, targetYear);
  return state.year;
}
