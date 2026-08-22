// Elections + opposition loop: mandate classes, loss -> opposition -> re-election.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGameState } from '../src/schema.mjs';
import { resolveElection, applyElectionResult, applyOppositionAction } from '../src/elections.mjs';

const healthy = () => {
  const s = newGameState(11);
  s.government.approval = 60;
  s.government.credibility = 65;
  return s;
};

test('strong state wins a majority; weak state loses', () => {
  const strong = healthy();
  strong.metrics.economy = 70; strong.metrics.unity = 65;
  const out = resolveElection(strong, { approvalNeeded: 40 });
  assert.equal(out.result, 'win');
  assert.equal(out.mandate, 'majority');

  const weak = healthy();
  weak.government.approval = 30;
  weak.metrics.economy = 25;
  const lost = resolveElection(weak, { approvalNeeded: 40 });
  assert.equal(lost.result, 'lose');
});

test('same seed => same outcome (determinism)', () => {
  const mk = () => {
    const s = healthy();
    s.metrics.economy = 55;
    return resolveElection(s, { approvalNeeded: 45 }).mandate;
  };
  assert.equal(mk(), mk());
});

test('borderline support yields minority, not majority', () => {
  const s = healthy();
  s.government.approval = 44;
  s.metrics.economy = 52;
  const out = resolveElection(s, { approvalNeeded: 40 });
  if (out.result === 'win') assert.notEqual(out.mandate, 'majority', 'bare win must be minority');
});

test('full loss -> opposition -> re-election loop restores government', () => {
  const s = healthy();
  // lose
  const out1 = resolveElection(s, { approvalNeeded: 90 }); // impossible gate
  assert.equal(out1.result, 'lose');
  applyElectionResult(s, out1, 'tory');
  assert.equal(s.government.mandate, 'opposition');
  assert.equal(s.government.partyControlsGovernment, false);
  assert.equal(s.elections[0].winnerParty, 'tory');

  // opposition years build position via opposition actions (not policy power)
  applyOppositionAction(s, { id: 'q1', label: 'Grill the government on deficits',
    metrics: { economy: 2 }, credibilityDelta: 8, approvalDelta: 6 });
  assert.ok(s.government.credibility > 65);

  // re-election
  const out2 = resolveElection(s, { approvalNeeded: 40 });
  applyElectionResult(s, out2);
  assert.equal(out2.result, 'win');
  assert.equal(s.government.partyControlsGovernment, true);
  assert.ok(['majority', 'minority'].includes(s.government.mandate));
});

test('opposition actions cannot be disguised policy moves', () => {
  const s = healthy();
  assert.throws(
    () => applyOppositionAction(s, { id: 'x', label: 'x', metrics: { unity: +20 } }),
    /exceeds max/,
    'big metric delta must be rejected'
  );
});
