// V2 schema — EventSpec / GameState types + runtime validator.
// Data lives in ./events.json; this module is the single authority on shape.
// No build step: browser imports it via <script type="module">, Node via import.

/**
 * @typedef {'unity'|'economy'|'rights'|'enviro'|'sovereign'|'social'} MetricId
 * @typedef {'unemployment'|'debtToGdp'|'growthIndex'} FinancialIndicatorId
 * @typedef {'BC'|'Prairies'|'Ontario'|'Quebec'|'Atlantic'|'North'} RegionId
 *
 * @typedef {'universal'|'altered'|'conditional'|'party'|'reactive'} EventType
 *   universal  — era anchor, appears in every run
 *   altered    — appears in every run, severity/copy/choices change with state
 *   conditional— appears only because a world flag makes it relevant
 *   party      — exists because of governing party / confidence-partner dynamics
 *   reactive   — systemic shock eligible when era + macro + flags + seed align
 *
 * @typedef {'government'|'opposition'|'confidence-partner'|'all-parties'} Actor
 *
 * @typedef {Object} ChoiceSpec
 * @property {string} id
 * @property {string} label            // short player-facing label
 * @property {Partial<Record<MetricId,number>>} metrics
 * @property {Object} [financial]      // partial FinancialIndicator deltas
 * @property {Partial<Record<RegionId,number>>} [regional]
 * @property {Object} [setsFlags]      // durable WorldFlag patches
 * @property {string[]} [unlocks]      // EventIds made eligible
 * @property {string[]} [blocks]       // EventIds made ineligible forever
 * @property {string[]} [alters]       // EventIds whose copy/severity changes
 * @property {Object} [confidence]     // confidence-partner deltas
 * @property {number} [delayedYears]   // years until financial/regional effects land
 * @property {boolean} [isHistorical]  // matches the real-world path (V1 parity)
 *
 * @typedef {Object} EventSpec
 * @property {string} id
 * @property {string} title
 * @property {[number,number]} yearWindow
 * @property {EventType} type
 * @property {Actor} actor
 * @property {boolean} [isElection]
 * @property {number} [approvalNeeded] // elections only (V1 parity)
 * @property {number} [v1Index]        // index in V1 game_data.json, if migrated
 * @property {boolean} [needsUnlock]   // true = only eligible when some choice unlocked it
 * @property {string[]} [requires]     // predicate refs: "flag:x=y" | "metric:unity>=40" | "unlocked:<id>"
 * @property {string[]} [excludes]
 * @property {number} [priority]       // selection order within an era (higher first)
 * @property {MetricId[]} metricsAffected
 * @property {FinancialIndicatorId[]} [financialAffected]
 * @property {RegionId[]} [regionalAffected]
 * @property {ChoiceSpec[]} choices
 */

// KNOWN GAPS (accepted by schema but NOT yet implemented by engine.mjs):
// - delayedYears: delayed financial/regional effects do not land automatically yet.
// - confidence: confidence-partner deltas are recorded on choices but not applied to state.
// - alters: alters[] is validated for referential integrity but has no runtime effect yet.

export const METRIC_IDS = ['unity', 'economy', 'rights', 'enviro', 'sovereign', 'social'];
export const FINANCIAL_IDS = ['unemployment', 'debtToGdp', 'growthIndex'];
export const REGION_IDS = ['BC', 'Prairies', 'Ontario', 'Quebec', 'Atlantic', 'North'];
export const EVENT_TYPES = ['universal', 'altered', 'conditional', 'party', 'reactive'];
export const ACTORS = ['government', 'opposition', 'confidence-partner', 'all-parties'];

/** Initial GameState factory. One source of truth for defaults. */
export function newGameState(seed = 1) {
  return {
    year: 1968,
    seed,
    rngState: seed,
    metrics: Object.fromEntries(METRIC_IDS.map(m => [m, 50])),
    financial: { unemployment: 5.8, debtToGdp: 66, growthIndex: 50 },
    world: {},               // durable flags, e.g. quebecStatus, tradePosture
    government: { party: 'liberal', mandate: 'majority', confidencePartner: null },
    parties: {},             // PartyId -> PartyState (credibility, approval)
    elections: [],           // { year, result, winningParty }
    history: [],             // transparent log of applied choices/effects
    unlocked: new Set(),     // EventIds currently eligible via unlocks
    blocked: new Set(),      // EventIds permanently removed
    resolved: new Set(),     // EventIds already played
  };
}

function fail(spec, msg) { throw new Error(`[events] ${spec.id || '?'}: ${msg}`); }

/** Validate one EventSpec against the contract above. Throws on violation. */
export function validateEvent(spec) {
  for (const k of ['id', 'title', 'yearWindow', 'type', 'actor', 'choices', 'metricsAffected']) {
    if (spec[k] === undefined) fail(spec, `missing required field "${k}"`);
  }
  if (!Array.isArray(spec.yearWindow) || spec.yearWindow.length !== 2 ||
      !(spec.yearWindow[0] <= spec.yearWindow[1])) {
    fail(spec, 'yearWindow must be [from, to] with from <= to');
  }
  if (!EVENT_TYPES.includes(spec.type)) fail(spec, `bad type "${spec.type}"`);
  if (!ACTORS.includes(spec.actor)) fail(spec, `bad actor "${spec.actor}"`);
  if (!Array.isArray(spec.choices) || spec.choices.length < 1) {
    fail(spec, 'needs at least one choice');
  }
  if (!Array.isArray(spec.metricsAffected)) fail(spec, 'metricsAffected must be an array');
  for (const m of spec.metricsAffected) {
    if (!METRIC_IDS.includes(m)) fail(spec, `metricsAffected: unknown metric "${m}"`);
  }
  const choiceIds = new Set();
  spec.choices.forEach((c, i) => {
    validateChoice(spec, c, i);
    if (choiceIds.has(c.id)) fail(spec, `duplicate choice id "${c.id}"`);
    choiceIds.add(c.id);
  });
}

function validateChoice(spec, c, i) {
  const at = `choice[${i}]${c.id ? `(${c.id})` : ''}`;
  if (!c.id || !c.label) fail(spec, `${at}: needs id and label`);
  for (const m of Object.keys(c.metrics || {})) {
    if (!METRIC_IDS.includes(m)) fail(spec, `${at}: unknown metric "${m}"`);
  }
  for (const f of Object.keys(c.financial || {})) {
    if (!FINANCIAL_IDS.includes(f)) fail(spec, `${at}: unknown financial indicator "${f}"`);
  }
  for (const r of Object.keys(c.regional || {})) {
    if (!REGION_IDS.includes(r)) fail(spec, `${at}: unknown region "${r}"`);
  }
}

/**
 * Validate a whole event array; checks id uniqueness and cross-references.
 * Returns error list (empty = valid).
 */
export function validateAll(events) {
  const errors = [];
  const seen = new Set();
  for (const e of events) {
    try {
      validateEvent(e);
      if (seen.has(e.id)) errors.push(`duplicate id ${e.id}`);
      seen.add(e.id);
    } catch (err) { errors.push(err.message); }
  }
  // cross-reference integrity: unlocks/blocks/alters/requires-unlocked must point at real ids
  for (const e of events) {
    const refs = [
      ...(e.unlocks || []), ...(e.blocks || []), ...(e.alters || []),
      ...(e.requires || []).filter(r => r.startsWith('unlocked:')).map(r => r.slice('unlocked:'.length)),
    ];
    for (const ref of refs) {
      if (!seen.has(ref)) errors.push(`${e.id}: references unknown event id "${ref}"`);
    }
  }
  return errors;
}
