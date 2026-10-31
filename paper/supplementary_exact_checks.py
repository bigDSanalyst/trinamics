"""Supplementary exact-arithmetic checks for Revision 5.5 (independent of numpy linear algebra).

(a) Theorem 5.2(3), Revision-3.9 baseline (y_base = 1e-6, three chord families): boundary signatures
    diag(Lambda(s) - Lambda(0)) of the test ridge and its two chord-consistent ghosts.
(b) Theorem 5.2(5), Revision-4.0 design (y_base = 1e-7, four families): the ridge pair formed by a
    closed 36-cell ridge loop plus either half of the four-family switching component (the placement
    with the LARGEST float64 separation among the 44 tested), and (d) the placement (-1, -1) with the SMALLEST.
(c) Proposition 5.9: the three-family augmented rank at R_hex = 4, computed exactly over Q.
(a), (b) and (d) use 256-bit ball arithmetic (python-flint) directly on differences of Schur complements and
report rigorous enclosures; (c) uses exact rational matrices.

Usage (same folder as biokagome_v55_verify.py):  pip install python-flint numpy
                                                  python supplementary_exact_checks.py
Runtime about 40 s.
"""
import itertools, math
import numpy as np
from flint import arb, arb_mat, ctx
from biokagome_v55_verify import Spec, BASELINE, Network, RIDGES, Q, switching_component, exact_laplacian, replace
import flint

ctx.prec = 256


def use(spec):
    global s, net, I, B, g1, g2b, g2on, yb, yr
    s = spec
    net = Network(s)
    I, B = [int(x) for x in net.I], [int(x) for x in net.B]
    g1, g2b, g2on = arb(str(s.g1)), arb(str(s.g2_base)), arb(str(s.g2_on))
    yb, yr = arb(str(s.y_base)), arb(str(s.y_ridge))


use(BASELINE)


def laplacian(state):
    L = [dict() for _ in range(3*net.N)]
    def add(a, b, v):
        L[a][b] = L[a].get(b, arb(0)) + v
    for (u, v, i, j, kind) in net.edges:
        g = g1 if kind == 1 else g2b + arb(int(state[i]) + int(state[j]))/2*(g2on - g2b)
        add(u, u, g); add(v, v, g); add(u, v, -g); add(v, u, -g)
    for i in range(net.N):
        for k in range(3):
            add(3*i + k, 3*i + k, (yb + arb(int(state[i]))*yr)/3)
    return L


def schur_diag(state):
    L = laplacian(state)
    X = arb_mat([[L[a].get(b, arb(0)) for b in I] for a in I]).solve(
        arb_mat([[L[a].get(b, arb(0)) for b in B] for a in I]))
    out = []
    for c, b in enumerate(B):
        acc = L[b].get(b, arb(0))
        for r, a in enumerate(I):
            if a in L[b]:
                acc -= L[b][a]*X[r, c]
        out.append(acc)
    return out


st = np.zeros(net.N, dtype=int)
for rc in RIDGES:
    st[net.c2i[rc]] = 1
sti = st[net.int_cells]
cand = net.gate(net.C @ sti, 0.5)
CK = net.C[:, cand]
cnt = CK @ sti[cand]
pats = [np.array(b) for b in itertools.product((0, 1), repeat=len(cand)) if np.array_equal(CK @ np.array(b), cnt)]
i_true = [i for i, b in enumerate(pats) if np.array_equal(b, sti[cand])][0]
base = schur_diag(np.zeros(net.N, dtype=int))
sig = []
for b in pats:
    x = np.zeros(net.N, dtype=int)
    for c, v in zip(cand, b):
        x[net.int_cells[c]] = int(v)
    d = schur_diag(x)
    sig.append([d[k] - base[k] for k in range(len(B))])


def norm_enclosure(vec):
    mid = math.sqrt(sum(float(v.mid())**2 for v in vec))
    rad = math.sqrt(sum(float(v.rad())**2 for v in vec))
    return mid - rad, mid + rad


nscale = max(abs(v) for v in sig[i_true])
sd = arb(str(s.sigma_rel))*nscale
lo_sd, hi_sd = float(sd.mid()) - float(sd.rad()), float(sd.mid()) + float(sd.rad())
print("(a) baseline, three families")
print(f"max|dLambda_bb| = {nscale.str(10, radius=True)} S")
for i in range(len(pats)):
    if i != i_true:
        lo, hi = norm_enclosure([sig[i][k] - sig[i_true][k] for k in range(len(B))])
        print(f"ghost {i}: separation / noise std in [{lo/hi_sd:.6f}, {hi/lo_sd:.6f}]")
g = [i for i in range(len(pats)) if i != i_true]
lo, hi = norm_enclosure([sig[g[0]][k] - sig[g[1]][k] for k in range(len(B))])
print(f"ghost vs ghost: separation / noise std in [{lo/hi_sd:.3e}, {hi/lo_sd:.3e}]")

# ---------------- (b) closed ridge loop screens a four-family ghost pair ----------------
use(Spec())
plus, minus = switching_component(net)
depth = lambda c: max(abs(c[0]), abs(c[1]), abs(c[0] + c[1]))
ring = [c for c in net.pos if depth(c) == s.R_hex - 2]
def state(cells):
    x = np.zeros(net.N, dtype=int)
    for c in cells:
        x[net.c2i[c]] = 1
    return x
base = schur_diag(np.zeros(net.N, dtype=int))
for (a, b), tag in (((-1, -4), "(b) largest"), ((-1, -1), "(d) smallest")):   # float64 extremes among the 44 placements
    RA = ring + [(x + a, y + b) for x, y in plus]
    RB = ring + [(x + a, y + b) for x, y in minus]
    dA = schur_diag(state(RA)); dB = schur_diag(state(RB))
    sigA = [dA[k] - base[k] for k in range(len(B))]
    diff = [dA[k] - dB[k] for k in range(len(B))]
    nscale = max(abs(v) for v in sigA)
    sd = arb(str(s.sigma_rel))*nscale
    lo_sd, hi_sd = float(sd.mid()) - float(sd.rad()), float(sd.mid()) + float(sd.rad())
    lo, hi = norm_enclosure(diff)
    print(f"{tag} separation, Revision-4.0 design, closed 36-cell loop + switching component at shift ({a}, {b})")
    print(f"max|dLambda_bb| = {nscale.str(10, radius=True)} S; separation in [{lo:.6e}, {hi:.6e}] S")
    print(f"pair separation / noise std in [{lo/hi_sd:.6e}, {hi/lo_sd:.6e}] -> any decoder errs w.p. >= {math.floor(Q(hi/lo_sd/2)*1e6)/1e6:.6f}")

# ---------------- (c) exact rank of [A_I; C3] at R_hex = 4 over Q ----------------
net4 = Network(replace(BASELINE, R_hex=4))
Lz = exact_laplacian(net4, np.zeros(net4.N, dtype=int))
X = flint.fmpz_mat(Lz[np.ix_(net4.I, net4.I)].tolist()).solve(flint.fmpz_mat(Lz[np.ix_(net4.I, net4.B)].tolist()))
A4 = [[sum((X[3*c + k, b]**2 for k in range(3)), flint.fmpq(0))/3 for c in range(net4.N_I)] for b in range(len(net4.B))]
M4 = flint.fmpq_mat(A4 + [[flint.fmpq(int(x)) for x in row] for row in net4.C])
print(f"(c) R_hex = 4, three families: rank over Q of [A_I; C] = {M4.rank()} of {net4.N_I} (exact rational arithmetic)")
