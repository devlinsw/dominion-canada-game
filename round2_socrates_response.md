# Round 2 — Socrates' Response (Scandals / Indigenous Arc / Crown Corporations)

> Position after the Critic's rebuttal. Goal: converge, not win. Each collision ends in CONCEDE / NARROW / HOLD with concrete counts.

---

## 1. Scandals — CONCEDE, with one narrowing

The Critic is right and my round-1 "cut it as too generic" was wrong on the merits:

- **Zero engine dependencies** is a real argument I underweighted. Every other candidate pack (Wheat Board, NEP, Crown sector) needs flags, regional support, or sub-state. Scandals run on `approval`, `partyCredibility`, and election timing — all of which V2.0a/b already ship. It's the only P1 content item with literally no prerequisite.
- **One category template × 5 eras** genuinely buys replay variance at near-zero authoring cost. My round-1 objection was about genericness; the Critic's counter — institutional stress test, no real names — answers exactly that. V2-11 already specifies this framing ("independent inquiry / defend minister / resign / reform rules / concealment") and it holds.

**Narrowing I still want (small):**

1. **Count: 5 events, not 7.** One per era bucket (1968–79, 1980–92, 1993–2005, 2006–14, 2015–25). The 6th/7th would start cannibalizing the per-era budget rule in V2-12 ("0–1 party or regional event per era") rather than filling slack.
2. **One durability hook, not zero:** each scandal sets a single boolean-ish flag (`institutionalTrust: bruised | reformed`) chosen by whether the player picked *reform rules* vs *conceal/defend*. That flag gates one altered later event per era (e.g., a reformed-procurement path softens the next scandal; a concealment path makes it worse). Cost: ~10 lines of predicate. This keeps scandals from being pure metric noise while respecting "no new mechanics."
3. **Accept the Critic's slot:** build order position 1, inside the party-bucket era budget. Agreed.

**Net:** 5 events, 1 shared choice template, 1 flag, 5 altered-copy hooks. I withdraw the cut.

---

## 2. Indigenous Rights Arc — PARTIAL CONCEDE; propose the minimal-thread compromise

Where the Critic is right:

- G2 fails today. A rights arc that actually means something needs regional support modeling (First Nations as a region/nation in the election model) and consent mechanics that don't exist in V2.0a–d. Shipping it now produces metric-delta theater — exactly what I accused scandals of being, so I can't have it both ways.
- A fifth full theme does break the era pacing budget.

Where the Critic overcorrects: **"not this round" ≠ "zero events this round."** Dropping the thread entirely leaves the biggest scorecard hole (V2-05's own *Regional / Indigenous legitimacy* row) with nothing feeding it, and makes the eventual arc feel bolted-on later.

**Proposed compromise — "anchor spine": ONE anchor event per era, flags + metric deltas only, no new mechanics:**

| Year | Event | Sets flag | Metric deltas only |
|---|---|---|---|
| 1969 | White Paper withdrawal | `indigenousRelation = 'assimilation-rejected'` vs `'assimilation-pursued'` | rights ±, unity ±, approval ± |
| 1982 | Constitution Act s.35 | `s35Recognized: bool` | rights +, sovereignty ∓ |
| 1998–99 | RCAP response / Nisga'a treaty | `treatyPosture = 'modern-treaties' \| 'status-quo'` | unity, rights, Prairie support |
| 2015 | TRC Calls to Action | `reconciliationPath = 'committed' \| 'deferred'` | social, rights, approval |

- **4 events total**, one per era — fits the V2-12 pacing rule as the era's single party/regional slot where needed.
- **Zero new mechanics:** every effect is an existing metric delta plus one world flag from the existing `WorldFlags` patch system (V2-06 schema already supports this).
- **G2 satisfaction argument:** these four are *era anchors*, not a theme. They don't require consent mechanics to be honest — they're the historical decision points themselves, authored like any universal anchor. What G2 correctly blocks is the *branch content* (negotiations, consent systems, regional modeling). Defer that to when regional support ships.
- **Payoff for later:** when the real arc gets built, these four flags are its precondition set. The spine costs ~4 scenes now and saves re-authoring later.
- **Concede to Critic:** Quebec merge-back alters take priority for remaining slack. If forced to choose between the 4-event spine and Quebec alters, take Quebec — but if both fit within the era budget (they do: 4 anchors spread across 5 eras), do both.

---

## 3. Crown Corporations / Nationalization — CONCEDE on scope; HOLD one narrow reservation

I accept the Critic's core kill-criterion argument: full V2-11 asset sub-state (`ownership/serviceCapacity/fiscalExposure/strategicControl/regionalLegitimacy` per asset, delayed-effects queue) across even 3 assets blows past the >20-scene budget once you author consequence events per state combination. The aggregate posture flag is the right V2.1-sized move.

**Accepted design:**

```js
crownSector: 'expansionist' | 'mixed' | 'retrenchment'
// ~5 events touch it; effects land as immediate metric deltas +
// regional/business-confidence deltas; no asset-level sub-state
```

- 5 events: e.g., Air Canada/Petro-Canada-era expansion choice (1976–80), VIA Rail creation (1979), privatization wave (1984–89), Petro-Canada sale (1990–91), post-2008 auto/Crown intervention. Each reads `crownSector` and offers keep/sell/partial choices.
- Delayed consequences: approximated via the existing `alters:` mechanism (later trade/shock events read the flag and adjust severity/copy), which V2-09/V2-12 already support. No queue engine.

**My held reservation (one sentence of scope, not a fight):** arm's-length governance dilemmas — ministerial interference vs. board independence — were the actual historical texture (CBC, Petro-Canada, AECL). If the Critic accepts **one** such dilemma folded into the existing scandal template as a variant category (ministerial ethics × Crown board), I drop the reservation entirely. Zero new events; it rides the 5-event scandal count from §1.

---

## Converged build order (proposed joint position)

| # | Item | Events | New mechanics |
|---|---|---|---|
| 1 | Scandal pack | 5 | none (+1 `institutionalTrust` flag, incl. Crown-governance variant) |
| 2 | Wheat Board | per Critic's spec | `prairieAgriculture` flag (already in V2-11) |
| 3 | Trade posture | per Critic's spec | `tradePosture` flag |
| 4 | NEP | hard cap 8 ✓ | agreed |
| 5 | Indigenous anchor spine | **4** (1969/1982/1998/2015) | none — flags + deltas only |
| 6 | Crown-sector aggregate | 5 | one `crownSector` flag |

Total contested additions: **14 events + 4 world flags, 0 new engines.**

Open question back to the Critic: does the 4-event Indigenous spine pass your G2 as *era anchors* (my claim), or do you read any Indigenous-content event as implicitly requiring the deferred mechanics (your claim)? If the latter, name the specific failure mode of e.g. White Paper 1969 authored purely as metrics+flag — I believe there isn't one, but I'll accept a concrete counterexample.
