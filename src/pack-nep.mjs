// V2-13 pack #4: NEP / western alienation (HARD CAP 8 events — consensus scope guard).
// Biggest payoff, biggest creep risk. No regional seat model; mandate-class
// elections and flag-gated copy only.

// NOTE: NEP_1980 already exists in src/events.json (migrated from V1 with
// v1Index 6). The V2 version below is the upgrade path — same id, richer flags.
// The graph loader dedupes by preferring the pack version, mirroring Quebec.

export const NEP_PACK = [
  {
    id: 'NEP_1980',
    title: 'The National Energy Program',
    yearWindow: [1980, 1982],
    type: 'universal',
    actor: 'government',
    priority: 5,   // era-defining anchor
    metricsAffected: ['economy', 'unity', 'sovereign', 'social'],
    context: 'Oil prices have quadrupled. Alberta swims in revenue while Central Canada pays through the nose. The National Energy Program would control prices, tax the industry to fund Canadian ownership, and keep energy affordable in the East. Alberta calls it a declaration of economic war.',
    choices: [
      {
        id: 'full_nep',
        label: 'Implement the NEP fully',
        desc: 'Price controls, the back-in tax, Petro-Canada buyouts. Canadianize the industry.',
        metrics: { economy: -4, unity: -12, sovereign: 8, social: 3 },
        financial: { unemployment: 1.0, growthIndex: -6 },
        setsFlags: { westernAlienation: 'high', energyModel: 'federal-nationalist' },
        isHistorical: true,
      },
      {
        id: 'revenue_sharing',
        label: 'Negotiate a revenue-sharing compact',
        desc: 'Sit down with the provinces. Share the boom instead of confiscating it.',
        metrics: { economy: 3, unity: 4, sovereign: 2 },
        setsFlags: { westernAlienation: 'moderate', energyModel: 'revenue-sharing' },
        isHistorical: false,
      },
      {
        id: 'market',
        label: 'Let the market price it',
        desc: 'No intervention. Alberta keeps the boom; the East pays world prices.',
        metrics: { economy: 4, unity: -6, sovereign: -6 },
        setsFlags: { westernAlienation: 'moderate', energyModel: 'market' },
        isHistorical: false,
      },
    ],
  },
  {
    id: 'NEP_BACKLASH_1982',
    title: 'The Western Backlash',
    yearWindow: [1981, 1984],
    type: 'conditional',
    actor: 'opposition',
    priority: 3,
    metricsAffected: ['unity', 'social'],
    requires: ['flag:westernAlienation=high'],
    context: 'The program has gutted drilling activity and land sales. Alberta\'s premier is withholding oil shipments and talking openly about a constitutional challenge. Separatist parties are polling double digits for the first time since the 1930s.',
    choices: [
      {
        id: 'stay_course',
        label: 'Stay the course',
        desc: 'National energy security outranks regional grievance. The program works.',
        metrics: { unity: -4, social: -2 },
        approvalDelta: -2,
        isHistorical: true,
      },
      {
        id: 'soften',
        label: 'Soften the terms',
        desc: 'Phase out the back-in provisions, compensate industry losses quietly.',
        metrics: { unity: 3, economy: 1 },
        financial: { debtToGdp: 0.4 },
        approvalDelta: 0,
        isHistorical: false,
      },
      {
        id: 'scrap',
        label: 'Scrap the program outright',
        desc: 'Admit error. Dismantle the whole apparatus.',
        metrics: { unity: 6, sovereign: -4, social: -2 },
        setsFlags: { westernAlienation: 'moderate', energyModel: 'market' },
        approvalDelta: -1,
        isHistorical: false,
      },
    ],
  },
  {
    id: 'WESTERN_SENATE_PRESSURE_1990',
    title: 'Triple-E or Nothing',
    yearWindow: [1989, 1992],
    type: 'party',
    actor: 'all-parties',
    priority: 2,
    metricsAffected: ['unity', 'rights', 'sovereign'],
    requires: [],   // fires regardless; intensity shaped by alienation state
    context: 'Western populists demand an elected, equal, effective Senate — the Triple-E formula — as the price of staying in constitutional conversations. The existing chamber is appointed, regionally lopsided toward Central Canada, and increasingly seen as patronage.',
    choices: [
      {
        id: 'triple_e_push',
        label: 'Champion Triple-E Senate reform',
        desc: 'Put elected senators and equal provincial representation on the constitutional agenda.',
        metrics: { unity: 3, rights: 2, sovereign: 1 },
        setsFlags: { senateModel: 'elected-triple-e' },
        isHistorical: false,
      },
      {
        id: 'status_quo_senate',
        label: 'Defend the appointed Senate',
        desc: 'Reform is constitutional quicksand. The chamber as-is preserves stability.',
        metrics: { unity: -2, rights: -1 },
        setsFlags: { senateModel: 'patronage' },
        isHistorical: true,
      },
      {
        id: 'abolition_track',
        label: 'Propose abolition',
        desc: 'If the Senate cannot be fixed, end it. Call the provinces\' bluff.',
        metrics: { unity: 0, rights: 1, sovereign: -1 },
        setsFlags: { senateModel: 'abolition-track' },
        isHistorical: false,
      },
    ],
  },
  {
    id: 'ENERGY_TRANSITION_2015',
    title: 'Energy in a Carbon-Constrained World',
    yearWindow: [2015, 2019],
    type: 'altered',
    actor: 'government',
    priority: 3,
    metricsAffected: ['enviro', 'economy', 'unity'],
    requires: [],   // altered by energyModel + westernAlienation history
    context: 'Pipeline proposals to tidewater are stalled by court challenges and provincial vetoes, climate commitments loom, and global investment is rotating away from high-carbon barrels. The Prairies see an existential threat; coastal cities see transition opportunity.',
    choices: [
      {
        id: 'pipelines_first',
        label: 'Force pipelines through',
        desc: 'Use federal power to override provincial and municipal objections.',
        metrics: { economy: 3, enviro: -4, unity: 2 },
        setsFlags: { energyModel: 'market' },
        approvalDelta: -1,
        isHistorical: false,
      },
      {
        id: 'balanced_transition',
        label: 'Pair climate policy with transition support',
        desc: 'Carbon pricing plus worker retraining plus a credible corridor deal.',
        metrics: { enviro: 4, economy: -1, unity: 1 },
        financial: { growthIndex: 2 },
        setsFlags: { energyModel: 'transition', westernAlienation: 'moderate' },
        isHistorical: true,
      },
      {
        id: 'cap_and_shift',
        label: 'Cap emissions hard, fund clean industries',
        desc: 'Accept the Prairie hit. Build the clean-industrial base with public money.',
        metrics: { enviro: 6, economy: -3, unity: -4 },
        financial: { debtToGdp: 1.0 },
        setsFlags: { energyModel: 'transition', westernAlienation: 'high' },
        isHistorical: false,
      },
    ],
  },
];
