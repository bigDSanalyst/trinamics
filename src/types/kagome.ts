export interface MaterialsParams {
  sheetResistance: number; // Rs in Ohms/sq (54)
  strutWidth: number; // 8
  strutLength: number; // 20.5
  filmThickness: number; // 4.0 um
  nodeArea: number; // 3.46 mm^2
  forceZ: number; // 1.5 N
  matrixEps: number; // 3.2
  btEps: number; // 1700
  btFraction: number; // 0.20
  d33Proxy: number; // 4.8 pC/N
  barrierG2: number; // 1.000e-7 S
  shuntYBase: number; // 1.000e-6 S
  snrDb: number; // 34 dB
  breathingDelta: number; // +0.18
}

export const LITERATURE_POINT: MaterialsParams = {
  sheetResistance: 54, // 54 Ohm/sq
  strutWidth: 8,
  strutLength: 20.5,
  filmThickness: 4.0e-6, // 4.0 um
  nodeArea: 3.46e-6, // 3.46 mm^2
  forceZ: 1.5, // 1.5 N
  matrixEps: 3.2,
  btEps: 1700,
  btFraction: 0.20,
  d33Proxy: 4.8e-12, // 4.8 pC/N
  barrierG2: 1.000e-7, // 1e-7 S
  shuntYBase: 1.000e-6, // 1e-6 S
  snrDb: 34, // 34 dB
  breathingDelta: 0.18, // +0.18
};

export interface PhysicsDerived {
  g1: number; // Conductance from Rs (S)
  g1OverG2: number;
  epsEff: number; // Effective dielectric constant
  g33: number; // Piezoelectric voltage constant (mV*m / N)
  wakeVoltageMv: number; // Open-circuit wake (mV)
  comparatorRatio: number; // Multiple of 50 mV comparator
  diracGap: number; // 3 * |t1 - t2|
  flatBandEnergy: number; // t1 + t2
}

export interface KagomeCell {
  id: number; // 1..169
  ring: number; // 0..7
  x: number;
  y: number;
  isTruth: boolean;
  isGhost1: boolean;
  isGhost2: boolean;
  clsWeight: number; // for CLS visualization
}

export interface KagomeBoundaryNode {
  id: number; // 1..144
  ring: number; // 7 (outer perimeter)
  x: number;
  y: number;
  isDark: boolean; // 75 dark nodes with no interior neighbor
  activeNeighborIds: number[];
  terminalIndex: number;
}

export interface RingDepthSensitivity {
  ring: number;
  radialDistanceNorm: number;
  boundaryGainDb: number;
  detectionStatisticLogSigma: number; // log10(sigma)
  sigmaValue: number;
  snrRequiredFor5Sigma: number;
}

export interface AuditItem {
  id: string;
  category: 'holds' | 'holds_narrower' | 'does_not_hold';
  headline: string;
  claim: string;
  findings: string;
  evidence: string;
  statusText: string;
}
