// Confidence-and-supply tests: partner support, refusal risk, early election.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGameState } from '../src/schema.mjs';
import { setConfidencePartner, makeDemand, resolveConfidence, governmentCollapsed }
  from '../src/confidence.mjs';
import { resolveElection, applyElectionResult } from '../src/elections.mjs';

const minority = () => {
  const s = newGameState(5);
  s.government.mandate = 'minority';
  s.government.approval = 50;
  s.government.credibility = 55;
  return s;
};

test('honoring the partner demand strengthens support; no election', () => {
  const s = minority();
  setConfidencePartner(s, { id: 'socialDemocrat', support: 55 });
  const demand = makeDemand('socialDemocrat', {
    eventId: 'NEP_1980', choiceId: 'c1',
    label: "NDP demand: public revenue-sharing compact",
    whatTheyWant: 'national revenue-sharing, no market pricing',
  });
  assert.equal(demand.offeredBy, 'socialDemocrat');
  const r = resolveConfidence(s, { tookDemandedChoice: true });
  assert.equal(r.electionTriggered, false);
  assert.equal(r.partnerSupport, 67);
});

test('refusing erodes support; collapse triggers early election state', () => {
  // find a seed where the refusal roll fires below 30 support
  let fired = null;
  for (let seed = 1; seed < 60 && !fired; seed++) {
    const s = newGameState(seed);
    s.government.mandate = 'minority';
    setConfidencePartner(s, { id: 'socialDemocrat', support: 45 });
    resolveConfidence(s, { tookDemandedChoice: false });           // -> 25
    if (!governmentCollapsed(s)) continue;
    resolveConfidence(s, { tookDemandedChoice: false });           // -> 5
    if (governmentCollapsed(s)) fired = s;
  }
  assert.ok(fired, 'some seed must produce a confidence collapse');
  // the collapsed government survives only weakened: approval penalty applies
  const before = fired.government.approval ?? 50;
  const out = resolveElection(fired, { approvalNeeded: 40 });
  applyElectionResult(fired, out);
  if (out.result === 'win') {
    assert.ok((fired.government.approval ?? 50) <= before,
      'confidence-failed survivors pay an approval penalty');
  } else {
    assert.equal(fired.government.mandate, 'opposition');
  }
});

test('refusal with healthy support does NOT trigger an election', () => {
  for (let seed = 1; seed < 30; seed++) {
    const s = newGameState(seed);
    s.government.mandate = 'minority';
    setConfidencePartner(s, { id: 'socialDemocrat', support: 80 });
    resolveConfidence(s, { tookDemandedChoice: false });   // -> 60, above floor
    assert.equal(governmentCollapsed(s), false, `seed ${seed}`);
  }
});

test('no partner => confidence ops are inert', () => {
  const s = minority();
  const r = resolveConfidence(s, { tookDemandedChoice: false });
  assert.equal(r.partnerSupport, null);
  assert.equal(r.electionTriggered, false);
});
