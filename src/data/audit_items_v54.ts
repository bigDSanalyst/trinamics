export interface AuditItemV54 {
  id: string;
  claim: string;
  statusV40: string;
  statusV54: string;
  category: 'holds' | 'narrower' | 'corrected' | 'new_in_v54';
  details: string;
  verificationEvidence: string;
}

export const MANUSCRIPT_AUDIT_ITEMS_V54: AuditItemV54[] = [
  {
    id: 'rank_4fam',
    claim: 'rank([A_I; C_4fam]) on 169 interior cells',
    statusV40: 'Rank 112 (kernel 57)',
    statusV54: 'Rank 112 (kernel 57) — exact and unchanged over F_p and Q',
    category: 'holds',
    details: 'The joint operator combining diagonal boundary response and 4 unbroken chord families reaches rank 112 of 169.',
    verificationEvidence: 'Fraction-free Bareiss elimination over Z gives rank(C_4) = 67; combined mod p=2^31-1 gives rank 112.',
  },
  {
    id: 'support_pruning',
    claim: 'Gate candidate count (K) on test ridge',
    statusV40: 'Printed log claimed "14" or "22 → 14"',
    statusV54: 'Exact K = 16 for 4 families (K = 17 for 3 families)',
    category: 'corrected',
    details: 'Revision 5.0 had mistakenly cited K=14. Comprehensive family-subset scan in verify_sec5.py confirms K=16.',
    verificationEvidence: 'gate_variants() checks all subsets and thresholds; K=16 is unique to the 4-family 0.5 y_ridge gate.',
  },
  {
    id: 'min_jacobian',
    claim: 'Minimum diagonal boundary response ∂Λ_bb/∂s_c',
    statusV40: 'Cited as 1.054×10⁻¹³ S in v5.0 draft',
    statusV54: '1.908×10⁻²¹ S (at s*) · 1.633×10⁻¹⁶ S (at s=0) · 5.624×10⁻³⁴ S (over 12 test states)',
    category: 'corrected',
    details: '1.054×10⁻¹³ S was from a withdrawn preliminary draft. Lemma 5.5 strictly proves ∂Λ_bb/∂s_c = w_b^T M_c w_b > 0 at active nodes.',
    verificationEvidence: 'Complex-step derivative across 24 columns matches formula to rel error < 3.0×10⁻¹⁰.',
  },
  {
    id: 'ghost_sep_baseline',
    claim: 'Ghost separation at baseline (y_base = 10⁻⁶ S)',
    statusV40: 'Claimed 1.2×10⁻¹⁴ σ ("pure numerical noise")',
    statusV54: '0.5265 σ_Λ (real, measurable, undecodable; P_err ≥ 0.396)',
    category: 'corrected',
    details: 'Calling 0.53σ "numerical noise" was wrong in v5.0. 0.5265σ is an exact physical separation; it leads to severe decoder error (P_err ≥ 0.396) because it is below the 34 dB noise floor, not a float cancellation artifact.',
    verificationEvidence: 'Certified in 256-bit ball arithmetic (python-flint): separation enclosure [0.526501, 0.526505] σ_Λ.',
  },
  {
    id: 'ghost_sep_design',
    claim: 'Ghost separation at design point (y_base = 10⁻⁷ S)',
    statusV40: 'Not computed',
    statusV54: '4.46 σ_Λ (3 families) · Fully determined (4 families)',
    category: 'new_in_v54',
    details: 'Lowering shunt y_base to 10⁻⁷ S amplifies boundary potential by ~8.5×, making the 3-family ghosts resolvable at 4.46σ (ML exact 1973/2000). The 4th family determines the test ridge uniquely.',
    verificationEvidence: 'Rank(C_K) = 16 = K; nullspace on candidate cells is {0}. Exact recovery 2000/2000 in MC.',
  },
  {
    id: 'loop_screening',
    claim: 'Screening by closed ridge loops (Theorem 5.7)',
    statusV40: '"Faraday cage" qualitative narrative',
    statusV54: 'Rigorous: 1.44×10⁻⁸ to 6.27×10⁻⁴ σ_Λ (P_err ≥ 0.4998)',
    category: 'new_in_v54',
    details: 'Inside a closed 36-cell ridge loop at depth 2, the 4-family switching component produces boundary signatures separated by at most 6.27×10⁻⁴σ across all 44 placements. Any decoder errs with P ≥ 0.4998.',
    verificationEvidence: 'Confirmed in 256-bit ball arithmetic for extreme placements (-1, -4) and (-1, -1); rigorous error lower bound Q(d/2) >= 0.4998.',
  },
  {
    id: 'data_collapse',
    claim: 'Boundary Jacobian data collapse (Theorem 5.6)',
    statusV40: 'Only noted 75 dark nodes',
    statusV54: 'rank(J) ≤ 45 everywhere; 69 active nodes form 24 identical pairs + 21 singletons',
    category: 'new_in_v54',
    details: 'Pairs of perimeter nodes bonded to the same interior node carry mathematically identical data at every state s ∈ [0, 1]^169. Rank cannot exceed 45 regardless of state or interior geometry.',
    verificationEvidence: 'L_IB columns identical for all 24 pairs; verified across continuous, binary, and random ridge states.',
  },
  {
    id: 'split_chords',
    claim: 'Per-line interleaved split chords (Theorem 5.11 & Prop 5.12)',
    statusV40: 'Not in v4.0',
    statusV54: 'Rank 163 / 169 (mod-2 parity split) → Rank 169 / 169 (mod-3 split at R=8)',
    category: 'new_in_v54',
    details: 'Reading lines with alternating parity (k=2) leaves kernel 6. Adding period-3 (k=3) achieves full rank 169/169 at R_hex=8. The kernels ker(C^(2)) and ker(C^(3)) are orthogonal, not nested.',
    verificationEvidence: 'Translates of dilated component span split kernels; ker C^(2) has 24 non-zero mod-3 sums per translate.',
  },
  {
    id: 'asymptotic_obstruction',
    claim: 'Asymptotic limit of fixed-order split chords (Theorem 5.14)',
    statusV40: 'Not in v4.0',
    statusV54: 'No fixed k works for all R; k=3 fails at R ≥ 10 (deficient by 1..3 at R=10, 25+ at R=11)',
    category: 'new_in_v54',
    details: 'Kernel dimension T_k(R) = 3R² - (10k+3)R + 8k² + 5k + 1 grows as Θ(R²), whereas distinct boundary data d(R) = 6R - 3 grows only as Θ(R). Deficiency is inevitable for any fixed k.',
    verificationEvidence: 'Exact mod-p calculations for R=2..15; R_crit(k) closed-form corollary.',
  },
  {
    id: 'cross_ratio_witness',
    claim: 'Convex ridge identifiability (Proposition 5.17)',
    statusV40: 'Not in v4.0',
    statusV54: 'Cross-ratio 2.0 excluded by Gardner-Gritzmann; explicit 8-cell convex mirror pair',
    category: 'new_in_v54',
    details: 'Slopes {-1, 0, 1, ∞} have cross-ratio 2.0. The obstruction is realized by two convex 8-cell lattice parallelograms sharing identical 4-family chord data at 102 interior placements.',
    verificationEvidence: 'Lattice closure conv(plus + I) = conv(minus + I); chord line sums match identically in all 4 families.',
  },
];
