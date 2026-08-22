// V2 party state: stable archetypes, caucus ideals, non-confidence risk.
// Decision (2026-08): archetypes not real parties; straying from ideals risks
// caucus non-confidence; player starts as Liberal.

export const PARTY_ARCHETYPES = {
  liberal: {
    label: 'Liberal / centrist federalist',
    // ideal bands per metric: [min, max] the caucus tolerates on core issues
    ideals: { unity: [45, 100], rights: [50, 100], sovereign: [40, 80] },
    credibility: 60,
  },
  tory: {
    label: 'Progressive conservative',
    ideals: { economy: [55, 100], sovereign: [45, 85] },   // fiscal capacity, decentralization
    credibility: 60,
  },
  socialDemocrat: {
    label: 'Social democratic',
    ideals: { social: [55, 100], rights: [55, 100] },
    credibility: 55,
  },
  quebecNationalist: {
    label: 'Quebec nationalist',
    ideals: { sovereign: [60, 100], rights: [45, 90] },
    credibility: 50,
  },
  regionalPopulist: {
    label: 'Regional populist',
    ideals: { unity: [30, 65], economy: [50, 90] },
    credibility: 45,
  },
};

/**
 * Caucus strain: how far current metrics sit outside the party's ideal bands.
 * Returns list of violated ideals with distance.
 */
export function caucusStrain(partyId, metrics) {
  const party = PARTY_ARCHETYPES[partyId];
  if (!party) throw new Error(`unknown party "${partyId}"`);
  const violations = [];
  for (const [metric, [lo, hi]] of Object.entries(party.ideals)) {
    const v = metrics[metric];
    if (v < lo) violations.push({ metric, kind: 'below', by: lo - v });
    else if (v > hi) violations.push({ metric, kind: 'above', by: v - hi });
  }
  return violations;
}

/**
 * Non-confidence check. Deterministic: caucus moves against the leader when
 * total strain exceeds a threshold AND credibility has been eroded.
 * threshold and erosion are authored policy, tunable in one place.
 */
export function facesNonConfidence(partyState, metrics) {
  const violations = caucusStrain(partyState.id, metrics);
  const totalStrain = violations.reduce((s, v) => s + v.by, 0);
  return totalStrain >= 25 && partyState.credibility < 35;
}
