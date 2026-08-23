// V2-13 packs #4 (NEP), #6 (Crown), Quebec merge-back: tests.
// Scope guards: NEP hard cap 8, Crown ~5, no per-asset sub-state, stubs honest.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateAll } from '../src/schema.mjs';
import * as engine from '../src/engine.mjs';
import { newGameState } from '../src/schema.mjs';
import { NEP_PACK } from '../src/pack-nep.mjs';
import { CROWN_PACK } from '../src/pack-crown.mjs';
import { QUEBEC_MERGEBACK } from '../src/pack-quebec-mergeback.mjs';

const base = JSON.parse(readFileSync(new URL('../src/events.json', import.meta.url)));

test('all three packs validate; no id collisions except sanctioned NEP upgrade', () => {
  for (const pack of [NEP_PACK, CROWN_PACK, QUEBEC_MERGEBACK]) {
    assert.deepEqual(validateAll(pack), []);
  }
  const ids = new Set(base.map(e => e.id));
  // NEP_1980 is a sanctioned V2 upgrade of the migrated event (same id, richer
  // flags) — the loader prefers the pack version, same as Quebec 1995.
  ids.delete('NEP_1980');
  for (const e of [...NEP_PACK, ...CROWN_PACK, ...QUEBEC_MERGEBACK]) {
    if (e.id === 'NEP_1980') continue;
    assert.ok(!ids.has(e.id), `collision ${e.id}`);
    ids.add(e.id);
  }
});

test('NEP pack respects the HARD CAP of 8 events', () => {
  assert.ok(NEP_PACK.length <= 8, `NEP has ${NEP_PACK.length}, cap is 8`);
});

test('Crown pack respects ~5 event budget and uses NO asset sub-state', () => {
  assert.ok(CROWN_PACK.length >= 4 && CROWN_PACK.length <= 5);
  const ASSET_FIELDS = /"ownership"|"serviceCapacity"|"fiscalExposure"|"strategicControl"|"regionalLegitimacy"/;
  for (const e of CROWN_PACK) {
    assert.ok(!ASSET_FIELDS.test(JSON.stringify(e)), `${e.id}: asset sub-state forbidden`);
    for (const c of e.choices) {
      if (c.setsFlags?.crownSector) {
        assert.ok(['expansionist', 'mixed', 'retrenchment'].includes(c.setsFlags.crownSector),
          `${e.id}/${c.id}: crownSector must be an aggregate posture`);
      }
      assert.equal(c.delayedYears, undefined,
        `${e.id}/${c.id}: delayed-effects queue forbidden; use alters instead`);
    }
  }
});

test('NEP full implementation sets high alienation + federal-nationalist energy', () => {
  const nep = NEP_PACK.find(e => e.id === 'NEP_1980');
  const full = nep.choices.find(c => c.id === 'full_nep');
  assert.equal(full.setsFlags.westernAlienation, 'high');
  assert.equal(full.setsFlags.energyModel, 'federal-nationalist');
  assert.equal(full.isHistorical, true);
});

test('backlash fires ONLY after full NEP (flag-gated)', async () => {
  const { SCANDAL_PACK } = await import('../src/pack-scandals.mjs');
  void SCANDAL_PACK;
  const backlash = NEP_PACK.find(e => e.id === 'NEP_BACKLASH_1982');
  const s = newGameState();
  assert.equal(engine.eligibleEvents(s, [backlash], 1982).length, 0,
    'no backlash without high alienation');
  s.world.westernAlienation = 'moderate';
  assert.equal(engine.eligibleEvents(s, [backlash], 1982).length, 0,
    'moderate alienation is not enough');
  s.world.westernAlienation = 'high';
  assert.equal(engine.eligibleEvents(s, [backlash], 1982).length, 1);
});

test('Quebec merge-back trade event fires only under independence flag', () => {
  const ev = QUEBEC_MERGEBACK[0];
  const s = newGameState();
  assert.equal(engine.eligibleEvents(s, [ev], 1997).length, 0,
    'united Canada never sees this');
  s.world.quebecStatus = 'independent';
  assert.equal(engine.eligibleEvents(s, [ev], 1997).length, 1);
  // and renewed-federalism does NOT trigger it
  s.world.quebecStatus = 'renewed-federalism';
  assert.equal(engine.eligibleEvents(s, [ev], 1997).length, 0);
});

test('FULL graph coherent: all packs together validate with cross-refs intact', async () => {
  const { SCANDAL_PACK } = await import('../src/pack-scandals.mjs');
  const { INDIGENOUS_SPINE } = await import('../src/pack-indigenous-spine.mjs');
  const { WHEAT_BOARD_PACK } = await import('../src/pack-wheat-board.mjs');
  const { TRADE_PACK } = await import('../src/pack-trade.mjs');
  const q = await import('../src/branch-quebec-1995.mjs');
  const all = [
    ...base.filter(e => e.id !== 'QUEBEC_REFERENDUM_1995' && e.id !== 'NEP_1980'),
    q.QUEBEC_1995_REFERENDUM_V2, ...q.QUEBEC_1995_BRANCH,
    ...SCANDAL_PACK, ...INDIGENOUS_SPINE,
    ...WHEAT_BOARD_PACK, ...TRADE_PACK,
    ...NEP_PACK, ...CROWN_PACK, ...QUEBEC_MERGEBACK,
  ];
  assert.deepEqual(validateAll(all), []);
});
