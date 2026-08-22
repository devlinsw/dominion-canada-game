// V2-13 packs #2 (Wheat Board) + #3 (Trade) tests: schema, cross-pack alters,
// cultural exemption first-class, stub constraint (no shock-severity payoffs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateAll } from '../src/schema.mjs';
import * as engine from '../src/engine.mjs';
import { newGameState } from '../src/schema.mjs';
import { WHEAT_BOARD_PACK } from '../src/pack-wheat-board.mjs';
import { TRADE_PACK } from '../src/pack-trade.mjs';

const base = JSON.parse(readFileSync(new URL('../src/events.json', import.meta.url)));

test('both packs validate; no id collisions', () => {
  assert.deepEqual(validateAll(WHEAT_BOARD_PACK), []);
  assert.deepEqual(validateAll(TRADE_PACK), []);
  const ids = new Set(base.map(e => e.id));
  for (const e of [...WHEAT_BOARD_PACK, ...TRADE_PACK]) {
    assert.ok(!ids.has(e.id), `collision ${e.id}`);
    ids.add(e.id);
  }
});

test('wheat pack respects event count (4-6) and sets prairieAgriculture on every path', () => {
  assert.ok(WHEAT_BOARD_PACK.length >= 4 && WHEAT_BOARD_PACK.length <= 6);
  const anchor = WHEAT_BOARD_PACK.find(e => e.id === 'WHEAT_BOARD_ANCHOR_1970');
  for (const c of anchor.choices) {
    assert.ok(c.setsFlags?.prairieAgriculture, `${c.id} must set prairieAgriculture`);
  }
});

test('western protest event fires ONLY under collective marketing', () => {
  const protest = WHEAT_BOARD_PACK.find(e => e.id === 'WHEAT_BOARD_PARTY_1993');
  const s = newGameState();
  s.world.prairieAgriculture = 'open-market';
  assert.equal(engine.eligibleEvents(s, [protest], 1994).length, 0,
    'protest requires the single desk to still exist');
  s.world.prairieAgriculture = 'collective-marketing';
  assert.equal(engine.eligibleEvents(s, [protest], 1994).length, 1);
});

test('drought response exists in every prairieAgriculture world (no dead branch)', () => {
  const drought = WHEAT_BOARD_PACK.find(e => e.id === 'WHEAT_DROUGHT_1985');
  for (const posture of ['collective-marketing', 'hybrid', 'open-market']) {
    const s = newGameState();
    s.world.prairieAgriculture = posture;
    assert.equal(engine.eligibleEvents(s, [drought], 1985).length, 1,
      `drought must fire under ${posture}`);
  }
});

test('cultural exemption is a first-class choice in 1988 anchor', () => {
  const anchor = TRADE_PACK.find(e => e.id === 'FREE_TRADE_ANCHOR_1988');
  const carveout = anchor.choices.find(c => c.id === 'carveout_culture');
  assert.ok(carveout, 'cultural-exemption choice must exist');
  assert.equal(carveout.setsFlags.culturalExemption, true);
  assert.equal(carveout.isHistorical, true, 'the real deal had the exemption');
});

test('STUB constraint: no shock-severity payoff variants authored yet', () => {
  // V2-13 constraint 3: trade cards may set tradePosture but must NOT contain
  // "milder 2008"-style conditional payoffs. Detect via alters on shock events.
  const SHOCK_IDS = new Set(['GFC_2008', 'COD_MORATORIUM_1992']);
  for (const e of TRADE_PACK) {
    for (const c of e.choices) {
      const shockAlters = (c.alters || []).filter(a => SHOCK_IDS.has(a));
      assert.equal(shockAlters.length, 0,
        `${e.id}/${c.id}: shock-severity alters are STUBBED until V2-10`);
    }
  }
});

test('tariff shock is reactive and fires in-window regardless of posture (stub honest)', () => {
  const shock = TRADE_PACK.find(e => e.id === 'TARIFF_SHOCK_2025');
  assert.equal(shock.type, 'reactive');
  for (const posture of ['continental', 'diversified', 'managed-strategic']) {
    const s = newGameState();
    s.world.tradePosture = posture;
    assert.equal(engine.eligibleEvents(s, [shock], 2025).length, 1);
  }
});

test('full graph still coherent with all four packs loaded', async () => {
  const { SCANDAL_PACK } = await import('../src/pack-scandals.mjs');
  const { INDIGENOUS_SPINE } = await import('../src/pack-indigenous-spine.mjs');
  const q = await import('../src/branch-quebec-1995.mjs');
  const all = [...base.filter(e => e.id !== 'QUEBEC_REFERENDUM_1995'),
               q.QUEBEC_1995_REFERENDUM_V2, ...q.QUEBEC_1995_BRANCH,
               ...SCANDAL_PACK, ...INDIGENOUS_SPINE, ...WHEAT_BOARD_PACK, ...TRADE_PACK];
  assert.deepEqual(validateAll(all), []);
});
