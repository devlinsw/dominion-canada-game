// Quebec 1995 vertical slice — the first real V2 branch pack.
// Decision (2026-08): Yes-path defaults to independence, but one negotiation
// event can land at 'renewed-federalism' (repair path, not full parallel content).

// Branch pack: unlocked only when QUEBEC_REFERENDUM_1995 resolves with a Yes.
export const QUEBEC_1995_BRANCH = [
  {
    id: 'QUEBEC_NEGOTIATION_1996',
    title: 'Separation Negotiations',
    yearWindow: [1996, 1997],
    type: 'conditional',
    actor: 'government',
    needsUnlock: true,          // eligible only after the referendum Yes choice unlocks it
    requires: ['flag:quebecStatus=independent-negotiating'],
    priority: 5,                // constitutional/existential outranks everything else
    metricsAffected: ['unity', 'economy', 'sovereign'],
    choices: [
      {
        id: 'hardline',
        label: 'Hardline: insist on maximal federal terms',
        desc: 'Debt allocation, Indigenous territorial consent, and border questions are non-negotiable.',
        metrics: { unity: -3, sovereign: 5 },
        financial: { debtToGdp: 4 },
        setsFlags: { quebecStatus: 'independent' },
        isHistorical: false,
      },
      {
        id: 'partnership',
        label: 'Negotiate a partnership / confederal arrangement',
        desc: 'Offer Quebec an economic and monetary partnership in exchange for renewed federalism.',
        metrics: { unity: 8, economy: 3, sovereign: 2 },
        setsFlags: { quebecStatus: 'renewed-federalism' },
        isHistorical: false,
      },
    ],
  },
];

// The referendum itself, as a V2 EventSpec. Replaces/extends the migrated V1
// event of the same id — the migration keeps v1Index parity; this spec adds
// flags + unlocks so the branch actually fires.
export const QUEBEC_1995_REFERENDUM_V2 = {
  id: 'QUEBEC_REFERENDUM_1995',
  title: 'The Quebec Referendum, Round Two',
  yearWindow: [1995, 1995],
  type: 'universal',            // era anchor
  actor: 'government',
  priority: 10,
  metricsAffected: ['unity', 'economy', 'rights'],
  choices: [
    {
      id: 'yes',
      label: 'YES — Quebec negotiates sovereignty',
      desc: 'The Yes side wins. Begin separation negotiations.',
      metrics: { unity: -25, economy: -8, sovereign: 12 },
      financial: { debtToGdp: 6, growthIndex: -10 },
      setsFlags: { quebecStatus: 'independent-negotiating' },
      unlocks: ['QUEBEC_NEGOTIATION_1996'],
      blocks: ['MEECH_LAKE_1992'],   // constitutional settlement overtaken by events
      isHistorical: false,
    },
    {
      id: 'no',
      label: 'NO — Quebec stays, federalism renewed from within',
      desc: 'The No side holds. Renew federalism without a rupture.',
      metrics: { unity: 4, rights: 2 },
      isHistorical: true,
    },
  ],
};
