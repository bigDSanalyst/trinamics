import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ExternalLink, FileText, Bookmark } from 'lucide-react';
import { MANUSCRIPT_AUDIT_ITEMS } from '../utils/tomography';

interface AuditReportTableProps {
  selectedAuditId?: string | null;
  onSelectAudit?: (id: string) => void;
}

export const AuditReportTable: React.FC<AuditReportTableProps> = ({
  selectedAuditId,
  onSelectAudit,
}) => {
  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-semibold text-zinc-100">v4.0 Baseline Audit & Locking Record</h2>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Historical item-by-item verification comparing printed v4.0 logs against the executable baseline (superseded by Revision 5.5)
        </p>
      </div>

      {/* Two columns: Keep vs Revise */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* KEEP */}
        <div className="bg-zinc-950/60 rounded-xl border border-emerald-900/40 p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-900/40">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider">
              What the manuscript may keep
            </h3>
          </div>
          <ul className="space-y-2.5 text-xs text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span>
                <strong className="text-zinc-100">g₁ = 7.227×10⁻³ S</strong> from Rs = 54 Ω/sq on BWCNF, with strut aspect 8/20.5.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span>
                <strong className="text-zinc-100">Open-circuit wake 168.4 mV</strong> (3.37× over 50 mV). The printed 168.6 mV is g₃₃ rounded to 97.2.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span>
                <strong className="text-zinc-100">Exact Bloch gap 3|t₁−t₂|</strong> and a leakage-free CLS. Phase at δb &gt; 0 is the trivial side.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span>
                <strong className="text-zinc-100">75 dark perimeter nodes</strong>, rank(A_I) = 45, rank(C₃) = 42, rank(C₄) = 67.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span>
                <strong className="text-zinc-100">rank([A_I; C₃]) = 87, kernel 82</strong>. Appendix print of the 4-chord joint rank, 112, also matches. Kernel of that operator is 57.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span>
                On this particular dual-ridge, adding <span className="font-mono text-zinc-200">m−n</span> leaves a <strong className="text-zinc-100">single binary vector</strong>.
              </span>
            </li>
          </ul>
        </div>

        {/* REVISE BEFORE LOCKING */}
        <div className="bg-zinc-950/60 rounded-xl border border-rose-900/40 p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-rose-900/40">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-rose-300 uppercase tracking-wider">
              Revise before locking
            </h3>
          </div>
          <ul className="space-y-2.5 text-xs text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold shrink-0">✕</span>
              <span>
                <strong className="text-zinc-100">Support pruning</strong> as written in the listing keeps <span className="font-mono text-amber-300 font-bold">17 cells, then 16</span> — not 22 and 14. The assert in the pasted script would fail.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold shrink-0">✕</span>
              <span>
                <strong className="text-zinc-100">Exact &#123;0,1&#125; solutions</strong> of the 3-chord projection: <span className="font-mono text-amber-300 font-bold">3, not 4</span>. Two ghosts, not a 2-dimensional kernel of four states.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold shrink-0">✕</span>
              <span>
                The preamble’s <strong className="text-rose-300">“4-chord kernel collapses to 0”</strong> contradicts the appendix line rank 112/169 (kernel is 57).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold shrink-0">✕</span>
              <span>
                <strong className="text-zinc-100">Ghost separation is not 0.531σ</strong>. At g₂ = 10⁻⁷ S the diagonal Dirichlet-to-Neumann map cannot tell the ghosts from truth (~10⁻¹⁴ σ at 34 dB). At g₂ = 10⁻³ S it is still &lt; 0.002σ.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold shrink-0">!</span>
              <span>
                The pasted <span className="font-mono text-zinc-200">ae()</span> cancels L_uv against itself, so L_uu is never stamped. Ranks here use the symmetric conductance Laplacian the theorem describes.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-zinc-400 font-bold shrink-0">•</span>
              <span>
                The annulus orientation certificate (130,592 triangles, 0.5509) is not in the executable listing, so this bench does not repeat it.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Item-by-item Evidence Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          Numerical Diagnostics Matrix
        </h3>

        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800">
              <tr>
                <th className="p-3">Audit Item</th>
                <th className="p-3">Status</th>
                <th className="p-3">Manuscript Printed Claim</th>
                <th className="p-3">Executable Bench Finding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {MANUSCRIPT_AUDIT_ITEMS.map((item) => {
                const isSelected = selectedAuditId === item.id;
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectAudit?.(item.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-zinc-800/80' : 'hover:bg-zinc-900/60'
                    }`}
                  >
                    <td className="p-3 font-semibold text-zinc-200">{item.headline}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          item.category === 'holds'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : item.category === 'holds_narrower'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {item.statusText}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-400 max-w-xs">{item.claim}</td>
                    <td className="p-3 text-zinc-200 max-w-sm">{item.findings}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Literature Anchors & Formal Citations */}
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 text-xs text-zinc-400 space-y-2">
        <div className="flex items-center gap-2 text-zinc-200 font-semibold uppercase tracking-wider text-[11px]">
          <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          Primary Literature Anchors & Calibration Sources
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
          <div className="border-l-2 border-cyan-500 pl-2.5 space-y-0.5">
            <div className="text-zinc-200 font-semibold">Liu, Zheng and Wan (2026)</div>
            <div className="text-zinc-400">Adv. Mater. Technol. — Borax-activated wood-derived laser-induced graphene (BWCNF), Rs = 54 Ω/sq, strut aspect 8/20.5.</div>
          </div>
          <div className="border-l-2 border-amber-500 pl-2.5 space-y-0.5">
            <div className="text-zinc-200 font-semibold">Mahadeva, Walus and Stoeber (2014)</div>
            <div className="text-zinc-400">ACS Appl. Mater. Interfaces 6, 7547 — Cellulose–BaTiO₃ nanocomposite films, node area 3.46 mm², thickness 4.0 µm, Fz = 1.5 N.</div>
          </div>
          <div className="border-l-2 border-indigo-500 pl-2.5 space-y-0.5">
            <div className="text-zinc-200 font-semibold">Wang et al. (2023)</div>
            <div className="text-zinc-400">Chitosan piezoelectric upper bound (13 pC/N). Scales open-circuit wake to 456 mV (not a measurement on Trametes chitin-glucan).</div>
          </div>
          <div className="border-l-2 border-emerald-500 pl-2.5 space-y-0.5">
            <div className="text-zinc-200 font-semibold">Yamada, Ueda and Kitayama (1982)</div>
            <div className="text-zinc-400">J. Appl. Phys. 53, 4328 — Maxwell–Garnett & 0-3 composite dielectric formulation yielding εeff = 5.583 at φ = 0.20.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
