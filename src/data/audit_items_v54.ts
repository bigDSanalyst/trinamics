/**
 * Revision history of the paper's results, taken only from the revision notes at the end of
 * the manuscript (Revisions 3.9 to 5.5). Each entry names the earlier claim, the revision that
 * made it, and what Revision 5.5 states instead.
 */
export interface RevisionItem {
  id: string;
  result: string;
  earlier: string;
  earlierRevision: string;
  current: string;
  category: 'confirmed' | 'corrected' | 'new' | 'not_adopted';
  changedIn: string;
}

export const REVISION_HISTORY: RevisionItem[] = [
  {
    id: 'rank_three_families',
    result: 'Rank of [A_I; C] with three chord families (Theorem 5.2)',
    earlier: 'Rank 169 with a trivial kernel, so ghost elimination was "unconditional"',
    earlierRevision: 'Revision 3.8',
    current:
      'Rank 87 (kernel 82). At 34 dB no decoder succeeds with probability above 0.604 on both the test ridge and its ghosts.',
    category: 'corrected',
    changedIn: 'Revision 3.9',
  },
  {
    id: 'ghost_separation',
    result: 'Chord-consistent ghosts of the test ridge (Theorem 5.2(3))',
    earlier: '100% Monte Carlo success',
    earlierRevision: 'Revision 3.8',
    current:
      'Each ghost differs from the truth at the boundary by 0.5265 σ_Λ at y_base = 10⁻⁶ S (every decoder errs w.p. ≥ 0.396) and 4.46 σ_Λ at 10⁻⁷ S (≥ 0.0128). Ball-arithmetic enclosures: 0.526493 and 0.526535 σ_Λ.',
    category: 'corrected',
    changedIn: 'Revision 3.9',
  },
  {
    id: 'frechet_check',
    result: 'Fréchet derivative check (Theorem 5.1)',
    earlier: 'Finite difference with step 10⁻⁴ agrees to 3.19×10⁻⁷',
    earlierRevision: 'Revision 3.8',
    current:
      'That check gives 2.6×10⁻². Replaced by complex-step verification, which agrees within 10⁻⁹ in all 169 columns.',
    category: 'corrected',
    changedIn: 'Revision 3.9',
  },
  {
    id: 'hoti',
    result: 'Phase at the design value δb = +0.18 (Remark 3.3)',
    earlier: 'Higher-order topological insulator (HOTI)',
    earlierRevision: 'Revisions up to 3.8',
    current:
      'Trivial atomic phase: the 217-cell flake has 217 states below the gap and none in it. The HOTI designation applies to δb < 0 (21 in-gap states at δb = −0.18).',
    category: 'corrected',
    changedIn: 'Revision 3.9',
  },
  {
    id: 'rank_four_families',
    result: 'Fourth chord family m − n (Theorem 5.2)',
    earlier: '—',
    earlierRevision: '',
    current:
      'Rank 112 (kernel 57). With four families the test ridge is determined by its chord sums and recovered in 2000/2000 trials.',
    category: 'new',
    changedIn: 'Revision 4.0',
  },
  {
    id: 'gate_k',
    result: 'Candidate count K of the chord gate',
    earlier: 'K = 14, and rank [J(s*)_K; w_c C_K] = 14/14',
    earlierRevision: 'Revision 5.0',
    current:
      'K = 16 with four families (17 with three); none of 45 family-subset and threshold variants gives 14. The rank is 16 = K and adds nothing to rank C_K = 16.',
    category: 'corrected',
    changedIn: 'Revision 5.1',
  },
  {
    id: 'min_response',
    result: 'Minimum boundary response ∂Λ_bb/∂s_c (Lemma 5.5)',
    earlier: '1.054×10⁻¹³ S',
    earlierRevision: 'Revision 5.0',
    current:
      'Not reproduced by any of 28 conventions. Replaced by computed minima: 1.633×10⁻¹⁶ S at s = 0, 1.908×10⁻²¹ S at s*, 5.624×10⁻³⁴ S over 12 test states.',
    category: 'corrected',
    changedIn: 'Revision 5.1',
  },
  {
    id: 'data_collapse',
    result: 'Boundary data collapse (Theorem 5.6)',
    earlier: 'Stated as Theorem 5.3',
    earlierRevision: 'Revision 5.0',
    current:
      'rank J(s) ≤ 45 for every state s: the 69 active boundary nodes form 24 pairs bonded to the same interior node and 21 singletons.',
    category: 'new',
    changedIn: 'Revision 5.1',
  },
  {
    id: 'loop_screening',
    result: 'Screening by closed ridge loops (Theorem 5.7)',
    earlier: 'd_screen = 3.84×10⁻⁶ σ_Λ for a 32-cell loop at depth 4–5; the separation decays in noise units',
    earlierRevision: 'Revision 5.0',
    current:
      'No hexagonal ring has 32 cells. In the 36-cell loop the 44 placements give 1.4445×10⁻⁸ to 6.2732×10⁻⁴ σ_Λ, so every decoder errs w.p. ≥ 0.4998. The separation decays only in siemens.',
    category: 'corrected',
    changedIn: 'Revision 5.1',
  },
  {
    id: 'snr',
    result: 'SNR needed inside a closed loop (Theorem 5.7)',
    earlier: 'SNR ≥ 125 dB for reliable resolution (no derivation)',
    earlierRevision: 'Revision 5.0',
    current:
      'Error probability ≤ 1% needs at least 111.3 dB for the most separated placement and 204.1 dB for the least separated.',
    category: 'corrected',
    changedIn: 'Revision 5.1',
  },
  {
    id: 'monte_carlo',
    result: 'Recovery statistics for ridge classes (Remark 5.8)',
    earlier: '99/100 unique ridges and 19,886/20,000 recoveries, with no sampler or code',
    earlierRevision: 'Revision 5.0',
    current: 'Replaced by two seeded studies (strokes; connected loop-free ridges), neither of which reproduces both values.',
    category: 'corrected',
    changedIn: 'Revision 5.1',
  },
  {
    id: 'material_system',
    result: 'Material system and wake-up voltage (Section 3.1)',
    earlier: 'Borax–water-activated cellulose-nanofibre LIG and BaTiO₃ paper: g₁ = 7.227×10⁻³ S, V_wake = 168.6 mV',
    earlierRevision: 'Revision 5.0',
    current:
      'Not adopted. Sections 1–4 keep the Revision 4.0 model: g₁ = 2.168×10⁻² S in every computation, V_wake = 70.2 mV > 50 mV.',
    category: 'not_adopted',
    changedIn: 'Revision 5.1',
  },
  {
    id: 'split_chords',
    result: 'Split chords C⁽ᵏ⁾ (Theorem 5.11, Proposition 5.12)',
    earlier:
      '"Conjugate-basis probes": ranks 112, 163, 169; nested kernels; three families including m − n necessary and sufficient; condition numbers 3756 and 350',
    earlierRevision: 'Separately circulated draft (labelled 5.1)',
    current:
      'Ranks 112, 163 and 169 confirmed. The kernels for k = 2 and 3 are not nested. "Three families including m − n" holds at R_hex = 8 only. The condition numbers are not reproduced (43,172 for [A_I; C⁽³⁾] at the design point).',
    category: 'corrected',
    changedIn: 'Revision 5.2',
  },
  {
    id: 'asymptotic',
    result: 'Fixed split order on growing arrays (Theorem 5.14)',
    earlier: '—',
    earlierRevision: '',
    current:
      'No fixed k works for every R_hex: k = 3 has full rank for R ≤ 9 and is deficient for every R ≥ 10 (268–270 of 271 at R = 10, 306 of 331 at R = 11).',
    category: 'new',
    changedIn: 'Revision 5.2',
  },
  {
    id: 'convex',
    result: 'Convex ridges and the cross-ratio criterion (Proposition 5.18)',
    earlier: '—',
    earlierRevision: '',
    current:
      'The four chord slopes have cross ratio 2, which Gardner–Gritzmann exclude; two convex 8-cell parallelograms have identical chord data in all four families, at 102 placements.',
    category: 'new',
    changedIn: 'Revision 5.3',
  },
  {
    id: 'critical_radius',
    result: 'Critical radius for split order k (Corollary 5.15)',
    earlier: '—',
    earlierRevision: '',
    current:
      'If d(R) = 6R − 3, deficient for R ≥ ⌊(10k + 9 + √(4k² + 120k + 33))/6⌋ + 1: 6, 8, 10, 13, 15 for k = 1..5, and exactly 2k + 7 when k ≥ 58. Using only d(R) ≤ 18R: R ≥ 16 for k = 3.',
    category: 'new',
    changedIn: 'Revision 5.5',
  },
  {
    id: 'scope',
    result: 'Scope and prior art (Section 1.1)',
    earlier: '—',
    earlierRevision: '',
    current:
      'The Section 5 results hold for any passive resistor-shunt network with this topology and conductance regime. Switching components follow Hajdu–Tijdeman (after Ryser); the cross-ratio criterion is Gardner–Gritzmann.',
    category: 'new',
    changedIn: 'Revision 5.5',
  },
];
