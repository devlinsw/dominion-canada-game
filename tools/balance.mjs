#!/usr/bin/env node
/**
 * balance.mjs — decision-tree balance analyzer + regression suite.
 *
 *   node tools/balance.mjs           # full report
 *   node tools/balance.mjs --check   # report + assertions, exit 1 on failure (CI)
 *   node tools/balance.mjs --json    # machine-readable
 *
 * Every number below is computed from index.html. Nothing is hardcoded.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadGame, simulate, clamp, SCORE_METRICS, ALL_METRICS, REPO } from './load-game.mjs';

const args = new Set(process.argv.slice(2));
const CHECK = args.has('--check');
const JSON_OUT = args.has('--json');
const { DECISIONS, HISTORICAL_PATH, TUNING } = loadGame();

const out = [];
const say = (s = '') => { if (!JSON_OUT) console.log(s); out.push(s); };
const rule = (t) => { say(''); say('─'.repeat(72)); say(t); say('─'.repeat(72)); };

const report = {};
const failures = [];
const assert = (ok, msg) => { if (!ok) failures.push(msg); return ok; };

// ── 1. Exact reachable range per metric ──────────────────────────────────────
// Metrics evolve independently (each choice's effect on metric M depends only on
// M's own value), so a per-metric DP over 0..100 is EXACT across all ~1.9e10 paths.
rule('1 · REACHABLE RANGE PER METRIC  (exact DP over every possible playthrough)');
report.ranges = {};
for (const m of ALL_METRICS) {
  let reach = new Set([50]);
  for (const d of DECISIONS) {
    const nxt = new Set();
    for (const v of reach) for (const c of d.choices) nxt.add(clamp(v + ((c.effects || {})[m] ?? 0)));
    reach = nxt;
  }
  const lo = Math.min(...reach), hi = Math.max(...reach);
  report.ranges[m] = { min: lo, max: hi, distinct: reach.size };
  const touched = DECISIONS.filter((d) => d.choices.some((c) => m in (c.effects || {}))).length;
  const swing = DECISIONS.reduce((a, d) => {
    const vals = d.choices.map((c) => (c.effects || {})[m] ?? 0);
    return a + (Math.max(...vals) - Math.min(...vals));
  }, 0);
  say(`  ${m.padEnd(10)} range [${String(lo).padStart(3)}, ${String(hi).padStart(3)}]   ` +
      `touched by ${String(touched).padStart(2)}/${DECISIONS.length} decisions   controllable swing ${swing}`);
}

// ── 2. Election gates ────────────────────────────────────────────────────────
rule('2 · ELECTION GATES  (is the approval threshold ever actually binding?)');
report.elections = [];
{
  let reach = new Set([50]);
  for (const d of DECISIONS) {
    if (d.election) {
      const need = d.approvalNeeded ?? 30;
      const lo = Math.min(...reach), hi = Math.max(...reach);
      const canFail = [...reach].some((v) => v < need);
      const scripted = d.choices.every((c) => c.result === 'lose');
      const noWinPath = !d.choices.some((c) => c.result === 'win');
      report.elections.push({ year: d.year, need, lo, hi, canFail, scripted, noWinPath });
      say(`  ${d.year}  need ≥${String(need).padStart(2)}%   approval reachable [${lo}, ${hi}]   ` +
          (canFail ? 'gate can bind' : '⚠ GATE CAN NEVER BIND — the election is decorative') +
          (scripted ? '   ⚠ outcome fully scripted' : ''));
    }
    const nxt = new Set();
    for (const v of reach) for (const c of d.choices) nxt.add(clamp(v + ((c.effects || {}).approval ?? 0)));
    reach = nxt;
  }
}

// ── 3. Best / worst achievable score (beam search) ───────────────────────────
rule('3 · SCORE ENVELOPE  (beam search, width 200k — effectively exact here)');
function beam(maximize, width = 200_000) {
  let states = new Map([[SCORE_METRICS.map(() => 50).join(','), { v: SCORE_METRICS.map(() => 50), p: [] }]]);
  for (const d of DECISIONS) {
    const nxt = new Map();
    for (const { v, p } of states.values()) {
      d.choices.forEach((c, ci) => {
        const e = c.effects || {};
        const nv = SCORE_METRICS.map((m, k) => clamp(v[k] + (e[m] ?? 0)));
        const key = nv.join(',');
        if (!nxt.has(key)) nxt.set(key, { v: nv, p: [...p, ci] });
      });
    }
    states = new Map([...nxt.entries()]
      .sort((a, b) => {
        const sa = a[1].v.reduce((x, y) => x + y, 0), sb = b[1].v.reduce((x, y) => x + y, 0);
        return maximize ? sb - sa : sa - sb;
      }).slice(0, width));
  }
  const best = [...states.values()].reduce((a, b) => {
    const sa = a.v.reduce((x, y) => x + y, 0), sb = b.v.reduce((x, y) => x + y, 0);
    return (maximize ? sb > sa : sb < sa) ? b : a;
  });
  return { score: best.v.reduce((x, y) => x + y, 0) / 6, metrics: Object.fromEntries(SCORE_METRICS.map((m, i) => [m, best.v[i]])) };
}
report.maxScore = beam(true);
report.minScore = beam(false);
say(`  best possible  ${report.maxScore.score.toFixed(2)}   ${JSON.stringify(report.maxScore.metrics)}`);
say(`  worst possible ${report.minScore.score.toFixed(2)}   ${JSON.stringify(report.minScore.metrics)}`);

// ── 4. Historical baseline ───────────────────────────────────────────────────
rule('4 · HISTORICAL BASELINE  (what does the real timeline score, in the game\'s own units?)');
if (HISTORICAL_PATH) {
  const hist = simulate(DECISIONS, (d, i) => HISTORICAL_PATH[i], TUNING);
  report.historical = { score: hist.score, metrics: hist.metrics };
  say(`  real timeline scores ${hist.score.toFixed(2)}  ${JSON.stringify(
    Object.fromEntries(SCORE_METRICS.map((m) => [m, hist.metrics[m]])))}`);
  say(`  → "you beat real history" must therefore mean score > ${hist.score.toFixed(1)}, not > 50.`);
} else {
  say('  ⚠ no HISTORICAL_PATH defined in index.html — the game cannot honestly claim');
  say('    a player "beat real history" because it never computes what real history scored.');
  report.historical = null;
}

// ── 5. Random-play distribution ──────────────────────────────────────────────
rule('5 · RANDOM-PLAY DISTRIBUTION  (300k playthroughs, deterministic seed)');
let seed = 0x2a9d8f;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
{
  const N = 300_000, scores = new Float64Array(N);
  for (let i = 0; i < N; i++) scores[i] = simulate(DECISIONS, (d) => Math.floor(rnd() * d.choices.length), TUNING).score;
  const sorted = Float64Array.from(scores).sort();
  const q = (p) => sorted[Math.floor(p * (N - 1))];
  const mean = scores.reduce((a, b) => a + b, 0) / N;
  const pctAbove = (t) => scores.reduce((a, s) => a + (s > t ? 1 : 0), 0) / N * 100;
  report.random = {
    mean, p5: q(0.05), p50: q(0.5), p95: q(0.95),
    aboveFifty: pctAbove(50),
    aboveHistorical: report.historical ? pctAbove(report.historical.score) : null,
  };
  say(`  mean ${mean.toFixed(1)}   p5 ${q(0.05).toFixed(1)}   median ${q(0.5).toFixed(1)}   p95 ${q(0.95).toFixed(1)}`);
  say(`  share of RANDOM players scoring > 50 ............ ${report.random.aboveFifty.toFixed(1)}%`);
  if (report.historical)
    say(`  share of RANDOM players beating real history .... ${report.random.aboveHistorical.toFixed(1)}%`);
}

// ── 6. Position bias ─────────────────────────────────────────────────────────
rule('6 · POSITION BIAS  (can you win by never reading the screen?)');
const fixed = (pick) => simulate(DECISIONS, (d) => Math.min(pick(d.choices.length), d.choices.length - 1), TUNING).score;
report.positional = {
  alwaysFirst: fixed(() => 0),
  alwaysMiddle: fixed((n) => Math.floor(n / 2)),
  alwaysLast: fixed((n) => n - 1),
  firstIsOptimal: DECISIONS.filter((d) => {
    const sums = d.choices.map((c) => SCORE_METRICS.reduce((a, m) => a + ((c.effects || {})[m] ?? 0), 0));
    return sums.indexOf(Math.max(...sums)) === 0;
  }).length,
};
say(`  always click choice #1 → ${report.positional.alwaysFirst.toFixed(1)}`);
say(`  always click the middle → ${report.positional.alwaysMiddle.toFixed(1)}`);
say(`  always click the last   → ${report.positional.alwaysLast.toFixed(1)}`);
say(`  choice #1 is the highest-scoring option in ${report.positional.firstIsOptimal}/${DECISIONS.length} decisions`);
say(TUNING.shuffleChoices
  ? '  (choices are shuffled per run, so the player cannot exploit this — but the content gradient is still real)'
  : '  ⚠ choices are NOT shuffled: the above is a live exploit');

// ── 7. Strictly dominated choices ────────────────────────────────────────────
rule('7 · STRICTLY DOMINATED CHOICES  (never rational to pick → dead options)');
report.dominated = [];
for (const d of DECISIONS) {
  const eff = d.choices.map((c) => c.effects || {});
  eff.forEach((a, i) => {
    const by = eff.findIndex((b, j) => j !== i &&
      SCORE_METRICS.every((m) => (b[m] ?? 0) >= (a[m] ?? 0)) &&
      SCORE_METRICS.some((m) => (b[m] ?? 0) > (a[m] ?? 0)));
    if (by !== -1) {
      report.dominated.push({ year: d.year, choice: d.choices[i].label, by: d.choices[by].label });
      say(`  ${d.year}  "${d.choices[i].label.slice(0, 42)}"`);
      say(`         └─ dominated by "${d.choices[by].label.slice(0, 42)}"`);
    }
  });
}
say(`  ${report.dominated.length} of ${DECISIONS.reduce((a, d) => a + d.choices.length, 0)} choices are strictly dominated.`);

// ── 8. Decision leverage ─────────────────────────────────────────────────────
rule('8 · DECISION LEVERAGE  (best-minus-worst choice, per decision)');
report.leverage = DECISIONS.map((d) => ({
  year: d.year, title: d.title,
  spread: (() => {
    const s = d.choices.map((c) => SCORE_METRICS.reduce((a, m) => a + ((c.effects || {})[m] ?? 0), 0));
    return Math.max(...s) - Math.min(...s);
  })(),
})).sort((a, b) => b.spread - a.spread);
for (const l of report.leverage) say(`  ${String(l.spread).padStart(3)}   ${l.year}  ${l.title}`);

// ── Assertions ───────────────────────────────────────────────────────────────
if (CHECK) {
  rule('REGRESSION CHECKS');
  assert(!report.elections.some((e) => !e.canFail),
    `election(s) whose approval gate can never bind: ${report.elections.filter((e) => !e.canFail).map((e) => e.year)}`);
  assert(!report.elections.some((e) => e.scripted),
    `election(s) with a fully scripted outcome: ${report.elections.filter((e) => e.scripted).map((e) => e.year)}`);
  assert(report.dominated.length === 0,
    `${report.dominated.length} strictly dominated choice(s) — see section 7`);
  assert(TUNING.shuffleChoices || report.positional.alwaysFirst < 65,
    `"always click choice #1" scores ${report.positional.alwaysFirst.toFixed(1)} and choices are not shuffled — position is a winning strategy`);
  assert(report.historical !== null, 'no HISTORICAL_PATH defined; the "beat real history" claim is unfalsifiable');
  if (report.historical)
    assert(Math.abs(report.random.aboveHistorical - 6) < 12,
      `${report.random.aboveHistorical.toFixed(1)}% of random players beat history; the UI's headline stat should match`);
  for (const m of SCORE_METRICS)
    assert(report.ranges[m].max - report.ranges[m].min >= 50,
      `metric "${m}" only spans ${report.ranges[m].min}–${report.ranges[m].max}; it is 1/6 of the score but barely movable`);

  // Known, accepted findings live in balance-baseline.json. CI fails on NEW
  // problems; the open content decisions are tracked, not re-litigated on every
  // push. Regenerate after fixing something: node tools/balance.mjs --accept
  const BASELINE = path.join(REPO, 'tools', 'balance-baseline.json');
  if (process.argv.includes('--accept')) {
    fs.writeFileSync(BASELINE, JSON.stringify({ accepted: failures }, null, 2) + '\n');
    say(`  ✎ baseline updated with ${failures.length} accepted finding(s)`);
    process.exit(0);
  }
  const accepted = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')).accepted : [];
  const regressions = failures.filter((f) => !accepted.includes(f));
  const resolved = accepted.filter((a) => !failures.includes(a));

  for (const a of accepted.filter((x) => failures.includes(x))) say(`  ○ known: ${a}`);
  for (const r of resolved) say(`  ✓ resolved since baseline: ${r}  (run --accept to clear)`);

  if (regressions.length) {
    say('');
    regressions.forEach((f) => say(`  ✗ NEW: ${f}`));
    say(`\n  ${regressions.length} new problem(s) introduced.`);
    if (JSON_OUT) console.log(JSON.stringify({ report, failures, regressions }, null, 2));
    process.exit(1);
  }
  say(`  ✓ no new problems (${accepted.length} known finding(s) tracked in tools/balance-baseline.json)`);
}

if (JSON_OUT) console.log(JSON.stringify({ report, failures }, null, 2));
