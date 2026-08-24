// Event-by-event sovereign → externalIndependence/selfDetermination migration
// mapping, derived from the audit (2026-08-24). Applied by migrate-sovereign.mjs.
// Sign reversals are intentional content decisions, not mechanical renames.
export const V1_MAP = [
  { title: 'The Just Society', choiceLabel: 'Pass the Official Languages Act', to: { selfDetermination: 5 } },
  { title: 'The October Crisis', choiceLabel: 'Invoke the War Measures Act', to: { selfDetermination: -3 } },
  { title: 'The October Crisis', choiceLabel: 'Use police and negotiation only', to: { selfDetermination: 3 } },
  { title: 'The October Crisis', choiceLabel: 'Invoke the Act but with a sunset clause', to: { selfDetermination: -1 } },
  { title: 'A Multicultural Country', choiceLabel: 'Bilingualism is enough — reject multiculturalism', to: { selfDetermination: -2 } },
  { title: 'The Berger Inquiry', choiceLabel: 'Accept the moratorium — listen to the land', to: { selfDetermination: 3 } },
  { title: 'The Berger Inquiry', choiceLabel: 'Build the pipeline — the North needs development', to: { externalIndependence: 5, selfDetermination: -3 } },
  { title: 'The Berger Inquiry', choiceLabel: 'Build it with Indigenous co-ownership', to: { externalIndependence: 2, selfDetermination: 3 } },
  { title: 'The National Energy Program', choiceLabel: 'Implement the NEP fully', to: { externalIndependence: 8, selfDetermination: -3 } },
  { title: 'The National Energy Program', choiceLabel: 'Negotiate a revenue-sharing deal with provinces', to: { externalIndependence: 2, selfDetermination: 3 } },
  { title: 'The National Energy Program', choiceLabel: "Let the market sort it out", to: { externalIndependence: -8 } },
  { title: 'The Quebec Referendum', choiceLabel: "Campaign hard — 'My country is my country'", to: { selfDetermination: 3 } },
  { title: 'The Quebec Referendum', choiceLabel: 'Let Quebecers decide for themselves', to: { selfDetermination: 4 } },
  { title: 'The Quebec Referendum', choiceLabel: 'YES — endorse sovereignty-association', to: { selfDetermination: 8 } },
  { title: 'Bringing the Constitution Home', choiceLabel: 'Patriate with the Charter — with or without Quebec', to: { externalIndependence: 10, selfDetermination: -3 } },
  { title: 'Bringing the Constitution Home', choiceLabel: 'Negotiate until Quebec agrees', to: { externalIndependence: 2, selfDetermination: 5 } },
  { title: 'Bringing the Constitution Home', choiceLabel: 'Patriate without the Charter', to: { externalIndependence: 10, selfDetermination: -2 } },
  { title: 'Free Trade with America', choiceLabel: 'Support free trade — the deal is done', to: { externalIndependence: -10 } },
  { title: 'Free Trade with America', choiceLabel: 'Oppose — renegotiate for cultural exemptions', to: { externalIndependence: 3 } },
  { title: 'Free Trade with America', choiceLabel: 'Kill the deal — build east-west trade instead', to: { externalIndependence: 8 } },
  { title: 'The GST', choiceLabel: 'Cut spending instead — no new tax', remove: true },
  { title: 'The Charlottetown Accord', choiceLabel: 'Campaign for a Yes — the deal is worth it', to: { selfDetermination: 2 } },
  { title: 'The Charlottetown Accord', choiceLabel: 'Respect the No vote — return to ordinary politics', to: { selfDetermination: 3 } },
  { title: 'The Charlottetown Accord', choiceLabel: 'Return with a narrower settlement', to: { selfDetermination: 1 } },
  { title: 'The Cod Moratorium', choiceLabel: 'Close the fishery — the cod must recover', to: { externalIndependence: 2 } },
  { title: 'The Cod Moratorium', choiceLabel: 'Keep the fishery open — let the communities survive', to: { externalIndependence: -2 } },
  { title: 'The Cod Moratorium', choiceLabel: 'Close it — but buy the licences and invest in transition', to: { externalIndependence: 3 } },
  { title: 'The Quebec Referendum, Round Two', choiceLabel: 'Fight with everything — a passionate Canada', to: { selfDetermination: 5 } },
  { title: 'The Quebec Referendum, Round Two', choiceLabel: 'Let Quebec decide — minimal federal involvement', to: { selfDetermination: 6 } },
  { title: 'The Quebec Referendum, Round Two', choiceLabel: 'YES — quietly hope for Oui', to: { selfDetermination: 7 } },
  { title: 'The Quebec Referendum, Round Two', choiceLabel: 'Offer clear constitutional reform — the clarity path', to: { selfDetermination: 3 } },
  { title: 'Kyoto or Not', choiceLabel: 'Ratify Kyoto — lead on climate', to: { externalIndependence: 3 } },
  { title: 'Kyoto or Not', choiceLabel: 'Ratify with concessions for the energy sector', to: { externalIndependence: 1 } },
  { title: 'Kyoto or Not', choiceLabel: "Don't ratify — the economy needs oil", to: { externalIndependence: -2 } },
  { title: 'Same-Sex Marriage', choiceLabel: 'Pass the Civil Marriage Act', to: { selfDetermination: 3 } },
  { title: 'Same-Sex Marriage', choiceLabel: 'Civil unions only — not marriage', to: { selfDetermination: 1 } },
  { title: 'Same-Sex Marriage', choiceLabel: 'Defend traditional marriage', to: { selfDetermination: -3 } },
  { title: 'The Global Financial Crisis', choiceLabel: 'Stimulate — the Economic Action Plan', to: { externalIndependence: 2 } },
  { title: 'The Global Financial Crisis', choiceLabel: 'Austerity — balance the budget through the recession', to: { externalIndependence: 3 } },
  { title: 'The Oil Sands', choiceLabel: 'Regulate and cap — transition starts now', to: { externalIndependence: 3 } },
  { title: 'The Oil Sands', choiceLabel: 'Approve pipelines — let the boom continue', to: { externalIndependence: -2 } },
  { title: 'Election of 2015', remove: true }, // event-level removal; handled by title match on choices too
  { title: 'Cannabis Legalization', choiceLabel: 'Legalize — regulate and tax', to: { selfDetermination: 3 } },
  { title: 'Cannabis Legalization', choiceLabel: 'Decriminalize only — no retail market', to: { selfDetermination: 4 } },
  { title: 'Cannabis Legalization', choiceLabel: 'Keep it criminal — not now', to: { selfDetermination: -2 } },
  { title: 'The Carbon Tax', choiceLabel: 'Hold firm — the price rises as planned', to: { selfDetermination: 3 } },
  { title: 'The Carbon Tax', choiceLabel: 'Scrap the carbon tax — use regulations instead', to: { selfDetermination: -2 } },
  { title: 'The Pandemic', choiceLabel: 'Go big — CERB and massive support', to: { selfDetermination: 3 } },
  { title: 'The Pandemic', choiceLabel: 'Moderate — targeted support only', to: { selfDetermination: 1 } },
  { title: 'The Pandemic', choiceLabel: 'Minimal — let people make their own choices', to: { selfDetermination: -2 } },
  { title: 'The Trump Tariffs', choiceLabel: "Retaliate and diversify — 'Canada Strong'", to: { externalIndependence: 12 } },
  { title: 'The Trump Tariffs', choiceLabel: 'Negotiate — find a deal, avoid escalation', to: { externalIndependence: -8 } },
  { title: 'The Trump Tariffs', choiceLabel: 'Full economic integration — embrace the future', to: { externalIndependence: -20 } },
];

// Pack event migrations keyed by pack module export + event id + choice id.
export const PACK_MAP = {
  'pack-nep.mjs': {
    NEP_1980: {
      full_nep: { externalIndependence: 8, selfDetermination: -3 },
      revenue_sharing: { externalIndependence: 1, selfDetermination: 2 },
      market: { externalIndependence: -6 },
    },
    NEP_BACKLASH_1982: { scrap: { externalIndependence: -4 } },
    WESTERN_SENATE_PRESSURE_1990: {
      triple_e_push: { selfDetermination: 1 },
      abolition_track: { selfDetermination: 1 },
      status_quo_senate: {},
    },
  },
  'pack-trade.mjs': {
    FREE_TRADE_ANCHOR_1988: {
      broad_culture: { externalIndependence: -6 },
      carveout_culture: { externalIndependence: -1 },
      no_deal: { externalIndependence: 4 },
    },
    NAFTA_EXTENSION_1993: {
      join: { externalIndependence: -2 },
      stay_bilateral: { externalIndependence: 1 },
      renegotiate_diversify: { externalIndependence: 3 },
    },
    TRADE_CHINA_2014: {
      deepen: { externalIndependence: -3 },
      conditional: {},
      avoid: { externalIndependence: 2 },
    },
    TARIFF_SHOCK_2025: {
      retaliate: { externalIndependence: 4 },
      negotiate: { externalIndependence: -5 },
      pivot_allies: { externalIndependence: 2 },
    },
  },
  'pack-crown.mjs': {
    CROWN_EXPANSION_1976: {
      expand: { externalIndependence: 4 },
      selective: { externalIndependence: 2 },
      hold_private: { externalIndependence: -3 },
    },
    VIA_RAIL_1978: { create_via: { externalIndependence: 1 }, cut_routes: {} },
    CROWN_PRIVATIZATION_1985: {
      sell_wave: { externalIndependence: -5 },
      sell_some: { externalIndependence: -1 },
      keep_all: { externalIndependence: 2 },
    },
    PETRO_CAN_1991: {
      full_sale: { externalIndependence: -4 },
      partial: { externalIndependence: -1 },
      keep_public: { externalIndependence: 3 },
    },
  },
  'pack-scandals.mjs': {
    SCANDAL_CROWN_BOARD_1985: {
      governance_reform: { externalIndependence: 2 },
      interfere: { externalIndependence: -1 },
      privatize: { externalIndependence: -4 },
    },
    SCANDAL_SENATE_2013: { reform_push: { selfDetermination: 3 }, circle_wagons: {} },
  },
  'pack-indigenous-spine.mjs': {
    CONSTITUTION_S35_1982: { entrench_s35: { selfDetermination: 2 }, omit_s35: { selfDetermination: -1 } },
  },
  'pack-quebec-mergeback.mjs': {
    TRADE_WITHOUT_QUEBEC_1997: {
      renegotiate_continental: { externalIndependence: 1 },
      diversify_hard: { externalIndependence: 4 },
    },
  },
  'pack-middle-choices.mjs': {
    QUEBEC_REFERENDUM_1980_accommodation: { accommodation: { selfDetermination: 2 } },
    FREE_TRADE_1988_conditional_trade: { conditional_trade: { externalIndependence: -2 } },
  },
  'branch-quebec-1995.mjs': {
    QUEBEC_NEGOTIATION_1996: {
      hardline: { selfDetermination: -3 },
      partnership: { selfDetermination: 2 },
    },
    QUEBEC_REFERENDUM_1995: {
      yes: { selfDetermination: 12 },
      no: {},
    },
  },
};
