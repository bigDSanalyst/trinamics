import React from 'react';
import { TOMOGRAPHY_V54 } from '../utils/tomography_v54';
import { Layers, ShieldCheck, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const V54Identifiability: React.FC = () => {
  const stages = TOMOGRAPHY_V54.rank_progression;

  return (
    <div className="space-y-6">
      {/* Top Banner: Rank progression */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono border border-emerald-800 font-semibold uppercase tracking-wider">
                v5.4 Multi-Tier Resolution
              </span>
              <span className="text-xs text-zinc-400 font-mono">Kagome Flake R_hex = 8 · N_I = 169</span>
            </div>
            <h2 className="text-xl font-bold text-zinc-100 mt-1 tracking-tight">
              Rank Progression: 45 → 87 → 112 → 163 → 169
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Two-layer interleaved chord splitting closes the 57-dimensional kernel of unbroken chords at R_hex = 8, achieving full algebraic rank.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
            <span className="text-zinc-500">Unbroken:</span>
            <span className="text-amber-400 font-bold">112 / 169</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-zinc-500">Parity (k=2):</span>
            <span className="text-purple-400 font-bold">163</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-zinc-500">Mod-3 (k=3):</span>
            <span className="text-emerald-400 font-bold">169 (Full)</span>
          </div>
        </div>
      </div>

      {/* Main Bar Chart: 5 Stages */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
              Operator Rank vs Nullspace Kernel Dimension
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Exact ranks computed via fraction-free Bareiss elimination over ℤ and certified over 𝔽_p (p = 2³¹ − 1)
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">Interior cells: 169</span>
        </div>

        <div className="space-y-4 pt-2">
          {stages.map((st, idx) => {
            const pct = Math.round(st.fraction * 100);
            return (
              <div key={st.stage} className="space-y-1.5 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-zinc-200 min-w-[120px]">{st.stage}</span>
                    <span className="text-zinc-400 font-sans text-xs">{st.probeDescription}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-100 font-bold">Rank {st.rank} / 169</span>
                    <span className={st.kernel === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                      ker = {st.kernel}
                    </span>
                    <span className="text-zinc-500 text-[11px] w-12 text-right">{pct}%</span>
                  </div>
                </div>

                {/* Bar */}
                <div className="h-4 bg-zinc-950 rounded-md overflow-hidden border border-zinc-800 flex">
                  <div
                    className="h-full transition-all duration-500 rounded-l-sm"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: st.color,
                    }}
                  />
                  <div
                    className="h-full bg-zinc-900/60"
                    style={{ width: `${100 - pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 Detail Cards Below */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Layer 1 (Parity) */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Layer 1: Parity Split (k=2)
              </h4>
            </div>
            <div className="text-lg font-bold font-mono text-zinc-100 mt-2">
              Rank 112 → 163 <span className="text-xs text-purple-400 font-normal">(kernel 57 → 6)</span>
            </div>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              Splitting each of the 74 lines into odd and even residues resolves the 4th-order switching hexadecapole. 
              The undilated component is completely invisible to unbroken chords, but exposes <strong className="text-zinc-100">24 non-zero parity line sums</strong> (out of 148).
            </p>
          </div>
          <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800 text-[11px] font-mono text-zinc-400">
            ker(C^(2)) dimension = 6. Spanned by T_2(8) = 6 translates of the 2-dilated switching component.
          </div>
        </div>

        {/* Card 2: Layer 2 (Mod-3) */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h4 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                Layer 2: Mod-3 Split (k=3)
              </h4>
            </div>
            <div className="text-lg font-bold font-mono text-zinc-100 mt-2">
              Rank 163 → 169 <span className="text-xs text-emerald-400 font-normal">(kernel 6 → 0)</span>
            </div>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              Closes the residual 6-dimensional stealth subspace. <strong className="text-zinc-100">The kernels are not nested:</strong> ker(C^(2)) and ker(C^(3)) are orthogonal. Each translate of the 3-dilated component has 24 non-zero parity sums, and vice versa.
            </p>
          </div>
          <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800 text-[11px] font-mono text-zinc-400">
            dim(ker) = 0 at R_hex = 8. Exact recovery is achievable without boundary disambiguation.
          </div>
        </div>

        {/* Card 3: Asymptotic Boundary Growth */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                Dimensional Asymptotics
              </h4>
            </div>
            <div className="text-lg font-bold font-mono text-zinc-100 mt-2">
              Θ(R²) Kernel vs Θ(R) Boundary
            </div>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              Why this works at R=8 but inevitably fails for large lattices: the switching kernel dimension grows as <span className="font-mono text-zinc-100">T_k(R) = 3R² − (10k+3)R + 8k² + 5k + 1</span> (quadratic), whereas distinct boundary data <span className="font-mono text-zinc-100">d(R) = 6R − 3</span> grows only linearly.
            </p>
          </div>
          <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800 text-[11px] font-mono text-amber-400">
            See the Asymptotic Limit tab for the exact deficiency breakdown for R ≥ 10.
          </div>
        </div>
      </div>

      {/* "What we no longer claim" Honesty Record */}
      <div className="bg-zinc-950 rounded-xl border border-zinc-800/90 p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>v5.4 Revision Notes: Explicit Corrections from Earlier Revisions</span>
        </div>
        <ul className="space-y-2 text-xs text-zinc-400 font-mono">
          <li className="flex items-start gap-2">
            <span className="text-rose-400 font-bold shrink-0">✕</span>
            <span>
              <span className="line-through text-zinc-500">“169/169 resolved by parity alone”</span> → <strong className="text-zinc-200">Corrected to rank 163</strong>. Parity split alone leaves kernel dimension 6. Full rank requires the mod-3 probe.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-400 font-bold shrink-0">✕</span>
            <span>
              <span className="line-through text-zinc-500">“Split chord kernels are nested: ker C^(3) ⊂ ker C^(2)”</span> → <strong className="text-zinc-200">Corrected to orthogonal</strong>. Each translate of z_3 has 24 non-zero parity sums; each translate of z_2 has 24 non-zero mod-3 sums.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-400 font-bold shrink-0">✕</span>
            <span>
              <span className="line-through text-zinc-500">“All four chord families necessary for uniqueness”</span> → The m−n line family (q) is essential, but <strong className="text-zinc-200">three families including q</strong> (e.g. m, n, q) already achieve full rank 169 with mod-3 split.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-400 font-bold shrink-0">✕</span>
            <span>
              <span className="line-through text-zinc-500">“Ghost separation of 0.53σ is pure numerical floating-point noise (1.2×10⁻¹⁴ σ)”</span> → <strong className="text-zinc-200">0.5265 σ_Λ is an exact, physical separation</strong> (at y_base = 10⁻⁶ S). It leads to severe decoder error (P_err ≥ 0.396), but is not a float artifact.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
