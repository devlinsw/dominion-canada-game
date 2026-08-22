#!/usr/bin/env node
// One-time migration: V1 game_data.json -> src/events.json (EventSpec format).
// Run: node tools/migrate-v1-events.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { validateAll } from '../src/schema.mjs';

const v1 = JSON.parse(readFileSync(new URL('../game_data.json', import.meta.url)));

// Bucket classification per V2_IDEAS.md §V2-12.
// universal  = era anchor every run sees
// altered    = every run, but severity/choices change with state (flagged for V2 rework)
// reactive   = macro shock whose severity should scale with fiscal/trade state
const CLASSIFY = {
  0:  { id: 'JUST_SOCIETY_1968',            type: 'universal' },
  1:  { id: 'OCTOBER_CRISIS_1970',          type: 'universal' },
  2:  { id: 'MULTICULTURALISM_1971',        type: 'universal' },
  3:  { id: 'ELECTION_1972',                type: 'universal', election: true },
  4:  { id: 'MONTREAL_OLYMPICS_1976',       type: 'altered' },   // severity scales with fiscal state
  5:  { id: 'BERGER_INQUIRY_1977',           type: 'conditional' }, // depends on northern development posture
  6:  { id: 'NEP_1980',                     type: 'universal' },  // sets westernAlienation flag in V2
  7:  { id: 'QUEBEC_REFERENDUM_1980',       type: 'universal' },  // sets quebecStatus flag in V2
  8:  { id: 'CONSTITUTION_1982',            type: 'universal' },  // sets constitutionalSettlement
  9:  { id: 'ELECTION_1984',                type: 'universal', election: true },
  10: { id: 'FREE_TRADE_1988',              type: 'universal' },  // sets tradePosture
  11: { id: 'GST_1991',                     type: 'universal' },
  12: { id: 'MEECH_LAKE_1992',              type: 'altered' },    // altered by constitutionalSettlement
  13: { id: 'COD_MORATORIUM_1992',          type: 'reactive' },   // resource collapse archetype
  14: { id: 'QUEBEC_REFERENDUM_1995',       type: 'universal' },  // the vertical-slice divergence point
  15: { id: 'DEFICIT_1995',                 type: 'altered' },    // severity scales with debtToGdp
  16: { id: 'KYOTO_2002',                   type: 'universal' },
  17: { id: 'SAME_SEX_MARRIAGE_2005',       type: 'universal' },
  18: { id: 'GFC_2008',                     type: 'reactive' },   // shock eligibility model (V2-10)
  19: { id: 'OIL_SANDS_2012',               type: 'altered' },
  20: { id: 'ELECTION_2015',                type: 'universal', election: true },
  21: { id: 'CANNABIS_2018',                type: 'universal' },
  22: { id: 'CARBON_TAX_2019',              type: 'universal' },
  23: { id: 'PANDEMIC_2020',                type: 'universal' },
  24: { id: 'TRUMP_TARIFFS_2025',           type: 'altered' },    // severity scales with tradePosture
};

const events = v1.map(d => {
  const c = CLASSIFY[d.index];
  // union of metric keys across all choices, in canonical order
  const affected = new Set();
  for (const ch of d.choices) for (const k of Object.keys(ch.effects || {})) {
    if (!['approval'].includes(k)) affected.add(k);
  }
  return {
    id: c.id,
    title: d.title,
    yearWindow: [d.year, d.year],
    type: c.type,
    actor: 'government',
    isElection: !!c.election,
    approvalNeeded: d.approval_needed ?? undefined,
    v1Index: d.index,
    priority: c.type === 'conditional' ? 3 : undefined,
    metricsAffected: [...affected],
    choices: d.choices.map(ch => ({
      id: `c${ch.index}`,
      label: ch.label,
      metrics: Object.fromEntries(
        Object.entries(ch.effects)
          .filter(([k]) => !['approval'].includes(k))
          .map(([k, v]) => [k, v])
      ),
      approvalDelta: ch.effects.approval ?? 0,
      outcome: ch.result ?? null,          // election result class ('minority'|'win'|'lose')
      isHistorical: !!ch.is_historical,
      v1Text: { desc: ch.desc, consequence: ch.consequence }, // preserved verbatim
      // V2 additions authored later: financial, setsFlags, unlocks/blocks/alters
    })),
  };
});

const errors = validateAll(events);
if (errors.length) {
  console.error('VALIDATION FAILED:\n' + errors.join('\n'));
  process.exit(1);
}
writeFileSync(new URL('../src/events.json', import.meta.url),
  JSON.stringify(events, null, 2) + '\n');
console.log(`Wrote ${events.length} events to src/events.json — all valid.`);
