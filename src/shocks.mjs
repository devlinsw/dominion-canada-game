// V2-10: shock severity model. Reactive shocks (GFC, cod moratorium, tariff
// threat) scale their effects by the world state the player built:
//   tradePosture gates exposure; debtToGdp/fiscal room gates resilience.
// This UN-STUBS the trade pack payoffs: "milder 2008" now exists, honestly.

/**
 * Severity multiplier for a reactive shock given world + financial state.
 * Returns { mult, drivers } — drivers are player-facing reasons.
 */
export function shockSeverity(world = {}, financial = {}) {
  const drivers = [];
  let mult = 1;

  const posture = world.tradePosture || 'continental';
  if (posture === 'diversified') { mult *= 0.75; drivers.push('diversified trade partners cushion the blow'); }
  else if (posture === 'managed-strategic') { mult *= 0.85; drivers.push('managed trade limits exposure'); }
  else if (posture === 'protectionist') { mult *= 1.1; drivers.push('protectionist stance invites retaliation'); }
  else { mult *= 1; drivers.push('continental integration transmits the shock directly'); }

  const debt = financial.debtToGdp ?? 66;
  if (debt > 90) { mult *= 1.2; drivers.push('debt above 90% of GDP leaves no fiscal room'); }
  else if (debt < 55) { mult *= 0.9; drivers.push('low debt gives Ottawa room to respond'); }

  const growth = financial.growthIndex ?? 50;
  if (growth < 35) { mult *= 1.15; drivers.push('the economy entered this shock already weak'); }
  else if (growth > 65) { mult *= 0.9; drivers.push('momentum entering the shock absorbs some damage'); }

  return { mult: Math.round(mult * 100) / 100, drivers };
}

/** Scale a shock choice's metrics/financial effects by severity. Penalties scale
 *  harder than gains (a crisis is a crisis), and drivers explain why. */
export function applyShockSeverity(choice, severity) {
  const m = severity.mult;
  const out = {};
  for (const [k, v] of Object.entries(choice.metrics || {})) {
    out[k] = v < 0 ? Math.round(v * m) : v;
  }
  const fin = {};
  for (const [k, v] of Object.entries(choice.financial || {})) {
    fin[k] = v < 0 ? Math.round(v * m * 10) / 10 : v;
  }
  return {
    metrics: out,
    financial: Object.keys(fin).length ? fin : undefined,
    driverNote: severity.drivers.join('; '),
  };
}

/**
 * Which shocks exist and their eligibility windows — the CI-checkable registry.
 * Historical route must produce a plausible version of each.
 */
export const SHOCK_REGISTRY = [
  { id: 'COD_MORATORIUM_1992', window: [1992, 1993], kind: 'resource' },
  { id: 'GFC_2008', window: [2008, 2009], kind: 'financial' },
  { id: 'TARIFF_SHOCK_2025', window: [2024, 2026], kind: 'trade' },
];
