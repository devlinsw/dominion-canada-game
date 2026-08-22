// V2-04 confidence-and-supply: ONE active partner, legible demands, early election risk.
// Decision per backlog: start simple — "NDP keeps us up if we deliver X; refuse and
// there may be an election." Not a full parliamentary simulator.

import { rng } from './engine.mjs';

/**
 * Attach a confidence partner to a minority government.
 * partner: { id, demandEventId, support } where support is 0..100.
 */
export function setConfidencePartner(state, partner) {
  state.government.confidencePartner = {
    id: partner.id,
    support: partner.support ?? 60,
    demandPending: null,
  };
}

/**
 * Offer a partner demand on an event. Returns the demand object the UI can show:
 * "The NDP will keep us in power if we deliver X."
 */
export function makeDemand(partnerId, { eventId, choiceId, label, whatTheyWant }) {
  return { partnerId, eventId, choiceId, label, whatTheyWant, offeredBy: partnerId };
}

/**
 * Resolve a governing choice against the confidence partner.
 * Taking the demanded choice strengthens the partner; refusing erodes support
 * and may trigger an early election (deterministic seeded roll).
 * Returns { partnerSupport, electionTriggered }.
 */
export function resolveConfidence(state, { tookDemandedChoice }) {
  const cp = state.government.confidencePartner;
  if (!cp) return { partnerSupport: null, electionTriggered: false };
  if (tookDemandedChoice) {
    cp.support = Math.min(100, cp.support + 12);
    cp.demandPending = null;
    return { partnerSupport: cp.support, electionTriggered: false };
  }
  cp.support = Math.max(0, cp.support - 20);
  // refusal risks the floor falling out — seeded but reproducible
  const r = rng(state);
  const electionTriggered = cp.support < 30 && r < 0.5;
  if (electionTriggered) {
    state.government.confidenceFailed = true;   // engine checks this before next event
  }
  return { partnerSupport: cp.support, electionTriggered };
}

/** True when a minority government has lost the floor. */
export function governmentCollapsed(state) {
  return !!state.government.confidenceFailed;
}
