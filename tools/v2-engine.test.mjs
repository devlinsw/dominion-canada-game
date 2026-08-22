// V2 engine smoke tests: determinism, eligibility, migration parity.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newGameState, validateAll } from '../src/schema.mjs';
import * as engine from '../src/engine.mjs';

const events = JSON.parse(readFileSync(new URL('../src/events.json', import.meta.url)));

test('all migrated events validate against the EventSpec schema', () => {
  assert.deepEqual(validateAll(events), []);
});

test('all 25 V1 decisions were migrated with choices preserved', () => {
  assert.equal(events.length, 25);
  for (const e of events) assert.ok(e.choices.length >= 2, `${e.id} lost choices`);
});

test('historical path is deterministic across two identical runs', () => {
  const run = () => {
    const s = newGameState(42);
    const picks = [];
    for (const e of events.sort((a, b) => a.v1Index - b.v1Index)) {
      engine.advanceYear(s, e.yearWindow[0]);
      const ev = engine.selectNextEvent(s, events);
      const choice = ev ? ev.choices.find(c => c.isHistorical) || ev.choices[0] : null;
      if (choice) { engine.applyChoice(s, ev, choice); picks.push(choice.id); }
    }
    return { picks, metrics: s.metrics };
  };
  assert.deepEqual(run(), run());
});

test("blocked events never become eligible", () => {
  const s = newGameState();
    const ev = { id: 'X', yearWindow: [1968, 1968], type: 'universal', actor: 'government',
      choices: [{ id: 'b', label: 'b', metrics: {}, blocks: ['GST_1991'] }] };
    engine.applyChoice(s, ev, ev.choices[0]);
  const pool = engine.eligibleEvents(s, events, 1991);
  assert.ok(!pool.some(e => e.id === 'GST_1991'));
});

test('flag predicates gate conditional events', () => {
  const s = newGameState();
  s.world.quebecStatus = 'independent';
  const cond = { id: 'T', yearWindow: [1995, 1997], type: 'conditional', actor: 'government',
    requires: ['flag:quebecStatus=independent'],
    choices: [{ id: 'c0', label: 'x', metrics: {} }] };
  assert.equal(engine.eligibleEvents(s, [cond], 1996).length, 1);
  delete s.world.quebecStatus;
  assert.equal(engine.eligibleEvents(s, [cond], 1996).length, 0);
});

test('metrics clamp to 0-100; financial indicators do not clamp', () => {
  const s = newGameState();
  const bigChoice = { id: 'z', label: 'z', metrics: { unity: +999 }, financial: { unemployment: -50 } };
  engine.applyChoice(s, { id: 'E', yearWindow: [1968, 1968], type: 'universal', actor: 'government', choices: [bigChoice] }, bigChoice);
  assert.equal(s.metrics.unity, 100);
  assert.equal(s.financial.unemployment, -44.2);
});

test('needsUnlock events are ineligible until some choice unlocks them (fix #1)', () => {
  const branch = {
    id: 'QUEBEC_DEBT_NEGOTIATION', yearWindow: [1995, 1997], type: 'conditional',
    actor: 'government', needsUnlock: true,
    choices: [{ id: 'c0', label: 'x', metrics: {} }],
  };
  const s = newGameState();
  assert.equal(engine.eligibleEvents(s, [branch], 1996).length, 0, 'locked before unlock');
  // a choice with unlocks makes it eligible
  const ev = { id: 'Q95', yearWindow: [1995, 1995], type: 'universal', actor: 'government',
    choices: [{ id: 'yes', label: 'Yes', metrics: {}, unlocks: ['QUEBEC_DEBT_NEGOTIATION'] }] };
  engine.applyChoice(s, ev, ev.choices[0]);
  assert.equal(engine.eligibleEvents(s, [branch], 1996).length, 1, 'eligible after unlock');
});

test('unlocked:<id> predicate kind works (fix #1)', () => {
  const s = newGameState();
  assert.equal(engine.testPredicate(s, 'unlocked:SOMETHING'), false);
  s.unlocked.add('SOMETHING');
  assert.equal(engine.testPredicate(s, 'unlocked:SOMETHING'), true);
});

test('rng is never consumed inside sort comparator — identical pool order gives identical pick (fix #2)', () => {
  const mk = () => {
    const s = newGameState(7);
    const pool = [
      { id: 'A', yearWindow: [2000, 2000], type: 'party', choices: [{ id: 'c0', label: 'x' }] },
      { id: 'B', yearWindow: [2000, 2000], type: 'reactive', choices: [{ id: 'c0', label: 'x' }] },
      { id: 'C', yearWindow: [2000, 2000], type: 'altered', priority: 1, choices: [{ id: 'c0', label: 'x' }] },
    ];
    return engine.selectNextEvent(s, pool, 2000).id;
  };
  assert.equal(mk(), mk(), 'same seed picks same event despite tie');
  // priority override dominates: C has priority 1 => +10 beats party's tier rank
  const s2 = newGameState(99);
  const pool2 = [
    { id: 'P', yearWindow: [2000, 2000], type: 'party', choices: [{ id: 'c0', label: 'x' }] },
    { id: 'O', yearWindow: [2000, 2000], type: 'altered', priority: 1, choices: [{ id: 'c0', label: 'x' }] },
  ];
  assert.equal(engine.selectNextEvent(s2, pool2, 2000).id, 'O');
});

test('validator enforces metricsAffected and cross-references (fix #3)', async () => {
  const { validateAll } = await import('/root/dominion-canada/src/schema.mjs');
  const bad = [
    { id: 'X', title: 'x', yearWindow: [2000, 2000], type: 'universal', actor: 'government',
      choices: [{ id: 'c0', label: 'x', metrics: {} }], unlocks: ['MISSING_ID'] },
  ];
  const errs = validateAll(bad);
  assert.ok(errs.some(e => e.includes('metricsAffected')), 'flags missing metricsAffected');
  assert.ok(errs.some(e => e.includes('MISSING_ID')), 'flags unknown cross-reference');
});
