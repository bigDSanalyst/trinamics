/** Shape of src/data/lattice_v55.ts, which scripts/export_lattice_data.py generates from the paper's code. */

export type Cell = [number, number]; // axial coordinates (m, n) of an up-triangle cell

export interface Placement {
  shift: [number, number]; // translation applied to the base pair
  sep: number; // boundary separation in noise standard deviations (listing's float64 forward model)
  perr: number; // lower bound Q(sep / 2) on the error probability of any decoder
  wallDepth?: number; // for pairs inside the closed loop: rings between the pair and the loop
  ball?: number; // 256-bit ball-arithmetic value (supplementary checks (b), (d)) where computed
}

export interface Ghost {
  cells: Cell[];
  sepBaseline: number; // y_base = 1e-6 S, float64
  sepBaselineBall: number; // y_base = 1e-6 S, ball arithmetic (supplementary check (a))
  sepDesign: number; // y_base = 1e-7 S
  perrBaseline: number;
  perrDesign: number;
}

export interface LatticeData {
  source: string;
  rHex: number;
  deltaB: number;
  cells: Cell[]; // all 217 cells; node index of site k of cell i is 3i + k
  interior: number[]; // cell indices of the 169 interior cells
  edges: [number, number, number][]; // [node, node, kind]: 1 = intracell (t1, g1), 2 = intercell (t2, g2)
  boundaryNodes: { node: number; cls: number; nbrs: number[] }[]; // cls = -1 for dark nodes
  ridge: {
    truth: Cell[];
    threeFamilies: { candidates: Cell[]; patterns: number; ghosts: Ghost[] };
    fourFamilies: { candidates: Cell[]; patterns: number };
  };
  switching: {
    plus: Cell[];
    minus: Cell[];
    convexShared: Cell[];
    ring: Cell[];
    bare: { isolated: Placement[]; framed: Placement[] };
    convex: { isolated: Placement[]; framed: Placement[]; total: number };
  };
  response: { cell: Cell; log10Max: number; bestNode: number }[];
  responseMin: number;
}
