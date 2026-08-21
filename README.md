# 🍁 Dominion

**Replay Canada, 1968–2030.**

You are elected Prime Minister in April 1968. You face 23 real decisions — the
Official Languages Act, the October Crisis, the NEP, patriation, free trade, two
Quebec referendums, Kyoto, the oil sands, CERB, the Trump tariffs — and four
elections. Then you find out what your Canada looks like in 2030.

Everyone thinks they would have done better. The game measures whether you did:
the real timeline is played through the same rules and scored, so "you beat
history" means something specific.

Open `index.html`. No build step, no dependencies, one file.

---

## Repository layout

| File | Role |
|---|---|
| `index.html` | **The game, and the single source of truth for its data.** |
| `AUDIT.md` | Design and engineering analysis — findings, evidence, recommendations. |
| `DECISION_TREE.md` | *Generated.* Full decision map, metric tables, Mermaid graph. |
| `game_data.json` | *Generated.* Machine-readable export of the decision tree. |
| `tools/` | Analysis and test harness. |

`DECISION_TREE.md` and `game_data.json` are **generated** — don't edit them by
hand. Change `index.html`, then run `npm run docs`.

---

## Development

```bash
npm install       # jsdom, for the DOM tests
npm test          # 42 integration tests, driving the real page
npm run balance   # exhaustive balance report
npm run check     # everything, exits nonzero on regression — use this in CI
npm run docs      # regenerate the derived files
npm run suggest   # minimal edits for outstanding balance findings
npm run serve     # http://localhost:8080
```

### The tooling

The decision tree is small enough to analyze exhaustively. Because metrics
evolve independently, a per-metric DP over 0–100 covers **all ~1.9 × 10¹⁰
playthroughs exactly** — no sampling. `tools/balance.mjs` uses this to report:

- reachable range and controllable swing for every metric
- whether each election's approval gate can ever actually bind
- the best and worst achievable score (beam search)
- what the real historical timeline scores under the same rules
- the full distribution of random play
- every strictly dominated choice
- per-decision leverage

`npm run check` turns these into assertions against a recorded baseline (`tools/balance-baseline.json`), so it fails on **new** problems while the three open content findings stay tracked rather than re-litigated. Clear one after fixing it with `node tools/balance.mjs --check --accept`. It, so a content edit that quietly
creates a dead choice or a decorative election fails CI instead of shipping.

`tools/load-game.mjs` holds the rules once; `tools/game.test.mjs` asserts the
analyzer and the page compute identical outcomes, so the two can't drift.

### Tuning

Behavioural switches live in one `TUNING` object at the top of the game script —
choice shuffling, opposition length and severity, the end-screen statistic,
autosave. Each is one flag to revert.

`HISTORICAL_PATH` records which choice matches what actually happened, for each
decision. It's what makes the "you beat history" claim falsifiable.

---

## Credits

Inspired by [Septennat(s)](https://septennats.fr). Built for Canada 🍁
