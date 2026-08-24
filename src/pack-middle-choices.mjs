// V2-13 playtest fix #7: middle-choice content — constitutional accommodation
// and mixed trade positions the playtest flagged as missing.
// These are ALTERS: they add a choice to existing V1 events at render time.

export const MIDDLE_CHOICES = [
  {
    eventId: 'QUEBEC_REFERENDUM_1980',   // migrated id; V1 index 7
    insertBeforeLabel: null,             // append at end
    choice: {
      id: 'accommodation',
      label: 'Middle path — campaign for renewed federalism, quietly',
      desc: "Not triumphalism, not surrender. Acknowledge Quebec's grievances, promise constitutional renewal after the vote.",
      metrics: { unity: 2, rights: 1, selfDetermination: 2 },
      approvalDelta: 0,
      outcome: 'minority',
      isHistorical: false,
    },
  },
  {
    eventId: 'FREE_TRADE_1988',          // migrated id; V1 index 10
    insertBeforeLabel: null,
    choice: {
      id: 'conditional_trade',
      label: 'Ratify with conditions — cultural exemption + energy carve-out',
      desc: 'Accept the deal in principle but hold back culture and energy until side agreements are signed.',
      metrics: { economy: 3, externalIndependence: -2, social: 1 },
      approvalDelta: 0,
      isHistorical: true,
    },
  },
  {
    eventId: 'MEECH_LAKE_1992',          // migrated id; V1 index 12
    insertBeforeLabel: null,
    choice: {
      id: 'distinct_society_narrow',
      label: 'Pass a narrowed distinct-society clause',
      desc: "Recognize Quebec's distinctiveness in language and civil law only — no veto, no opt-outs. A deal some can live with.",
      metrics: { unity: 0, rights: -1, social: 1 },
      approvalDelta: -1,
      isHistorical: false,
    },
  },
];
