# Bio-Kagome v5.4 — paper assets

Verify with:

    pip install numpy
    python biokagome_v54_verify.py    # ~213 s, ends with [done] N s

Supplementary ball-arithmetic checks (need python-flint):

    pip install python-flint numpy
    python supplementary_exact_checks.py    # ~40 s

Both scripts must sit in the same directory — the second imports from the first.

Every printed line has a section tag ([Sec.5], [Sec.5.4], [Sec.5.5], [Sec.5.6])
matching a section of biokagome_v54.tex.

## Scope

The identifiability theorems (Sections 5.2–5.6) are substrate-agnostic: they
hold for any passive readout of on/off cells via diagonal Schur entries and
line sums on the Kagome flake at R_hex = 8.

Sections 1–4 describe an illustrative material stack (hemp / chitin-mycelium,
Cu-graphene / BaTiO3, h-BN, LIG) with assumed parameters in Table 1. No
fabrication or measurement is claimed in this repository.

Conjectures 5.10 (connected loop-free ridges) and the general-k spanning claim
of Theorem 5.11(2) are open problems, not theorems.

## Credit

Switching-component analysis (Theorems 5.2(5), 5.11(1)) is an instance of
Hajdu–Tijdeman discrete tomography. Cross-ratio criterion (Prop. 5.17) is
Gardner–Gritzmann 1997. Lemma 5.5 without strictness is Rayleigh's monotonicity
law. Specific contributions: count T_k(R) on the hexagonal domain, the data
collapse (rank J <= 45), the asymptotic obstruction (Theorem 5.14), and the
realized cross-ratio witness on this geometry.

## License

CC-BY-4.0. See LICENSE.md in this directory.
