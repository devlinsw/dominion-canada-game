#!/usr/bin/env node
/**
 * build-docs.mjs — regenerate every derived artifact from index.html.
 *
 *   node tools/build-docs.mjs          # write game_data.json + DECISION_TREE.md
 *   node tools/build-docs.mjs --check  # fail if they're stale (CI)
 *
 * Before this existed the game data lived in three hand-maintained places:
 * the DECISIONS array, game_data.json, and the tables + Mermaid graph in
 * DECISION_TREE.md. Three copies of the same numbers is three chances to
 * disagree, and the export had already dropped the `term` field.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadGame, simulate, clamp, SCORE_METRICS, ALL_METRICS, REPO } from './load-game.mjs';

const CHECK = process.argv.includes('--check');
const { DECISIONS, METRICS, HISTORICAL_PATH, TUNING } = loadGame();

const ORDER = ALL_METRICS;
const cell = (v) => (v === 0 || v === undefined ? '—' : `${v > 0 ? '+' : ''}${v}`);
const sanitizeMermaid = (s) => String(s).replace(/["\[\]{}()|]/g, '').replace(/—/g, '-').trim();

// ── game_data.json ───────────────────────────────────────────────────────────
const json = JSON.stringify(DECISIONS.map((d, i) => ({
  index: i,
  year: d.year,
  term: d.term ?? null,
  title: d.title,
  is_election: !!d.election,
  approval_needed: d.approvalNeeded ?? null,
  historical_choice_index: HISTORICAL_PATH ? HISTORICAL_PATH[i] : null,
  context: d.context,
  choices: d.choices.map((c, ci) => ({
    index: ci,
    label: c.label,
    desc: c.desc,
    effects: c.effects ?? {},
    net_score_effect: SCORE_METRICS.reduce((a, m) => a + ((c.effects ?? {})[m] ?? 0), 0),
    consequence: c.consequence,
    result: c.result ?? null,
    is_historical: HISTORICAL_PATH ? HISTORICAL_PATH[i] === ci : null,
  })),
})), null, 2) + '\n';

// ── DECISION_TREE.md ─────────────────────────────────────────────────────────
const hist = HISTORICAL_PATH ? simulate(DECISIONS, (d, i) => HISTORICAL_PATH[i], TUNING) : null;

// Reachable approval at each election, for the gate table.
const gateInfo = [];
{
  let reach = new Set([50]);
  for (const d of DECISIONS) {
    if (d.election) {
      gateInfo.push({
        year: d.year, title: d.title, need: d.approvalNeeded ?? 30,
        lo: Math.min(...reach), hi: Math.max(...reach),
        binds: [...reach].some((v) => v < (d.approvalNeeded ?? 30)),
        scripted: d.choices.every((c) => c.result === 'lose'),
      });
    }
    const n = new Set();
    for (const v of reach) for (const c of d.choices) n.add(clamp(v + ((c.effects ?? {}).approval ?? 0)));
    reach = n;
  }
}

const L = [];
const w = (s = '') => L.push(s);

w('# 🍁 Dominion — Decision Tree & Game Flow');
w('');
w('> **Generated file — do not edit by hand.** Run `node tools/build-docs.mjs` after');
w('> changing `index.html`. Every number below is read out of the live `DECISIONS`');
w('> array, so this document cannot drift from the game.');
w('');
w('---');
w('');
w('## Game Flow');
w('');
w(`The game is linear: ${DECISIONS.length} decision points in chronological order ` +
  `(${DECISIONS[0].year} → ${DECISIONS[DECISIONS.length - 1].year}), of which ` +
  `${DECISIONS.filter((d) => d.election).length} are elections. Each decision offers 2–3 choices; ` +
  'the choice order is shuffled per run, so screen position carries no information.');
w('');
w('```');
w('START');
for (const d of DECISIONS) {
  const tag = d.election ? '🗳️ ' : '📜 ';
  w(`  │`);
  w(`  ├─ [${d.year}] ${tag}${d.title}${' '.repeat(Math.max(0, 40 - d.title.length))}► ${d.choices.length} choices`);
}
w('  │');
w('  ▼');
w('END — "Your Canada, 2030"');
w('```');
w('');
w('---');
w('');
w('## Metrics');
w('');
w('All metrics start at **50** and are clamped to **0–100**. The first six determine the');
w('final score; **Approval** gates elections but is excluded from scoring.');
w('');
w('| Metric | Reachable range | Decisions that move it | Controllable swing |');
w('|---|---|---|---|');
for (const m of METRICS) {
  let reach = new Set([50]);
  for (const d of DECISIONS) {
    const n = new Set();
    for (const v of reach) for (const c of d.choices) n.add(clamp(v + ((c.effects ?? {})[m.id] ?? 0)));
    reach = n;
  }
  const touched = DECISIONS.filter((d) => d.choices.some((c) => m.id in (c.effects ?? {}))).length;
  const swing = DECISIONS.reduce((a, d) => {
    const vals = d.choices.map((c) => (c.effects ?? {})[m.id] ?? 0);
    return a + (Math.max(...vals) - Math.min(...vals));
  }, 0);
  w(`| **${m.label}** | ${Math.min(...reach)}–${Math.max(...reach)} | ${touched}/${DECISIONS.length} | ${swing} |`);
}
w('');
w('---');
w('');
w('## Elections');
w('');
w('| Year | Title | Approval needed | Approval reachable at that point | Gate binds? |');
w('|---|---|---|---|---|');
for (const g of gateInfo) {
  w(`| ${g.year} | ${g.title} | ${g.need}% | ${g.lo}–${g.hi} | ${g.binds ? 'yes' : '**no — decorative**'}${g.scripted ? ' · *outcome scripted*' : ''} |`);
}
w('');
w('**Resolution** (single implementation, shared by the UI and the analyzer):');
w('');
w('```js');
w('function resolveElection(decision, choice, approvalAtBallot) {');
w('  const needed = decision.approvalNeeded ?? 30;');
w('  if (choice.result === \'lose\') return \'lose\';');
w('  if (approvalAtBallot < needed) return \'lose\';');
w('  return choice.result === \'minority\' ? \'minority\' : \'win\';');
w('}');
w('```');
w('');
w(`**Defeat has teeth.** Losing puts you in opposition for the next ${TUNING.oppositionYears} ` +
  `decisions: you are still asked, but your choice lands at ${Math.round((TUNING.oppositionScale ?? 1) * 100)}% strength.`);
w('');
w('---');
w('');
w('## Scoring');
w('');
w('```');
w('finalScore = weighted mean of unity, economy, rights, enviro, externalIndependence (0.5), selfDetermination (0.5), social');
w('```');
w('');
if (hist) {
  w(`The real timeline — the choices Canada actually made — scores **${hist.score.toFixed(1)}** under these`);
  w('same rules. That, not 50, is the bar for "you beat history".');
  w('');
  w('| Metric | Real history, 2030 |');
  w('|---|---|');
  for (const m of METRICS) w(`| ${m.label} | ${Math.round(hist.metrics[m.id])} |`);
  w('');
}
w('---');
w('');
w('## Decision-by-decision');
w('');
for (const [i, d] of DECISIONS.entries()) {
  w(`### ${d.election ? '🗳️' : '📜'} ${d.year} — ${d.title}`);
  w('');
  w(`> ${d.context.replace(/<\/?em>/g, '*').replace(/\s+/g, ' ').trim()}`);
  w('');
  if (d.election) w(`**Approval needed:** ${d.approvalNeeded ?? 30}%`);
  else w(`**Term ${d.term ?? '—'}**`);
  w('');
  w(`| # | Choice | ${ORDER.map((m) => METRICS.find((x) => x.id === m).label).join(' | ')} | Net | ${d.election ? 'Result | ' : ''}Historical |`);
  w(`|---|---|${ORDER.map(() => '---').join('|')}|---|${d.election ? '---|' : ''}---|`);
  d.choices.forEach((c, ci) => {
    const e = c.effects ?? {};
    const net = SCORE_METRICS.reduce((a, m) => a + (e[m] ?? 0), 0);
    const isHist = HISTORICAL_PATH && HISTORICAL_PATH[i] === ci;
    w(`| ${ci + 1} | ${c.label} | ${ORDER.map((m) => cell(e[m])).join(' | ')} | ${cell(net)} | ` +
      `${d.election ? `${c.result ?? '—'} | ` : ''}${isHist ? '**✓ actual**' : ''} |`);
  });
  w('');
}
w('---');
w('');
w('## Full decision map');
w('');
w('```mermaid');
w('graph TD');
w('    Start((START))');
DECISIONS.forEach((d, i) => {
  const id = `D${i}`;
  const next = i + 1 < DECISIONS.length ? `D${i + 1}` : 'End';
  const icon = d.election ? '🗳️' : '📜';
  w(`    ${i === 0 ? 'Start --> ' : ''}${id}["${icon} ${d.year}: ${sanitizeMermaid(d.title)}"]`);
  d.choices.forEach((c, ci) => {
    const e = c.effects ?? {};
    const label = ORDER.filter((m) => e[m]).map((m) => `${m}${cell(e[m])}`).join(', ') || 'no change';
    w(`    ${id} -->|"${sanitizeMermaid(c.label)}"| ${id}c${ci}["${label}"]`);
    w(`    ${id}c${ci} --> ${next}`);
  });
});
w('    End((END: Your Canada, 2030))');
w('    style Start fill:#2a9d8f,color:#fff');
w('    style End fill:#d62828,color:#fff');
DECISIONS.forEach((d, i) => { if (d.election) w(`    style D${i} fill:#e9c46a,color:#000`); });
w('```');
w('');
w('---');
w('');
w(`*Generated ${new Date().toISOString().slice(0, 10)} from \`index.html\` by \`tools/build-docs.mjs\`.*`);

const md = L.join('\n') + '\n';

// ── write or check ───────────────────────────────────────────────────────────
const targets = [
  [path.join(REPO, 'game_data.json'), json],
  [path.join(REPO, 'DECISION_TREE.md'), md],
];

let stale = 0;
for (const [file, content] of targets) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  const same = current === content;
  if (CHECK) {
    if (!same) { console.log(`  ✗ ${path.basename(file)} is stale — run: node tools/build-docs.mjs`); stale++; }
    else console.log(`  ✓ ${path.basename(file)} is up to date`);
  } else {
    fs.writeFileSync(file, content);
    console.log(`  ${same ? '·' : '✎'} wrote ${path.basename(file)} (${content.length.toLocaleString()} bytes)`);
  }
}
if (CHECK && stale) process.exit(1);
