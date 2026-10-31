import { MaterialsParams, PhysicsDerived } from '../types/kagome';

export const EPSILON_0 = 8.8541878128e-12; // vacuum permittivity (F/m)

/**
 * Piezo wake-up of paper Section 3.1, with the paper's formulas and no fitted factors:
 *   beta = (eps_BT - eps_m) / (eps_BT + 2 eps_m)
 *   eps_eff = eps_m (1 + 2 phi beta) / (1 - phi beta)          (Maxwell-Garnett)
 *   g33 = d33,eff / (eps_0 eps_eff)
 *   V_wake = g33 (F_z / A_node) h_node
 * At the paper values this gives beta = 0.9944, eps_eff = 5.5831, g33 = 40.46 mV m/N
 * and V_wake = 70.16 mV, as printed by the verification listing.
 */
export function computePhysics(p: MaterialsParams): PhysicsDerived {
  const beta = (p.epsBT - p.epsM) / (p.epsBT + 2 * p.epsM);
  const epsEff = (p.epsM * (1 + 2 * p.phiP * beta)) / (1 - p.phiP * beta);
  const g33V = p.d33Eff / (EPSILON_0 * epsEff); // V*m/N
  const stressPa = p.forceZ / p.nodeArea;
  const wakeVoltageMv = g33V * stressPa * p.nodeThickness * 1000;
  return {
    beta,
    epsEff,
    g33: g33V * 1000,
    stressPa,
    wakeVoltageMv,
    thresholdRatio: wakeVoltageMv / p.thresholdMv,
  };
}

/**
 * Format scientific notation with clean superscript
 */
export function formatSci(val: number, decimals: number = 3): string {
  if (val === 0) return '0';
  const exponent = Math.floor(Math.log10(Math.abs(val)));
  const mantissa = val / Math.pow(10, exponent);
  return `${mantissa.toFixed(decimals)}×10${toSuperscript(exponent)}`;
}

export function toSuperscript(num: number): string {
  const superDigits: Record<string, string> = {
    '-': '⁻',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  return num
    .toString()
    .split('')
    .map((c) => superDigits[c] || c)
    .join('');
}
