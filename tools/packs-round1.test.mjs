// V2-13 packs #1 + #5 integration tests: schema validity, era budget, flag flow,
// scorecard wiring of spine flags, and the constraint set from the consensus.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateAll } from '../src/schema.mjs';
import { SCANDAL_PACK } from '../src/pack-scandals.mjs';
import { INDIGENOUS_SPINE } from '../src/pack-indigenous-spine.mjs';

const base = JSON.parse(readFileSync(new URL('../src/events.json', import.meta.url)));

test('both packs validate against EventSpec schema', () => {
  assert.deepEqual(validateAll(SCANDAL_PACK), []);
  assert.deepEqual(validateAll(INDIGENOUS_SPINE), []);
});

test('no id collisions with migrated events or each other', () => {
  const ids = new Set(base.map(e => e.id));
  for (const e of [...SCANDAL_PACK, ...INDIGENOUS_SPINE]) {
    assert.ok(!ids.has(e.id), `duplicate id ${e.id}`);
    ids.add(e.id);
  }
});

test('scandal pack: exactly one event per era bucket (5 eras)', () => {
  const buckets = [[1968,1979],[1980,1992],[1993,2005],[2006,2014],[2015,2025]];
  for (const [lo, hi] of buckets) {
    const count = SCANDAL_PACK.filter(e => e.yearWindow[0] >= lo - 1 && e.yearWindow[0] <= hi).length;
    assert.equal(count, 1, `era ${lo}-${hi} should have exactly 1 scandal, has ${count}`);
  }
});

test('every scandal choice sets institutionalTrust (reform-vs-conceal shape)', () => {
  for (const e of SCANDAL_PACK) {
    for (const c of e.choices) {
      assert.ok(c.setsFlags?.institutionalTrust,
        `${e.id}/${c.id}: scandal choices must set institutionalTrust`);
      // Crown-board variant may additionally set crownSector
    }
  }
});

test('exactly one Crown-governance variant exists in the pack', () => {
  const crownVariants = SCANDAL_PACK.filter(e =>
    e.choices.some(c => c.setsFlags?.crownSector));
  assert.equal(crownVariants.length, 1);
});

test('spine: no deferred-mechanics leakage — no regional deltas, no consent flags', () => {
  const FORBIDDEN_FLAGS = /consent|negotiat|regionalSupport|selfGovt/;
  for (const e of INDIGENOUS_SPINE) {
    assert.ok(!FORBIDDEN_FLAGS.test(e.id), `${e.id} implies branch content`);
    for (const c of e.choices) {
      assert.ok(!c.regional || Object.keys(c.regional).length === 0,
        `${e.id}/${c.id}: spine must not use regional deltas`);
      for (const f of Object.keys(c.setsFlags || {})) {
        assert.ok(!FORBIDDEN_FLAGS.test(f), `${e.id}/${c.id}: forbidden flag ${f}`);
      }
      // metric deltas stay within normal anchor bounds (±5)
      for (const v of Object.values(c.metrics)) {
        assert.ok(Math.abs(v) <= 5, `${e.id}/${c.id}: delta ${v} exceeds anchor bound ±5`);
      }
    }
  }
});

test('spine flags feed the scorecard (kill criterion: unread flags = cut)', async () => {
  const { regionalIndigenousLegitimacy } = await import('../src/scorecard.mjs');
  const mk = (world) => { const s = newGameStateFor(); Object.assign(s.world, world); return s; };
  function newGameStateFor() {
    // minimal state shape scorecard needs
    return { metrics: {}, world: {}, elections: [], government: {} };
  }
  const baseScore = regionalIndigenousLegitimacy(mk({}));
  // reconciliationPath is read
  const committed = regionalIndigenousLegitimacy(mk({ reconciliationPath: 'committed' }));
  const ignored = regionalIndigenousLegitimacy(mk({ indigenousRelation: 'assimilation-pursued' }));
  assert.ok(committed > baseScore, 'committed reconciliation must raise regional legitimacy');
  assert.ok(ignored < baseScore, 'pursued assimilation must lower it');
});

test('White Paper "pause" choice sets NO flag (question stays open)', () => {
  const wp = INDIGENOUS_SPINE.find(e => e.id === 'WHITE_PAPER_1969');
  const pause = wp.choices.find(c => c.id === 'halfway');
  assert.equal(pause.setsFlags, undefined);
});
