# Dominion V2 — Idea Backlog & Design Questions

> **Status key:** `proposed` = worth exploring; `validated` = prototype/test supports it; `planned` = approved for build; `killed` = consciously rejected with rationale.
>
> This is a living backlog. `index.html` remains the V1 source of truth; this file is deliberately a *product/design* record, not an implementation spec.

## V2 north star

V1 asks: **“Could you govern Canada better than its real historical path?”**

V2 should ask the stronger question: **“Could your party govern a changing Canada through consequences it created, survive elections, and eventually return from opposition?”**

The core shift is from a mostly linear historical counterfactual to a **stateful alternate-history political simulation**. The historical timeline remains one valid branch and baseline, not the only track.

---

## Current V1 algorithm (baseline to preserve or replace)

### State

```text
metrics = {
  unity, economy, rights, enviro, sovereign, social, approval
} // all begin at 50 and clamp to 0–100

score = mean(unity, economy, rights, enviro, sovereign, social)
```

- The six non-approval metrics determine the end score equally.
- **Approval** does not contribute to the score; it gates elections.
- Each decision adds or subtracts authored effects from the metrics.
- Decisions are presented in a seeded shuffled order, so position on screen conveys no advantage.
- A historical-choice path runs through the same rules, creating a measured benchmark. Current V1 historical score: **81.0**.

### Elections and opposition in V1

```text
if approval < approvalNeeded OR chosen result is "lose":
  election outcome = loss
  opposition = 2 decisions

while opposition > 0:
  apply each chosen effect at 50% strength
  opposition -= 1
```

V1 therefore acknowledges defeat, but it does **not** yet model:
- which party takes power;
- the governing party’s own platform and decisions;
- minority confidence-and-supply mechanics;
- an opposition party regaining power at a later election;
- decisions unlocking, suppressing, or changing later decisions.

---

## Backlog

## V2-01 — Consequence-driven alternate-history branches

**Status:** `proposed`  
**Priority:** P0 — defining V2 feature

### Problem

V1 plays a fixed chronological list even after world-changing outcomes. For example, a Quebec sovereignty win in 1980 or 1995 changes only metrics and a consequence card; the rest of the game continues as though a united Canada still exists.

### Proposed direction

Replace the purely linear sequence with a **directed scenario graph**.

```text
Decision → outcome tag(s) → state transition → eligible future scenes
```

A choice may:
1. modify metrics;
2. set durable world-state flags;
3. add or remove future scenes;
4. alter later scene copy, available choices, election geography, and score interpretation.

Example world-state flags:

```js
world = {
  quebecStatus: 'federal' | 'renewed-federalism' | 'sovereignty-negotiation' | 'independent',
  constitutionalSettlement: 'none' | 'charter-without-quebec' | 'meech' | 'charlottetown',
  energyModel: 'market' | 'federal-nationalist' | 'revenue-sharing' | 'transition',
  climatePath: 'laggard' | 'price-led' | 'regulation-led' | 'clean-industrial',
  fiscalPosition: 'constrained' | 'balanced' | 'surplus',
  government: { party, mandate, confidencePartner }
}
```

### Quebec separation example

A Quebec sovereignty victory must not simply mean `unity -20` and then return to the real history. It should open a **branch family** such as:

```text
1995 referendum: YES
  ├─ 1995–97: separation negotiations
  │   ├─ currency / debt allocation
  │   ├─ citizenship and mobility
  │   ├─ Indigenous nations and territorial consent
  │   ├─ borders, trade, Hydro-Québec and the St. Lawrence
  │   └─ constitutional redesign of the remaining federation
  ├─ 1998: first post-separation federal election
  ├─ 2000s: changed US trade / security relationship
  └─ end state: Canada-without-Quebec and Quebec evaluated separately
```

### Design rule

Do **not** try to simulate every butterfly effect. Use **branch horizons**:
- choose 3–5 high-impact divergence points;
- give each a small authored branch pack (roughly 3–6 scenes);
- merge back into shared later scenes only where the premise still holds;
- otherwise switch to a branch-specific ending.

### Acceptance criteria

- At least one divergence point (recommended: 1995 Quebec referendum) produces visibly different later scenes.
- Branches use explicit world-state flags, not title-text conditionals scattered through UI code.
- Historical path remains deterministic and playable.
- Every branch has an explainable ending and test coverage for reachability.

### Risks / kill criteria

- **Risk:** combinatorial explosion and shallow “fake branches.”
- **Kill or narrow it** if a prototype requires more than ~20 bespoke scenes to make one divergence credible. Use a smaller, better-authored branch rather than pretending to simulate all of Canada.

---

## V2-02 — Parties, not one immortal Prime Minister

**Status:** `proposed`  
**Priority:** P0 — needed for credible election loop

### Problem

A single player-character leading Canada from 1968 to 2025 is game-readable but implausible. It also prevents elections from materially changing the choices available.

### Proposed direction

The player controls a **political party / governing tradition**, not one person.

```text
Player identity: party
Current leader: changes across elections, succession events, and defeat
Government status: majority / minority / opposition
```

Suggested initial party archetypes (avoid treating real parties as monoliths):

| Archetype | Starting strengths | Typical tensions |
|---|---|---|
| Liberal / centrist federalist | unity, rights, institutional legitimacy | deficit, regional alienation |
| Progressive conservative / Tory | fiscal capacity, decentralization, business confidence | rights, national cohesion, climate |
| Social democratic / NDP | social wellbeing, labour legitimacy, public services | fiscal constraints, business confidence |
| Quebec nationalist / sovereigntist | Quebec legitimacy, language/culture | federal unity, constitutional settlement |
| Regional / populist faction | regional responsiveness | national legitimacy, coalition durability |

Parties should not have immutable “good” or “bad” score multipliers. Instead they receive:
- **caucus values** (what choices are politically available);
- **coalition / donor / membership constraints**;
- **credibility reservoirs** (e.g., a Tory can spend fiscal credibility for a large public investment; an NDP can spend labour credibility for restraint);
- issue-specific choice variants.

### Safety / editorial boundary

Party-specific content can model constitutional hardline, austerity, nationalization, policing, immigration restriction, resource extraction, or social-democratic expansion. It must **not** offer genocide, racial violence, or other dehumanizing “extreme” choices as game options. Political variation should create legitimate dilemmas, not make hatred or violence a play mechanic.

### Choice model

For a scene, offer:

```text
2 universal choices
+ 1 governing-party choice OR 1 coalition-concession choice
+ optionally 1 opposition amendment / messaging choice
```

Example — energy crisis under an NDP-supported minority:

```text
Universal: revenue-sharing compact
Universal: accelerate private supply / market pricing
Minority concession: nationalize strategic oil assets + provincial revenue formula
```

### Acceptance criteria

- The UI says “your party” and identifies the current leader/government rather than implying the same PM remains forever.
- Party identity changes available choices and political costs, not just flavor text.
- The same historical scene can play differently under at least two governing parties.

---

## V2-03 — Elections with transfers of power and return from opposition

**Status:** `proposed`  
**Priority:** P0

### Problem

V1 defeat reduces effect strength for two decisions, but does not identify who governs or enable a meaningful return to office.

### Proposed direction

Make an election produce a government state:

```js
government = {
  party: 'liberal' | 'tory' | 'ndp' | 'bloc' | 'other',
  playerControlsParty: boolean,
  mandate: 'majority' | 'minority' | 'opposition',
  confidencePartner: 'ndp' | 'bloc' | null,
  seats: { /* simplified seat or regional seat model */ },
  nextElectionWindow: year
}
```

### After defeat

The player remains active in two modes:

1. **Opposition response:** respond to a government bill with messaging, amendment, organizing, coalition-building, or a provincial strategy. Effects are lower and differently shaped — e.g., strong influence on approval/party credibility, weaker influence on enacted policy.
2. **Government turn:** the governing party makes the policy choice. This should be authored or generated from its platform; the player sees it, but does not choose it.

At the next election, the player’s party can return to government based on approval, regional support, leader/caucus credibility, and government performance.

### Important distinction

Do not scale every effect by 50% in V2. Opposition has a different type of agency:

| In government | In opposition |
|---|---|
| enact policy | amend, oppose, organize, frame public debate |
| large state-metric effects | smaller state effects; larger party-approval / coalition effects |
| owns outcomes | gains or loses credibility based on government outcomes |

### Acceptance criteria

- Losing an election visibly changes governing party, available actions, and whose bill is on screen.
- At least one playtest path supports loss → opposition → re-election.
- The player can inspect government decisions without falsely being presented as the decider.

---

## V2-04 — Minorities, confidence-and-supply, and coalition concessions

**Status:** `proposed`  
**Priority:** P1

### Problem

V1 labels minority governments but does not materially change gameplay. Canadian minority parliaments are exactly where ideological trade-offs and party relationships should become visible.

### Proposed direction

A minority government must maintain **confidence** with a partner or win issue-by-issue support.

```js
confidence = {
  ndp: 0..100,
  bloc: 0..100,
  regionalCaucus: 0..100
}
```

Each major bill has:
- a standard governing-party choice;
- possibly a confidence-partner demand;
- a cost for rejecting it;
- a risk of election / defeat on confidence.

Example — 1980 energy crisis under a Liberal-NDP minority:

| Path | Immediate benefit | Cost / risk |
|---|---|---|
| Revenue-sharing deal | economy, unity | NDP confidence falls |
| Nationalize strategic oil assets | social, sovereignty, NDP confidence | Alberta unity, business confidence |
| Market-led supply response | economy, Alberta support | NDP confidence collapse; possible election |

### Keep it legible

Start with **one active confidence partner**, not a full parliamentary simulator. The player should understand: *“The NDP will keep us in power if we deliver X; if we refuse, there may be an election.”*

### Acceptance criteria

- A minority government unlocks one or more materially distinct policy options.
- Refusing a partner demand has a clear, visible consequence.
- A confidence failure can trigger an early election.

---

## V2-05 — Scoring: replace a single liberal-versus-Tory “answer” with plural success criteria

**Status:** `proposed`  
**Priority:** P1

### Observation

V1 is intentionally grounded in the way Canadian voter coalitions and historical outcomes have tended to value policies. That is useful. But a single equal-weight score inevitably creates an implicit preferred ideology, especially if unity, rights, social wellbeing, and environment all rise together on one family of choices.

V2 should not erase authorial judgment or pretend all choices are morally equivalent. It should make the judgment **explicit and inspectable**.

### Proposed direction: public baseline + declared mandate

Keep the neutral/common baseline:

```text
Commonwealth score = weighted national outcomes relative to historical baseline
```

Then add a party mandate score that is visible but separate:

```text
Party mandate = party promises kept + caucus / coalition credibility
```

Potential scorecard:

| Score | Question answered |
|---|---|
| National outcome | Did Canada / the branch country outperform the historical benchmark? |
| Democratic legitimacy | Did you maintain consent, rights, and constitutional legitimacy? |
| Party mandate | Did you deliver what voters elected your party to do? |
| Electoral durability | Could your party win again? |
| Regional / Indigenous legitimacy | Did affected nations and regions consent or merely comply? |

This allows a player to say: “My Tory government improved fiscal capacity and was re-elected, but made Canada less equitable,” rather than receiving one opaque “bad score.”

### Acceptance criteria

- The end screen explains what each score measures and does not hide weights.
- A party can succeed electorally while failing national outcomes, or vice versa.
- Historical baseline remains available for comparison.

---

## V2-06 — Algorithm architecture for a branching party simulation

**Status:** `proposed`  
**Priority:** P0 architecture decision

### Recommended model: authored event graph + deterministic state machine

Do **not** build an unrestricted AI-generated grand-strategy simulator. Use authored scenario nodes with explicit requirements and transitions.

```ts
type GameState = {
  year: number;
  metrics: Metrics;
  world: WorldFlags;
  government: Government;
  parties: Record<PartyId, PartyState>;
  elections: ElectionHistory[];
  branchHistory: EventResult[];
};

type EventNode = {
  id: string;
  yearWindow: [number, number];
  requires?: Predicate[];
  excludes?: Predicate[];
  actor: 'government' | 'opposition' | 'all-parties';
  choices: Choice[];
  next?: Transition[];
};

type Choice = {
  id: string;
  effects: Partial<Metrics>;
  worldEffects?: Partial<WorldFlags>;
  partyEffects?: Partial<PartyState>;
  unlocks?: string[];
  blocks?: string[];
  confidenceEffects?: Partial<ConfidenceState>;
};
```

### Event-selection algorithm

At each time step:

```text
1. Advance to next historical / scheduled year window.
2. Gather events whose requires() predicates are true.
3. Remove blocked or already-resolved events.
4. Prioritize:
   a. constitutional / existential branch events;
   b. election or confidence events;
   c. scheduled era-defining policy events;
   d. one optional regional / party event.
5. Resolve the event using the actor who actually governs.
6. Apply state transitions and append a transparent history record.
7. Check early-election and government-collapse conditions.
```

### Election algorithm: recommended first version

Avoid a fake granular riding model at first. Use a transparent **regional support model**:

```text
regions = { BC, Prairies, Ontario, Quebec, Atlantic, North }
partySupport[region][party] = 0..100
```

Election support is a function of:

```text
previous support
+ national approval
+ region-specific metric sensitivity
+ party credibility
+ leader / campaign effect
+ issue salience
+ incumbency / fatigue
+ deterministic seeded noise
```

Simplified concept:

```text
support(region, party) =
  baseSupport(region, party)
  + campaignEffect
  + partyCredibility
  + sum(metricWeight[region][metric] * metricDelta[metric])
  + incumbencyModifier
  + seededNoise
```

Then map regional support to a simplified seat estimate or mandate class:

```text
majority / minority / opposition
```

This is easier to explain, test, and balance than pretending to model every riding.

### Why deterministic seeded randomness

Use a run seed for uncertainty, but log it and surface it at the end:
- results feel political rather than mechanically predetermined;
- a player can replay/share the same run;
- tests can reproduce every election and branch.

### V2 test requirements

Add tests beyond V1's DOM checks:
- every event reachable only when its stated requirements are satisfied;
- no branch dead-ends before an ending;
- historical path remains valid;
- Quebec independence branch reaches branch-specific resolution;
- loss → opposition → re-election path works;
- minority confidence failure produces an early-election state;
- same seed + same choices = identical outcome;
- score explanations reconcile exactly with metric and party-effect logs.

---

## Suggested delivery order

| Milestone | Scope | Why first |
|---|---|---|
| **V2.0a: party state** | party identity, leader label, government/opposition state, election transfer | makes V1’s defeat mechanic meaningful without branch explosion |
| **V2.0b: minority mechanics** | confidence partner, one minority-only choice per relevant scene, early-election trigger | makes Canadian parliamentary politics distinctive |
| **V2.0c: one real branch** | Quebec 1995 YES branch pack (3–6 scenes + ending) | proves alternate-history architecture before scaling it |
| **V2.0d: scorecard** | national outcome + mandate + legitimacy + durability | exposes value judgments instead of hiding them |
| **V2.1: branch packs** | energy/federalism and climate/resource divergence packs | expand only where V2.0c shows depth is sustainable |

---

## Open design decisions

- [ ] **Scope of playable actor:** one chosen party, or choose any party at game start?
- [ ] **Party set:** real historical parties by era, or stable archetypes to avoid party-label anachronisms?
- [ ] **Historical control:** after a loss, should government decisions be fully authored, selected from a platform AI, or partially randomized within deterministic constraints?
- [ ] **Quebec split:** does Quebec sovereignty always create a separate end-state, or can negotiations reconstitute a confederal arrangement?
- [ ] **Election resolution:** mandate classes only for V2.0, or regional seat estimator immediately?
- [ ] **Scoring:** equal commonwealth weights, declared weights, or dynamic weights by branch / affected nation?
- [ ] **Editorial model:** how will sources, uncertainty, and legitimate scholarly disagreement be shown in-game?

---

## Explicitly not doing in early V2

- Full map/riding-level simulation.
- LLM-generated policy outcomes presented as historical fact.
- Every possible alternate-history branch.
- Hate, genocide, or racial violence as “hardline party” options.
- Hidden scoring weights or unexplained election outcomes.

---

## Review cadence

Before adding any V2 feature, update this item with one of:

```text
Status: proposed → validated → planned → shipped
Status: proposed → killed (with brief reason)
```

For a new idea, add: problem, proposed mechanic, affected state, acceptance criteria, and kill criteria.
