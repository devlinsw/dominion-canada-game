# Dominion — Design & Engineering Audit

An analysis of the decision tree and game design, with fixes applied where the
problem was unambiguous and exact recommendations where the call is yours.

Every number in this document was computed from `index.html`, not estimated.
Re-derive any of them with `node tools/balance.mjs`.

---

## Method

The decision tree has a property that makes it fully analyzable: **each metric
evolves independently**. A choice's effect on Unity depends only on Unity's
current value, because clamping is per-metric. That means a dynamic program over
each metric's reachable values (0–100) covers *every* one of the ~1.9 × 10¹⁰
possible playthroughs exactly, with no sampling.

Where the joint state matters — the final score is a mean across six coupled
metrics — I used beam search (width 200k, effectively exact at this scale) for
the envelope and 300,000 Monte Carlo playthroughs for the distribution.

Runtime behaviour was verified by driving the real `index.html` in a real DOM
(jsdom) and clicking through complete games.

---

## Part 1 — The five design problems

### 1. The headline statistic is inverted

The end screen tells the player:

> *"94% of players leave Canada no better than the real timeline."*

Two things are wrong with this.

**It isn't measured.** The number is a constant. Nothing in the codebase ever
computed it.

**It's backwards.** A player who clicks entirely at random scores above 50 in
**67.8%** of runs. The distribution of random play:

| | Score |
|---|---|
| 5th percentile | 39.3 |
| median | 54.5 |
| 95th percentile | 69.5 |

So the "94% fail" framing was being shown to a population where two-thirds
succeed by the game's own test.

**And the threshold is wrong.** The claim is *"you left Canada in better shape
than the real history did"* — but the game never asked what real history scored.
I encoded the actual timeline (Official Languages Act passed, War Measures Act
invoked, Meech died, pipelines approved, CERB, retaliation on tariffs) as
`HISTORICAL_PATH` and ran it through the same rules:

> **Real history scores 73.8.**

That is the bar. Not 50. Under the old code, a player scoring 55 was told they'd
beaten history — while sitting nearly 19 points below it.

Against the corrected bar, **1.3%** of random players genuinely beat history.
The original "6%" instinct was closer to right than the threshold that
implemented it.

**Fixed.** The end screen now computes a real percentile from 20,000 simulated
runs of the live ruleset, shows what history actually scored, and displays each
metric against its historical value (`Sovereignty 84 · history 100 · −16`). The
score finally has a referent.

---

### 2. The dominant strategy is "don't read the screen"

| Strategy | Final score | Band |
|---|---|---|
| **Always click choice #1** | **77.5** | **Extraordinary** |
| Always click the middle | 48.3 | Familiar |
| Always click the last | 33.5 | Struggling |

Choice #1 is the highest-scoring option in **15 of 23** decisions. A player who
never reads a word lands in the game's top band — above the real historical
timeline.

This is the most damaging finding, because the game's thesis is *"everyone
thinks they would have done better; let's see."* If the top rating is reachable
by reflex, the thesis is untested.

**Fixed.** Choice order is now shuffled per run from a seeded PRNG. Position
carries no information. The seed is shown on the end screen and accepted via
`?seed=`, so a run is still exactly reproducible for testing or for comparing
against a friend.

Note this treats the *symptom*. The underlying content gradient — the
progressive option is usually also the highest-scoring one — is a deeper
authorial question, addressed in §5.

---

### 3. Three of four elections are theatre

| Year | Threshold | Approval actually reachable there | Binding? |
|---|---|---|---|
| 1972 | 30% | **34 – 68** | never — you cannot fail |
| 1980 | 25% | 22 – 76 | yes |
| 1984 | 35% | 14 – 84 | irrelevant — scripted to lose |
| 2015 | 30% | 0 – 100 | yes |

**1972** displays "Approval 47% / Needed 30%" on a screen where the minimum
possible approval is 34. The gauge cannot move the outcome. Neither choice can
produce anything but a minority.

**1984** discards the player's input entirely — both options are
`result: "lose"`. Asking someone to choose and then ignoring it is the one thing
a choice-driven game shouldn't do. (Two honest options: make it a contest, or
present 1984 as narration and don't ask.)

**And losing cost nothing.** `electionsLost++`, `term++`, one line of end-screen
text. The 1980 Quebec referendum could be *lost* — Quebec votes to leave — and
the next screen carried on identically. The dramatic peak of the entire game had
no mechanical consequence.

**Fixed.** Defeat now puts you in opposition for the following two decisions:
you're still asked, but your choice lands at 50% strength, and the UI says so
plainly — *"You are not in government. You can shape this — you cannot decide
it."* One shared `resolveElection()` now serves both the UI and the analyzer, so
what the player sees can't diverge from what the model computes.

The 1972 gate and the 1984 script are content decisions and are left to you.
`node tools/suggest-fixes.mjs` gives exact numbers: to put the bottom ~10% of
runs at risk in 1972, `approvalNeeded` needs to be **41**; for the bottom ~25%,
**48**.

---

### 4. Eleven choices are dead content

A choice is **strictly dominated** when another option in the same decision is
at least as good on all six scoring metrics and better on at least one. No
informed player picks it. It occupies a screen and offers nothing.

**11 of 65 choices (17%) are strictly dominated:**

| Year | Dominated choice | Dominated by |
|---|---|---|
| 1970 | Invoke the War Measures Act | Invoke with a sunset clause |
| 1971 | Bilingualism is enough | Adopt official multiculturalism |
| 1971 | Multiculturalism with integration requirements | Adopt official multiculturalism |
| 1972 | Campaign on the record | Pivot to economic competence |
| 1980 | Let Quebecers decide | Campaign hard |
| 1991 | Cut spending instead | Implement the GST |
| 1992 | Let it die | Renegotiate — include Indigenous nations |
| 1995 | Let Quebec decide | Fight with everything |
| 2008 | Austerity | Steady as she goes |
| 2018 | Decriminalize only | Legalize — regulate and tax |
| 2018 | Keep it criminal | Legalize — regulate and tax |

The 1970 case is the most striking. "Invoke the War Measures Act" — the single
most consequential and most argued-over decision in modern Canadian political
history — is mechanically pointless, because the sunset-clause variant is better
on every axis. The scene that should be the game's hardest choice is a
formality.

`tools/suggest-fixes.mjs` computes the smallest edit that breaks each
domination, restricted to metrics the scene already argues about. For 1970 it
proposes `unity: -3 → 0`, `social: -5 → -1`, or `rights: -10 → -3` — i.e. make
the full Act buy something the sunset version doesn't, which is the historical
argument anyway: *decisiveness*. Right now it buys +10 Approval and nothing
else.

Three of these are worth calling out as *narrative* problems, not arithmetic
ones. "Let Quebec decide" in 1980 and 1995, and "Keep it criminal" in 2018, have
no metric in play that favours them. That isn't a tuning gap — it means those
options currently have no argument for themselves. Worth asking: what does a
player who picks them believe they're buying?

---

### 5. The metrics aren't equally real

Each of the six scoring metrics is worth exactly 1/6 of the final score. They
are not equally reachable:

| Metric | Reachable range | Decisions that move it | Swing |
|---|---|---|---|
| National Unity | 0 – 100 | 20/23 | 245 |
| Social Wellbeing | 0 – 100 | 20/23 | 183 |
| Sovereignty | 0 – 100 | 17/23 | 156 |
| Economy | 0 – 100 | 16/23 | 154 |
| Rights & Liberties | 0 – 100 | 13/23 | 129 |
| **Environment** | **16 – 83** | **5/23** | **67** |

Environment can never be worse than 16 or better than 83, and only five
decisions touch it — yet it anchors a full sixth of every result. In practice
it's a partly-fixed constant dragging every score toward the middle.

Two defensible fixes:

1. **Give it more levers** — this is the honest one, and it's really a content
   gap. Six decades of Canadian environmental politics with five decision points
   omits the Berger Inquiry (1977), acid rain and the 1991 Air Quality Agreement,
   the 1992 cod moratorium, and Site C. Any of those is a good scene.
2. **Weight the score by reachable span**, so a metric that can barely move can't
   quietly anchor a sixth of the outcome.

Related: **Approval has the second-largest swing in the game (213) and
contributes zero to the score.** It gates four elections, three of which barely
function. That's a lot of authorial energy invested in a currency that buys
almost nothing.

---

## Part 2 — Six runtime bugs

All reproduced by driving the real page in jsdom; all now covered by regression
tests in `tools/game.test.mjs`.

**1. The term counter drifted.** `state.term` incremented only on elections
(max 5), while the data carried authored `term` values up to 15 — a field the
renderer never read. 1997 displayed "Term 4"; the data says 7. 2012 displayed
"Term 4"; the data says 11.

**2. Elections were missing from the decision log.** `chooseElection()` never
pushed to `state.history`. The end screen's "Your Decisions" listed 19 of 23,
silently omitting all four elections — including the 1980 and 1995 referendums.

**3. Replaying stacked duplicate history logs.** `showEndScreen()` used
`insertAdjacentHTML('afterend', …)` on a node that was never cleared. After
three playthroughs: three log blocks, 57 stale entries on screen.

**4. `canWin` was baked into markup at render time.** The election verdict was
computed during rendering and interpolated into an `onclick` string, splitting
election logic across two places. Now one `resolveElection()` serves both the UI
and the simulator, verified consistent across 81 (choice × approval) cases.

**5. Losing an election had no mechanical effect.** Covered in §3.

**6. The 6%/94% stat.** Covered in §1.

---

## Part 3 — What else shipped

Beyond the bug fixes:

- **Save and resume.** 23 decisions is a long mobile session; backgrounding the
  app discarded everything. Progress now persists, with a resume prompt on
  return.
- **Progress indicator.** There was no sense of how far through the century you
  were. Twenty-three unmarked screens is a drop-off risk.
- **Keyboard control.** Number keys select; Enter advances; focus moves to the
  first choice on each screen and to Continue after each consequence. Previously
  there was no focus management and no visible focus ring at all.
- **Screen-reader support.** Metrics expose `role="meter"` with live values,
  progress exposes `role="progressbar"`, metric deltas announce via `aria-live`.
- **`prefers-reduced-motion`** respected.
- **Social metadata.** A game built to be shared had no Open Graph tags, no
  description, and no favicon — every link preview was a blank card. Added,
  along with a share button and a seed line for reproducible runs.
- **No inline handlers.** All `onclick=` replaced with one delegated listener.

---

## Part 4 — Content accuracy notes

Not bugs, but worth a pass:

- **Meech Lake is dated 1992.** It died in **June 1990**, when Elijah Harper
  refused consent in the Manitoba legislature. 1992 is Charlottetown — a
  different accord, defeated by national referendum on October 26. Right now the
  game has the 1990 event on the 1992 date and skips Charlottetown entirely,
  which is arguably the better scene: it's the only time Canadians voted
  directly on their own constitution.
- **The deficit decision is dated 1997.** The defining cuts were Martin's
  **February 1995 budget** (the CHST). By 1997 the deficit was essentially
  eliminated — the drama was two years earlier.
- **The 2019 carbon tax scene is now historically stale.** The consumer fuel
  charge was removed effective **April 1, 2025**, before the 2025 tariff
  decision the game ends on. A game running to 2025 that treats the carbon price
  as standing has a visible gap; "hold firm" is no longer what happened.
- **1976 Montreal Olympics.** Encoded correctly — Ottawa did *not* bail out;
  Quebec carried the debt to 2006 — but worth confirming that's the intent,
  since it's the one decision where the historical answer is choice #2.

---

## Part 5 — What I'd do next

In priority order, all now measurable with the tooling:

1. **Break the eleven dominations.** Highest value per unit of work. Start with
   1970 — the game's signature moment shouldn't be a formality.
2. **Decide what 1984 is.** A contest or a cutscene. Not a discarded prompt.
3. **Raise the 1972 gate to 41** (or delete the approval display on that screen).
4. **Give Environment three or four more decisions.** Berger, acid rain, the cod
   moratorium.
5. **Make Approval buy something**, or drop it to flavour. 213 points of swing
   currently purchase four elections, three of which barely function.
6. **Interrogate the ideological gradient.** Choice #1 — usually the
   progressive/historical option — is optimal in 15 of 23 decisions. Shuffling
   stops players from *exploiting* that, but it doesn't make the tree neutral. A
   game whose premise is "you try governing" is more interesting when the
   trade-offs are real in both directions: when austerity genuinely buys fiscal
   room the player will need in 2008, when the NEP's sovereignty gain genuinely
   costs a decade of Western alienation. Right now several conservative options
   are simply worse, which makes the exercise a quiz with a known answer rather
   than a dilemma.

Point 6 is the one that decides whether this is a good toy or a good argument.

---

## Running the tooling

```bash
npm install          # jsdom, for the DOM tests
npm test             # 42 integration tests against the real page
npm run balance      # full balance report
npm run check        # balance + docs freshness, exits nonzero on regression
npm run docs         # regenerate game_data.json + DECISION_TREE.md
npm run suggest      # minimal edits for the outstanding content findings
```

`index.html` is the single source of truth. `game_data.json` and
`DECISION_TREE.md` are generated from it — previously all three were maintained
by hand, and the JSON export had already dropped the `term` field.
