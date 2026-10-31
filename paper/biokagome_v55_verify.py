"""Verification suite for 'Hierarchical Bio-Kagome Solid-State Metamaterials' (Revision 5.5).

Every number printed is computed below; no result string is hard-coded.  Only numpy is
required (exact ranks use a self-contained modular-arithmetic elimination).
Each block raises AssertionError if a stated claim fails.
"""
import math, time, itertools
from dataclasses import dataclass, replace
from fractions import Fraction
from decimal import Decimal, ROUND_CEILING, ROUND_FLOOR
import numpy as np


@dataclass(frozen=True)
class Spec:
    delta_b: float = 0.18
    t_sum: float = 2.0
    g1: float = 2.168e-2
    g2_base: float = 1.0e-7
    g2_on: float = 1.0e-3
    y_base: float = 1.0e-7          # Revision 4.0 design value (Revisions <= 3.9: 1.0e-6)
    y_ridge: float = 2.5e-3
    a2_mm: float = 0.050
    a1_mm: float = 2.000
    rx_mm: float = 10.0
    ry_mm: float = 12.5
    rho_c: float = 0.80
    eta_r: float = 0.080
    sigma_rel: float = 0.02
    R_hex: int = 8
    chord_families: int = 4         # Revision 4.0: m, n, m+n, m-n lines (Revisions <= 3.9: 3)


BASELINE = Spec(y_base=1.0e-6, chord_families=3)   # design analysed in Revision 3.9
# cell (m,n) owns nodes 3i+k (k=0,1,2) = up-triangle; down-triangle bonds:
# v2(m,n)-v1(m+1,n), v3(m,n)-v1(m,n+1), v3(m,n)-v2(m-1,n+1)
INTERCELL = (((1, 0), 1, 0), ((0, 1), 2, 0), ((-1, 1), 2, 1))
RIDGES = ((-3, 1), (-2, 1), (-1, 1), (0, 1), (1, 0), (2, 0), (3, -1),
          (-3, 0), (-2, 0), (-1, -1), (0, -1), (1, -1))


def Q(x):
    return 0.5 * math.erfc(x / math.sqrt(2.0))


def _directed(x, sig, mode):
    d = Decimal(repr(float(x)))
    if d == 0:
        return "0"
    q = d.quantize(Decimal(1).scaleb(d.adjusted() - sig + 1), rounding=mode)
    return f"{q:.{sig - 1}e}" if (q.adjusted() < -3 or q.adjusted() >= 4) else f"{q:f}"


def up(x, sig=3):        # upper bounds are printed rounded up ...
    return _directed(x, sig, ROUND_CEILING)


def dn(x, sig=3):        # ... and lower bounds rounded down
    return _directed(x, sig, ROUND_FLOOR)


def hex_cells(R):
    return [(m, n) for m in range(-R, R + 1) for n in range(-R, R + 1) if max(abs(m), abs(n), abs(m + n)) <= R]


# ============================== Section 3 ==============================
def kagome_H(cells, t1, t2):
    c2i = {c: i for i, c in enumerate(cells)}
    H = np.zeros((3 * len(cells), 3 * len(cells)))
    def hop(u, v, t):
        H[u, v] -= t; H[v, u] -= t
    for i, (m, n) in enumerate(cells):
        hop(3*i, 3*i+1, t1); hop(3*i+1, 3*i+2, t1); hop(3*i+2, 3*i, t1)
        for (dm, dn), ks, kd in INTERCELL:
            if (m + dm, n + dn) in c2i:
                hop(3*i + ks, 3*c2i[(m + dm, n + dn)] + kd, t2)
    return H, c2i


def verify_sec3(s):
    t1 = 0.5*s.t_sum*(1 + s.delta_b); t2 = 0.5*s.t_sum*(1 - s.delta_b)
    rng = np.random.default_rng(7)
    err = 0.0
    for _ in range(400):                       # Thm 3.1 at random k (k.a1, k.a2 uniform)
        k1, k2 = rng.uniform(-math.pi, math.pi, 2); k3 = k2 - k1
        Hk = -np.array([[0, t1 + t2*np.exp(-1j*k1), t1 + t2*np.exp(-1j*k2)],
                        [t1 + t2*np.exp(1j*k1), 0, t1 + t2*np.exp(-1j*k3)],
                        [t1 + t2*np.exp(1j*k2), t1 + t2*np.exp(1j*k3), 0]])
        Lam = 3 + 2*(math.cos(k1) + math.cos(k2) + math.cos(k3))
        r = math.sqrt(2.25*(t1 - t2)**2 + t1*t2*Lam)
        ana = np.sort([t1 + t2, -(t1 + t2)/2 + r, -(t1 + t2)/2 - r])
        err = max(err, float(np.abs(np.linalg.eigvalsh(Hk) - ana).max()))
    assert err < 1e-12
    gap_K = 3*abs(t1 - t2)
    cells = hex_cells(3)                         # Thm 3.2(ii): CLS on an internal hexagon
    H, c2i = kagome_H(cells, t1, t2)
    ring = [(3*c2i[(0, 0)]+1, 1), (3*c2i[(0, 0)]+2, -1), (3*c2i[(0, 1)]+0, 1),
            (3*c2i[(0, 1)]+1, -1), (3*c2i[(1, 0)]+2, 1), (3*c2i[(1, 0)]+0, -1)]
    psi = np.zeros(H.shape[0])
    for v, sg in ring:
        psi[v] = sg/math.sqrt(6)
    res = float(np.linalg.norm(H @ psi - (t1 + t2)*psi))
    assert res < 1e-13
    # phase of the lowest band on the R_hex flake cut along complete up-triangle cells
    flake = hex_cells(s.R_hex)
    lo = -(t1 + t2)/2 - 1.5*abs(t1 - t2); hi = -(t1 + t2)/2 + 1.5*abs(t1 - t2)
    phase = {}
    for db in (s.delta_b, -s.delta_b):
        a, b = 0.5*s.t_sum*(1 + db), 0.5*s.t_sum*(1 - db)
        ev = np.linalg.eigvalsh(kagome_H(flake, a, b)[0])
        phase[db] = (int(np.sum(ev <= lo + 1e-9)), int(np.sum((ev > lo + 1e-9) & (ev < hi - 1e-9))))
    below, ingap = phase[s.delta_b]
    assert below == len(flake) and ingap == 0         # trivial (atomic) phase for t1 > t2
    print(f"[Sec.3] Thm3.1 max|E_num-E_formula| over 400 k <= {up(err, 2)}; gap at K = {gap_K:.4f}; "
          f"Thm3.2 CLS residual <= {up(res, 2)}")
    print(f"[Sec.3] {len(flake)}-cell flake: delta_b={s.delta_b:+.2f}: {below} states below gap, {ingap} in gap "
          f"(trivial); delta_b={-s.delta_b:+.2f}: {phase[-s.delta_b][0]} below, {phase[-s.delta_b][1]} in gap (obstructed)")


# ============================== Section 4 ==============================
def verify_sec4(s):
    a2, rx, ry, rc, eta = s.a2_mm, s.rx_mm, s.ry_mm, s.rho_c, s.eta_r
    ab = 0.5*(1 - s.delta_b); d_rel = (s.a1_mm - a2)/a2
    phi_inv = (math.sqrt(5) - 1)/2; phi_inv2 = phi_inv**2; s32 = math.sqrt(3)/2
    U = 2.0**-53
    # (1) intracell phase offsets are cell-independent constants
    D21 = (2*math.pi*(ab*phi_inv + 1/3)) % (2*math.pi)
    D31 = (2*math.pi*(ab*(phi_inv/2 + s32*phi_inv2) + 2/3)) % (2*math.pi)
    C_up = np.array([[math.cos(D21) - 1, math.cos(D31) - 1], [math.sin(D21), math.sin(D31)]])
    qnorm = 2*math.pi*math.hypot(phi_inv, phi_inv2)

    def ref(m, n, k):
        x = a2*(m + 0.5*n + np.where(k == 2, ab, np.where(k == 3, 0.5*ab, 0.0)))
        y = a2*s32*(n + np.where(k == 3, ab, 0.0))
        return x, y

    def vmap(m, n, k):
        xr, yr = ref(m, n, k)
        rho = np.hypot(xr/rx, yr/ry); th = np.arctan2(yr/ry, xr/rx)
        u = np.clip((rho - rc)/(1 - rc), 0.0, 1.0)
        R = np.where(rho <= rc, rho, np.where(rho <= 1.0, rho + d_rel*(1 - rc)*(u**6 - 3*u**5 + 2.5*u**4),
                                              1 + 0.5*d_rel*(1 - rc) + (1 + d_rel)*(rho - 1)))
        inside = (u > 0) & (u < 1)
        w = np.where(inside, 16*u**2*(1 - u)**2, 0.0)
        psi = 2*math.pi*phi_inv*(m*m + m*n + n*n) + (2*math.pi/a2)*(phi_inv*xr + phi_inv2*yr) + 2*math.pi*(k - 1)/3
        f = np.where(rho > 0, R/np.where(rho > 0, rho, 1.0), 1.0)
        sc = np.where(inside, eta*a2*f*w, 0.0)
        X0, Y0 = rx*R*np.cos(th), ry*R*np.sin(th)
        return dict(X0=X0, Y0=Y0, dx=sc*np.cos(psi), dy=sc*np.sin(psi), inside=inside, f=f,
                    big=np.maximum(np.abs(X0), np.abs(Y0)))

    mm = int(math.ceil(rx/a2 + ry/(a2*math.sqrt(3)))) + 3
    nn = int(math.ceil(ry/(a2*s32))) + 3
    M, N = np.meshgrid(np.arange(-mm, mm + 1), np.arange(-nn, nn + 1), indexing='ij')
    M, N = M.ravel(), N.ravel()
    one = np.ones_like(M)
    xa, ya = ref(M, N, one); rho_a = np.hypot(xa/rx, ya/ry)
    v38_sel = (rho_a >= rc) & (rho_a <= 1.0)       # anchor-vertex rule used in v3.8
    ell = {'up': ab*a2, 'dn': (1 - ab)*a2}
    res = {}
    for fam in ('up', 'dn'):
        V = ([vmap(M, N, one*k) for k in (1, 2, 3)] if fam == 'up' else
             [vmap(M, N, 3*one), vmap(M, N + 1, one), vmap(M - 1, N + 1, 2*one)])
        E0 = np.array([[V[1]['X0'] - V[0]['X0'], V[2]['X0'] - V[0]['X0']],
                       [V[1]['Y0'] - V[0]['Y0'], V[2]['Y0'] - V[0]['Y0']]])
        dE = np.array([[V[1]['dx'] - V[0]['dx'], V[2]['dx'] - V[0]['dx']],
                       [V[1]['dy'] - V[0]['dy'], V[2]['dy'] - V[0]['dy']]])
        sel = V[0]['inside'] | V[1]['inside'] | V[2]['inside']       # every triangle with a perturbed vertex
        det = lambda A: A[0, 0]*A[1, 1] - A[0, 1]*A[1, 0]
        d0 = det(E0)
        inv = np.array([[E0[1, 1], -E0[0, 1]], [-E0[1, 0], E0[0, 0]]])/d0
        Mx = np.einsum('ijt,jkt->ikt', inv, dE)
        fr = (Mx**2).sum((0, 1)); dm = det(Mx)
        nrm = np.sqrt(0.5*(fr + np.sqrt(np.maximum(0, fr**2 - 4*dm**2))))
        dIM = (1 + Mx[0, 0])*(1 + Mx[1, 1]) - Mx[0, 1]*Mx[1, 0]
        E = E0 + dE; dE_ = det(E)
        fr0 = (E0**2).sum((0, 1)); smin0 = np.abs(d0)/np.sqrt(0.5*(fr0 + np.sqrt(np.maximum(0, fr0**2 - 4*d0**2))))
        fbar = (V[0]['f'] + V[1]['f'] + V[2]['f'])/3
        ratio = (1/smin0)/(math.sqrt(2)/(ell[fam]*fbar))
        big = np.maximum.reduce([V[i]['big'] for i in range(3)])
        ce = 2*64*U*big + 64*U*ell[fam]                       # generous per-entry error of E
        Emax = np.abs(E).max((0, 1))
        derr = 2*(2*Emax*ce + ce**2) + 4*U*Emax**2
        dref = s32*ell[fam]**2
        res[fam] = dict(n=int(sel.sum()), n_v38=int(v38_sel.sum()), missed=int((sel & ~v38_sel).sum()),
                        maxM=float(nrm[sel].max()), min_dIM=float(dIM[sel].min()),
                        min_ratio=float((dE_/dref)[sel].min()), min_d0=float((d0/dref)[sel].min()),
                        max_inv=float(ratio[sel].max()), margin=float((dE_/derr)[sel].min()))
        assert res[fam]['maxM'] < 1 and res[fam]['min_dIM'] > 0 and res[fam]['min_d0'] > 0 and res[fam]['margin'] > 1e6

    # first-order (a2 -> 0) supremum: M ~ eta*W*(a2/ell)*T*(I - beta*D e e^T D^-1)*[chords]
    Dm, Di = np.array([rx, ry]), np.array([1/rx, 1/ry])
    T = {'up': np.linalg.inv(np.array([[1, 0.5], [0, s32]])), 'dn': np.linalg.inv(np.array([[0.5, -0.5], [s32, s32]]))}
    def n2(A):  # spectral norm of stacked 2x2 matrices A[...,2,2]
        F = (A**2).sum((-1, -2)); d = A[..., 0, 0]*A[..., 1, 1] - A[..., 0, 1]*A[..., 1, 0]
        return np.sqrt(0.5*(F + np.sqrt(np.maximum(0, F**2 - 4*d**2))))
    def P_of(u, th):
        rho = rc + u*(1 - rc)
        R = rho + d_rel*(1 - rc)*(u**6 - 3*u**5 + 2.5*u**4); Rp = 1 + d_rel*(6*u**5 - 15*u**4 + 10*u**3)
        beta = 1 - (R/rho)/Rp
        e = np.stack([np.cos(th), np.sin(th)], -1)
        Pm = np.eye(2) - beta[..., None, None]*np.einsum('...i,...j->...ij', Dm*e, Di*e)
        return 16*u**2*(1 - u)**2, Pm
    def sup_dn(us, ths):
        uu, tt = np.meshgrid(us, ths, indexing='ij'); W, Pm = P_of(uu, tt)
        val = W*n2(T['dn'] @ Pm)*2*math.sqrt(2)*eta*a2/ell['dn']
        i = np.unravel_index(np.argmax(val), val.shape); return float(val[i]), us[i[0]], ths[i[1]]
    def sup_up(us, ths, ps):
        uu, tt, pp = np.meshgrid(us, ths, ps, indexing='ij'); W, Pm = P_of(uu, tt)
        Rot = np.stack([np.stack([np.cos(pp), -np.sin(pp)], -1), np.stack([np.sin(pp), np.cos(pp)], -1)], -2)
        val = W*n2(T['up'] @ Pm @ Rot @ C_up)*eta*a2/ell['up']
        i = np.unravel_index(np.argmax(val), val.shape); return float(val[i]), us[i[0]], ths[i[1]], ps[i[2]]
    v, u0, t0 = sup_dn(np.linspace(0.01, 0.99, 491), np.linspace(-math.pi, math.pi, 1441))
    for h in (0.01, 0.001):
        v, u0, t0 = sup_dn(np.linspace(u0 - h, u0 + h, 201), np.linspace(t0 - 5*h, t0 + 5*h, 201))
    fo_dn = v
    v, u0, t0, p0 = sup_up(np.linspace(0.05, 0.95, 61), np.linspace(-math.pi, math.pi, 145), np.linspace(-math.pi, math.pi, 145))
    for h in (0.02, 0.002, 0.0002):
        v, u0, t0, p0 = sup_up(np.linspace(u0 - h, u0 + h, 41), np.linspace(t0 - 2*h, t0 + 2*h, 41), np.linspace(p0 - 2*h, p0 + 2*h, 41))
    fo_up = v
    mu = 0.5*(ry/rx + rx/ry)
    print(f"[Sec.4] |q_phi| a2 = {qnorm:.4f}; intracell offsets psi2-psi1 = {math.degrees(D21):.2f} deg, "
          f"psi3-psi1 = {math.degrees(D31):.2f} deg; ||C_up||_2 = {np.linalg.norm(C_up, 2):.4f}")
    for fam, name in (('up', 'up  '), ('dn', 'down')):
        r = res[fam]
        print(f"[Sec.4] {name}: {r['n']} perturbed triangles ({r['missed']} not in v3.8 anchor rule of {r['n_v38']}); "
              f"max||E0^-1 dE|| = {r['maxM']:.5f}; min det(I+M) = {r['min_dIM']:.5f}; "
              f"min det(E)/det_ref = {r['min_ratio']:.4f}; min det(E0)/det_ref = {r['min_d0']:.4f}")
        print(f"[Sec.4] {name}: max ||E0^-1|| / (sqrt2/(ell R/rho)) = {r['max_inv']:.4f}; "
              f"min det(E)/float-error bound >= {dn(r['margin'], 2)}")
    print(f"[Sec.4] first-order sup: up {fo_up:.4f}, down {fo_dn:.4f}; rigorous first-order bound 4*mu*eta*a2/ell "
          f"(mu={mu:.3f}): up {4*mu*eta/ab:.4f}, down {4*mu*eta/(1 - ab):.4f}")
    return res


# ============================== Section 5 ==============================
class Network:
    def __init__(self, s):
        self.s = s
        self.cells = hex_cells(s.R_hex)
        self.c2i = {c: i for i, c in enumerate(self.cells)}
        self.N = len(self.cells)
        depth = lambda c: max(abs(c[0]), abs(c[1]), abs(c[0] + c[1]))
        self.int_cells = [i for i, c in enumerate(self.cells) if depth(c) < s.R_hex]
        self.bnd_cells = [i for i, c in enumerate(self.cells) if depth(c) == s.R_hex]
        self.I = np.array([3*i + k for i in self.int_cells for k in range(3)])
        self.B = np.array([3*i + k for i in self.bnd_cells for k in range(3)])
        self.N_I = len(self.int_cells)
        self.edges = []
        for i, (m, n) in enumerate(self.cells):
            self.edges += [(3*i, 3*i + 1, i, i, 1), (3*i + 1, 3*i + 2, i, i, 1), (3*i + 2, 3*i, i, i, 1)]
            for (dm, dn), ks, kd in INTERCELL:
                if (m + dm, n + dn) in self.c2i:
                    j = self.c2i[(m + dm, n + dn)]
                    self.edges.append((3*i + ks, 3*j + kd, i, j, 2))
        self.m = np.array([self.cells[i][0] for i in self.int_cells])
        self.n = np.array([self.cells[i][1] for i in self.int_cells])
        self.p, self.q = self.m + self.n, self.m - self.n
        self.pos = {(int(a), int(b)): c for c, (a, b) in enumerate(zip(self.m, self.n))}
        # chord families: lines of constant m, n, m+n and (Revision 4.0) m-n
        self.fam = [self.m, self.n, self.p, self.q][:s.chord_families]
        self.off, rows = [], 0
        for f in self.fam:
            self.off.append(rows - int(f.min())); rows += int(f.max() - f.min()) + 1
        self.C = np.zeros((rows, self.N_I))
        for f, o in zip(self.fam, self.off):
            self.C[f + o, np.arange(self.N_I)] = 1
        self.line_len = self.C.sum(1)
        self.cell_bonds = {i: [] for i in range(self.N)}            # intercell bonds touching each cell
        for (u, v, i, j, kind) in self.edges:
            if kind == 2:
                self.cell_bonds[i].append((u, v)); self.cell_bonds[j].append((u, v))

    def laplacian(self, state, g2_switch=True):
        """state: per-cell values in [0, 1] (length N); complex values allowed (complex-step)"""
        s = self.s
        state = np.asarray(state)
        L = np.zeros((3*self.N, 3*self.N), dtype=np.result_type(state.dtype, float))
        for (u, v, i, j, kind) in self.edges:
            g = s.g1 if kind == 1 else s.g2_base + (0.5*(state[i] + state[j])*(s.g2_on - s.g2_base) if g2_switch else 0.0)
            L[u, u] += g; L[v, v] += g; L[u, v] -= g; L[v, u] -= g
        for i in range(self.N):
            for k in range(3):
                L[3*i + k, 3*i + k] += (s.y_base + state[i]*s.y_ridge)/3.0
        return L

    def schur(self, L):
        I, B = self.I, self.B
        return L[np.ix_(B, B)] - L[np.ix_(B, I)] @ np.linalg.solve(L[np.ix_(I, I)], L[np.ix_(I, B)])

    def A_of(self, G):
        Gr = G.reshape(self.N_I, 3, -1)
        return (Gr**2).sum(1).T/3.0                     # A[b, c] = (1/3) sum_k G[3c+k, b]^2

    def gate(self, P, thr):
        on = P > thr
        ok = np.ones(self.N_I, dtype=bool)
        for f, o in zip(self.fam, self.off):
            ok &= on[f + o]
        return [int(c) for c in np.flatnonzero(ok)]

    def interior_vector(self, cells):
        v = np.zeros(self.N_I)
        for c in cells:
            v[self.pos[c]] = 1.0
        return v

    def cells_of(self, positions):
        return [(int(self.m[c]), int(self.n[c])) for c in positions]

    def state(self, cells):
        x = np.zeros(self.N)
        for c in cells:
            x[self.c2i[c]] = 1.0
        return x


def linear_model(net):
    L0 = net.laplacian(np.zeros(net.N), g2_switch=False)
    G0 = -np.linalg.solve(L0[np.ix_(net.I, net.I)], L0[np.ix_(net.I, net.B)])
    return L0, G0, net.A_of(G0)


def forward(net, L0, G0, cells, full=False):
    """Lambda(s) - Lambda(0) for ridge cells (shunt + g2 switching), without cancellation:
    G(s)^T dL_II G0, valid because interior ridges leave L_IB and L_BB unchanged."""
    I, B = net.I, net.B
    Ls = net.laplacian(net.state(cells), g2_switch=True)
    dL = Ls - L0
    assert not dL[np.ix_(I, B)].any() and not dL[np.ix_(B, B)].any()
    Gs = -np.linalg.solve(Ls[np.ix_(I, I)], Ls[np.ix_(I, B)])
    if full:
        return Gs.T @ dL[np.ix_(I, I)] @ G0
    return np.einsum('ib,ij,jb->b', Gs, dL[np.ix_(I, I)], G0)


def verify_frechet(net, L0, G0, A):
    s = net.s
    I, B = net.I, net.B
    worst = 0.0                                    # complex-step derivative of diag(Lambda), every interior cell
    h = 1e-30
    for pos, ci in enumerate(net.int_cells):
        z = np.zeros(3*net.N, dtype=complex); z[3*ci:3*ci + 3] = 1j*h/3
        d = np.diag(net.schur(L0.astype(complex) + np.diag(z))).imag/h
        nz = A[:, pos] != 0
        assert np.all(d[~nz] == 0)
        worst = max(worst, float(np.max(np.abs(d[nz] - A[nz, pos])/A[nz, pos])))
    assert worst < 1e-8
    rng = np.random.default_rng(3)                  # exact second-order remainder identity (Thm 5.1(3))
    dy = rng.uniform(0, 1e-7, net.N_I)
    dY = np.diag(np.repeat(dy/3, 3))
    st = np.zeros(net.N); st[net.int_cells] = dy/s.y_ridge
    dLam = net.schur(net.laplacian(st, g2_switch=False)) - net.schur(L0)
    LII = L0[np.ix_(I, I)]
    R2 = -G0.T @ dY @ np.linalg.solve(LII + dY, dY @ G0)
    ident = float(np.linalg.norm(dLam - (G0.T @ dY @ G0 + R2))/np.linalg.norm(dLam))
    ev = np.linalg.eigvalsh(LII)
    bnd = np.linalg.norm(G0, 2)**2*(dy.max()/3)**2/ev[0]
    assert ident < 1e-6 and np.linalg.norm(R2, 2) <= bnd
    print(f"[Sec.5] y_base={s.y_base:.0e}: Thm5.1 complex-step max rel. err over {net.N_I} columns <= {up(worst, 2)}; "
          f"remainder identity residual <= {up(ident, 2)}; ||R2|| = {np.linalg.norm(R2, 2):.2e} <= {bnd:.2e}")
    print(f"[Sec.5] y_base={s.y_base:.0e}: lambda_min(L_II) = {ev[0]:.3e} S, cond(L_II) = {ev[-1]/ev[0]:.2e}; "
          f"remainder bound at dy = y_ridge: {np.linalg.norm(G0, 2)**2*(s.y_ridge/3)**2/ev[0]:.2e} S")


def modp_eliminate(M, p, ncols):
    """Gauss-Jordan over F_p on the first ncols columns; returns (rank, reduced matrix)."""
    M = M % p
    r = 0
    for c in range(ncols):
        nz = np.flatnonzero(M[r:, c])
        if nz.size == 0:
            continue
        piv = r + nz[0]
        if piv != r:
            M[[r, piv]] = M[[piv, r]]
        M[r] = (M[r]*pow(int(M[r, c]), p - 2, p)) % p
        f = M[:, c].copy(); f[r] = 0
        M = (M - np.outer(f, M[r])) % p
        r += 1
        if r == M.shape[0]:
            break
    return r, M


def rank_exact(M):
    """exact rank of an integer matrix: fraction-free (Bareiss) elimination, exact divisions asserted"""
    A = [[int(x) for x in row] for row in M]
    rows, cols = len(A), len(A[0])
    r, prev = 0, 1
    for c in range(cols):
        piv = next((i for i in range(r, rows) if A[i][c] != 0), None)
        if piv is None:
            continue
        A[r], A[piv] = A[piv], A[r]
        for i in range(r + 1, rows):
            if A[i][c] == 0:
                for j in range(c + 1, cols):
                    num = A[i][j]*A[r][c]
                    assert num % prev == 0
                    A[i][j] = num//prev
                continue
            for j in range(c + 1, cols):
                num = A[i][j]*A[r][c] - A[i][c]*A[r][j]
                assert num % prev == 0
                A[i][j] = num//prev
            A[i][c] = 0
        prev = A[r][c]; r += 1
        if r == rows:
            break
    return r


def modular_model(net):
    """exact integer Laplacian (all parameters are exact decimals) and A_I mod p; structural row bound"""
    s = net.s
    gq, g2q, shq = Fraction(str(s.g1)), Fraction(str(s.g2_base)), Fraction(str(s.y_base))/3
    scale = math.lcm(gq.denominator, g2q.denominator, shq.denominator)
    gi, g2i, shi = int(gq*scale), int(g2q*scale), int(shq*scale)
    Lz = np.zeros((3*net.N, 3*net.N), dtype=np.int64)
    for (u, v, i, j, kind) in net.edges:
        g = gi if kind == 1 else g2i
        Lz[u, u] += g; Lz[v, v] += g; Lz[u, v] -= g; Lz[v, u] -= g
    Lz[np.diag_indices_from(Lz)] += shi
    assert np.allclose(Lz/scale, net.laplacian(np.zeros(net.N), g2_switch=False), rtol=1e-15, atol=0)
    LII, LIB = Lz[np.ix_(net.I, net.I)], Lz[np.ix_(net.I, net.B)]
    nzcols = [c for c in range(LIB.shape[1]) if LIB[:, c].any()]
    n_distinct = len({tuple(LIB[:, c]) for c in nzcols})            # rank A_I <= n_distinct
    p = 2147483647
    r, X = modp_eliminate(np.concatenate([LII, LIB], 1).astype(np.int64), p, LII.shape[0])
    assert r == LII.shape[0]
    G = X[:, LII.shape[0]:]                                           # = LII^{-1} LIB mod p
    Gr = G.reshape(net.N_I, 3, -1)
    Ap = ((Gr*Gr % p).sum(1) % p).T*pow(3, p - 2, p) % p
    rA = modp_eliminate(Ap.copy(), p, Ap.shape[1])[0]
    assert rA == n_distinct                                           # bounds meet: rank A_I exact over Q
    return dict(p=p, Ap=Ap, G=G, rA=rA, n_zero=len(net.B) - len(nzcols), n_nonzero=len(nzcols), n_distinct=n_distinct)


def verify_rank(net, mod, label):
    p, Ap, rA = mod['p'], mod['Ap'], mod['rA']
    Ci = net.C.astype(np.int64)
    rC = rank_exact(Ci)
    assert modp_eliminate(Ci.copy(), p, Ci.shape[1])[0] == rC
    rAug = modp_eliminate(np.concatenate([Ap, Ci]), p, Ap.shape[1])[0]
    assert rAug == rA + rC                                            # = upper bound rank A_I + rank C
    print(f"[Sec.5] {label}: {len(net.B)} boundary nodes, {mod['n_zero']} without interior neighbour, "
          f"{mod['n_distinct']} distinct rows -> rank A_I = {rA}; {len(net.fam)} chord families, {Ci.shape[0]} lines, "
          f"rank C = {rC}; rank [A_I; w_c C] = {rAug} of {net.N_I}; dim ker = {net.N_I - rAug} (exact)")
    return Ci, rC, rAug


def stage_b(net, L0, G0, A, mod, Ci, label, n_trials=2000, full_dtn=False):
    s = net.s
    p, Ap, Gp = mod['p'], mod['Ap'], mod['G']
    y_r, sig = s.y_ridge, s.sigma_rel
    st = np.zeros(net.N_I)
    for rc in RIDGES:
        st[net.pos[rc]] = 1.0
    cache = {}
    def fwd(on):
        key = tuple(sorted(int(c) for c in on))
        if key not in cache:
            cache[key] = forward(net, L0, G0, [net.cells[net.int_cells[c]] for c in key])
        return cache[key]
    dL = fwd(np.flatnonzero(st))
    nscale = float(np.abs(dL).max())
    w_c = nscale/y_r
    nlines = len(net.line_len)
    zmax = 1/(2*sig*math.sqrt(net.line_len.max()))
    tight = sum(Q(1/(2*sig*math.sqrt(L))) for L in net.line_len)
    cand0 = net.gate(net.C @ (st*y_r), 0.5*y_r)
    K0 = len(cand0)
    CK = net.C[:, cand0]
    cnt = CK @ st[cand0]
    pats = [np.array(b) for b in itertools.product((0, 1), repeat=K0) if np.array_equal(CK @ np.array(b), cnt)]
    i_true = [i for i, b in enumerate(pats) if np.array_equal(b, st[cand0])][0]
    rCK = modp_eliminate(Ci[:, cand0].copy(), p, K0)[0]
    ring = ((1, 0), (0, 1), (-1, 1), (-1, 0), (0, -1), (1, -1))
    loc = {(int(net.m[c]), int(net.n[c])): j for j, c in enumerate(cand0)}
    rings = []
    for (a, b) in loc:                                              # hexagonal-ring kernel vectors of C_K
        cells = [(a + dm, b + dn) for dm, dn in ring]
        if all(c in loc for c in cells):
            v = np.zeros(K0)
            for t, c in enumerate(cells):
                v[loc[c]] = (-1)**t
            if not (CK @ v).any():
                rings.append(v)
    nring = int(np.linalg.matrix_rank(np.array(rings))) if rings else 0
    assert rCK == K0 - nring                                        # rank C_K exact (mod-p lower = ring upper bound)
    rK = modp_eliminate(np.concatenate([Ap[:, cand0], Ci[:, cand0]]), p, K0)[0]
    Aaug = np.vstack([A, w_c*net.C])
    sv = np.linalg.svd(Aaug[:, cand0], compute_uv=False)
    sigs = [fwd([cand0[j] for j in np.flatnonzero(b)]) for b in pats]
    seps = [float(np.linalg.norm(sigs[i] - dL)/(sig*nscale)) for i in range(len(pats)) if i != i_true]
    lin = A @ st*y_r
    print(f"[Sec.5] {label}: chord gate {nlines} lines, p_chord <= Q({zmax:.3f}) <= {up(Q(zmax))}, FWER <= {up(nlines*Q(zmax))} "
          f"(line-length-aware <= {up(tight)}); max|dLambda| = {nscale:.4e} S, w_c = {w_c:.2e}; "
          f"||dL - A s y_r||/||dL|| = {np.linalg.norm(dL - lin)/np.linalg.norm(dL):.1f}")
    print(f"[Sec.5] {label}: K = {K0}, rank C_K = {rCK}, rank [A_K; w_c C_K] = {rK} (exact), "
          f"sigma(A_K) ratio {sv[-1]/sv[0]:.1e}; {len(pats)} binary pattern(s) share the chord data" +
          (f"; ghost separation {', '.join(f'{x:.4f}' for x in seps)} std -> any decoder errs w.p. >= "
           f"{dn(Q(min(seps)/2))}" if seps else "; the chord data determine the ridge"))
    if full_dtn:
        iu = np.triu_indices(len(net.B))
        Ff = [forward(net, L0, G0, [net.cells[net.int_cells[cand0[j]]] for j in np.flatnonzero(b)], full=True)[iu] for b in pats]
        sdf = sig*np.abs(Ff[i_true]).max()
        sepf = [np.linalg.norm(Ff[i] - Ff[i_true])/sdf for i in range(len(pats)) if i != i_true]
        Gr = Gp.reshape(net.N_I, 3, -1)
        J = np.zeros((len(iu[0]), net.N_I), dtype=np.int64)
        for c in range(net.N_I):
            acc = np.zeros(len(iu[0]), dtype=np.int64)
            for k in range(3):
                acc = (acc + Gr[c, k, iu[0]]*Gr[c, k, iu[1]] % p) % p
            J[:, c] = acc*pow(3, p - 2, p) % p
        rJ = modp_eliminate(J, p, net.N_I)[0]
        print(f"[Sec.5] {label}: full Schur matrix: linearised Jacobian rank {rJ} of {net.N_I} (exact); ghost "
              f"separation {', '.join(f'{x:.3f}' for x in sepf)} std -> decoder error >= {dn(Q(min(sepf)/2))}; "
              f"sigma(A_K) = [{sv[0]:.2e}, {sv[-1]:.2e}]")
    # Monte Carlo: same draws as Revision 3.8/3.9 (np.random.seed(0); dLambda noise then cell noise)
    def exact(cand, on_mask):
        rec = np.zeros(net.N_I); rec[[c for c, o in zip(cand, on_mask) if o]] = 1
        return bool(np.array_equal(rec, st))
    np.random.seed(0)
    ok_ls = ok_ml = 0
    Ks = []; t_ml = 0.0; max_est = 0.0
    pat_cache = {}
    for _ in range(n_trials):
        dLn = dL + np.random.normal(0, sig*nscale, size=dL.shape)
        vals = st*y_r + np.random.normal(0, sig*y_r, net.N_I)
        P = net.C @ vals
        cand = net.gate(P, 0.5*y_r); K = len(cand); Ks.append(K)
        if K == 0:
            continue
        AK = Aaug[:, cand]
        b = np.concatenate([dLn/y_r, w_c*P/y_r])
        est = np.linalg.solve(AK.T @ AK + 1e-10*np.eye(K), AK.T @ b)      # Revision-3.8 ridge least squares
        ok_ls += exact(cand, est >= 0.45)
        max_est = max(max_est, float(np.abs(est).max()))
        key = (tuple(cand), tuple(np.rint(P/y_r).astype(int)))             # maximum likelihood over
        if key not in pat_cache:                                           # chord-consistent binary patterns
            CKk = net.C[:, cand]; target = np.array(key[1])
            on = [[cand[j] for j in np.flatnonzero(bb)] for bb in itertools.product((0, 1), repeat=K)
                  if np.array_equal(CKk @ np.array(bb), target)]
            pat_cache[key] = (on, np.array([fwd(o) for o in on]))
        on, S = pat_cache[key]
        t0 = time.perf_counter()
        best = on[int(np.argmin(((S - dLn)**2).sum(1)))]
        t_ml += time.perf_counter() - t0
        rec = np.zeros(net.N_I); rec[best] = 1
        ok_ml += bool(np.array_equal(rec, st))
    Ks = np.array(Ks)
    print(f"[Sec.5] {label}: MC {n_trials} @ {20*math.log10(1/sig):.1f} dB: K in [{Ks.min()}, {Ks.max()}]; "
          f"ridge-LS (lambda=1e-10) {ok_ls}/{n_trials} (max |s_hat| <= {up(max_est, 2)}); maximum likelihood {ok_ml}/{n_trials} "
          f"({1e3*t_ml/n_trials:.3f} ms/trial select)")
    return dict(K=K0, patterns=len(pats), seps=seps, ok_ml=ok_ml, ok_ls=ok_ls)


def switching_component(net):
    """prod_d (1 - T^d) over the line directions of the active chord families: +-1 cells with zero line sums"""
    dirs = [(0, 1), (1, 0), (1, -1), (1, 1)][:net.s.chord_families]   # keep m, n, m+n, m-n constant
    comp = {(0, 0): 1}
    for d in dirs:
        new = dict(comp)
        for (a, b), v in comp.items():
            new[(a + d[0], b + d[1])] = new.get((a + d[0], b + d[1]), 0) - v
        comp = {k: v for k, v in new.items() if v != 0}
    return sorted(k for k, v in comp.items() if v > 0), sorted(k for k, v in comp.items() if v < 0)


def ghost_pairs(net, L0, G0, label):
    """Theorem 5.2(5): binary ridge pairs with identical chord data in every active family."""
    s = net.s
    plus, minus = switching_component(net)
    depth = lambda c: max(abs(c[0]), abs(c[1]), abs(c[0] + c[1]))
    def sep(RA, RB):
        va, vb = np.zeros(net.N_I), np.zeros(net.N_I)
        for c in RA: va[net.pos[c]] = 1
        for c in RB: vb[net.pos[c]] = 1
        assert np.array_equal(net.C @ va, net.C @ vb)                  # identical chord sums, all families
        sa, sb = forward(net, L0, G0, RA), forward(net, L0, G0, RB)
        return float(np.linalg.norm(sa - sb)/(s.sigma_rel*np.abs(sa).max()))
    shifts = [(a, b) for a in range(-8, 9) for b in range(-8, 9)]
    deep = lambda c, r: c in net.pos and depth(c) <= r            # r <= R_hex-2: no ridge bond touches B
    iso = [(sep([(x + a, y + b) for x, y in plus], [(x + a, y + b) for x, y in minus]), (a, b)) for a, b in shifts
           if all(deep((x + a, y + b), s.R_hex - 2) for x, y in plus + minus)]
    ring = [c for c in net.pos if depth(c) == s.R_hex - 2]           # closed loop of ridge cells at depth 2
    framed = [(sep(ring + [(x + a, y + b) for x, y in plus], ring + [(x + a, y + b) for x, y in minus]), (a, b))
              for a, b in shifts
              if all((x + a, y + b) in net.pos and depth((x + a, y + b)) < s.R_hex - 2 for x, y in plus + minus)]
    iso.sort(); framed.sort()
    print(f"[Sec.5] Thm5.2(5) {label}: {len(plus)}+{len(minus)}-cell switching component {plus} vs {minus}; "
          f"isolated (all cells >= 2 rings deep): {len(iso)} placements, min separation >= {dn(iso[0][0], 4)} std at shift {iso[0][1]}")
    print(f"[Sec.5] Thm5.2(5) {label}: inside a closed {len(ring)}-cell ridge loop: {len(framed)} placements, separation "
          f"{framed[0][0]:.1e} to <= {up(framed[-1][0], 2)} std -> any decoder errs w.p. >= {dn(Q(framed[-1][0]/2), 4)} on one of each pair")
    assert Q(framed[-1][0]/2) > 0.49 and iso[0][0] > 10
    return iso, framed




# ======================= Section 5.4 (Revision 5.1) =======================
forward_diag = forward


def verify_sec2():
    """Sections 2 and 3.1: five-phase closure, Maxwell-Garnett permittivity, g33 and wake voltage."""
    V = (0.220, 0.450, 0.050, 0.044, 0.236); rho = (1480, 180, 4200, 1450, 1.2)
    assert abs(sum(V) - 1) < 1e-12
    rho_eff = sum(v*r for v, r in zip(V, rho))
    W = [100*v*r/rho_eff for v, r in zip(V, rho)]
    eps_bt, eps_m, phi, d33, eps0 = 1700.0, 3.2, 0.20, 2.0e-12, 8.8541878128e-12
    beta = (eps_bt - eps_m)/(eps_bt + 2*eps_m)
    eps_eff = eps_m*(1 + 2*phi*beta)/(1 - phi*beta)
    g33 = d33/(eps0*eps_eff)
    V_wake = g33*1.5/3.46e-6*4e-6
    assert round(rho_eff, 1) == 680.7 and round(eps_eff, 2) == 5.58 and round(1e3*V_wake, 1) == 70.2
    print(f"[Sec.2] rho_eff = {rho_eff:.4f} kg/m^3; W_i = {', '.join(f'{w:.2f}' for w in W)} %; "
          f"[Sec.3.1] beta = {beta:.4f}, eps_eff = {eps_eff:.4f}, g33 = {1e3*g33:.2f} mV m/N, V_wake = {1e3*V_wake:.2f} mV")


def Q_inv(p):
    """inverse of the Gaussian tail Q, by bisection"""
    lo, hi = 0.0, 40.0
    for _ in range(200):
        mid = 0.5*(lo + hi)
        lo, hi = (mid, hi) if Q(mid) > p else (lo, mid)
    return 0.5*(lo + hi)


def radius(c):
    return max(abs(c[0]), abs(c[1]), abs(c[0] + c[1]))


def rank_modp(M, p=2147483647):
    M = np.asarray(M, dtype=np.int64)
    return modp_eliminate(M.copy(), p, M.shape[1])[0]


def frac_modp(x, p=2147483647):
    x = Fraction(x)
    return x.numerator % p * pow(x.denominator % p, p - 2, p) % p


def exact_laplacian(net, binary_state):
    """integer matrix scale*L(state) for a 0/1 state; all parameters are exact decimals"""
    s = net.s
    g1, g2b, g2on = Fraction(str(s.g1)), Fraction(str(s.g2_base)), Fraction(str(s.g2_on))
    yb, yr = Fraction(str(s.y_base)), Fraction(str(s.y_ridge))
    bond, vals = {}, []
    for (u, v, i, j, kind) in net.edges:
        g = g1 if kind == 1 else g2b + Fraction(int(binary_state[i]) + int(binary_state[j]), 2)*(g2on - g2b)
        bond[(u, v)] = g; vals.append(g)
    shunt = [(yb + int(binary_state[i])*yr)/3 for i in range(net.N)]
    scale = 1
    for x in vals + shunt:
        scale = math.lcm(scale, x.denominator)
    Lz = np.zeros((3*net.N, 3*net.N), dtype=np.int64)
    for (u, v), g in bond.items():
        gi = int(g*scale)
        Lz[u, u] += gi; Lz[v, v] += gi; Lz[u, v] -= gi; Lz[v, u] -= gi
    for i in range(net.N):
        for k in range(3):
            Lz[3*i + k, 3*i + k] += int(shunt[i]*scale)
    return Lz


def harmonic_modp(net, binary_state, p=2147483647):
    """X = L_II^{-1} L_IB mod p (interior potentials are G = -X)"""
    Lz = exact_laplacian(net, binary_state)
    LII, LIB = Lz[np.ix_(net.I, net.I)], Lz[np.ix_(net.I, net.B)]
    r, Mx = modp_eliminate(np.concatenate([LII, LIB], 1), p, LII.shape[0])
    assert r == LII.shape[0]
    return Mx[:, LII.shape[0]:]


def A_modp(net, p=2147483647):
    X = harmonic_modp(net, np.zeros(net.N, dtype=int), p)
    Xr = X.reshape(net.N_I, 3, -1)
    return ((Xr*Xr % p).sum(1) % p).T*pow(3, p - 2, p) % p


def structural_rows(net):
    LIB = exact_laplacian(net, np.zeros(net.N, dtype=int))[np.ix_(net.I, net.B)]
    nz = [c for c in range(LIB.shape[1]) if LIB[:, c].any()]
    return len(net.B) - len(nz), len(nz), len({tuple(LIB[:, c]) for c in nz})


def diag_jacobian(net, state_all):
    """D[b, c] = d Lambda_bb / d s_c at a (continuous) state, D = w_b^T M_c w_b (Lemma 5.5)"""
    s = net.s
    L = net.laplacian(state_all, g2_switch=True)
    I, B = net.I, net.B
    G = -np.linalg.solve(L[np.ix_(I, I)], L[np.ix_(I, B)])
    W = np.zeros((3*net.N, len(B))); W[I, :] = G; W[B, np.arange(len(B))] = 1.0
    D = np.zeros((len(B), net.N_I))
    half = 0.5*(s.g2_on - s.g2_base)
    for pos, ci in enumerate(net.int_cells):
        d = s.y_ridge*(W[3*ci:3*ci + 3, :]**2).sum(0)/3.0
        for (u, v) in net.cell_bonds[ci]:
            d = d + half*(W[u, :] - W[v, :])**2
        D[:, pos] = d
    return D, G, L


def jacobian_modp(net, binary_state, p=2147483647):
    """the same Jacobian exactly mod p at a 0/1 state"""
    s = net.s
    X = harmonic_modp(net, binary_state, p)
    W = np.zeros((3*net.N, len(net.B)), dtype=np.int64)
    W[net.I, :] = (-X) % p
    W[net.B, np.arange(len(net.B))] = 1
    yr3 = frac_modp(Fraction(str(s.y_ridge))/3, p)
    half = frac_modp((Fraction(str(s.g2_on)) - Fraction(str(s.g2_base)))/2, p)
    J = np.zeros((len(net.B), net.N_I), dtype=np.int64)
    for pos, ci in enumerate(net.int_cells):
        acc = np.zeros(len(net.B), dtype=np.int64)
        for k in range(3):
            w = W[3*ci + k, :]; acc = (acc + w*w % p) % p
        acc = acc*yr3 % p
        for (u, v) in net.cell_bonds[ci]:
            d = (W[u, :] - W[v, :]) % p
            acc = (acc + (d*d % p)*half % p) % p
        J[:, pos] = acc
    return J


def active_nodes(net):
    L0 = net.laplacian(np.zeros(net.N), g2_switch=False)
    return np.array([b for b in range(len(net.B)) if L0[np.ix_(net.I, [net.B[b]])].any()])


def consistent_patterns(CK, target, cap=64, node_limit=5_000_000):
    """all 0/1 vectors x with CK x = target (exact DFS with line-sum propagation); returns (solutions, complete?)"""
    K = CK.shape[1]
    lines_of = [np.flatnonzero(CK[:, j]) for j in range(K)]
    order = sorted(range(K), key=lambda j: -len(lines_of[j]))
    rem = np.array(target, dtype=np.int64).copy()
    free = CK.sum(1).astype(np.int64)
    if (rem < 0).any() or (rem > free).any():
        return [], True
    sols, x, nodes = [], np.zeros(K, dtype=np.int64), [0]
    def dfs(i):
        if len(sols) >= cap or nodes[0] > node_limit:
            return
        nodes[0] += 1
        if i == K:
            if not rem.any():
                sols.append(x.copy())
            return
        j = order[i]; Lj = lines_of[j]
        for v in (1, 0):
            rem[Lj] -= v; free[Lj] -= 1
            if (rem[Lj] >= 0).all() and (rem[Lj] <= free[Lj]).all():
                x[j] = v; dfs(i + 1); x[j] = 0
            rem[Lj] += v; free[Lj] += 1
    dfs(0)
    return sols, nodes[0] <= node_limit and len(sols) < cap


def gate_variants():
    """Revision 5.0 reported K = 14 for the four-family gate on the test ridge: try every family subset and threshold."""
    net = Network(Spec())
    st = net.interior_vector(RIDGES)
    fams = {"m": net.m, "n": net.n, "m+n": net.p, "m-n": net.q}
    found = {}
    for k in range(1, 5):
        for sub in itertools.combinations(fams, k):
            for thr in (0.5, 1.5, 2.5):                        # at least 1, 2 or 3 ridge cells per line
                ok = np.ones(net.N_I, dtype=bool)
                for name in sub:
                    f = fams[name]
                    counts = {v: st[f == v].sum() for v in np.unique(f)}
                    ok &= np.array([counts[v] > thr for v in f])
                found[(sub, thr)] = int(ok.sum())
    full = found[(("m", "n", "m+n", "m-n"), 0.5)]
    assert full == 16
    print(f"[Sec.5.4] gate variants: K = {full} for the four-family gate; {len(found)} family-subset/threshold variants "
          f"give K in {sorted(set(found.values()))}; K = 14 occurs: {14 in found.values()}")


def verify_monotonicity(lin):
    """Lemma 5.5: d Lambda_bb / d s_c = w_b^T M_c w_b > 0 on active nodes, = 0 on inactive ones."""
    for spec, label in ((Spec(), "design 1e-7 S"), (BASELINE, "baseline 1e-6 S")):
        net = Network(spec)
        act = active_nodes(net)
        inact = np.setdiff1d(np.arange(len(net.B)), act)
        rng = np.random.default_rng(11)
        states = {"s=0": np.zeros(net.N), "s*": net.state(RIDGES)}
        for t in range(6):
            x = np.zeros(net.N); x[net.int_cells] = rng.uniform(0, 1, net.N_I); states[f"cont{t}"] = x
        for t in range(4):
            x = np.zeros(net.N); x[net.int_cells] = (rng.uniform(0, 1, net.N_I) < 0.3); states[f"bin{t}"] = x
        mins, zero_ok, dmp_ok = {}, True, True
        for name, x in states.items():
            D, G, L = diag_jacobian(net, x)
            LII = L[np.ix_(net.I, net.I)]
            off = LII - np.diag(np.diag(LII))
            dmp_ok &= bool((off <= 0).all() and (LII.sum(1) > 0).all() and (G[:, act] > 0).all())
            zero_ok &= bool(np.abs(D[inact, :]).max() == 0)
            mins[name] = float(D[act, :].min())
        adj = {k: set() for k in range(len(net.I))}
        idx = {int(v): k for k, v in enumerate(net.I)}
        for (u, v, i, j, kind) in net.edges:
            if u in idx and v in idx:
                adj[idx[u]].add(idx[v]); adj[idx[v]].add(idx[u])
        seen, stack = {0}, [0]
        while stack:
            for w in adj[stack.pop()] - seen:
                seen.add(w); stack.append(w)
        assert dmp_ok and len(seen) == len(net.I) and min(mins.values()) > 0 and zero_ok
        print(f"[Sec.5.4] Lemma 5.5 {label}: Z-matrix, strictly diag. dominant, connected, G[:, active] > 0 at "
              f"{len(states)} states; min dLambda_bb/ds_c over {len(act)} active nodes: s=0 {mins['s=0']:.3e}, "
              f"s* {mins['s*']:.3e}, all states {min(mins.values()):.3e} S; exactly 0 on {len(inact)} inactive nodes")
    net = Network(Spec())
    rng = np.random.default_rng(5)
    worst = 0.0
    for name, x in (("s*", net.state(RIDGES)),
                    ("random", np.where(np.isin(np.arange(net.N), net.int_cells), rng.uniform(0, 1, net.N), 0.0))):
        D = diag_jacobian(net, x)[0]
        for pos in rng.choice(net.N_I, 12, replace=False):
            ci = net.int_cells[pos]
            xc = x.astype(complex); xc[ci] += 1e-30j
            d = np.diag(net.schur(net.laplacian(xc))).imag/1e-30
            nz = D[:, pos] != 0
            worst = max(worst, float(np.max(np.abs(d[nz] - D[nz, pos])/np.abs(D[nz, pos]))))
    assert worst < 1e-6
    print(f"[Sec.5.4] Lemma 5.5 formula w_b^T M_c w_b vs complex-step derivative (24 columns, 2 states): "
          f"max rel. error <= {up(worst, 2)}")
    claimed, tried = 1.054e-13, []
    for spec, lab in ((Spec(), "design"), (BASELINE, "baseline")):
        net = Network(spec); act = active_nodes(net)
        n4 = Network(replace(spec, chord_families=4)); c4 = n4.gate(n4.C @ n4.interior_vector(RIDGES), 0.5)
        rp = [net.pos[c] for c in RIDGES]
        for sname, x in (("s=0", np.zeros(net.N)), ("s*", net.state(RIDGES))):
            Da = diag_jacobian(net, x)[0][act]
            for k, v in {"min all": Da.min(), "min candidates": Da[:, c4].min(), "min ridge cells": Da[:, rp].min(),
                         "min_c max_b": Da.max(0).min(), "min all / y_ridge": Da.min()/spec.y_ridge,
                         "min candidates / y_ridge": Da[:, c4].min()/spec.y_ridge,
                         "min_c max_b / y_ridge": Da.max(0).min()/spec.y_ridge}.items():
                tried.append((abs(v/claimed - 1), f"{lab} {sname} {k}", v))
    tried.sort()
    print(f"[Sec.5.4] Rev.5.0 value 1.054e-13: not reproduced by {len(tried)} conventions; closest {tried[0][1]} = "
          f"{tried[0][2]:.4e} ({100*tried[0][0]:.0f}% off)")
    net = Network(Spec()); L0, G0 = lin[Spec().y_base][:2]
    act = active_nodes(net)
    rng = np.random.default_rng(3)
    deep = [c for c in net.pos if radius(c) <= net.s.R_hex - 2]
    integrand_ok, diff_ok, n_res = True, True, 0
    for _ in range(10):
        base = [deep[i] for i in rng.choice(len(deep), 8, replace=False)]
        extra = [c for c in deep if c not in base][rng.integers(len(deep) - 8)]
        for tt in (1e-6, 1e-4, 1e-2, 0.25, 0.5, 1.0):
            x = net.state(base); x[net.c2i[extra]] = tt
            integrand_ok &= bool((diag_jacobian(net, x)[0][act, net.pos[extra]] > 0).all())
        lo_, hi_ = forward_diag(net, L0, G0, base), forward_diag(net, L0, G0, base + [extra])
        res = np.abs(hi_[act] - lo_[act]) > 1e-8*np.maximum(np.abs(hi_[act]), np.abs(lo_[act]))
        n_res += int(res.sum()); diff_ok &= bool((hi_[act][res] > lo_[act][res]).all())
    assert integrand_ok and diff_ok
    print(f"[Sec.5.4] Lemma 5.5(2) (10 random s <= s'): integrand > 0 along every segment; "
          f"{n_res} resolvable increases, all positive")


def verify_nonlinear_rank(lin):
    """Theorem 5.6: data collapse to 45 functions; rank J(s) <= 45 everywhere, = 45 at s*."""
    for spec, label in ((Spec(), "4 fam"), (replace(Spec(), chord_families=3), "3 fam")):
        net = Network(spec)
        L0, G0 = lin[spec.y_base][:2]
        st = net.interior_vector(RIDGES)
        cand = net.gate(net.C @ st, 0.5)
        Jp = jacobian_modp(net, net.state(RIDGES).astype(int))
        Jf = diag_jacobian(net, net.state(RIDGES))[0]
        CKi = net.C[:, cand].astype(np.int64)
        r_aug, r_J, r_C = rank_modp(np.concatenate([Jp[:, cand], CKi])), rank_modp(Jp[:, cand]), rank_modp(CKi)
        w_c = float(np.abs(forward_diag(net, L0, G0, RIDGES)).max())/spec.y_ridge
        sv = np.linalg.svd(np.vstack([Jf[:, cand]/spec.y_ridge, w_c*net.C[:, cand]]), compute_uv=False)
        assert r_aug == len(cand)
        print(f"[Sec.5.4] Thm 5.6 {label}: K = {len(cand)}, rank C_K = {r_C}, rank J(s*)_K = {r_J}, "
              f"rank [J(s*)_K; w_c C_K] = {r_aug} (exact); sigma_min/sigma_max = {sv[-1]/sv[0]:.2e}")
        if label == "4 fam":
            r_full = rank_modp(Jp)
            LIB = net.laplacian(np.zeros(net.N), g2_switch=False)[np.ix_(net.I, net.B)]
            groups = {}
            for b in range(len(net.B)):
                if LIB[:, b].any():
                    groups.setdefault(tuple(LIB[:, b]), []).append(b)
            same_rows = all(np.allclose(Jf[g[0]], Jf[g[i]], rtol=1e-12, atol=0) for g in groups.values() for i in range(len(g)))
            rngJ = np.random.default_rng(9); same_data = True
            for _ in range(3):
                cells_r = [c for c in net.pos if radius(c) <= spec.R_hex - 2 and rngJ.random() < 0.15]
                fd = forward_diag(net, L0, G0, cells_r)
                same_data &= all(np.allclose(fd[g[0]], fd[g[i]], rtol=1e-10, atol=0) for g in groups.values() for i in range(len(g)))
            assert r_full == len(groups) == 45 and same_rows and same_data
            sizes = sorted(len(g) for g in groups.values())
            pair_ok = all(np.count_nonzero(LIB[:, g[0]]) == 1 for g in groups.values() if len(g) == 2)
            const_ok = True
            for _ in range(2):
                cells_r = [c for c in net.pos if radius(c) <= spec.R_hex - 2 and rngJ.random() < 0.15]
                Lr = net.laplacian(net.state(cells_r))
                X = np.linalg.solve(Lr[np.ix_(net.I, net.I)], Lr[np.ix_(net.I, net.B)])
                diagr = np.diag(Lr[np.ix_(net.B, net.B)]) - np.einsum('ib,ib->b', Lr[np.ix_(net.I, net.B)], X)
                inactive = [b for b in range(len(net.B)) if not LIB[:, b].any()]
                const_ok &= bool(np.array_equal(diagr[inactive], np.diag(net.laplacian(np.zeros(net.N))[np.ix_(net.B, net.B)])[inactive]))
            assert max(sizes) <= 2 and pair_ok and const_ok
            print(f"[Sec.5.4] Thm 5.6: the 69 active nodes form {sizes.count(2)} pairs bonded to the same single interior node "
                  f"and {sizes.count(1)} singletons; Lambda_bb of the 75 inactive nodes is independent of s (2 random ridges)")
            print(f"[Sec.5.4] Thm 5.6: rank J(s*) over all {net.N_I} cells = {r_full} (exact: mod-p lower bound = "
                  f"{len(groups)} groups of identical rows); Delta Lambda_bb identical within each group for 3 random ridges")


def verify_screening(lin):
    """Theorem 5.7: four-family switching pair inside closed hexagonal ridge loops."""
    net = Network(Spec()); L0, G0 = lin[Spec().y_base][:2]
    plus, minus = switching_component(net)
    comp = {c: 1 for c in plus}; comp.update({c: -1 for c in minus})
    mom = {(a, b): sum(v*(m**a)*(n**b) for (m, n), v in comp.items()) for a in range(5) for b in range(5 - a)}
    assert all(mom[k] == 0 for k in mom if sum(k) <= 3) and any(mom[k] != 0 for k in mom if sum(k) == 4)
    print(f"[Sec.5.4] Thm 5.7(1): switching component has {len(plus) + len(minus)} cells ({len(plus)} at +1, "
          f"{len(minus)} at -1, not 16: the shifts satisfy (0,1)+(1,0) = (1,1)); moments of order <= 3 vanish, order 4 does not")
    def sep_abs(RA, RB):
        sa, sb = forward_diag(net, L0, G0, RA), forward_diag(net, L0, G0, RB)
        return float(np.linalg.norm(sa - sb)), float(np.linalg.norm(sa - sb)/(net.s.sigma_rel*np.abs(sa).max()))
    rows = []
    for r in (6, 5, 4, 3):
        ring = [c for c in net.pos if radius(c) == r]
        recs = []
        for a in range(-8, 9):
            for b in range(-8, 9):
                A_ = [(x + a, y + b) for x, y in plus]; B_ = [(x + a, y + b) for x, y in minus]
                if all(c in net.pos and radius(c) < r for c in A_ + B_):
                    fa, fr = sep_abs(ring + A_, ring + B_); ia, ir = sep_abs(A_, B_)
                    recs.append((min(r - radius(c) for c in A_ + B_), fa, fr, fa/ia, a, b))
        recs = np.array(recs)
        rows.append((r, np.median(recs[:, 1]), np.median(recs[:, 2])))
        print(f"[Sec.5.4] Thm 5.7 loop radius {r} ({len(ring)} cells): {len(recs)} placements; median separation "
              f"{np.median(recs[:, 1]):.2e} S = {np.median(recs[:, 2]):.2e} std (max {recs[:, 2].max():.2e} std); "
              f"loop factor {np.median(recs[:, 3]):.1e}")
        if r == 6:
            print("[Sec.5.4] Thm 5.7 radius-6 loop, by depth of the pair inside the wall: " + "; ".join(
                f"{int(d)} cell(s): {int((recs[:, 0] == d).sum())} placements, median {np.median(recs[recs[:, 0] == d, 2]):.2e} std"
                for d in sorted(set(recs[:, 0]))))
            z = 2*Q_inv(0.01)                                   # d/sigma needed for P_err <= 1 %
            snr0 = 20*np.log10(1/net.s.sigma_rel)
            for tag, i in (("largest", int(np.argmax(recs[:, 2]))), ("smallest", int(np.argmin(recs[:, 2])))):
                print(f"[Sec.5.4] Thm 5.7 radius-6 loop, {tag} separation: {recs[i, 2]:.3e} std ({recs[i, 1]:.2e} S) at shift "
                      f"({int(recs[i, 4])}, {int(recs[i, 5])}), depth {int(recs[i, 0])}; P_err <= 1% needs d >= {z:.4f} std, "
                      f"i.e. SNR >= {dn(snr0 + 20*np.log10(z/recs[i, 2]), 4)} dB (now {snr0:.2f} dB)")
    absd = np.array([x[1] for x in rows]); reld = np.array([x[2] for x in rows])
    assert np.all(np.diff(absd) < 0)
    print(f"[Sec.5.4] Thm 5.7: absolute separation falls monotonically inward (log10 slope "
          f"{np.polyfit(np.arange(len(absd)), np.log10(absd), 1)[0]:.2f} per ring); in noise units monotone: "
          f"{bool(np.all(np.diff(reld) < 0))}")


def clopper_pearson(k, n, alpha=0.05):
    """exact two-sided (1 - alpha) confidence interval for a binomial proportion with k of n (k small)"""
    cdf = lambda j, p: sum(math.comb(n, i)*p**i*(1 - p)**(n - i) for i in range(j + 1))
    def solve(f):                                   # f decreasing in p on (0, 1)
        lo, hi = 0.0, 1.0
        for _ in range(100):
            mid = 0.5*(lo + hi)
            lo, hi = (mid, hi) if f(mid) > 0 else (lo, mid)
        return 0.5*(lo + hi)
    p_lo = 0.0 if k == 0 else solve(lambda p: alpha/2 - (1 - cdf(k - 1, p)))
    p_hi = solve(lambda p: cdf(k, p) - alpha/2)
    return p_lo, p_hi


DIRS6 = [(1, 0), (0, 1), (-1, 1), (-1, 0), (0, -1), (1, -1)]


def is_tree(cells):
    """connected and loop-free: the 6-neighbour adjacency graph induced on the cells is a tree"""
    cs = set(cells)
    edges = sum((c[0] + d[0], c[1] + d[1]) in cs for c in cs for d in DIRS6)//2
    seen, todo = set(), [next(iter(cs))]
    while todo:
        c = todo.pop()
        if c not in seen:
            seen.add(c); todo += [(c[0] + d[0], c[1] + d[1]) for d in DIRS6 if (c[0] + d[0], c[1] + d[1]) in cs]
    return len(seen) == len(cs) and edges == len(cs) - 1


def decode_study(net, L0, G0, rng, sampler, n_ridges, trials, label):
    """four-family gate, exact enumeration of chord-consistent patterns, ML decoding over them"""
    s = net.s
    n_unique = n_ok = n_trials = 0
    failures = []
    for k in range(n_ridges):
        ridge = sampler()
        st = net.interior_vector(ridge)
        cand = net.gate(net.C @ st, 0.5)
        sols, complete = consistent_patterns(net.C[:, cand], net.C[:, cand] @ st[cand], cap=256)
        if not complete:
            failures.append((k, ridge, len(cand), f">={len(sols)}", 0, [], []))
            n_trials += trials
            continue
        n_unique += (len(sols) == 1)
        dL = forward_diag(net, L0, G0, ridge)
        sd = s.sigma_rel*np.abs(dL).max()
        sigs = {tuple(np.flatnonzero(x)): forward_diag(net, L0, G0, net.cells_of([cand[j] for j in np.flatnonzero(x)])) for x in sols}
        keys = list(sigs); S = np.array([sigs[q] for q in keys])
        true_key = tuple(j for j, c in enumerate(cand) if st[c] > 0.5)
        ok = 0
        for _ in range(trials):
            dLn = dL + rng.normal(0, sd, size=dL.shape)
            vals = st*s.y_ridge + rng.normal(0, s.sigma_rel*s.y_ridge, net.N_I)
            P = net.C @ vals
            if net.gate(P, 0.5*s.y_ridge) != cand or not np.array_equal(np.rint(P/s.y_ridge), net.C @ st):
                continue
            ok += keys[int(np.argmin(((S - dLn)**2).sum(1)))] == true_key
        n_ok += ok; n_trials += trials
        if len(sols) > 1 or ok < trials:
            alts = [net.cells_of([cand[j] for j in q]) for q in keys if q != true_key]
            d = [float(np.linalg.norm(sigs[q] - dL)/sd) for q in keys if q != true_key]
            dS = [float(np.linalg.norm(sigs[q] - dL)) for q in keys if q != true_key]
            failures.append((k, ridge, len(cand), len(sols), ok, alts, d, dS))
    a_lo, a_hi = clopper_pearson(n_ridges - n_unique, n_ridges)
    b_lo, b_hi = clopper_pearson(n_trials - n_ok, n_trials)
    print(f"[Sec.5.4] Rem 5.8 ({label}): {n_ridges} seeded ridges: unique chord solution {n_unique}/{n_ridges} "
          f"(non-unique rate 95% CI [{dn(100*a_lo)}, {up(100*a_hi)}] %); ML exact {n_ok}/{n_trials} "
          f"(error rate 95% CI [{dn(100*b_lo)}, {up(100*b_hi)}] %)")
    for (k, ridge, K, ns, ok, alts, d, *dS) in failures:
        trees = [is_tree(a) for a in alts]
        print(f"[Sec.5.4]   ridge {k}: {len(ridge)} cells, K = {K}, {ns} chord-consistent patterns, ML {ok}/{trials}, "
              f"separations {[round(x, 3) for x in d]} std" + (f" = {[float(f'{x:.2e}') for x in dS[0]]} S; alternatives "
              f"connected and loop-free: {sum(trees)}/{len(trees)}; {trials} Q(d_min/2) = {trials*Q(min(d)/2):.1f}"
              if dS else ""))
    return n_unique, n_ok, n_trials


def ridge_study(lin, n_ridges=100, trials=200):
    """Remark 5.8: (a) seeded stroke ridges; (b) Revision 5.0's class: connected, loop-free 12-cell ridges."""
    net = Network(Spec()); L0, G0 = lin[Spec().y_base][:2]
    inner = [c for c in net.pos if radius(c) <= 5]
    inner_set = set(inner)

    rng = np.random.default_rng(2026)
    def sample_strokes():
        cells = set()
        for _ in range(int(rng.integers(2, 4))):
            c = inner[int(rng.integers(len(inner)))]; d = int(rng.integers(6))
            for _ in range(int(rng.integers(4, 9))):
                if c in net.pos and radius(c) <= 5:
                    cells.add(c)
                if rng.random() < 0.25:
                    d = (d + int(rng.choice([-1, 1]))) % 6
                c = (c[0] + DIRS6[d][0], c[1] + DIRS6[d][1])
        return sorted(cells)
    decode_study(net, L0, G0, rng, sample_strokes, n_ridges, trials, "strokes")

    rng_t = np.random.default_rng(1205)
    def sample_tree(size=12):
        while True:
            cells = {inner[int(rng_t.integers(len(inner)))]}
            while len(cells) < size:
                front = sorted({(c[0] + d[0], c[1] + d[1]) for c in cells for d in DIRS6} - cells)
                front = [f for f in front if f in inner_set
                         and sum((f[0] + d[0], f[1] + d[1]) in cells for d in DIRS6) == 1]
                if not front:
                    break
                cells.add(front[int(rng_t.integers(len(front)))])
            if len(cells) == size:
                assert is_tree(cells)
                return sorted(cells)
    decode_study(net, L0, G0, rng_t, sample_tree, n_ridges, trials, "connected loop-free, 12 cells")


def rank_family():
    """Proposition 5.9: exact ranks for R_hex = 2..8."""
    print("[Sec.5.4] Prop 5.9:  R | interior | active | distinct | rank A_I | rank C3 | rank C4 | rank aug3 | rank aug4")
    fmt = lambda lo, hi: f"{lo}" if lo == hi else f"[{lo},{hi}]"
    for Rh in range(2, 9):
        net3, net4 = Network(replace(BASELINE, R_hex=Rh)), Network(replace(BASELINE, R_hex=Rh, chord_families=4))
        Ap = A_modp(net3)
        n0, nnz, ndist = structural_rows(net3)
        rA = rank_modp(Ap)
        rC3, rC4 = rank_exact(net3.C.astype(int)), rank_exact(net4.C.astype(int))
        r3 = rank_modp(np.concatenate([Ap, net3.C.astype(np.int64)])); r4 = rank_modp(np.concatenate([Ap, net4.C.astype(np.int64)]))
        hiA = min(ndist, net3.N_I)
        hi3, hi4 = min(hiA + rC3, net3.N_I), min(hiA + rC4, net3.N_I)
        if r3 < hi3:
            Ap2 = A_modp(net3, 2147483629)
            r3 = max(r3, rank_modp(np.concatenate([Ap2, net3.C.astype(np.int64)]), 2147483629))
        assert rA == hiA and r4 == hi4
        print(f"[Sec.5.4] Prop 5.9: {Rh:2d} | {net3.N_I:8d} | {nnz:6d} | {ndist:8d} | {fmt(rA, hiA):>8s} | {rC3:7d} | "
              f"{rC4:7d} | {fmt(r3, hi3):>9s} | {fmt(r4, hi4):>9s}")
        assert (nnz, ndist, rC3, rC4) == (9*Rh - 3, 6*Rh - 3, 6*Rh - 6, 10*Rh - 13) and net3.N_I == 3*Rh*Rh - 3*Rh + 1
        assert (Rh < 5 or r3 == 12*Rh - 9) and (Rh < 6 or r4 == 16*Rh - 16)
    print("[Sec.5.4] Prop 5.9: closed forms hold for 2 <= R <= 8: N_I = 3R^2-3R+1, active = 9R-3, distinct = 6R-3, "
          "rank C3 = 6R-6, rank C4 = 10R-13; rank aug3 = 12R-9 (R >= 5), rank aug4 = 16R-16 (R >= 6)")


# ======================= Revision 5.2: per-line split chords (Section 5.5) =======================
FAM4 = ("m", "n", "p", "q")
PRIMES = (2147483647, 2147483629, 2147483587, 2147483579)          # 2^31 - 1, -19, -61, -69


def split_rows(net, fams, k):
    """mod-k split chords: one 0/1 row per (family, line, residue r) with the cells of the line whose
    position along it (a unit-step coordinate: n on m-lines, m on the other three) is r mod k"""
    val = {"m": net.m, "n": net.n, "p": net.p, "q": net.q}
    pos = {"m": net.n, "n": net.m, "p": net.m, "q": net.m}
    rows = []
    for f in fams:
        for v in np.unique(val[f]):
            on = val[f] == v
            for r in range(k):
                sel = on & (pos[f] % k == r)
                if sel.any():
                    rows.append(sel.astype(np.int64))
    return np.array(rows)


def T_count(k, R):
    """number of translates of the k-dilated switching component inside the interior (Theorem 5.11)"""
    return 3*R*R - (10*k + 3)*R + 8*k*k + 5*k + 1 if R >= 2*k + 1 else 0


def dilated_translates(net, k):
    plus, minus = switching_component(Network(replace(net.s, chord_families=4)))
    out = []
    for a in range(-4*net.s.R_hex, 4*net.s.R_hex + 1):
        for b in range(-4*net.s.R_hex, 4*net.s.R_hex + 1):
            P_ = [(k*x + a, k*y + b) for x, y in plus]; M_ = [(k*x + a, k*y + b) for x, y in minus]
            if all(c in net.pos for c in P_ + M_):
                out.append((P_, M_))
    return out


def as_matrix(net, trans):
    Z = np.zeros((len(trans), net.N_I), dtype=np.int64)
    for i, (P_, M_) in enumerate(trans):
        for c in P_: Z[i, net.pos[c]] += 1
        for c in M_: Z[i, net.pos[c]] -= 1
    return Z


def verify_split_kernels():
    """Theorem 5.11: kernels of the split chords are spanned by translates of the dilated component."""
    net = Network(replace(Spec(), chord_families=4))
    Z = {}
    for k in (1, 2, 3, 4, 5):
        C = split_rows(net, FAM4, k)
        Zk = as_matrix(net, dilated_translates(net, k)); Z[k] = Zk
        rc = rank_exact(C.astype(int))
        if len(Zk):
            assert not (C @ Zk.T).any() and (np.abs(Zk).sum(1) == 8).all() and rank_exact(Zk.astype(int)) == len(Zk)
        assert len(Zk) == T_count(k, 8) == net.N_I - rc
        print(f"[Sec.5.5] Thm 5.11 k={k}: {C.shape[0]} split-chord rows, rank C^(k) = {rc} (exact); {len(Zk)} = T_k(8) translates "
              f"of the 8-cell k-dilated component lie in the kernel, are independent and span it (dim {net.N_I - rc})")
    C1, C2, C3 = (split_rows(net, FAM4, k) for k in (1, 2, 3))
    r1 = rank_exact(Z[1].astype(int))
    assert rank_exact(np.vstack([Z[1], Z[2], Z[3]]).astype(int)) == r1
    nz32 = sorted({int((C2 @ z != 0).sum()) for z in Z[3]}); nz23 = sorted({int((C3 @ z != 0).sum()) for z in Z[2]})
    assert nz32 == [24] and nz23 == [24]
    z = Z[1][0]
    vis = [int((C @ z != 0).sum()) for C in (C1, C2, C3)]
    print(f"[Sec.5.5] Thm 5.11: k=2 and k=3 translates lie in the span of the k=1 translates; kernels for k=2 and k=3 are not "
          f"nested (each z_3 translate has {nz32[0]} non-zero parity sums, each z_2 translate {nz23[0]} non-zero mod-3 sums); "
          f"the undilated component has {vis[0]}/{C1.shape[0]}, {vis[1]}/{C2.shape[0]} and {vis[2]}/{C3.shape[0]} non-zero split sums")


def verify_split_ranks():
    """Proposition 5.12: exact ranks of [A_I; C^(k)] at R_hex = 8, and the mod-3 family subsets."""
    for spec, lab in ((Spec(), "design"), (BASELINE, "baseline")):
        net = Network(replace(spec, chord_families=4))
        Ap, Ap2 = A_modp(net, PRIMES[0]), A_modp(net, PRIMES[1])
        rA = rank_modp(Ap)
        res = []
        for k in (1, 2, 3):
            C = split_rows(net, FAM4, k)
            rc = rank_exact(C.astype(int))
            lo = max(rank_modp(np.concatenate([Ap, C]), PRIMES[0]), rank_modp(np.concatenate([Ap2, C]), PRIMES[1]))
            assert lo == min(net.N_I, rA + rc)
            res.append(f"k={k}: rank C^(k) = {rc}, rank [A_I; C^(k)] = {lo}")
        print(f"[Sec.5.5] Prop 5.12 {lab} (y_base={spec.y_base:g}): " + "; ".join(res) + " (exact)")
    net = Network(replace(Spec(), chord_families=4))
    Ap, Ap2 = A_modp(net, PRIMES[0]), A_modp(net, PRIMES[1]); rA = rank_modp(Ap)
    out = []
    for size in (1, 2, 3, 4):
        for sub in itertools.combinations(FAM4, size):
            C = split_rows(net, sub, 3)
            rc = rank_exact(C.astype(int))
            lo = max(rank_modp(np.concatenate([Ap, C]), PRIMES[0]), rank_modp(np.concatenate([Ap2, C]), PRIMES[1]))
            assert lo == min(net.N_I, rA + rc)
            out.append(f"{''.join(sub)} {rc}/{lo}")
    print("[Sec.5.5] Prop 5.12 mod-3 family subsets, rank C | rank [A_I; C] (exact): " + ", ".join(out))


def verify_rcrit():
    """Corollary 5.15: R_crit(k) formula matches observed transitions."""
    import math
    def R_crit(k):
        return int((10*k + 9 + math.sqrt(4*k*k + 120*k + 33)) / 6) + 1
    def R_unc(k):
        return int((10*k + 21 + math.sqrt(4*k*k + 360*k + 429)) / 6) + 1
    def T(k, R):
        return 3*R*R - (10*k + 3)*R + 8*k*k + 5*k + 1 if R >= 2*k + 1 else 0
    def brute(k, d):  # smallest R0 with T_k(R) > d(R) for every R >= R0 (quadratic: beyond 4k+60 nothing changes)
        return 1 + max(R for R in range(1, 4*k + 60) if T(k, R) <= d(R))
    expected = {1: 6, 2: 8, 3: 10, 4: 13, 5: 15}
    for k, want in expected.items():
        got = R_crit(k)
        assert got == want, f"R_crit({k}) = {got}, expected {want}"
    for k in range(1, 501):
        assert R_crit(k) == brute(k, lambda R: 6*R - 3), k
        assert R_unc(k) == brute(k, lambda R: 18*R), k
        assert (R_crit(k) - 2*k == 7) == (k >= 58), k
    assert R_unc(3) == 16  # matches the R >= 16 of Theorem 5.14
    # asymptotic check: additive constant approaches 7
    for k in (100, 1000, 10000):
        gap = R_crit(k) - 2 * k
        assert 6 <= gap <= 7, f"R_crit({k}) - 2k = {gap}, expected 6..7"
    print(f"[Sec.5.5] Cor 5.15: R_crit(k) verified for k=1..5 "
          f"(1:6, 2:8, 3:10, 4:13, 5:15); R_crit(10000) - 20000 = {R_crit(10000)-20000} (asymptote 7)")


def verify_split_conditioning():
    """Remark 5.16: singular values of the stacked linear operators."""
    sv = lambda M: np.linalg.svd(M, compute_uv=False)
    for yb in (1e-7, 1e-6):
        net = Network(replace(Spec(), chord_families=4, y_base=yb))
        A = np.asarray(linear_model(net)[2], float)
        C2, C3 = split_rows(net, FAM4, 2), split_rows(net, FAM4, 3)
        s2 = sv(np.vstack([A, C2]))
        M = np.vstack([A, C3]); s3 = sv(M)
        Mn = M[np.linalg.norm(M, axis=1) > 0]
        sr = sv(Mn/np.linalg.norm(Mn, axis=1)[:, None]); scol = sv(M/np.linalg.norm(M, axis=0))
        _, _, Vt = np.linalg.svd(C3.astype(float)); sa = sv(A @ Vt[153:].T)
        print(f"[Sec.5.5] Rem 5.16 y_base={yb:g}: [A_I; C^(2)] sigma_1 = {s2[0]:.3e}, sigma_163 = {s2[162]:.3e}, "
              f"sigma_164 = {s2[163]:.3e}; [A_I; C^(3)] sigma_max = {s3[0]:.3e}, sigma_min = {s3[-1]:.3e}, "
              f"kappa = {s3[0]/s3[-1]:.0f} (column-equilibrated {scol[0]/scol[-1]:.0f}, row-equilibrated {sr[0]/sr[-1]:.0f}); "
              f"A_I on ker C^(3): singular values {sa[0]:.2e} .. {sa[-1]:.2e}")
        trip = []
        for sub in (("m", "n", "q"), ("m", "p", "q"), ("n", "p", "q")):
            st = sv(np.vstack([A, split_rows(net, sub, 3)]))
            trip.append(f"{''.join(sub)} {st[0]/st[-1]:.2e}")
        print(f"[Sec.5.5] Rem 5.16 y_base={yb:g}: kappa of [A_I; C^(3)] on the full-rank three-family subsets: " + ", ".join(trip))


def verify_split_screening():
    """Theorem 5.13: dilated-component pairs, isolated and inside closed ridge loops (exact identity, any ridge)."""
    net = Network(replace(Spec(), chord_families=4))
    L0f = net.laplacian(np.zeros(net.N))
    def W_of(L):
        W = np.zeros((L.shape[0], len(net.B)))
        W[np.ix_(net.I, np.arange(len(net.B)))] = -np.linalg.solve(L[np.ix_(net.I, net.I)], L[np.ix_(net.I, net.B)])
        W[net.B, np.arange(len(net.B))] = 1.0
        return W
    W0 = W_of(L0f)
    def fwd(cells):                          # diag(Lambda(s) - Lambda(0)) = diag(W(s)^T (L(s) - L(0)) W(0))
        L = net.laplacian(net.state(cells))
        return np.einsum('ib,ib->b', W_of(L), (L - L0f) @ W0)
    L0, G0 = linear_model(net)[:2]
    ref = forward_diag(net, L0, G0, RIDGES)
    assert np.abs(fwd(RIDGES) - ref).max() < 1e-9*np.abs(ref).max()
    def sep(RA, RB):
        a, b = fwd(RA), fwd(RB)
        return float(np.linalg.norm(a - b)), float(np.linalg.norm(a - b)/(net.s.sigma_rel*np.abs(a).max()))
    for k, rr in ((2, 6), (3, 7)):
        ring = [c for c in net.pos if radius(c) == rr]
        tr = dilated_translates(net, k)
        iso = np.array([sep(P_, M_)[1] for P_, M_ in tr])
        enc = np.array([sep(ring + P_, ring + M_) for P_, M_ in tr if all(radius(c) < rr for c in P_ + M_)])
        print(f"[Sec.5.5] Thm 5.13 k={k}: {len(tr)} isolated pairs separated by {dn(iso.min())} .. {up(iso.max())} std; inside the "
              f"closed radius-{rr} ring ({len(ring)} cells) {len(enc)} pairs at {dn(enc[:, 1].min())} .. {up(enc[:, 1].max())} std "
              f"({dn(enc[:, 0].min(), 2)} .. {up(enc[:, 0].max(), 2)} S) -> every decoder errs w.p. >= "
              f"{dn(Q(enc[:, 1].max()/2), 4)} on one ridge of each pair")


def verify_split_scaling():
    """Theorem 5.14: mod-3 split chords plus boundary diagonal, R_hex = 2..15."""
    rows, keep = [], {}
    for R in range(2, 12):
        net = Network(replace(Spec(), R_hex=R, chord_families=4))
        C = split_rows(net, FAM4, 3)
        rc = rank_exact(C.astype(int))
        d = structural_rows(net)[2]
        Ap = A_modp(net)
        lo, hi = rank_modp(np.concatenate([Ap, C])), min(net.N_I, d + rc)
        T = len(dilated_translates(net, 3))
        assert T == T_count(3, R) == net.N_I - rc and d == 6*R - 3
        assert (R <= 9 and lo == net.N_I) or (R >= 10 and hi < net.N_I)
        rows.append(f"R={R}: {lo}" + ("" if lo == hi else f"..{hi}") + f"/{net.N_I}")
        keep[R] = (rc, d)
    print("[Sec.5.5] Thm 5.14 rank [A_I; C^(3)] / N_I: " + ", ".join(rows) + "  (full for R <= 9, deficient for R = 10, 11)")
    for R in range(12, 16):
        net = Network(replace(Spec(), R_hex=R, chord_families=4))
        d = structural_rows(net)[2]
        assert d == 6*R - 3 and T_count(3, R) - d == 3*R*R - 39*R + 91 > 0
    assert all(T_count(3, R) - 18*R == 3*R*R - 51*R + 88 > 0 for R in range(16, 200))
    print("[Sec.5.5] Thm 5.14: d(R) = 6R - 3 distinct L_IB columns for 2 <= R <= 15, and T_3(R) - d(R) = 3R^2 - 39R + 91 > 0 "
          "for 10 <= R <= 15; T_3(R) - 18R = 3R^2 - 51R + 88 > 0 for R >= 16 (18R boundary nodes)")
    net = Network(replace(Spec(), R_hex=10, chord_families=4))
    K = as_matrix(net, dilated_translates(net, 3)).T
    ranks = []
    for p in PRIMES:
        Ap = A_modp(net, p)
        AK = np.zeros((Ap.shape[0], K.shape[1]), dtype=np.int64)
        for j in range(K.shape[1]):
            for i in np.flatnonzero(K[:, j]):
                AK[:, j] = (AK[:, j] + Ap[:, i]*(int(K[i, j]) % p)) % p
        ranks.append(rank_modp(AK, p))
    A = np.asarray(linear_model(net)[2], float)
    s = np.linalg.svd(A @ K, compute_uv=False)
    rc10, d10 = keep[10]
    lo10, hi10 = rc10 + max(ranks), rc10 + min(d10, K.shape[1])
    print(f"[Sec.5.5] Thm 5.14 R=10: rank [A_I; C^(3)] = rank C^(3) ({rc10}) + rank(A_I K) with K the {K.shape[1]} kernel translates; "
          f"rank(A_I K) mod four primes = {ranks}; float64 singular values of A_I K {s[0]:.2e} .. {s[54]:.2e}, then "
          f"{s[55]:.1e}, {s[56]:.1e}, {s[57]:.1e} -> rank [A_I; C^(3)] in [{lo10}, {hi10}] of {net.N_I}")


def split_decoding_study():
    """Remark 5.17: standard versus mod-3 split chords on the same seeded ridges."""
    net = Network(Spec()); s = net.s
    L0, G0 = linear_model(net)[:2]
    inner = [c for c in net.pos if radius(c) <= 5]; inner_set = set(inner)
    def strokes(rng):
        cells = set()
        for _ in range(int(rng.integers(2, 4))):
            c = inner[int(rng.integers(len(inner)))]; d = int(rng.integers(6))
            for _ in range(int(rng.integers(4, 9))):
                if c in net.pos and radius(c) <= 5: cells.add(c)
                if rng.random() < 0.25: d = (d + int(rng.choice([-1, 1]))) % 6
                c = (c[0] + DIRS6[d][0], c[1] + DIRS6[d][1])
        return sorted(cells)
    def tree(rng, size=12):
        while True:
            cells = {inner[int(rng.integers(len(inner)))]}
            while len(cells) < size:
                front = sorted({(c[0] + d[0], c[1] + d[1]) for c in cells for d in DIRS6} - cells)
                front = [f for f in front if f in inner_set and sum((f[0] + d[0], f[1] + d[1]) in cells for d in DIRS6) == 1]
                if not front: break
                cells.add(front[int(rng.integers(len(front)))])
            if len(cells) == size: return sorted(cells)
    def gate(C, P, thr):
        ok = np.ones(C.shape[1], bool)
        for r in np.flatnonzero(~(P > thr)):
            ok &= ~C[r].astype(bool)
        return [int(c) for c in np.flatnonzero(ok)]
    designs = (("standard", split_rows(net, FAM4, 1)), ("mod-3", split_rows(net, FAM4, 3)))
    for cname, sampler, seed in (("strokes", strokes, 2026), ("connected loop-free 12", tree, 1205)):
        rng_r = np.random.default_rng(seed)
        ridges = [sampler(rng_r) for _ in range(100)]          # the same ridges for both designs
        for dname, C in designs:
            rng = np.random.default_rng(77)
            uniq = n_ok = 0; multi = []
            for k, ridge in enumerate(ridges):
                st = net.interior_vector(ridge)
                cand = gate(C, C @ st, 0.5)
                sols, complete = consistent_patterns(C[:, cand], C[:, cand] @ st[cand], cap=256)
                assert complete
                uniq += len(sols) == 1
                dL = forward_diag(net, L0, G0, ridge); sd = s.sigma_rel*np.abs(dL).max()
                sigs = {tuple(np.flatnonzero(x)): forward_diag(net, L0, G0, net.cells_of([cand[j] for j in np.flatnonzero(x)])) for x in sols}
                keys = list(sigs); S = np.array([sigs[q] for q in keys])
                tk = tuple(j for j, c in enumerate(cand) if st[c] > 0.5)
                ok = 0
                for _ in range(200):
                    dLn = dL + rng.normal(0, sd, size=dL.shape)
                    vals = st*s.y_ridge + rng.normal(0, s.sigma_rel*s.y_ridge, net.N_I)
                    P = C @ vals
                    if gate(C, P, 0.5*s.y_ridge) != cand or not np.array_equal(np.rint(P/s.y_ridge), C @ st):
                        continue
                    ok += keys[int(np.argmin(((S - dLn)**2).sum(1)))] == tk
                n_ok += ok
                if len(sols) > 1:
                    multi.append(f"{len(sols)} patterns, ML {ok}/200, separations "
                                 f"{[round(float(np.linalg.norm(sigs[q] - dL)/sd), 2) for q in keys if q != tk]} std")
            print(f"[Sec.5.5] Rem 5.17 {cname}, {dname} chords ({C.shape[0]} rows): unique chord data {uniq}/100, "
                  f"ML exact {n_ok}/20000" + (f"; non-unique: {'; '.join(multi)}" if multi else ""))


# ======================= Revision 5.3: convex ridges and the cross-ratio criterion (Section 5.6) =======================
def _cross(o, a, b):
    return (a[0] - o[0])*(b[1] - o[1]) - (a[1] - o[1])*(b[0] - o[0])


def _hull(pts):
    pts = sorted(set(pts))
    if len(pts) <= 2:
        return pts
    lo, hi = [], []
    for p in pts:
        while len(lo) >= 2 and _cross(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(hi) >= 2 and _cross(hi[-2], hi[-1], p) <= 0: hi.pop()
        hi.append(p)
    return lo[:-1] + hi[:-1]


def _inside(H, q):
    if len(H) == 1:
        return q == H[0]
    if len(H) == 2:
        a, b = H
        return _cross(a, b, q) == 0 and min(a[0], b[0]) <= q[0] <= max(a[0], b[0]) and min(a[1], b[1]) <= q[1] <= max(a[1], b[1])
    return all(_cross(H[i], H[(i + 1) % len(H)], q) >= 0 for i in range(len(H)))


def lattice_closure(pts):
    """Z^2 intersected with conv(pts): the smallest convex lattice set containing pts"""
    H = _hull(pts)
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return frozenset((x, y) for x in range(min(xs), max(xs) + 1) for y in range(min(ys), max(ys) + 1) if _inside(H, (x, y)))


def chord_data(cells, fams):
    lines = {"m": lambda c: c[0], "n": lambda c: c[1], "p": lambda c: c[0] + c[1], "q": lambda c: c[0] - c[1]}
    out = []
    for f in fams:
        cnt = {}
        for c in cells:
            cnt[lines[f](c)] = cnt.get(lines[f](c), 0) + 1
        out.append(tuple(sorted(cnt.items())))
    return tuple(out)


def verify_convex(lin):
    """Proposition 5.18: convex ridges with identical chord data, and how well the boundary separates them."""
    slopes = (-1.0, 0.0, 1.0)                       # with infinity: cross ratio (c-a)/(c-b) for a<b<c<inf
    cr = (slopes[2] - slopes[0])/(slopes[2] - slopes[1])
    assert cr == 2.0
    net = Network(Spec()); s = net.s
    W = [c for c in net.pos if radius(c) <= 3]
    convex = set()
    for k in (1, 2, 3, 4):
        for pts in itertools.combinations(W, k):
            convex.add(lattice_closure(pts))
    res = {}
    for fams in (("m", "n", "p"), ("m", "n", "p", "q")):
        groups = {}
        for F in convex:
            groups.setdefault(chord_data(F, fams), []).append(F)
        coll = [g for g in groups.values() if len(g) > 1]
        res[len(fams)] = (len(coll), min(len(g[0]) for g in coll))
    assert res[3][1] == 4 and res[4][1] == 8
    print(f"[Sec.5.6] Prop 5.18: cross ratio of the four chord slopes = {cr:g}; {len(convex)} convex lattice sets generated by "
          f"<= 4 of the {len(W)} cells within radius 3: three families: {res[3][0]} chord-data classes with distinct convex "
          f"sets, smallest {res[3][1]} cells; four families: {res[4][0]} classes, smallest {res[4][1]} cells")
    plus, minus = switching_component(net)
    interior = [(1, 0), (1, 1), (2, 0), (2, 1)]
    P0, M0 = frozenset(plus + interior), frozenset(minus + interior)
    assert lattice_closure(sorted(plus)) == P0 and lattice_closure(sorted(minus)) == M0
    pairs = []
    for a in range(-2*s.R_hex, 2*s.R_hex + 1):
        for b in range(-2*s.R_hex, 2*s.R_hex + 1):
            F1 = frozenset((x + a, y + b) for x, y in P0); F2 = frozenset((x + a, y + b) for x, y in M0)
            if all(c in net.pos for c in F1 | F2):
                assert lattice_closure(sorted(F1)) == F1 and lattice_closure(sorted(F2)) == F2
                assert chord_data(F1, FAM4) == chord_data(F2, FAM4) and F1 != F2
                pairs.append((F1, F2))
    L0, G0 = lin[s.y_base][:2]
    def sep(A, B):
        sa, sb = forward_diag(net, L0, G0, sorted(A)), forward_diag(net, L0, G0, sorted(B))
        return float(np.linalg.norm(sa - sb)/(s.sigma_rel*np.abs(sa).max()))
    iso = np.array([sep(F1, F2) for F1, F2 in pairs if all(radius(c) <= s.R_hex - 2 for c in F1 | F2)])
    ring = [c for c in net.pos if radius(c) == s.R_hex - 2]
    enc = np.array([sep(set(ring) | F1, set(ring) | F2) for F1, F2 in pairs if all(radius(c) < s.R_hex - 2 for c in F1 | F2)])
    print(f"[Sec.5.6] Prop 5.18: the two lattice parallelograms S+ u I and S- u I (I = 4 interior points) are convex, have "
          f"identical chord data in all four families and differ by the switching component; {len(pairs)} placements in the "
          f"interior; isolated ({len(iso)} placements, radius <= {s.R_hex - 2}): separation {dn(iso.min(), 4)} .. "
          f"{up(iso.max(), 4)} std; inside the closed radius-{s.R_hex - 2} ring ({len(enc)} placements): {dn(enc.min(), 3)} .. "
          f"{up(enc.max(), 3)} std -> every decoder errs w.p. >= {dn(Q(float(up(enc.max(), 3))/2), 4)} on one ridge of each pair")


if __name__ == "__main__":
    t_start = time.perf_counter()
    design = Spec()
    verify_sec2()
    verify_sec3(design)
    verify_sec4(design)
    configs = ((BASELINE, "R3.9 baseline (y_base=1e-6, 3 fam)"),
               (replace(BASELINE, y_base=1.0e-7), "y_base=1e-7, 3 fam"),
               (replace(BASELINE, chord_families=4), "y_base=1e-6, 4 fam"),
               (design, "R4.0 design (y_base=1e-7, 4 fam)"))
    lin, mods, summary = {}, {}, {}
    for spec, label in configs:
        net = Network(spec)
        if spec.y_base not in lin:
            lin[spec.y_base] = linear_model(net)
            verify_frechet(net, *lin[spec.y_base])
            mods[spec.y_base] = modular_model(net)
        L0, G0, A = lin[spec.y_base]
        Ci, rC, rAug = verify_rank(net, mods[spec.y_base], label)
        summary[label] = stage_b(net, L0, G0, A, mods[spec.y_base], Ci, label, full_dtn=(spec == BASELINE))
        summary[label]['rank'] = rAug
    for spec, label in configs[2:]:
        ghost_pairs(Network(spec), *lin[spec.y_base][:2], label)
    print("[Sec.5] summary: config | rank [A_I; C] | K | chord-consistent patterns | ML exact / 2000")
    for label, r in summary.items():
        print(f"[Sec.5]   {label:36s} | {r['rank']:3d} | {r['K']:2d} | {r['patterns']} | {r['ok_ml']}")
    gate_variants()
    verify_monotonicity(lin)
    verify_nonlinear_rank(lin)
    verify_screening(lin)
    ridge_study(lin)
    rank_family()
    verify_split_kernels()
    verify_split_ranks()
    verify_split_screening()
    verify_split_scaling()
    verify_rcrit()
    verify_split_conditioning()
    split_decoding_study()
    verify_convex(lin)
    print(f"[done] {time.perf_counter() - t_start:.0f} s")
