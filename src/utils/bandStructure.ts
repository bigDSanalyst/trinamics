/**
 * Exact Bloch spectrum of the breathing Kagome lattice (paper Section 3.2, Theorem 3.1).
 *
 * Hoppings with t_Sigma = 2 (so t1 + t2 = 2):
 *   intracell (up-triangle)   t1 = 1 + delta_b
 *   intercell (down-triangle) t2 = 1 - delta_b
 * Bravais vectors a1 = (1, 0), a2 = (1/2, sqrt3/2), a3 = a2 - a1.
 * With Lambda_k = 3 + 2 sum_i cos(k . a_i) in [0, 9]:
 *   E1 = t1 + t2 (flat band)
 *   E2,3 = -(t1 + t2)/2 +- sqrt(9/4 (t1 - t2)^2 + t1 t2 Lambda_k)
 * The two dispersive bands are separated by the bulk gap 3|t1 - t2| at K (Lambda_K = 0).
 */

export interface BandPoint {
  kDist: number; // path parameter from 0 to 1
  bands: [number, number, number]; // [E_lower, E_middle, E_flat]
}

export type PhaseKind = 'trivial' | 'obstructed' | 'gapless';

const A_VECS: [number, number][] = [
  [1, 0],
  [0.5, Math.sqrt(3) / 2],
  [-0.5, Math.sqrt(3) / 2],
];

export function lambdaK(kx: number, ky: number): number {
  return 3 + 2 * A_VECS.reduce((s, [ax, ay]) => s + Math.cos(kx * ax + ky * ay), 0);
}

export function blochEnergies(deltaB: number, kx: number, ky: number): [number, number, number] {
  const t1 = 1 + deltaB;
  const t2 = 1 - deltaB;
  const root = Math.sqrt(2.25 * (t1 - t2) ** 2 + t1 * t2 * Math.max(0, lambdaK(kx, ky)));
  const centre = -(t1 + t2) / 2;
  return [centre - root, centre + root, t1 + t2];
}

export function computeKagomeBands(deltaB: number, numPoints: number = 150): {
  pathPoints: BandPoint[];
  symmetryPoints: { label: string; kDist: number }[];
  t1: number;
  t2: number;
  gapAtK: number;
  flatBandEnergy: number;
  phase: PhaseKind;
} {
  const t1 = 1 + deltaB;
  const t2 = 1 - deltaB;

  // High-symmetry path Gamma -> K -> M -> Gamma
  const G: [number, number] = [0, 0];
  const K: [number, number] = [(4 * Math.PI) / 3, 0];
  const M: [number, number] = [Math.PI, Math.PI / Math.sqrt(3)];
  const legs: [[number, number], [number, number]][] = [
    [G, K],
    [K, M],
    [M, G],
  ];
  const lens = legs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  const total = lens.reduce((s, l) => s + l, 0);

  const pathPoints: BandPoint[] = [];
  for (let i = 0; i <= numPoints; i++) {
    let s = (i / numPoints) * total;
    let leg = 0;
    while (leg < 2 && s > lens[leg]) {
      s -= lens[leg];
      leg++;
    }
    const [a, b] = legs[leg];
    const f = lens[leg] === 0 ? 0 : Math.min(1, s / lens[leg]);
    const kx = a[0] + f * (b[0] - a[0]);
    const ky = a[1] + f * (b[1] - a[1]);
    pathPoints.push({ kDist: i / numPoints, bands: blochEnergies(deltaB, kx, ky) });
  }

  const symmetryPoints = [
    { label: 'Γ', kDist: 0 },
    { label: 'K', kDist: lens[0] / total },
    { label: 'M', kDist: (lens[0] + lens[1]) / total },
    { label: 'Γ', kDist: 1 },
  ];

  const phase: PhaseKind = deltaB > 1e-9 ? 'trivial' : deltaB < -1e-9 ? 'obstructed' : 'gapless';

  return {
    pathPoints,
    symmetryPoints,
    t1,
    t2,
    gapAtK: 3 * Math.abs(t1 - t2),
    flatBandEnergy: t1 + t2,
    phase,
  };
}
