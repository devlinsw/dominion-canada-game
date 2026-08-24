#!/usr/bin/env node
// One-time migration: apply the sovereign → external/selfDetermination split
// to index.html DECISIONS, src/events.json regeneration input, and all packs.
// Run once: node tools/migrate-sovereign.mjs
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { V1_MAP, PACK_MAP } from './sovereign-mapping.mjs';

const norm = s => (s || '').replace(/[^a-z]/gi, '').toLowerCase();
let changes = 0;

// ── 1. index.html DECISIONS ────────────────────────────────────────────────
{
  const p = 'index.html';
  let s = readFileSync(p, 'utf8');
  for (const m of V1_MAP) {
    const tIdx = s.indexOf(`title: "${m.title}"`);
    if (tIdx === -1) { console.error('MISSING EVENT:', m.title); process.exit(1); }
    // find the choices array for this decision object (next "choices: [" after title)
    const cStart = s.indexOf('choices: [', tIdx);
    // decision ends at the next "\n  },\n" at term depth — approximate by next "\n  {\n" at same indent OR end marker
    let cEnd = s.indexOf('\n  {\n', cStart);
    const histEnd = s.indexOf('\n];\n', cStart);
    if (cEnd === -1 || (histEnd !== -1 && histEnd < cEnd)) cEnd = histEnd;
    const seg = s.slice(cStart, cEnd);

    if (m.remove) {
      // remove sovereign key from every choice in this decision
      const newSeg = seg.replace(/,\s*sovereign:\s*[+-]?\d+/g, '');
      if (newSeg !== seg) { changes++; s = s.slice(0, cStart) + newSeg + s.slice(cEnd); }
      continue;
    }
    const chIdx = seg.indexOf(`label: "${m.choiceLabel}"`);
    if (chIdx === -1) { console.error('MISSING CHOICE:', m.title, '→', m.choiceLabel); process.exit(1); }
    // find effects object within this choice (bounded by next "label:" or segment end)
    const nextLabel = seg.indexOf('label:', chIdx + 1);
    const chunk = seg.slice(chIdx, nextLabel === -1 ? undefined : nextLabel);
    const effRe = /effects:\s*\{([^}]*)\}/;
    const match = chunk.match(effRe);
    if (!match) { console.error('NO EFFECTS:', m.title, m.choiceLabel); process.exit(1); }
    let body = match[1];
    // strip existing sovereign entry
    body = body.replace(/,?\s*sovereign:\s*[+-]?\d+/, '');
    const entries = Object.entries(m.to).map(([k, v]) => `${k}: ${v >= 0 ? '+' : ''}${v}`);
    const newBody = entries.join(', ') + ',' + body.replace(/^\s*/, ' ').replace(/,\s*$/, '');
    const newEffects = `effects: {${newBody}}`;
    const newChunk = chunk.replace(effRe, newEffects);
    const newSeg = seg.slice(0, chIdx) + newChunk + seg.slice(nextLabel === -1 ? seg.length : nextLabel);
    changes++;
    s = s.slice(0, cStart) + newSeg + s.slice(cEnd);
  }
  writeFileSync(p, s);
}

// ── 2. Pack modules ────────────────────────────────────────────────────────
for (const [file, events] of Object.entries(PACK_MAP)) {
  const p = `src/${file}`;
  let s = readFileSync(p, 'utf8');
  for (const [eventId, choices] of Object.entries(events)) {
    const eIdx = s.indexOf(`id: '${eventId}'`);
    if (eIdx === -1) { console.error('MISSING PACK EVENT:', file, eventId); continue; }
    // event object ends at the next "\n  {\n" at same level or EOF-ish boundary
    let eEnd = s.indexOf('\n  {\n', eIdx);
    const tail = s.indexOf('\n];', eIdx);
    if (eEnd === -1 || (tail !== -1 && tail < eEnd)) eEnd = tail;
    let seg = s.slice(eIdx, eEnd);
    for (const [choiceId, to] of Object.entries(choices)) {
      const cIdx = seg.indexOf(`id: '${choiceId}'`);
      if (cIdx === -1) { console.error('MISSING CHOICE:', eventId, choiceId); continue; }
      const nextId = seg.indexOf("id: '", cIdx + 1);
      let chunk = seg.slice(cIdx, nextId === -1 ? undefined : nextId);
      // replace metrics object's sovereign with mapped keys
      const mRe = /metrics:\s*\{([^}]*)\}/;
      const mm = chunk.match(mRe);
      if (!mm && Object.keys(to).length) { console.error('NO METRICS:', eventId, choiceId); continue; }
      if (mm) {
        let body = mm[1].replace(/,?\s*sovereign:\s*-?\d+/, '');
        const add = Object.entries(to).map(([k, v]) => `${k}: ${v}`).join(', ');
        const newBody = add ? (body.trim() ? body.trim().replace(/,$/, '') + ', ' + add + ', ' : add + ', ') : body;
        chunk = chunk.replace(mRe, `metrics: {${newBody}}`);
      } else if (Object.keys(to).length) {
        chunk = chunk.replace(/desc: ([^,]+),/, (mm2) => `${mm2}\n        metrics: {${Object.entries(to).map(([k,v])=>`${k}: ${v}`).join(', ')}`,);
      }
      // fix metricsAffected metadata
      const affectedRe = /metricsAffected:\s*\[([^\]]*)\]/;
      const am = chunk.match(affectedRe);
      if (am) {
        let list = am[1].replace(/'?sovereign'?,?/g, '');
        const needE = Object.values(to).some(o => o && o.externalIndependence !== undefined);
        const needS = Object.values(to).some(o => o && o.selfDetermination !== undefined);
        const adds = [];
        if (needE && !list.includes('externalIndependence')) adds.push("'externalIndependence'");
        if (needS && !list.includes('selfDetermination')) adds.push("'selfDetermination'");
        if (adds.length) {
          const inner = list.trim().replace(/,$/, '');
          list = inner ? `${inner}, ${adds.join(', ')}` : adds.join(', ');
          chunk = chunk.replace(affectedRe, `metricsAffected: [${list}]`);
        }
      }
      seg = seg.slice(0, cIdx) + chunk + seg.slice(nextId === -1 ? seg.length : nextId);
    }
    s = s.slice(0, eIdx) + seg + s.slice(eEnd);
    changes++;
  }
  writeFileSync(p, s);
}
console.log(`Migration applied — ${changes} block(s) updated.`);
