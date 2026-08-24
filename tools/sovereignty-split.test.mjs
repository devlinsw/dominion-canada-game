// Contract for replacing sovereign with two non-overlapping V2 dimensions.
// This test is deliberately written before migration: it must fail until the
// split exists throughout the schema and authored V2 packs.
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { METRIC_IDS } from '../src/schema.mjs';
import { SCANDAL_PACK } from '../src/pack-scandals.mjs';
import { INDIGENOUS_SPINE } from '../src/pack-indigenous-spine.mjs';
import { WHEAT_BOARD_PACK } from '../src/pack-wheat-board.mjs';
import { TRADE_PACK } from '../src/pack-trade.mjs';
import { NEP_PACK } from '../src/pack-nep.mjs';
import { CROWN_PACK } from '../src/pack-crown.mjs';
import { QUEBEC_MERGEBACK } from '../src/pack-quebec-mergeback.mjs';
import { QUEBEC_1995_BRANCH, QUEBEC_1995_REFERENDUM_V2 } from '../src/branch-quebec-1995.mjs';

const PACKS = [SCANDAL_PACK, INDIGENOUS_SPINE, WHEAT_BOARD_PACK, TRADE_PACK,
  NEP_PACK, CROWN_PACK, QUEBEC_MERGEBACK, QUEBEC_1995_BRANCH,
  [QUEBEC_1995_REFERENDUM_V2]];

test('metric schema replaces sovereign with external independence and self-determination', () => {
  assert.ok(METRIC_IDS.includes('externalIndependence'));
  assert.ok(METRIC_IDS.includes('selfDetermination'));
  assert.ok(!METRIC_IDS.includes('sovereign'));
});

test('V2 authored packs contain no legacy sovereign metric key or metadata', () => {
  for (const pack of PACKS) for (const event of pack) {
    assert.ok(!event.metricsAffected.includes('sovereign'), `${event.id}: stale metadata`);
    for (const choice of event.choices) {
      assert.ok(!Object.hasOwn(choice.metrics || {}, 'sovereign'), `${event.id}/${choice.id}: stale sovereign effect`);
    }
  }
});

test('signature events express the intended trade-offs rather than double-counting', () => {
  // Berger is a V1 spine event (index.html): verify the split there textually.
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(/Build the pipeline[^}]*externalIndependence: \+5[^}]*selfDetermination: -3/s.test(html),
    'Berger pipeline choice must carry E:+5 / S:-3');
  const nep = NEP_PACK.find(e => e.id === 'NEP_1980');
  const full = nep.choices.find(c => c.id === 'full_nep');
  assert.equal(full.metrics.externalIndependence, 8);
  assert.equal(full.metrics.selfDetermination, -3);
});
