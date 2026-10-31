/**
 * Bio-Kagome Rigorous Discrete Tomography & Identifiability Models
 * Anchored in Revision 5.5 of the manuscript and verified via biokagome_v55_verify.py
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
  // 'exact': computed rank; 'range': rankMod3..maxPossibleRank (R=10);
  // 'upper_bound': not computed, rankMod3 = N_I - T_3(R) + d(R) from Theorem 5.14
  rankKind: 'exact' | 'range' | 'upper_bound';
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
      stage: 'A_I + C (3 fam.)',
      rank: 87,
      kernel: 82,
      total: 169,
      probeDescription: 'm, n, m+n chord families (45 lines, rank 42)',
      fraction: 87 / 169,
      color: '#0284c7', // Sky
    },
    {
      stage: 'A_I + C (4 fam.)',
      rank: 112,
      kernel: 57,
      total: 169,
      probeDescription: 'Add m−n chord family (74 lines, rank 67)',
      fraction: 112 / 169,
      color: '#f59e0b', // Amber
    },
    {
      stage: 'A_I + C⁽²⁾',
      rank: 163,
      kernel: 6,
      total: 169,
      probeDescription: 'Four-family lines split by parity, in place of C (146 rows, rank 118)',
      fraction: 163 / 169,
      color: '#8b5cf6', // Violet
    },
    {
      stage: 'A_I + C⁽³⁾',
      rank: 169,
      kernel: 0,
      total: 169,
      probeDescription: 'Four-family lines split mod 3, in place of C (216 rows, rank 153). Full rank at R_hex = 8',
      fraction: 169 / 169,
      color: '#10b981', // Emerald
    },
  ] as RankProgressionStage[],

  // Asymptotic data across R_hex = 2..15 (Theorem 5.14).
  // Ranks are computed for R <= 11 only; R = 12..15 show the Theorem 5.14 upper bound.
  asymptotic_k3: [
    { R: 2, nInterior: 7, rankMod3: 7, maxPossibleRank: 7, deficient: false, status: 'full', tCount: 0, distinctBoundaryD: 9, rankKind: 'exact' },
    { R: 3, nInterior: 19, rankMod3: 19, maxPossibleRank: 19, deficient: false, status: 'full', tCount: 0, distinctBoundaryD: 15, rankKind: 'exact' },
    { R: 4, nInterior: 37, rankMod3: 37, maxPossibleRank: 37, deficient: false, status: 'full', tCount: 0, distinctBoundaryD: 21, rankKind: 'exact' },
    { R: 5, nInterior: 61, rankMod3: 61, maxPossibleRank: 61, deficient: false, status: 'full', tCount: 0, distinctBoundaryD: 27, rankKind: 'exact' },
    { R: 6, nInterior: 91, rankMod3: 91, maxPossibleRank: 91, deficient: false, status: 'full', tCount: 0, distinctBoundaryD: 33, rankKind: 'exact' },
    { R: 7, nInterior: 127, rankMod3: 127, maxPossibleRank: 127, deficient: false, status: 'full', tCount: 4, distinctBoundaryD: 39, rankKind: 'exact' },
    { R: 8, nInterior: 169, rankMod3: 169, maxPossibleRank: 169, deficient: false, status: 'full', tCount: 16, distinctBoundaryD: 45, rankKind: 'exact' },
    { R: 9, nInterior: 217, rankMod3: 217, maxPossibleRank: 217, deficient: false, status: 'full', tCount: 34, distinctBoundaryD: 51, rankKind: 'exact' },
    { R: 10, nInterior: 271, rankMod3: 268, maxPossibleRank: 270, deficient: true, status: 'threshold', tCount: 58, distinctBoundaryD: 57, rankKind: 'range' },
    { R: 11, nInterior: 331, rankMod3: 306, maxPossibleRank: 306, deficient: true, status: 'deficient', tCount: 88, distinctBoundaryD: 63, rankKind: 'exact' },
    { R: 12, nInterior: 397, rankMod3: 342, maxPossibleRank: 342, deficient: true, status: 'deficient', tCount: 124, distinctBoundaryD: 69, rankKind: 'upper_bound' },
    { R: 13, nInterior: 469, rankMod3: 378, maxPossibleRank: 378, deficient: true, status: 'deficient', tCount: 166, distinctBoundaryD: 75, rankKind: 'upper_bound' },
    { R: 14, nInterior: 547, rankMod3: 414, maxPossibleRank: 414, deficient: true, status: 'deficient', tCount: 214, distinctBoundaryD: 81, rankKind: 'upper_bound' },
    { R: 15, nInterior: 631, rankMod3: 450, maxPossibleRank: 450, deficient: true, status: 'deficient', tCount: 268, distinctBoundaryD: 87, rankKind: 'upper_bound' },
  ] as AsymptoticCurvePoint[],

  // Corollary 5.15: R_crit(k) = floor((10k + 9 + sqrt(4k^2 + 120k + 33)) / 6) + 1  (when d(R) = 6R - 3)
  r_crit_values: [
    { k: 1, rCrit: 6, note: 'Standard line sums: deficient for R >= 6; full rank at R <= 5 (observed onset)' },
    { k: 2, rCrit: 8, note: 'Parity split: deficient for R >= 8 (rank 163 of 169 at R = 8)' },
    { k: 3, rCrit: 10, note: 'Mod-3 split: full rank at R <= 9, deficient for R >= 10 (observed onset)' },
    { k: 4, rCrit: 13, note: 'Deficient for R >= 13 (bound; not 12 as 2k+4 would give)' },
    { k: 5, rCrit: 15, note: 'Deficient for R >= 15 (bound)' },
  ],
  // R_crit(k) = 2k + 7 exactly when k >= 58; without assuming d(R) = 6R - 3 (d(R) <= 18R):
  r_crit_asymptote: { constant: 7, fromK: 58 },
  r_unconditional_values: [
    { k: 1, rUnc: 10 }, { k: 2, rUnc: 13 }, { k: 3, rUnc: 16 }, { k: 4, rUnc: 18 }, { k: 5, rUnc: 20 },
  ],
};
