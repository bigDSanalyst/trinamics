/**
 * Bio-Kagome v5.4 Rigorous Discrete Tomography & Identifiability Models
 * Anchored in Revision 5.4 of the manuscript and verified via biokagome_v54_verify.py
 */

export interface RankProgressionStage {
  stage: string;
  rank: number;
  kernel: number;
  total: number;
  probeDescription: string;
  fraction: number;
  color: string;
}

export interface AsymptoticCurvePoint {
  R: number;
  nInterior: number;
  rankMod3: number;
  maxPossibleRank: number;
  deficient: boolean;
  status: 'full' | 'threshold' | 'deficient';
  tCount: number;
  distinctBoundaryD: number;
}

export const TOMOGRAPHY_V54 = {
  // 5-Stage Rank Progression at R_hex = 8 (N_I = 169)
  rank_progression: [
    {
      stage: 'A_I',
      rank: 45,
      kernel: 124,
      total: 169,
      probeDescription: 'Boundary diagonal only (144 nodes: 75 dark, 69 active in 24 pairs + 21 singletons)',
      fraction: 45 / 169,
      color: '#64748b', // Slate
    },
    {
      stage: '+ 3 families',
      rank: 87,
      kernel: 82,
      total: 169,
      probeDescription: 'm, n, m+n chord families (45 lines, rank 42)',
      fraction: 87 / 169,
      color: '#0284c7', // Sky
    },
    {
      stage: '+ 4 families',
      rank: 112,
      kernel: 57,
      total: 169,
      probeDescription: 'Add m−n chord family (74 lines, rank 67)',
      fraction: 112 / 169,
      color: '#f59e0b', // Amber
    },
    {
      stage: '+ mod-2 split',
      rank: 163,
      kernel: 6,
      total: 169,
      probeDescription: 'Parity split per line (148 rows, rank 118). Resolves 4th-order hexadecapole',
      fraction: 163 / 169,
      color: '#8b5cf6', // Violet
    },
    {
      stage: '+ mod-3 split',
      rank: 169,
      kernel: 0,
      total: 169,
      probeDescription: 'Period-3 split per line (222 rows, rank 153). Full rank at R_hex = 8',
      fraction: 169 / 169,
      color: '#10b981', // Emerald
    },
  ] as RankProgressionStage[],

  // Asymptotic data across R_hex = 2..15 (Theorem 5.14)
  asymptotic_k3: [
    { R: 2, nInterior: 7, rankMod3: 7, maxPossibleRank: 7, deficient: false, status: 'full', tCount: 0, distinctBoundaryD: 9 },
    { R: 3, nInterior: 19, rankMod3: 19, maxPossibleRank: 19, deficient: false, status: 'full', tCount: 0, distinctBoundaryD: 15 },
    { R: 4, nInterior: 37, rankMod3: 37, maxPossibleRank: 37, deficient: false, status: 'full', tCount: 0, distinctBoundaryD: 21 },
    { R: 5, nInterior: 61, rankMod3: 61, maxPossibleRank: 61, deficient: false, status: 'full', tCount: 0, distinctBoundaryD: 27 },
    { R: 6, nInterior: 91, rankMod3: 91, maxPossibleRank: 91, deficient: false, status: 'full', tCount: 0, distinctBoundaryD: 33 },
    { R: 7, nInterior: 127, rankMod3: 127, maxPossibleRank: 127, deficient: false, status: 'full', tCount: 4, distinctBoundaryD: 39 },
    { R: 8, nInterior: 169, rankMod3: 169, maxPossibleRank: 169, deficient: false, status: 'full', tCount: 16, distinctBoundaryD: 45 },
    { R: 9, nInterior: 217, rankMod3: 217, maxPossibleRank: 217, deficient: false, status: 'full', tCount: 34, distinctBoundaryD: 51 },
    { R: 10, nInterior: 271, rankMod3: 269, maxPossibleRank: 270, deficient: true, status: 'threshold', tCount: 58, distinctBoundaryD: 57 },
    { R: 11, nInterior: 331, rankMod3: 306, maxPossibleRank: 306, deficient: true, status: 'deficient', tCount: 88, distinctBoundaryD: 63 },
    { R: 12, nInterior: 397, rankMod3: 345, maxPossibleRank: 345, deficient: true, status: 'deficient', tCount: 124, distinctBoundaryD: 69 },
    { R: 13, nInterior: 469, rankMod3: 387, maxPossibleRank: 387, deficient: true, status: 'deficient', tCount: 166, distinctBoundaryD: 75 },
    { R: 14, nInterior: 547, rankMod3: 432, maxPossibleRank: 432, deficient: true, status: 'deficient', tCount: 214, distinctBoundaryD: 81 },
    { R: 15, nInterior: 631, rankMod3: 480, maxPossibleRank: 480, deficient: true, status: 'deficient', tCount: 268, distinctBoundaryD: 87 },
  ] as AsymptoticCurvePoint[],

  // Critical radius formula values: R_crit(k) = ceil((10k + 9 + sqrt(4k^2 + 120k + 33)) / 6)
  r_crit_values: [
    { k: 1, rCrit: 6, note: 'Standard line sums (k=1) fail at R >= 6' },
    { k: 2, rCrit: 8, note: 'Parity splits (k=2) fail at R >= 8 (rank 163 of 169)' },
    { k: 3, rCrit: 10, note: 'Mod-3 splits (k=3) succeed at R=8,9; fails at R >= 10' },
    { k: 4, rCrit: 13, note: 'R_crit = 13 (not 12; 2k+4 shortcut is invalid at k >= 4)' },
  ],

  // Ghost Separation data
  ghost_separation: {
    baseline_ybase: '1.000e-6 S',
    baseline_sigma: 0.5265,
    baseline_perr: 0.396,
    design_ybase: '1.000e-7 S',
    design_sigma: 4.46,
    design_perr: 0.0128,
    withdrawn_v50_value: '1.200e-14 σ',
  },

  // Closed ridge loop screening (Theorem 5.7)
  screening_loop: {
    cells_in_loop: 36,
    placements: 44,
    min_separation_sigma: 1.44e-8,
    max_separation_sigma: 6.27e-4,
    min_decoder_error: 0.4998,
  },

  // Gardner-Gritzmann cross ratio 2 witness (Prop 5.17)
  cross_ratio_witness: {
    slopes: [-1.0, 0.0, 1.0],
    cross_ratio: 2.0,
    convex_cell_count: 8,
    parallelogram_placements: 102,
    isolated_separation_range: '30.09 .. 44.62 σ',
    framed_separation_range: '6.27e-4 σ (P_err >= 0.4998)',
  },
};
