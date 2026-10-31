import React from 'react';
import { TOMOGRAPHY_V54 } from '../utils/tomography_v54';
import { ShieldCheck, ArrowRight } from 'lucide-react';

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
                Section 5 · Revision 5.5
              </span>
              <span className="text-xs text-zinc-400 font-mono">Kagome Flake R_hex = 8 · N_I = 169</span>
            </div>
            <h2 className="text-xl font-bold text-zinc-100 mt-1 tracking-tight">
              Rank Progression: 45 → 87 → 112 → 163 → 169
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Each bar is a separate measurement design. Splitting each of the 74 chord lines by residue mod k, in place of the plain line sums, raises the rank of [A_I; C⁽ᵏ⁾] from 112 (k = 1) to 163 (k = 2) and 169 (k = 3) at R_hex = 8.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
            <span className="text-zinc-500">Unsplit (k=1):</span>
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
              Exact: upper bounds from distinct boundary columns and Bareiss ranks of the chord matrices, matched by elimination modulo p = 2³¹ − 1
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
                Parity split <span className="normal-case">(k = 2)</span>
              </h4>
            </div>
            <div className="text-lg font-bold font-mono text-zinc-100 mt-2">
              Rank 112 → 163 <span className="text-xs text-purple-400 font-normal">(kernel 57 → 6)</span>
            </div>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              Splitting each of the 74 lines into odd and even positions gives 146 rows. The undilated switching component has zero sum on
              every unsplit line but <strong className="text-zinc-100">24 non-zero parity sums</strong> (out of 146).
            </p>
          </div>
          <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800 text-[11px] font-mono text-zinc-400">
            dim ker C⁽²⁾ = 51 = T₂(8), spanned by translates of the 2-dilated component. The boundary block covers 45 of these directions, leaving 6.
          </div>
        </div>

        {/* Card 2: Layer 2 (Mod-3) */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h4 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                Mod-3 split <span className="normal-case">(k = 3)</span>
              </h4>
            </div>
            <div className="text-lg font-bold font-mono text-zinc-100 mt-2">
              Rank 112 → 169 <span className="text-xs text-emerald-400 font-normal">(kernel 57 → 0)</span>
            </div>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              dim ker C⁽³⁾ = 16 = T₃(8), and the boundary block covers all 16 directions. <strong className="text-zinc-100">The kernels for k = 2 and 3 are not nested:</strong> each translate of z₃ has 24 non-zero parity sums, and each translate of z₂ has 24 non-zero mod-3 sums.
            </p>
          </div>
          <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800 text-[11px] font-mono text-zinc-400">
            Full rank needs the boundary block: C⁽³⁾ alone has rank 153. C⁽⁴⁾ and C⁽⁵⁾ alone reach 169, at k channels per line. Rank is not resolution: κ = 43,172 at the design point (Remark 5.16).
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
              Why this works at R=8 but inevitably fails for large lattices: the switching kernel dimension grows as <span className="font-mono text-zinc-100">T_k(R) = 3R² − (10k+3)R + 8k² + 5k + 1</span> (quadratic), whereas the distinct boundary data <span className="font-mono text-zinc-100">d(R) = 6R − 3</span> (checked for R ≤ 15; d(R) ≤ 18R always) grow only linearly.
            </p>
          </div>
          <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800 text-[11px] font-mono text-amber-400">
            See the Asymptotic Limit tab for the exact deficiency breakdown for R ≥ 10.
          </div>
        </div>
      </div>

      {/* Corrections recorded in the paper's revision notes */}
      <div className="bg-zinc-950 rounded-xl border border-zinc-800/90 p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Corrections recorded in the paper</span>
        </div>
        <ul className="space-y-2 text-xs text-zinc-400 font-mono">
          <li className="flex items-start gap-2">
            <span className="text-rose-400 font-bold shrink-0">✕</span>
            <span>
              <span className="line-through text-zinc-500">“Rank 169, trivial kernel: ghost elimination is unconditional”</span> (Revision 3.8) →{' '}
              <strong className="text-zinc-200">rank 87</strong> with three families (Revision 3.9).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-400 font-bold shrink-0">✕</span>
            <span>
              <span className="line-through text-zinc-500">“K = 14 gate candidates”</span> (Revision 5.0) → <strong className="text-zinc-200">K = 16</strong>; none of 45 gate variants gives 14 (Revision 5.1).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-400 font-bold shrink-0">✕</span>
            <span>
              <span className="line-through text-zinc-500">“Split-chord kernels are nested; three families including m − n are necessary and sufficient”</span> (split-chord draft) →{' '}
              <strong className="text-zinc-200">not nested</strong>, and the three-family statement holds at R_hex = 8 only; even all four families lose full rank at R_hex = 10 (Revision 5.2).
            </span>
          </li>
        </ul>
        <p className="text-[11px] text-zinc-500">The Revision History tab lists every correction in the paper's notes.</p>
      </div>
    </div>
  );
};
