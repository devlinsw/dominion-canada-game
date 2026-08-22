// Quebec 1995 vertical-slice integration tests: full path Yes -> negotiation ->
// both endings, plus repair path and loss/opposition/re-election basics.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newGameState, validateAll } from '../src/schema.mjs';
import * as engine from '../src/engine.mjs';
import { QUEBEC_1995_REFERENDUM_V2, QUEBEC_1995_BRANCH } from '../src/branch-quebec-1995.mjs';
import { PARTY_ARCHETYPES, caucusStrain, facesNonConfidence } from '../src/parties.mjs';

const base = JSON.parse(readFileSync(new URL('../src/events.json', import.meta.url)));
// merged graph: migrated V1 events, with the 1995 referendum upgraded to the V2 spec
const events = [...base.filter(e => e.id !== 'QUEBEC_REFERENDUM_1995'),
                QUEBEC_1995_REFERENDUM_V2, ...QUEBEC_1995_BRANCH];

test('merged event graph validates (cross-refs included)', () => {
  assert.deepEqual(validateAll(events), []);
});

test('No path: negotiation event never fires, Meech stays reachable', () => {
  const s = newGameState();
  const ref = events.find(e => e.id === 'QUEBEC_REFERENDUM_1995');
  engine.advanceYear(s, 1995);
  engine.applyChoice(s, ref, ref.choices.find(c => c.id === 'no'));
  const pool96 = engine.eligibleEvents(s, events, 1996);
  assert.ok(!pool96.some(e => e.id === 'QUEBEC_NEGOTIATION_1996'));
  assert.ok(events.some(e => e.id === 'MEECH_LAKE_1992' && !s.blocked.has(e.id)));
  assert.equal(s.world.quebecStatus, undefined);
});

test('Yes path: negotiation unlocks, hardline lands at full independence', () => {
  const s = newGameState();
  const ref = events.find(e => e.id === 'QUEBEC_REFERENDUM_1995');
  engine.advanceYear(s, 1995);
  engine.applyChoice(s, ref, ref.choices.find(c => c.id === 'yes'));
  assert.equal(s.world.quebecStatus, 'independent-negotiating');
  assert.ok(s.unlocked.has('QUEBEC_NEGOTIATION_1996'));
  assert.ok(s.blocked.has('MEECH_LAKE_1992'));

  engine.advanceYear(s, 1996);
  const next = engine.selectNextEvent(s, events);
  assert.equal(next.id, 'QUEBEC_NEGOTIATION_1996', 'branch pack fires in window');
  engine.applyChoice(s, next, next.choices.find(c => c.id === 'hardline'));
  assert.equal(s.world.quebecStatus, 'independent');
});

test('Yes path: partnership choice lands at renewed-federalism (repair route)', () => {
  const s = newGameState();
  const ref = events.find(e => e.id === 'QUEBEC_REFERENDUM_1995');
  engine.advanceYear(s, 1995);
  engine.applyChoice(s, ref, ref.choices[0]); // yes
  engine.advanceYear(s, 1996);
  const neg = engine.selectNextEvent(s, events);
  engine.applyChoice(s, neg, neg.choices.find(c => c.id === 'partnership'));
  assert.equal(s.world.quebecStatus, 'renewed-federalism');
});

test('negotiation is NOT eligible without the flag even if unlocked', () => {
  const s = newGameState();
  s.unlocked.add('QUEBEC_NEGOTIATION_1996'); // unlock without the world flag
  assert.equal(engine.eligibleEvents(s, [QUEBEC_1995_BRANCH[0]], 1996).length, 0);
});

test('party archetypes: caucus strain and non-confidence trigger', () => {
  assert.deepEqual(caucusStrain('liberal', { unity: 60, rights: 60, sovereign: 50 }), [],
    'no strain inside ideal bands');
  const strained = caucusStrain('liberal', { unity: 30, rights: 40, sovereign: 90 });
  assert.equal(strained.length, 3);

  // healthy party does not face non-confidence despite some strain
  assert.equal(facesNonConfidence({ id: 'liberal', credibility: 60 },
    { unity: 30, rights: 40, sovereign: 90 }), false,
    'high credibility absorbs strain');
  // eroded credibility + heavy strain triggers caucus revolt
  assert.equal(facesNonConfidence({ id: 'liberal', credibility: 20 },
    { unity: 10, rights: 20, sovereign: 100 }), true);
});
