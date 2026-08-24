/**
 * load-game.mjs — the single source of truth loader.
 *
 * The game data lives in exactly one place: the DECISIONS array inside index.html.
 * Every other artifact (game_data.json, DECISION_TREE.md, the balance report) is
 * DERIVED from it. Nothing is hand-maintained twice.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(__dirname, '..');

/** Extract a top-level `const NAME = [...]` / `{...}` literal from a JS/HTML file and evaluate it. */
function extractLiteral(src, name) {
  const decl = `const ${name} = `;
  const start = src.indexOf(decl);
  if (start === -1) throw new Error(`Could not find "${decl}" in index.html`);
  const openIdx = start + decl.length;
  const open = src[openIdx];
  const close = open === '[' ? ']' : '}';

  // Brace-match, skipping strings, template literals and comments.
  let depth = 0, i = openIdx, inStr = null, esc = false;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i === -1) break; continue; }
    if (ch === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (ch === open) depth++;
    else if (ch === close) { depth--; if (depth === 0) { i++; break; } }
  }
  const literal = src.slice(openIdx, i);
  return vm.runInNewContext(`(${literal})`);
}

const DEFAULT_TUNING = { oppositionYears: 0, oppositionScale: 1 };

export function loadGame(htmlPath = path.join(REPO, 'index.html')) {
  const src = fs.readFileSync(htmlPath, 'utf8');
  const DECISIONS = extractLiteral(src, 'DECISIONS');
  const METRICS = extractLiteral(src, 'METRICS');
  let HISTORICAL_PATH = null, TUNING = DEFAULT_TUNING;
  try { HISTORICAL_PATH = extractLiteral(src, 'HISTORICAL_PATH'); } catch { /* pre-patch file */ }
  try { TUNING = { ...DEFAULT_TUNING, ...extractLiteral(src, 'TUNING') }; } catch { /* pre-patch file */ }
  return { src, DECISIONS, METRICS, HISTORICAL_PATH, TUNING };
}

export const SCORE_METRICS = ['unity', 'economy', 'rights', 'enviro', 'externalIndependence', 'selfDetermination', 'social'];
export const SCORE_WEIGHTS = { externalIndependence: 0.5, selfDetermination: 0.5 };
export const ALL_METRICS = [...SCORE_METRICS, 'approval'];
export const clamp = (v) => Math.max(0, Math.min(100, v));

/**
 * These three are byte-for-byte the same rules as the engine in index.html.
 * tools/game.test.mjs asserts the two agree, so a change to one that isn't
 * mirrored in the other fails CI rather than silently skewing the analysis.
 */
export function scaleEffects(effects, scale) {
  if (scale === 1) return { ...effects };
  const out = {};
  for (const [k, v] of Object.entries(effects)) {
    if (v === 0) continue;
    const s = v * scale;
    out[k] = s > 0 ? Math.max(1, Math.round(s)) : Math.min(-1, Math.round(s));
  }
  return out;
}

export function resolveElection(decision, choice, approvalAtBallot) {
  const needed = decision.approvalNeeded ?? 30;
  if (choice.result === 'lose') return 'lose';
  if (approvalAtBallot < needed) return 'lose';
  return choice.result === 'minority' ? 'minority' : 'win';
}

/** Play a full game given a chooser(decision, index) -> choiceIndex. */
// Soft floor: below 20, only half of further losses land; hard floor at 5.
// Keeps "functioning country with economy 0" outcomes out of the space.
export const applyDelta = (m, k, v) => {
  let next = m[k] + v;
  if (v < 0 && next < 20) {
    const overshoot = 20 - Math.max(next, 5);
    if (next < 5) next = 5;
    else next = 20 - overshoot / 2;
  }
  m[k] = clamp(Math.round(next * 10) / 10);
};

export function simulate(DECISIONS, chooser, TUNING = DEFAULT_TUNING) {
  const m = Object.fromEntries(ALL_METRICS.map((k) => [k, 50]));
  const picks = [];
  let opposition = 0;
  DECISIONS.forEach((d, i) => {
    const ci = chooser(d, i);
    picks.push(ci);
    const c = d.choices[ci];
    const eff = scaleEffects(c.effects || {}, opposition > 0 ? TUNING.oppositionScale : 1);
    for (const [k, v] of Object.entries(eff)) if (k in m) applyDelta(m, k, v);
    if (opposition > 0) opposition--;
    if (d.election && resolveElection(d, c, m.approval) === 'lose') opposition = TUNING.oppositionYears;
  });
  const wsum = SCORE_METRICS.reduce((a, k) => a + (SCORE_WEIGHTS[k] ?? 1), 0);
    return { metrics: m, picks, score: SCORE_METRICS.reduce((a, k) => a + Math.max(15, m[k]) * (SCORE_WEIGHTS[k] ?? 1), 0) / wsum };
}
