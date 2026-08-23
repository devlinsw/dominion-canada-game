# Codex Task: Playstyle/Ideology Testing for Dominion Canada V2

## Context

You are working in `/root/dominion-canada`, branch `v2`. This is a build-free
browser game (single `index.html` + ES modules in `src/`). The V2 layer adds 27
authored events (packs in `src/pack-*.mjs` + `src/branch-quebec-1995.mjs`) that
interleave into the V1 timeline of 25 decisions. Choices set durable world flags
(`v2World`), and a plural scorecard exists in `src/scorecard.mjs`.

**Do NOT modify game code.** Your job is to *test* by driving the page and
reporting findings. If you find bugs, write them up; don't fix them.

## How to drive the game

The game runs in jsdom (installed). A playthrough driver pattern:

```js
// tools/_ideology-test.mjs template
import { JSDOM } from 'jsdom';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'file:///root/dominion-canada/index.html' });
const w = dom.window;

const FILES = ['pack-scandals.mjs','pack-indigenous-spine.mjs','pack-wheat-board.mjs',
               'pack-trade.mjs','pack-nep.mjs','pack-crown.mjs',
               'pack-quebec-mergeback.mjs','branch-quebec-1995.mjs'];
w.__v2mods = {};
for (const f of FILES) w.__v2mods['src/' + f] = await import('../src/' + f);

const scriptSrc = html.match(/<script>([\s\S]*)<\/script>/)[1];
const patched = scriptSrc.replace(
  'await import(new URL(src, location.href).href)',
  'await Promise.resolve(window.__v2mods[src])'
) + `
;window.__v2 = () => ({ world: v2World, activeId: v2Active && v2Active.id,
  queue: v2Queue.map(e=>e.id), resolvedCount: v2Resolved.size,
  metrics: state.metrics, history: state.history,
  approval: state.metrics.approval ?? null });`;

w.eval(patched);

export async function playIdeology(w, pickFn) {
  w.document.querySelector('[data-action="start"]')
    .dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  await new Promise(r => setTimeout(r, 300));
  const log = [];
  for (let guard = 0; guard < 200; guard++) {
    const btns = [...w.document.querySelectorAll('.choice-button')];
    if (!btns.length) {
      const cont = w.document.querySelector('.continue-button');
      if (cont) { cont.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); continue; }
      break;
    }
    const isV2 = !!w.eval('__v2().activeId');
    // pickFn receives labels + context, returns index to click
    const idx = pickFn({ labels: btns.map(b => b.textContent), isV2 });
    btns[idx].dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    log.push({ v2: isV2, id: w.eval('__v2().activeId'), picked: idx });
    await new Promise(r => setTimeout(r, 2));
  }
  return { log, world: w.eval('__v2()').world, metrics: w.eval('__v2()').metrics,
           history: w.eval('__v2()').history };
}
```

**Important quirks:**
- V1 cards show via `.choice-button`; consequence screens have `.continue-button`.
- For V1 decisions you can inspect the authored choices with
  `DECISIONS[state.currentDecision].choices[i].label` — but note during a V2 card
  `state.currentDecision` still points at the *next* V1 card.
- Seeds: pass a fixed seed via `startGame(12345)` (called as `w.eval('startGame(12345)')`)
  before clicking start, or just accept random seeds per run.
- The Quebec Yes branch requires choosing "Yes" on QUEBEC_REFERENDUM_1995 — then
  QUEBEC_NEGOTIATION_1996 fires in 1996–97.

## The five ideology bots to implement and run

Each bot picks choices consistently across ALL cards (V1 + V2). Read choice
labels/desc text and match keywords:

### 1. HISTORICAL
Always pick the choice where `is_historical === true` (V1 data:
`game_data.json[decisionIndex].choices[i].is_historical`) / `isHistorical` (V2).
This is the baseline — its final metrics should roughly match the known
historical score of **81.0** (V1 metric). Record any drift.

### 2. TORY-FISCAL-HAWK
Keywords favoring: market, privatize, sell, tax cuts, austerity, restraint,
free trade/continental, pipelines, "let the market". Avoid: nationalize,
spending, subsidy, carbon pricing. On scandals choose "defend"/"close ranks".
Expected outcome signature: economy high, social/enviro lower, crownSector=retrenchment.

### 3. SOCIAL-DEMOCRAT
Keywords favoring: public, expand, nationalize, universal, single desk/strengthen,
inquiry/reform, commit (TRC), partnership, revenue-sharing. Avoid: privatize,
sell, cut, market pricing.
Expected: social/rights high, crownSector=expansionist, institutionalTrust=reformed.

### 4. SOVEREIGNTIST-SYMPATHIZER
On both Quebec referendums choose the Yes/most-autonomy option; on language/
constitutional cards choose the decentralizing option; on trade prefer
diversified over continental. **This bot must reach QUEBEC_NEGOTIATION_1996** —
verify the branch pack fires, then test BOTH endings across two runs
(hardline → quebecStatus=independent; partnership → renewed-federalism).

### 5. RENEWAL-REFORMER (institutionalist)
Always choose inquiry/commission/reform/cooperation options; on scandals never
conceal; on Senate pick reform-track; on Indigenous spine always the
most-reconciliation choice; on Crown boards pick governance reform.
Expected: institutionalTrust=reformed everywhere, s35Recognized=true,
reconciliationPath=committed, high democratic legitimacy inputs.

## What to report (write to `TESTING_IDEOLOGIES.md`)

For each bot:
1. Final six metrics (unity/economy/rights/enviro/sovereign/social) + which V2 events fired
2. Full `v2World` flag snapshot at end
3. Whether elections were won/lost (from `state.history` kind==='election')
4. Any anomalies:
   - V2 events that should fire but didn't (e.g., western protest vote under collective-marketing)
   - Flag states inconsistent with the ideology's choices
   - Crashes, undefined errors, stuck screens (guard hit 200 without ending)
   - Metric clamping oddities (values pinned at 0 or 100 early)
5. Cross-bot comparisons:
   - Did any two ideologies end with identical worlds? (bad — means choices don't matter)
   - Does SOVEREIGNTIST actually reach the branch? Does TRADE_WITHOUT_QUEBEC_1997
     fire after independence?
   - Scorecard check: load `src/scorecard.mjs`, call `buildScorecard()` with each
     bot's final state + the historical baseline from `HISTORICAL_METRICS`
     (available in-page), and report the five scores per ideology. Do the scores
     tell distinguishable stories?

Also run each bot 3× with different seeds and confirm determinism holds
(same seed + same picks = same result).

## Deliverables

1. `tools/ideology-bots.mjs` — the reusable driver + five bots
2. `TESTING_IDEOLOGIES.md` — results table + anomaly list
3. Commit both to branch `v2` with message `test: ideology playthrough bots + results`

Do not change any existing files except adding these two. If something crashes
hard enough that you can't complete a bot's run, document it precisely (what was
on screen, what was clicked) rather than patching around it.
