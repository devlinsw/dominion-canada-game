// V2-13 pack #5: Indigenous anchor spine — 4 era anchors, flags + metric deltas ONLY.
// Binding constraints (V2-13 / Critic verdict): federal decision points only; no
// consent-negotiation or regional-electoral mechanics in copy; these flags become
// the precondition set for the future full arc and feed the scorecard's
// Regional & Indigenous legitimacy row.

export const INDIGENOUS_SPINE = [
  {
    id: 'WHITE_PAPER_1969',
    title: 'The White Paper on Indian Policy',
    yearWindow: [1969, 1971],
    type: 'universal',
    actor: 'government',
    priority: 2,
    metricsAffected: ['rights', 'unity', 'social'],
    context: 'Your government has tabled a policy paper proposing to end the distinct legal status of First Nations — abolish the Indian Act, transfer services to the provinces, and dissolve treaty obligations into ordinary citizenship. First Nations leaders from across the country, organized as never before, have arrived in Ottawa to demand its withdrawal. They call it the final step in a long project of assimilation.',
    choices: [
      {
        id: 'withdraw',
        label: 'Withdraw the White Paper',
        desc: 'Acknowledge treaty rights and distinct status. Begin a new dialogue on First Nations\' terms.',
        metrics: { rights: 4, social: 2, unity: 1 },
        setsFlags: { indigenousRelation: 'assimilation-rejected' },
        isHistorical: true,
      },
      {
        id: 'proceed',
        label: 'Proceed with implementation',
        desc: 'Equality means one law for all. End the special status as planned.',
        metrics: { rights: -4, social: -3, unity: -3 },
        setsFlags: { indigenousRelation: 'assimilation-pursued' },
        isHistorical: false,
      },
      {
        id: 'halfway',
        label: 'Pause it — study further',
        desc: 'Neither withdraw nor proceed. Strike a joint committee and defer.',
        metrics: { rights: 0, social: -1, unity: -1 },
        // no flag set: the question stays open, haunting later events
        isHistorical: false,
      },
    ],
  },
  {
    id: 'CONSTITUTION_S35_1982',
    title: 'Aboriginal Rights in the Constitution',
    yearWindow: [1980, 1982],
    type: 'universal',
    actor: 'government',
    priority: 3,
    metricsAffected: ['rights', 'sovereign', 'unity'],
    requires: [],   // fires alongside patriation regardless of Quebec outcome
    context: 'The constitutional package is nearly complete. First Nations, Inuit, and Métis leaders demand that existing aboriginal and treaty rights be recognized and affirmed in the supreme law of the land — not left to ordinary legislation. Provincial premiers are wary; some want the section dropped entirely.',
    choices: [
      {
        id: 'entrench_s35',
        label: 'Entrench section 35 — recognize and affirm existing rights',
        desc: 'Constitutional protection for aboriginal and treaty rights, now and hereafter.',
        metrics: { rights: 5, sovereign: 2, unity: 2 },
        setsFlags: { s35Recognized: true },
        isHistorical: true,
      },
      {
        id: 'omit_s35',
        label: 'Leave it out — keep the package simple',
        desc: 'Rights can be protected by courts and statutes later. Don\'t complicate patriation.',
        metrics: { rights: -4, sovereign: 1 },
        setsFlags: { s35Recognized: false },
        isHistorical: false,
      },
    ],
  },
  {
    id: 'RCAP_NISGAA_1998',
    title: 'RCAP Response and Modern Treaties',
    yearWindow: [1997, 2000],
    type: 'universal',
    actor: 'government',
    priority: 1,
    metricsAffected: ['rights', 'social', 'economy'],
    context: 'The Royal Commission on Aboriginal Peoples has delivered a sweeping report: recognition of the right of self-government, a new fiscal relationship, and truth about the residential schools era. Meanwhile the Nisga\'a treaty — the first modern treaty in BC — is before Parliament, contested in the courts and in provincial politics.',
    choices: [
      {
        id: 'respond_full',
        label: 'Respond to RCAP; ratify Nisga\'a',
        desc: 'Commit to implementing the commission\'s vision and sign the first modern treaty.',
        metrics: { rights: 4, social: 3, economy: -1 },
        setsFlags: { indigenousRelation: 'land-claims-era', treatyPosture: 'modern-treaties' },
        isHistorical: false,
      },
      {
        id: 'nisgaa_only',
        label: 'Ratify Nisga\'a, shelve RCAP',
        desc: 'One treaty at a time. The commission\'s report joins the shelf of reports.',
        metrics: { rights: 2, social: 0 },
        setsFlags: { treatyPosture: 'modern-treaties' },
        isHistorical: true,
      },
      {
        id: 'status_quo',
        label: 'Delay both',
        desc: 'Treaty-making is expensive and controversial. Let the courts sort it out.',
        metrics: { rights: -3, social: -2 },
        setsFlags: { treatyPosture: 'status-quo' },
        isHistorical: false,
      },
    ],
  },
  {
    id: 'TRC_2015',
    title: 'Truth and Reconciliation',
    yearWindow: [2015, 2017],
    type: 'universal',
    actor: 'all-parties',
    priority: 1,
    metricsAffected: ['rights', 'social', 'sovereign'],
    context: 'The Truth and Reconciliation Commission has concluded six years of testimony from survivors of the residential schools. Its 94 Calls to Action range from child-welfare reform to language protection to a papal apology. Survivors are watching to see whether this moment produces change or another shelved report.',
    choices: [
      {
        id: 'commit',
        label: 'Adopt the Calls to Action with funding and timelines',
        desc: 'Full-of-government response: child welfare, education gaps, language and culture.',
        metrics: { rights: 5, social: 4 },
        financial: { debtToGdp: 0.3 },
        setsFlags: { reconciliationPath: 'committed' },
        isHistorical: false,
      },
      {
        id: 'symbolic',
        label: 'Inquiry and apology — act on recommendations slowly',
        desc: 'Embrace the symbolism, defer the costly structural changes.',
        metrics: { rights: 1, social: 1 },
        setsFlags: { reconciliationPath: 'deferred' },
        isHistorical: true,
      },
      {
        id: 'reject',
        label: 'Reject the framework',
        desc: 'The past is the past. Focus on the economy.',
        metrics: { rights: -5, social: -4, unity: -2 },
        setsFlags: { reconciliationPath: 'rejected' },
        isHistorical: false,
      },
    ],
  },
];
