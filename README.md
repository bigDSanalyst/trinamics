# trinamics

Kagome boundary-tomography toolkit: a passive readout framework for on/off cell
grids, with an accompanying inverse-problems paper.

## Contents

- `src/` — Vite + React viewer (audit table, lattice, band structure)
- `paper/` — v5.5 manuscript, verification suite, supplementary checks

## Paper

**Hierarchical Bio-Kagome Solid-State Metamaterials** (Revision 5.5)

Proves, on the Kagome flake at R_hex = 8 (169 interior cells):

- rank A_I = 45; rank [A_I; C_4fam] = 112 (kernel 57)
- mod-2 split raises rank to 163 (kernel 6); mod-3 split to 169 (kernel 0) at R=8
- kernel of C^(k) contains T_k(R) = 3R^2 - (10k+3)R + 8k^2 + 5k + 1 translates
  of the k-dilated switching component (Thm 5.11)
- no fixed k works asymptotically: k = 3 fails at R >= 10 (Thm 5.14)
- closed-form onset R_crit(k) = floor((10k+9+sqrt(4k^2+120k+33))/6) + 1
  when d(R) = 6R-3 (Cor 5.15); equals 2k+7 for k >= 58
- closed ridge loops screen to <= 6.27e-4 noise std, forcing P_err >= 0.4998
  (Thm 5.7)
- cross-ratio 2 excluded by Gardner-Gritzmann; the obstruction is realized by an
  explicit 8-cell convex mirror pair with identical chord data at 102 placements
  (Prop. 5.18)

Does **not** claim:

- Any measurement or fabrication of the bio-Kagome device. Sections 1-4 of the
  paper describe an illustrative material stack with assumed parameters; the
  identifiability theorems are substrate-agnostic.
- Permanence of any conjecture. Conjecture 5.10 and the general-k spanning claim
  of Theorem 5.11(2) are open problems.

Full scope, prior-art attribution, and every withdrawn claim from earlier
revisions are in the paper's Revision Notes.

## Verification

    cd paper
    pip install numpy
    python biokagome_v55_verify.py    # ~213 s

Expected last line: [done] N s.

Supplementary ball-arithmetic checks (need python-flint):

    pip install python-flint numpy
    python supplementary_exact_checks.py    # ~40 s

## App

    npm install
    npm run dev

Six tabs: Identifiability, Lattice, Asymptotic Limit and Revision History
(Section 5 and the paper's revision notes), Bloch Spectrum (Section 3.2) and
Piezo Wake-Up (Section 3.1). Every value shown is quoted from the paper or
computed with its formulas. Rank and asymptotic data live in
src/utils/tomography_v54.ts, the revision history in src/data/audit_items_v54.ts.

The Lattice tab's data (cells, boundary-node classes, the test ridge and its
ghosts, switching and convex pairs with their separations, and the Lemma 5.5
boundary response) is generated from the verification script:

    pip install numpy
    python scripts/export_lattice_data.py    # writes src/data/lattice_v55.ts

The export stops if any count differs from the paper.

## License

- Code (src/, package.json, build tooling): MIT — see LICENSE
- Paper, verification scripts, supplementary: CC-BY-4.0 — see paper/LICENSE.md

## Citation

    @misc{maino2026kagome,
      author = {Maino, Nicholas Clifford},
      title  = {Hierarchical Bio-Kagome Solid-State Metamaterials: Anisotropic
                Phonon-Electron Decoupling, Compact Localized Flat-Band States,
                and Identifiability of Three- and Four-Chord Schur-Complement
                Boundary Tomography},
      year   = {2026},
      note   = {Revision 5.5},
      url    = {https://github.com/bigDSanalyst/trinamics}
    }
