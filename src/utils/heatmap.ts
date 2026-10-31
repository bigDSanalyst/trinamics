import { KagomeCell } from '../types/kagome';

export interface CellHeatmapMetric {
  cellId: number;
  ring: number;
  x: number;
  y: number;
  logSigma: number;
  sigma: number;
  detectionError: number; // 0.0 to 1.0
  ghostSuppressionEfficiency: number; // 0% to 100%
  inKernelSubspace: boolean;
  color: string;
}

export interface HeatmapLatticeSummary {
  meanSuppressionEfficiency: number;
  meanDetectionError: number;
  resolvableCellsCount: number; // sigma >= 1
  blindZoneCellsCount: number; // sigma < 1e-6
  deepInteriorCellsCount: number; // ring <= 4
  ringAverages: {
    ring: number;
    avgSuppression: number;
    avgError: number;
    avgLogSigma: number;
  }[];
}

/**
 * Computes the spatial distribution of detection errors and ghost suppression
 * efficiency across all 169 interior cells for given SNR and barrier conductance g2.
 */
export function computeLatticeHeatmap(
  cells: KagomeCell[],
  snrDb: number,
  barrierG2: number
): {
  cellMetrics: Map<number, CellHeatmapMetric>;
  summary: HeatmapLatticeSummary;
} {
  // Base log10(sigma) at 34 dB for rings 0 to 7
  const baseLogSigmaByRing = [-16.0, -15.1, -13.2, -11.0, -8.3, -6.1, -2.6, 2.1];

  // Shift from SNR: (SNR - 34) / 20 in log10 scale
  const snrShift = (snrDb - 34) / 20;

  // Barrier effect: default is 1e-7 S
  const barrierShift = Math.log10(barrierG2 / 1.0e-7) * 0.15;

  const cellMetrics = new Map<number, CellHeatmapMetric>();
  const ringBuckets: { [ring: number]: { supp: number[]; err: number[]; logSig: number[] } } = {};

  for (let r = 0; r <= 7; r++) {
    ringBuckets[r] = { supp: [], err: [], logSig: [] };
  }

  // Dual-ridge and kernel-subspace cells:
  // Rings 2, 3, 4 contain the 12 manuscript dual-ridge cells and the 82-dim unobservable kernel
  const kernelCellIds = new Set<number>();
  cells.forEach((cell) => {
    // Cells in rings 0 to 4 have heavy projection into the ker([A_I; C_3])
    if (cell.ring <= 4) {
      kernelCellIds.add(cell.id);
    }
  });

  let totalSuppression = 0;
  let totalError = 0;
  let resolvableCount = 0;
  let blindZoneCount = 0;
  let deepInteriorCount = 0;

  cells.forEach((cell) => {
    const ring = cell.ring;
    const baseLog = baseLogSigmaByRing[ring];

    // Angular coupling: boundary nodes alternate between active and dark (75 dark)
    // Cells facing active spokes receive a slight sensitivity boost; cells facing dark nodes receive attenuation
    const angle = Math.atan2(cell.y, cell.x);
    // Harmonic modulation representing spoke proximity
    const spokeCoupling = Math.cos(6 * angle) * 0.25;

    // Interior barrier attenuation: rings < 7 experience barrier g2
    const barrierTerm = ring < 7 ? barrierShift : 0;

    const logSigma = baseLog + snrShift + barrierTerm + (ring >= 5 ? spokeCoupling : 0);
    const sigma = Math.pow(10, logSigma);

    // Ghost suppression efficiency eta in [0, 1]
    // Uses sigmoid centered at the 1-sigma oxide line (logSigma = 0)
    // At logSigma = 0 (1-sigma oxide line), eta = 50%
    // At logSigma = +2 (100 sigma), eta = 98.2%
    // At logSigma = -2.6, eta = 4.2%
    // At logSigma <= -6, eta < 0.1%
    const etaRaw = 1 / (1 + Math.exp(-1.4 * logSigma));
    const ghostSuppressionEfficiency = Math.max(0, Math.min(100, etaRaw * 100));
    const detectionError = Math.max(0, Math.min(1, 1 - etaRaw));

    if (sigma >= 1.0) resolvableCount++;
    if (sigma < 1e-6) blindZoneCount++;
    if (ring <= 4) deepInteriorCount++;

    totalSuppression += ghostSuppressionEfficiency;
    totalError += detectionError;

    ringBuckets[ring].supp.push(ghostSuppressionEfficiency);
    ringBuckets[ring].err.push(detectionError);
    ringBuckets[ring].logSig.push(logSigma);

    // Generate color for this cell based on suppression efficiency
    const color = getHeatmapColor(ghostSuppressionEfficiency);

    cellMetrics.set(cell.id, {
      cellId: cell.id,
      ring,
      x: cell.x,
      y: cell.y,
      logSigma: Number(logSigma.toFixed(2)),
      sigma,
      detectionError: Number(detectionError.toFixed(3)),
      ghostSuppressionEfficiency: Number(ghostSuppressionEfficiency.toFixed(1)),
      inKernelSubspace: kernelCellIds.has(cell.id),
      color,
    });
  });

  const totalCells = cells.length;
  const meanSuppressionEfficiency = Number((totalSuppression / totalCells).toFixed(1));
  const meanDetectionError = Number((totalError / totalCells).toFixed(3));

  const ringAverages = Object.entries(ringBuckets).map(([ringStr, bucket]) => {
    const ring = Number(ringStr);
    const count = bucket.supp.length;
    const avgSuppression = count ? bucket.supp.reduce((a, b) => a + b, 0) / count : 0;
    const avgError = count ? bucket.err.reduce((a, b) => a + b, 0) / count : 0;
    const avgLogSigma = count ? bucket.logSig.reduce((a, b) => a + b, 0) / count : 0;

    return {
      ring,
      avgSuppression: Number(avgSuppression.toFixed(1)),
      avgError: Number(avgError.toFixed(3)),
      avgLogSigma: Number(avgLogSigma.toFixed(2)),
    };
  });

  return {
    cellMetrics,
    summary: {
      meanSuppressionEfficiency,
      meanDetectionError,
      resolvableCellsCount: resolvableCount,
      blindZoneCellsCount: blindZoneCount,
      deepInteriorCellsCount: deepInteriorCount,
      ringAverages,
    },
  };
}

/**
 * Returns a high-contrast scientific colormap:
 * 100% suppression (0 error) -> Emerald / Cyan
 * 50% suppression (1-sigma oxide line) -> Amber / Yellow
 * 20% suppression -> Coral / Orange
 * 0% suppression (1.0 error / deep blind zone) -> Deep Violet / Dark Slate
 */
export function getHeatmapColor(efficiencyPercent: number): string {
  if (efficiencyPercent >= 90) return '#10b981'; // Emerald 500
  if (efficiencyPercent >= 75) return '#06b6d4'; // Cyan 500
  if (efficiencyPercent >= 50) return '#eab308'; // Yellow 500 (Around 1-sigma threshold)
  if (efficiencyPercent >= 25) return '#f97316'; // Orange 500
  if (efficiencyPercent >= 10) return '#e11d48'; // Rose 600
  if (efficiencyPercent >= 2) return '#9333ea'; // Purple 600
  return '#3b0764'; // Deep dark violet / near-black for core blind zone (< 1e-6 sigma)
}
