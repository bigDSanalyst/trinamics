# Bio-Kagome v5.4 — paper assets

Verify with:

    pip install numpy
    python biokagome_v54_verify.py    # ~213 s, ends with [done] N s

Supplementary ball-arithmetic checks:

    pip install python-flint numpy
    python supplementary_exact_checks.py    # ~40 s

Both scripts must sit in the same directory (the second imports from the first).

Credit: switching-component analysis is Hajdu-Tijdman discrete tomography; cross-ratio criterion is Gardner-Gritzmann 1997; monotonicity without strictness is Rayleigh's law. Specific contributions here: count T_k(R) on the hexagonal domain, the data collapse rank J <= 45, the asymptotic obstruction (Thm 5.14), and the realized cross-ratio witness (Prop 5.17).
