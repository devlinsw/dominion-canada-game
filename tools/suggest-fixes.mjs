#!/usr/bin/env node
/**
 * suggest-fixes.mjs — turns balance findings into the smallest concrete edit.
 *
 * These are content decisions, so this tool proposes rather than applies. For each
 * problem it computes the minimum change that resolves it, so you're choosing
 * between defensible options instead of guessing at numbers.
 *
 *   node tools/suggest-fixes.mjs
 */
import { loadGame, simulate, clamp, SCORE_METRICS } from './load-game.mjs';

const { DECISIONS, HISTORICAL_PATH, TUNING } = loadGame();
const sum = (c) => SCORE_METRICS.reduce((a, m) => a + ((c.effects || {})[m] ?? 0), 0);
const say = console.log;

say('\n╔══════════════════════════════════════════════════════════════════════╗');
say('║  MINIMAL EDITS TO RESOLVE THE OUTSTANDING BALANCE FINDINGS           ║');
say('╚══════════════════════════════════════════════════════════════════════╝');

// ── A. Strictly dominated choices ────────────────────────────────────────────
say('\n── A · DOMINATED CHOICES ──────────────────────────────────────────────');
say('A choice is dominated when another option is at least as good on all six');
say('scoring metrics and better on one. It is dead content: no informed player');
say('ever picks it. The fix is to give it something the dominant option lacks —');
say('a real trade-off, which is what the decision was supposed to dramatise.\n');

let dominatedCount = 0;
for (const d of DECISIONS) {
  const eff = d.choices.map((c) => c.effects || {});
  eff.forEach((a, i) => {
    const byIdx = eff.findIndex((b, j) => j !== i &&
      SCORE_METRICS.every((m) => (b[m] ?? 0) >= (a[m] ?? 0)) &&
      SCORE_METRICS.some((m) => (b[m] ?? 0) > (a[m] ?? 0)));
    if (byIdx === -1) return;
    dominatedCount++;
    const b = eff[byIdx];

    // Only propose bumps on metrics this decision already engages. Awarding a
    // scene +1 Environment purely to break a tie is arithmetic, not drama.
    const inPlay = new Set(SCORE_METRICS.filter((m) => d.choices.some((c) => m in (c.effects || {}))));
    const options = SCORE_METRICS
      .map((m) => ({ m, need: (b[m] ?? 0) - (a[m] ?? 0) + 1, thematic: inPlay.has(m) }))
      .filter((o) => o.need > 0)
      .sort((x, y) => (y.thematic - x.thematic) || (x.need - y.need));
    const thematic = options.filter((o) => o.thematic);

    say(`  ${d.year} · ${d.title}`);
    say(`    "${d.choices[i].label}"`);
    say(`      is dominated by "${d.choices[byIdx].label}"`);
    if (thematic.length) {
      say(`      smallest edit on a metric this scene already argues about:`);
      for (const o of thematic.slice(0, 3)) {
        const from = a[o.m] ?? 0, to = from + o.need;
        say(`        · ${o.m}: ${from >= 0 ? '+' : ''}${from} → ${to >= 0 ? '+' : ''}${to}   (Δ${o.need})`);
      }
    } else {
      say(`      every metric this scene touches is already worse on this option.`);
      say(`      That means the option has no argument for itself — the writing, not`);
      say(`      the numbers, is what needs revisiting. What does this choice buy?`);
    }
    say('');
  });
}
if (!dominatedCount) say('  none — every choice is on the Pareto frontier.\n');

// ── B. Election gates that never bind ────────────────────────────────────────
say('── B · ELECTION GATES ─────────────────────────────────────────────────');
say('An approval threshold below the minimum reachable approval is decorative:');
say('the screen shows a number that cannot change the outcome.\n');

let reach = new Set([50]);
for (const d of DECISIONS) {
  if (d.election) {
    const need = d.approvalNeeded ?? 30;
    const lo = Math.min(...reach), hi = Math.max(...reach);
    const scripted = d.choices.every((c) => c.result === 'lose');
    const winnable = d.choices.some((c) => c.result === 'win');

    if (lo >= need) {
      // How high must the threshold go to put a meaningful slice of runs at risk?
      const sorted = [...reach].sort((a, b) => a - b);
      const p10 = sorted[Math.floor(sorted.length * 0.10)];
      const p25 = sorted[Math.floor(sorted.length * 0.25)];
      say(`  ${d.year} · ${d.title}`);
      say(`    approvalNeeded: ${need}  ·  approval can only reach [${lo}, ${hi}]  →  the gate never binds`);
      say(`    set approvalNeeded to ${p10} to put the bottom ~10% of runs at risk`);
      say(`    set approvalNeeded to ${p25} to put the bottom ~25% of runs at risk`);
      say('');
    }
    if (scripted) {
      say(`  ${d.year} · ${d.title}`);
      say(`    every choice has result:"lose" — the player's input is discarded.`);
      say(`    Either make it a real contest (give one choice result:"win" or "minority"`);
      say(`    with approvalNeeded ≈ ${Math.round((Math.min(...reach) + Math.max(...reach)) / 2)}), or drop the`);
      say(`    choice screen and present 1984 as narration. Asking for a decision that`);
      say(`    cannot matter is the one thing a choice-driven game should never do.`);
      say('');
    }
    if (!winnable && !scripted) {
      say(`  ${d.year} · ${d.title}: no choice can produce a "win" — the ceiling is a minority.\n`);
    }
  }
  const nxt = new Set();
  for (const v of reach) for (const c of d.choices) nxt.add(clamp(v + ((c.effects || {}).approval ?? 0)));
  reach = nxt;
}

// ── C. Under-used metrics ────────────────────────────────────────────────────
say('── C · METRIC WEIGHT ──────────────────────────────────────────────────');
say('Each of the six scoring metrics is worth exactly 1/6 of the final score,');
say('but they are not equally reachable, so the score silently over-weights');
say('whichever metrics the content happens to touch most.\n');

const stats = SCORE_METRICS.map((m) => {
  let r = new Set([50]);
  for (const d of DECISIONS) {
    const n = new Set();
    for (const v of r) for (const c of d.choices) n.add(clamp(v + ((c.effects || {})[m] ?? 0)));
    r = n;
  }
  return {
    m,
    span: Math.max(...r) - Math.min(...r),
    touched: DECISIONS.filter((d) => d.choices.some((c) => m in (c.effects || {}))).length,
  };
}).sort((a, b) => a.span - b.span);

const widest = stats[stats.length - 1].span;
for (const s of stats) {
  const flag = s.span < widest * 0.75 ? '  ← under-weighted' : '';
  say(`  ${s.m.padEnd(10)} span ${String(s.span).padStart(3)}   in ${String(s.touched).padStart(2)}/${DECISIONS.length} decisions${flag}`);
}
say('');
say('  Two ways to fix, both defensible:');
say('    1. Give the thin metrics more decisions to move (the honest fix — Environment');
say('       has only five levers across sixty years, which is itself a content gap:');
say('       the Berger Inquiry, acid rain, the cod moratorium, Site C all fit).');
say('    2. Weight the final score by each metric\'s reachable span, so a metric that');
say('       can barely move cannot quietly anchor a sixth of every result.');

// ── D. Where the game stops asking ───────────────────────────────────────────
say('\n── D · PACING ─────────────────────────────────────────────────────────');
const leverage = DECISIONS.map((d) => ({
  year: d.year, title: d.title,
  spread: Math.max(...d.choices.map(sum)) - Math.min(...d.choices.map(sum)),
})).sort((a, b) => a.spread - b.spread);
say('Lowest-stakes decisions — these cost the player a screen and give little back:\n');
for (const l of leverage.slice(0, 5)) {
  say(`  spread ${String(l.spread).padStart(2)}   ${l.year}  ${l.title}`);
}
say('\n  A spread of 0–6 means every option lands in nearly the same place. Either raise');
say('  the stakes or fold the beat into the neighbouring decision\'s context text.');

// ── E. Effect of applying everything ─────────────────────────────────────────
say('\n── F · CURRENT HEADLINE NUMBERS ───────────────────────────────────────');
const hist = simulate(DECISIONS, (d, i) => HISTORICAL_PATH[i], TUNING);
say(`  real timeline scores ................ ${hist.score.toFixed(1)}`);
say(`  best achievable ..................... see balance.mjs §3`);
say(`  a player must exceed ${hist.score.toFixed(1)} to have genuinely "beaten history".`);
say('');
