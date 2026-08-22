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

- [x] **Scope of playable actor:** start fixed as one party (Liberal), expand to any-party selection later.
- [x] **Party set:** stable archetypes (Liberal / Tory / Social-democrat / Quebec nationalist / Regional-populist) to avoid era anachronisms. Archetypes have *ideals* — straying too far from them risks caucus non-confidence.
- [x] **Historical control:** after a loss, government decisions are authored per event (not platform-AI-generated).
- [x] **Quebec split:** independence is the default Yes-path, but one negotiation event can land at `renewed-federalism` — a repair path exists without doubling content.
- [ ] **Election resolution:** mandate classes only for V2.0, or regional seat estimator immediately?
- [ ] **Scoring:** equal commonwealth weights, declared weights, or dynamic weights by branch / affected nation?
- [ ] **Editorial model:** how will sources, uncertainty, and legitimate scholarly disagreement be shown in-game?

---

## V2-07 — Simulation engine: state machine first, Monte Carlo second

**Status:** `proposed`  
**Priority:** P0 foundation

### Recommendation

V2 needs a **small game simulation engine**, but not a full Paradox-style world simulator and not a Monte Carlo process running continuously in the browser.

The right first architecture is:

```text
Authored event graph
+ deterministic state machine
+ durable world-state flags
+ transparent formulas
+ offline / on-demand scenario analysis
```

The engine should own the whole `GameState` and deterministically apply each choice, election, confidence vote, and branch transition. This is necessary once decisions unlock scenes, alter the country structure, change governing parties, or affect regional support.

### What belongs in the live game

- Apply a player choice to the state.
- Select future eligible events from the authored graph.
- Calculate a deterministic election outcome from the run seed.
- Update dashboard metrics.
- Show a brief **Cabinet Forecast** for the choice: likely direction, uncertainty, and main trade-off.

Example player-facing forecast:

```text
Treasury forecast, 3–5 years
Unemployment: likely down
Debt-to-GDP: likely up
Prairie support: likely down
Confidence risk: NDP support strengthens
```

This is immediate, explainable, and cheap enough to run on every click.

### What should not run continuously

A browser should not run thousands of future branch simulations after every click. It adds latency, obscures the authored model, and can create misleading precision — e.g., “there is a 63.4% chance of Quebec separation” despite a simplified model.

### Where Monte Carlo is valuable

Use seeded Monte Carlo as an **analysis tool**, not as the game's hidden referee:

1. **Content authoring / CI:** detect dead branches, impossible elections, dominant choices, and wild balance changes.
2. **Optional player-facing forecast:** after a major decision, calculate a broad scenario band from a limited number of seeded simulations, clearly labelled as modelled uncertainty rather than fact.
3. **Post-run replay:** show alternative plausible trajectories for the same branch.

A player-facing output should be qualitative or banded:

```text
Modelled outlook: resilient / contested / fragile
Chance of minority survival: low / medium / high
```

Not fake decimal precision.

### Acceptance criteria

- Same seed + same choices always produces the same state and election outcome.
- Event eligibility can be explained from recorded state flags.
- Monte Carlo is optional, bounded, and never required for basic gameplay.
- Analysis code can run in Node/CI without the browser UI.

---

## V2-08 — Financial dashboard and economic indicators

**Status:** `proposed`  
**Priority:** P1

### Why add it

The current `economy` score is useful but too abstract for a political simulator. A dashboard with recognizably Canadian macro indicators makes trade-offs tangible: a stimulus can lower unemployment while raising debt; austerity can protect debt while weakening growth; an oil boom can improve GDP while worsening regional and environmental pressures.

### Recommended initial dashboard

Keep the main dashboard to **three legible indicators** plus an optional details drawer:

| Indicator | Player-facing display | Why it matters |
|---|---|---|
| **Unemployment** | `%` | immediate household and election consequence |
| **Debt-to-GDP** | `%` | fiscal capacity, crisis response, credibility |
| **Real GDP / productivity strength** | index or `weak / steady / strong` | broad growth and capacity |

Optional drawer / later V2:

| Indicator | Use |
|---|---|
| Inflation / affordability | makes carbon, energy, and spending choices politically legible |
| Housing pressure | essential for post-2015 Canada |
| Federal balance / deficit | annual budget drama, distinct from total debt |
| Regional prosperity | Alberta/Prairies vs Ontario/Quebec vs Atlantic divergence |
| Emissions | complements Environment with a concrete number |

### Data model

Do not replace the six national metrics. Add a linked economic substate:

```ts
economy = {
  unemployment: number,      // e.g. 5.8
  debtToGdp: number,         // e.g. 61
  growthIndex: number,       // 0–100 or annual growth band
  inflation: number,         // optional in first release
  fiscalBalance: number      // optional in first release
}
```

Each decision can affect both high-level outcomes and indicators:

```js
effects: {
  economy: +4,
  social: +2,
  fiscal: { debtToGdp: +3, unemployment: -1.1, growthIndex: +4 }
}
```

The game should model **lags**: a policy does not necessarily change GDP, debt, and unemployment all on the next card. Add authored delayed effects where historically appropriate.

### Guardrail

Do not present invented annual rates as historical data. If the game displays precise years and percentages:
- seed the historical baseline from cited historical series;
- label alternate-path projections as modelled estimates;
- show ranges where uncertainty is high.

### Acceptance criteria

- Dashboard always shows unemployment, debt-to-GDP, and growth strength.
- Every financial metric has a plain-language tooltip and an associated policy trade-off.
- Historical baseline values are sourced and distinguishable from counterfactual projections.
- Economic indicators inform approval and regional support but do not secretly override visible choice effects.

---

## V2-09 — Conditional branch packs and visible consequence maps

**Status:** `proposed`  
**Priority:** P0

### Goal

Make selected choices feel like they genuinely reshape Canadian history without producing an unreadable, infinitely branching tree.

### Branch-pack model

A major divergence sets a durable flag and unlocks a finite branch pack:

```text
Choice outcome
  → durable world flag
  → 3–6 conditional follow-up scenes
  → branch-specific election / ending implications
```

Candidate first packs:

| Divergence | Flag | Follow-up themes |
|---|---|---|
| 1995 Quebec referendum: Yes | `quebecStatus = independent` | debt, borders, Indigenous consent, currency, federal redesign |
| 1980 NEP fully implemented | `westernAlienation = high` | Alberta constitutional conflict, party realignment, energy investment |
| 1982 Charter without Quebec | `constitutionalSettlement = contested` | Meech / Charlottetown alternatives, court legitimacy |
| 2012 oil-sands cap | `energyTransition = early` | clean industry, Alberta backlash, export markets |
| 2025 full continental integration | `sovereigntyModel = continental` | customs union, culture, defence, constitutional legitimacy |

### Player-facing map

Do not reveal every future card or their exact metric values before a player chooses. That turns the game into optimization.

Instead, after a major choice, update a **Consequences Map** on the dashboard:

```text
ACTIVE TRAJECTORIES
• Quebec constitutional settlement: unstable
• Western alienation: rising
• Fiscal capacity: constrained
• Energy transition: early-stage

Likely future dossiers
• constitutional negotiations
• provincial-federal resource dispute
• clean-industry investment decision
```

This communicates that the choice changed the future while preserving discovery.

### Authoring view

The repository should contain a full machine-readable branch graph and generated reviewer document showing:
- every flag a choice can set;
- every scene it unlocks/blocks;
- all reachable endings;
- metric impacts, delayed impacts, party effects, and election consequences.

This extends V1's generated `DECISION_TREE.md` into a branch-aware review artifact.

### Acceptance criteria

- At least one V2 branch contains conditional follow-up scenes unavailable in the historical route.
- The game dashboard names active trajectories without exposing exact optimisation values.
- CI verifies every branch has a valid continuation or a deliberate ending.

---

## V2-10 — Macro shocks, economic triggers, and crisis response

**Status:** `proposed`  
**Priority:** P1

### Principle

Economic crashes should not trigger from one simplistic number alone, such as “unemployment > 8%.” That makes downturns feel scripted and creates a player exploit: keep one indicator just below the line.

Instead, use an authored **shock eligibility model**:

```text
shock eligibility = era + macro conditions + world flags + seeded uncertainty
```

Example:

```text
2007–2009 global-finance shock is eligible when:
• year window is active;
• externalExposure is medium/high OR export/commodity dependence is high;
• growth strength is weak OR debt/fiscal vulnerability is elevated;
• seeded event roll selects the shock.

Severity then scales with:
• unemployment;
• debt-to-GDP / fiscal room;
• banking / regulatory state;
• trade exposure;
• prior policy choices.
```

This means the historical 2008 event remains likely in the historical route, but a player with different banking, fiscal, energy, or trade policy can see a milder, delayed, or differently-shaped downturn.

### Historical calibration

Use historical episodes as **archetypes**, not as hard-coded repetitions:

| Archetype | Era | Core signal | Canadian gameplay use |
|---|---|---|---|
| Technology / export slowdown | 2000–02 | growth slowdown, investment pullback | technology/telecom and export vulnerability dossier |
| Global financial crisis | 2008–09 | GDP contraction, unemployment jump, commodity shock | banking, auto industry, stimulus, federal-provincial response |
| Commodity collapse | 2014–16 | regional oil/commodity downturn | Prairie regional support, fiscal revenues, energy transition |
| Pandemic stop | 2020 | external non-market shock | employment support, public health, debt shock |
| Trade / tariff shock | 2025+ | external market access threat | sovereignty, diversification, manufacturing and consumer costs |

For scale, Statistics Canada reports that during the 2008–09 recession Canada’s unemployment rate rose from 5.1% in August 2008 to 7.7% in July 2009 under its U.S.-concept-adjusted series; employment fell and real GDP declined over the downturn.[1][2]

### Player-facing presentation

Never present a crash as “the algorithm rolled badly.” Present it as a dossier with visible conditions:

```text
ECONOMIC ALERT — Export and credit conditions deteriorate

Drivers:
• Global credit freeze
• Commodity price collapse
• High auto-sector exposure

Canada enters this shock with:
• unemployment: 5.4%
• debt-to-GDP: 46%
• fiscal room: high

Cabinet options: stimulus / targeted support / fiscal restraint
```

### Acceptance criteria

- A shock has a named historical or plausible structural driver.
- Severity can differ based on prior player choices.
- Thresholds are visible enough to be intelligible but not reducible to a single exploit.
- The historical route reproduces a historically plausible version of the event.

---

## V2-11 — Policy and scandal event packs

**Status:** `proposed`  
**Priority:** P1 content backlog

### Candidate policy packs

| Event family | Core dilemma | Likely state affected | Branch potential |
|---|---|---|---|
| **Canadian Wheat Board** | marketing board / farmer power / Prairie regional autonomy | Prairie support, trade, rural economy, sovereignty | high — changes later trade and Prairie party politics |
| **Nationalization** | public control of strategic air, energy, rail, or communications assets | sovereignty, fiscal balance, regional legitimacy, business confidence | high — Crown corporation performance and provincial conflicts |
| **Privatization** | sell Crown assets / deregulate public sectors / reduce public role | debt, fiscal capacity, service quality, labour support, sovereignty | high — irreversible asset ownership and later service crises |
| **Trade diversification** | deepen US integration vs Europe/Asia/Commonwealth vs managed strategic trade | economy, sovereignty, sector / regional support | high — alters exposure to tariff and financial shocks |
| **Scandal / ethics crisis** | protect minister, call inquiry, resign, or reform procurement | approval, party credibility, rights / institutional legitimacy | medium — election timing and opposition opportunities |

### Canadian Wheat Board — recommended scene framing

Avoid presenting it as simply “market good / board bad.” The authored trade-off is:

```text
Single-desk power and collective bargaining
vs.
individual farmer marketing freedom and trade flexibility
```

Possible options:
- retain / modernize the single desk;
- farmer-controlled hybrid model;
- abolish the board and transition to open marketing.

The important downstream state is not only `economy ±N`; it is:

```js
prairieAgriculture = 'collective-marketing' | 'hybrid' | 'open-market'
```

That state can affect future trade negotiation, drought / price-shock response, rural approval, and regional party strength.

### Nationalization and privatization — recommended rule

Model each asset as a long-term institution, not a one-time ideological score button:

```js
asset = {
  ownership: 'public' | 'mixed' | 'private',
  serviceCapacity: 0..100,
  fiscalExposure: 0..100,
  strategicControl: 0..100,
  regionalLegitimacy: 0..100
}
```

Nationalization can improve strategic control and service coordination while increasing fiscal exposure and provincial / business conflict. Privatization can reduce near-term debt and improve investment flexibility while weakening strategic control, labour trust, and future policy room. Those consequences should land over multiple later events.

### Trade choices

Trade should be a recurring strategic posture rather than one free-trade card:

```js
tradePosture = 'continental' | 'diversified' | 'managed-strategic' | 'protectionist'
```

It should influence later tariff shocks, manufacturing, commodities, culture, procurement rules, and foreign-policy room.

### Scandals

Scandals are good content if handled as **institutional stress tests**, not trivia quizzes or a claim that every player will repeat history.

Use event categories with sourced historical inspirations:
- procurement / sponsorship;
- conflict of interest;
- campaign finance;
- ministerial ethics;
- security / intelligence oversight.

Choices should be framed as:

```text
independent inquiry / defend minister / resignation / reform rules / concealment
```

The real consequences are approval, party credibility, institutional trust, caucus unity, and election timing. Exact historical names can appear in archival mode or citations, but the player should be confronting the governing dilemma rather than guessing a scandal’s answer.

### Acceptance criteria

- Every pack has at least one durable flag or institutional state, not only immediate metric deltas.
- Nationalization, privatization, and trade produce delayed consequences.
- Scandal scenes are grounded in sourced institutional facts and do not trivialize real harm.
- Prairie, provincial, labour, consumer, and Indigenous effects are considered where historically relevant.

---

## V2-12 — Event taxonomy, eligibility rules, and vertical-slice plan

**Status:** `proposed`  
**Priority:** P0 — first V2 design deliverable

### Purpose

Before authoring all new scenarios or building the dashboard, create the **V2 event map**: a reviewable specification of what can happen, why it appears, who acts, what it changes, and what it unlocks.

The first V2 output should be an event-graph / eligibility document, not a giant pile of card copy and not a polished UI.

### Event buckets

Every event must belong to one of these buckets:

| Type | Appearance rule | Example |
|---|---|---|
| **Universal era anchor** | Appears in every run because the historical era creates an unavoidable pressure | October Crisis, pandemic, global downturn |
| **Universal but altered** | Appears in every run, but its severity, copy, available choices, or actor changes with state | 2008 downturn with high versus low debt; tariff shock after continental versus diversified trade |
| **Conditional consequence** | Appears only because a player-created world flag makes it relevant | Quebec separation negotiations after a Yes vote |
| **Party / mandate event** | Appears because the governing party, opposition, or confidence partner makes a particular demand possible | NDP nationalization demand under Liberal-NDP confidence-and-supply |
| **Reactive systemic shock** | Becomes eligible when era, macro conditions, exposure, and seeded uncertainty align | commodity crash, financial shock, trade disruption |

### Authoring schema

Each event needs a structured record before prose is finalized:

```ts
type EventSpec = {
  id: string;
  title: string;
  yearWindow: [number, number];
  type: 'universal' | 'altered' | 'conditional' | 'party' | 'reactive';
  actor: 'government' | 'opposition' | 'confidence-partner' | 'all-parties';

  requires?: Predicate[];
  excludes?: Predicate[];
  priority?: number;

  metricsAffected: MetricId[];
  financialIndicatorsAffected: FinancialIndicatorId[];
  regionalEffects?: RegionId[];

  choices: ChoiceSpec[];
  setsFlags?: WorldFlagPatch;
  unlocks?: EventId[];
  blocks?: EventId[];
  alters?: EventId[];
};
```

For each `ChoiceSpec`, document:

```text
Immediate metric effects
Financial effects
Delayed effects
Party / confidence effects
World flags set
Future events unlocked, blocked, or altered
Historical reference path, if applicable
```

### Example: Quebec 1995 event

```text
Event: QUEBEC_1995_REFERENDUM
Type: universal era anchor
Year: 1995
Actor: federal government

Choice: Yes vote / separation negotiated
Sets:
  quebecStatus = independent
Unlocks:
  QUEBEC_DEBT_NEGOTIATION
  INDIGENOUS_TERRITORIAL_CONSENT
  POST_SEPARATION_FEDERAL_REDESIGN
  POST_SEPARATION_ELECTION
Alters:
  later trade posture events
  constitutional events
  regional support model
  end-state scorecard
```

### Event budget / pacing rule

To prevent V2 from becoming a bloated sequence:

```text
Per era, normally show:
• 1 shared pressure / anchor event
• 0–1 conditional or altered consequence event
• 0–1 party or regional event
• elections / confidence events when due
```

Not every historical event deserves a card. An event belongs when it produces a meaningful decision, a durable state change, or an important political trade-off.

### Build sequence

1. Define `GameState` and the event schema.
2. Classify existing V1 scenes as universal, altered, conditional, party, or reactive.
3. Build a branch-aware event map with all flags, unlocks, blocks, and altered scenes.
4. Define the financial state fields early (unemployment, debt-to-GDP, growth strength), but defer dashboard polish.
5. Add minimal party/government/opposition state needed for the event actor to be meaningful.
6. Build one complete vertical slice: **1995 Quebec referendum: Yes**.
7. Test loss → opposition → re-election, altered events, and branch-specific ending within that slice.
8. Only then add confidence-and-supply, Wheat Board, nationalization/privatization, trade, scandal, climate, and other branch packs.

### Acceptance criteria

- Every planned V2 event is classified in one event bucket.
- Every conditional event has explicit requirements and at least one valid continuation.
- Every major choice lists its future unlocks, blocks, and altered events.
- Historical route remains a valid, deterministic route through the graph.
- A reviewer can identify which events are independent, which are shared-but-altered, and which are branch-only without reading UI code.

---
## V2-13 — Content expansion consensus (Socrates/Critic joint position)

**Status:** `planned`
**Priority:** P0 content round — step 8 of the V2-12 build sequence
**Origin:** Three-round Socrates/Critic design discussion, 2026-08-22. Round docs absorbed into this section and removed.

### Agreed package

| # | Pack | Events | State added | Key constraints |
|---|---|---|---|---|
| 1 | Scandal pack | 5 | `institutionalTrust: 'bruised' \| 'reformed'` | Institutional stress tests; no real ministers named; reform-vs-conceal alters later event copy; one variant = ministerial ethics × Crown board |
| 2 | Canadian Wheat Board | 5–6 | `prairieAgriculture: 'collective-marketing' \| 'hybrid' \| 'open-market'` | Alters later trade events; sequence before/with pack 3 |
| 3 | Trade posture | 6–7 | `tradePosture: 'continental' \| 'diversified' \| 'managed-strategic' \| 'protectionist'` | Cultural exemption is a first-class sub-dilemma; shock-severity payoffs STUBBED until V2-10 exists |
| 4 | NEP / western alienation | ≤8 hard cap | `westernAlienation`, energy-model flags | Biggest creep risk; built after pattern proven |
| 5 | Indigenous anchor spine | 4 | `indigenousRelation`, `s35Recognized`, `treatyPosture`, `reconciliationPath` | Flags + metric deltas ONLY; no consent/regional mechanics in copy; feeds scorecard's Regional & Indigenous legitimacy row; precondition set for the future full arc |
| 6 | Crown sector | ~5 | `crownSector: 'expansionist' \| 'mixed' \| 'retrenchment'` | Aggregate posture flag, not per-asset sub-state; delayed effects via existing `alters:` mechanism |

**Totals:** ~33–35 events, 4–6 world flags, **zero new engine features**.
**Slack priority:** Quebec merge-back alters (e.g., independent-Quebec trade anchor variants).

### Binding authoring constraints

1. No event copy may simulate deferred mechanics (consent negotiation, regional/nation electoral modeling) — the spine is federal decision points only.
2. Scandal categories are era-anchored party events, never a random crisis pool; real names stay out of player-facing text.
3. Trade cards authored now may SET `tradePosture` but must not author "milder 2008" payoff variants until the V2-10 eligibility model exists.
4. Crown-sector consequences land as immediate deltas + `alters:` hooks on later trade/shock events; no delayed-effects queue.

### Kill criteria

- Any pack breaching its event count by >50% returns to review.
- If the spine's flags end up unread by any later event or scorecard component, cut it.
- NEP exceeding 8 scenes triggers automatic scope review.

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

## Sources

[1] https://www150.statcan.gc.ca/n1/pub/11-626-x/11-626-x2014036-eng.htm — Statistics Canada: Labour Market Since the Last Recession
[2] https://www150.statcan.gc.ca/n1/pub/11-010-x/2010004/part-partie3-eng.htm — Statistics Canada: Canadian Economic Observer, 2008-09 Recession
