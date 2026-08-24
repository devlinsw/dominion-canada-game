// V2-13 Quebec merge-back alters: how an independent or negotiating Quebec
// changes shared later events. Consensus gave these first claim on slack.
export const QUEBEC_MERGEBACK = [
  // Altered copy/effects for the 1995 referendum's aftermath reaching trade:
  // handled by requires/excludes on new conditional variants of shared events.
  {
    id: 'TRADE_WITHOUT_QUEBEC_1997',
    title: 'Trade After Separation',
    yearWindow: [1996, 2000],
    type: 'conditional',
    actor: 'government',
    priority: 3,
    needsUnlock: false,
    requires: ['flag:quebecStatus=independent'],
    metricsAffected: ['economy', 'unity'],
    context: 'The remaining nine provinces must now negotiate trade as a smaller federation — and renegotiate the continental agreement, since Quebec was part of it. Washington sees leverage; Ottawa sees an opening to diversify.',
    choices: [
      {
        id: 'renegotiate_continental',
        label: 'Renegotiate the continental deal fast',
        desc: 'Accept worse terms quickly to restore certainty.',
        metrics: {economy: -2, externalIndependence: 1, },
        financial: { growthIndex: -3 },
        isHistorical: false,
      },
      {
        id: 'diversify_hard',
        label: 'Use the rupture to diversify',
        desc: 'Europe and Asia talks become existential, not optional. Slow, but strategic.',
        metrics: {economy: -3, externalIndependence: 4, },
        setsFlags: { tradePosture: 'diversified' },
        isHistorical: false,
      },
    ],
  },
];
