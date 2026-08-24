// Scorecard tests: five plural criteria, weights exposed, divergence possible.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGameState } from '../src/schema.mjs';
import {
  buildScorecard, nationalOutcome, democraticLegitimacy,
  partyMandate, electoralDurability, regionalIndigenousLegitimacy,
  COMMONWEALTH_WEIGHTS,
} from '../src/scorecard.mjs';

const HISTORICAL = { unity: 55, economy: 60, rights: 70, enviro: 45, externalIndependence: 50, selfDetermination: 50, social: 58 };

test('weights are public, not hidden', () => {
  assert.ok(COMMONWEALTH_WEIGHTS && Object.keys(COMMONWEALTH_WEIGHTS).length === 7,
    'seven scored dimensions (E/S split at 0.5 weight each)');
});

test('matching the historical path scores exactly 50 on national outcome', () => {
  assert.equal(nationalOutcome(HISTORICAL, HISTORICAL), 50);
});

test('beating history scores above 50; worse below', () => {
  const better = { ...HISTORICAL, economy: 75 };
  const worse = { ...HISTORICAL, unity: 30 };
  assert.ok(nationalOutcome(better, HISTORICAL) > 50);
  assert.ok(nationalOutcome(worse, HISTORICAL) < 50);
});

test('constitutional rupture costs democratic legitimacy', () => {
  const intact = newGameState();
  intact.metrics.rights = 70;
  const broken = newGameState();
  broken.metrics.rights = 70;
  broken.world.quebecStatus = 'independent';
  broken.world.constitutionalSettlement = 'contested';
  assert.ok(democraticLegitimacy(broken) < democraticLegitimacy(intact));
});

test('a party can win electorally while failing national outcomes (divergence)', () => {
  const s = newGameState(3);
  s.metrics.economy = 80; s.metrics.enviro = 15; s.metrics.social = 20;   // rich but hollow
  s.government.credibility = 85;
  s.elections.push({ year: 1972, result: 'win', mandate: 'majority', winnerParty: 'liberal' });
  s.government.mandate = 'majority';

  const card = buildScorecard(s, HISTORICAL);
  const durability = card.find(c => c.key === 'durability').value;
  const national = card.find(c => c.key === 'national').value;
  // national outcome near or below historical; durability high
  assert.ok(durability > 60, `durability should be high, got ${durability}`);
  // the point of V2-05: these two numbers CAN tell opposite stories
  assert.notEqual(Math.sign(durability - 50), Math.sign(national - 50),
    'electoral success and national outcome should diverge here');
});

test('renewed federalism earns regional legitimacy; independence loses it', () => {
  const repaired = newGameState();
  repaired.world.quebecStatus = 'renewed-federalism';
  const independent = newGameState();
  independent.world.quebecStatus = 'independent';
  assert.ok(regionalIndigenousLegitimacy(repaired) > regionalIndigenousLegitimacy(independent));
});

test('party mandate blends promise-keeping with credibility', () => {
  const s = newGameState();
  s.government.credibility = 60;
  assert.equal(partyMandate(s, 4, 8), 55);      // kept half promises
  assert.equal(partyMandate(s, 0, 0), 55);      // no promises made -> neutral 0.5 prior
});

test('every scorecard entry carries its explanatory question', () => {
  const card = buildScorecard(newGameState(), HISTORICAL);
  assert.equal(card.length, 5);
  for (const row of card) {
    assert.ok(row.question && row.question.includes('?'), `${row.key} lacks a question`);
    assert.ok(row.value >= 0 && row.value <= 100, `${row.key} out of range`);
  }
});
