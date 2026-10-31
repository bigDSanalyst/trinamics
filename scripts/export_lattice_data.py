"""Export the data behind the app's Lattice tab from the paper's own verification code.

Every cell set, boundary-node class, placement and separation below is produced by functions of
paper/biokagome_v55_verify.py; nothing is entered by hand. The script stops if any count differs
from the value stated in the paper.

Usage (from the repository root):  pip install numpy
                                   python scripts/export_lattice_data.py
Writes src/data/lattice_v55.ts (about 10 s).
"""
import itertools
import json
import pathlib
import sys

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "paper"))
import biokagome_v55_verify as v  # noqa: E402

design = v.Spec()                                    # Revision 4.0 design: y_base = 1e-7 S, four families
base = v.BASELINE                                    # Revision 3.9 baseline: y_base = 1e-6 S, three families
net4, net3 = v.Network(design), v.Network(base)
net3d = v.Network(v.replace(base, y_base=design.y_base))   # three families at the design y_base
depth = v.radius
cell = lambda c: [int(c[0]), int(c[1])]
floor_to = lambda x, d: float(np.floor(x*10**d)/10**d)   # lower bounds are rounded down

# ---------------- geometry: 217 cells (up-triangles), 3 nodes each, intra- and intercell bonds ----------------
assert net4.N == 217 and net4.N_I == 169 and len(net4.B) == 144
cells = [cell(c) for c in net4.cells]
interior = [int(i) for i in net4.int_cells]
edges = [[int(u), int(w), int(kind)] for (u, w, i, j, kind) in net4.edges]

# ---------------- boundary nodes: dark / active, classes of identical L_IB columns (Theorem 5.6) ----------------
LIB = v.exact_laplacian(net4, np.zeros(net4.N, dtype=int))[np.ix_(net4.I, net4.B)]
classes, bnodes = {}, []
for b in range(len(net4.B)):
    col = LIB[:, b]
    if not col.any():
        bnodes.append({"node": int(net4.B[b]), "cls": -1, "nbrs": []})
        continue
    key = tuple(col)
    classes.setdefault(key, len(classes))
    bnodes.append({"node": int(net4.B[b]), "cls": classes[key], "nbrs": [int(net4.I[r]) for r in np.flatnonzero(col)]})
sizes = np.bincount([n["cls"] for n in bnodes if n["cls"] >= 0])
assert sum(n["cls"] < 0 for n in bnodes) == 75 and len(classes) == 45
assert (sizes == 2).sum() == 24 and (sizes == 1).sum() == 21

# ---------------- test ridge, gate candidates and chord-consistent patterns (Theorem 5.2(3)) ----------------
def patterns(net):
    """as in supplementary_exact_checks.py: candidates of the noise-free gate, then every 0/1 pattern on them
    with the same chord sums, in itertools.product order (so ghost 1 and 2 match its numbering)"""
    sti = net.state(v.RIDGES)[net.int_cells]
    cand = net.gate(net.C @ sti, 0.5)
    CK = net.C[:, cand]
    cnt = CK @ sti[cand]
    pats = [np.array(b) for b in itertools.product((0, 1), repeat=len(cand)) if np.array_equal(CK @ np.array(b), cnt)]
    to_cells = lambda b: sorted(net.cells_of([cand[j] for j in range(len(cand)) if b[j]]))
    truth = sorted(v.RIDGES)
    others = [to_cells(b) for b in pats if to_cells(b) != truth]
    return net.cells_of(cand), others, len(pats)

def separation(net, A, B):
    """boundary separation in noise standard deviations, as in the listing: ||f(A) - f(B)|| / (sigma_rel max|f(A)|)"""
    L0, G0 = v.linear_model(net)[:2]
    fa, fb = v.forward(net, L0, G0, list(A)), v.forward(net, L0, G0, list(B))
    return float(np.linalg.norm(fa - fb) / (net.s.sigma_rel * np.abs(fa).max()))

cand3, ghosts3, n3 = patterns(net3)
cand4, ghosts4, n4 = patterns(net4)
assert len(cand3) == 17 and n3 == 3 and len(cand4) == 16 and n4 == 1 and not ghosts4
BALL = [0.526493, 0.526535]                            # supplementary check (a), 256-bit ball arithmetic
ghosts = []
for g, ball in zip(ghosts3, BALL):
    s6, s7 = separation(net3, v.RIDGES, g), separation(net3d, v.RIDGES, g)
    assert abs(s6 - ball) < 2e-6, (s6, ball)
    ghosts.append({"cells": [cell(c) for c in g], "sepBaseline": round(s6, 6), "sepBaselineBall": ball,
                   "sepDesign": round(s7, 4), "perrBaseline": floor_to(v.Q(s6 / 2), 4), "perrDesign": floor_to(v.Q(s7 / 2), 4)})
assert sorted(round(g["sepDesign"], 4) for g in ghosts) == [4.4595, 4.4598]
assert min(g["perrBaseline"] for g in ghosts) >= 0.396 and min(g["perrDesign"] for g in ghosts) >= 0.0128

# ---------------- switching pairs and convex parallelograms (Theorems 5.2(5), 5.7; Proposition 5.18) ----------------
plus, minus = v.switching_component(net4)
assert len(plus) == 4 and len(minus) == 4
interior_I = [(1, 0), (1, 1), (2, 0), (2, 1)]
ring = sorted(c for c in net4.pos if depth(c) == design.R_hex - 2)
assert len(ring) == 36
BALL_RING = {(-1, -4): 6.273115e-4, (-1, -1): 1.444536e-8}   # supplementary checks (b) and (d)

def placements(P, M, span):
    iso, framed = [], []
    for a in range(-span, span + 1):
        for b in range(-span, span + 1):
            A = [(x + a, y + b) for x, y in P]; B = [(x + a, y + b) for x, y in M]
            if not all(c in net4.pos for c in A + B):
                continue
            dmax = max(depth(c) for c in A + B)
            if dmax <= design.R_hex - 2:
                s = separation(net4, A, B)
                iso.append({"shift": [a, b], "sep": float(f"{s:.6g}"), "perr": floor_to(v.Q(s / 2), 6)})
            if dmax < design.R_hex - 2:
                s = separation(net4, ring + A, ring + B)
                p = {"shift": [a, b], "sep": float(f"{s:.6g}"), "perr": floor_to(v.Q(s / 2), 6),
                     "wallDepth": design.R_hex - 2 - dmax}
                if (a, b) in BALL_RING and P == plus:
                    p["ball"] = BALL_RING[(a, b)]
                framed.append(p)
    return sorted(iso, key=lambda p: p["sep"]), sorted(framed, key=lambda p: p["sep"])

bare_iso, bare_framed = placements(plus, minus, 8)
assert len(bare_iso) == 70 and len(bare_framed) == 44
assert np.bincount([p["wallDepth"] for p in bare_framed]).tolist()[1:] == [20, 14, 8, 2]
assert bare_iso[0]["sep"] >= 30.09 and bare_framed[-1]["sep"] <= 6.3e-4
P0, M0 = sorted(plus + interior_I), sorted(minus + interior_I)
assert v.chord_data(P0, v.FAM4) == v.chord_data(M0, v.FAM4)
conv_total = sum(all((x + a, y + b) in net4.pos for x, y in P0 + M0) for a in range(-16, 17) for b in range(-16, 17))
conv_iso, conv_framed = placements(P0, M0, 16)
assert conv_total == 102 and len(conv_iso) == 70 and len(conv_framed) == 44
assert conv_iso[0]["sep"] >= 30.08 and conv_iso[-1]["sep"] <= 89.84 and conv_framed[-1]["sep"] <= 6.14e-4

# ---------------- boundary response d Lambda_bb / d s_c at s = 0 (Lemma 5.5), design point ----------------
D = v.diag_jacobian(net4, np.zeros(net4.N))[0]
act = v.active_nodes(net4)
dmin = float(D[act, :].min())
assert abs(dmin / 1.633e-16 - 1) < 1e-3, dmin
response = [{"cell": cell(net4.cells[i]), "log10Max": round(float(np.log10(D[:, pos].max())), 4),
             "bestNode": int(net4.B[int(np.argmax(D[:, pos]))])} for pos, i in enumerate(net4.int_cells)]

data = {
    "source": "Generated by scripts/export_lattice_data.py from paper/biokagome_v55_verify.py (Revision 5.5). Do not edit by hand.",
    "rHex": design.R_hex,
    "deltaB": design.delta_b,
    "cells": cells,
    "interior": interior,
    "edges": edges,
    "boundaryNodes": bnodes,
    "ridge": {
        "truth": [cell(c) for c in sorted(v.RIDGES)],
        "threeFamilies": {"candidates": [cell(c) for c in sorted(cand3)], "patterns": n3, "ghosts": ghosts},
        "fourFamilies": {"candidates": [cell(c) for c in sorted(cand4)], "patterns": n4},
    },
    "switching": {
        "plus": [cell(c) for c in plus], "minus": [cell(c) for c in minus],
        "convexShared": [cell(c) for c in interior_I], "ring": [cell(c) for c in ring],
        "bare": {"isolated": bare_iso, "framed": bare_framed},
        "convex": {"isolated": conv_iso, "framed": conv_framed, "total": conv_total},
    },
    "response": response,
    "responseMin": dmin,
}

out = ROOT / "src" / "data" / "lattice_v55.ts"
body = json.dumps(data, separators=(",", ":"))
out.write_text("// " + data["source"] + "\nimport type { LatticeData } from './latticeTypes';\n\n"
               "export const LATTICE_DATA: LatticeData = " + body + ";\n")
print(f"wrote {out.relative_to(ROOT)} ({len(body) // 1024} KB): {len(cells)} cells, {len(edges)} bonds, "
      f"{len(classes)} active classes, ghosts {[g['sepBaselineBall'] for g in ghosts]} / {[g['sepDesign'] for g in ghosts]} std, "
      f"placements bare {len(bare_iso)}+{len(bare_framed)}, convex {conv_total} ({len(conv_iso)}+{len(conv_framed)}), "
      f"response min {dmin:.4g} S")
