import React from 'react';
import { MANUSCRIPT_AUDIT_ITEMS_V54, AuditItemV54 } from '../data/audit_items_v54';
import { Scale, CheckCircle2, AlertTriangle, Sparkles, BookOpen } from 'lucide-react';

export const V54Comparison: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800 font-semibold uppercase tracking-wider">
                Evolution & Errata Matrix
              </span>
              <span className="text-xs text-zinc-400 font-mono">v4.0 Baseline → v5.5 Executed</span>
            </div>
            <h2 className="text-xl font-bold text-zinc-100 mt-1 tracking-tight">
              v5.5 vs v4.0 Comparative Verification
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Transparent, item-by-item accounting of what held unchanged, what was corrected from preliminary drafts, and what new theorems were established in Revisions 5.4 and 5.5.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-emerald-400">Holds / Confirmed</span>
            <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-amber-400">Corrected</span>
            <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-cyan-400">New in v5.4</span>
            <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-violet-400">New in v5.5</span>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 w-1/4">Claim / Problem Domain</th>
                <th className="p-3.5 w-1/3 text-zinc-400">v4.0 / Draft Status</th>
                <th className="p-3.5 w-5/12 text-zinc-200">v5.5 Manuscript Reality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {MANUSCRIPT_AUDIT_ITEMS_V54.map((item) => {
                let badgeColor = 'bg-zinc-800 text-zinc-300';
                if (item.category === 'holds') badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                if (item.category === 'corrected') badgeColor = 'bg-amber-950 text-amber-300 border-amber-800';
                if (item.category === 'new_in_v54') badgeColor = 'bg-cyan-950 text-cyan-300 border-cyan-800';
                if (item.category === 'new_in_v55') badgeColor = 'bg-violet-950 text-violet-300 border-violet-800';

                return (
                  <tr key={item.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="p-3.5 font-sans">
                      <div className="font-semibold text-zinc-100">{item.claim}</div>
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${badgeColor}`}>
                        {item.category === 'holds' ? 'Confirmed' : item.category === 'corrected' ? 'Corrected' : item.category === 'new_in_v55' ? 'New in v5.5' : 'New in v5.4'}
                      </span>
                    </td>
                    <td className="p-3.5 text-zinc-400 font-mono align-top">
                      <div className="line-through text-zinc-500">{item.statusV40}</div>
                    </td>
                    <td className="p-3.5 text-zinc-200 font-mono align-top">
                      <div className="font-semibold text-zinc-100">{item.statusV54}</div>
                      <p className="text-zinc-400 font-sans text-xs mt-1 leading-snug">
                        {item.details}
                      </p>
                      <div className="text-[11px] text-zinc-500 font-mono mt-1">
                        Proof: {item.verificationEvidence}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Notes on Archaeological Integrity */}
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-2">
        <div className="flex items-center gap-2 text-zinc-200 font-semibold uppercase tracking-wider text-[11px]">
          <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
          Archaeological Principle: Preservation of Historical Revisions
        </div>
        <p className="leading-relaxed">
          The previous tabs (<span className="text-zinc-300">Tomography & Lattice</span>, <span className="text-zinc-300">v4.0 Audit</span>, <span className="text-zinc-300">Materials Bench</span>) document the initial v4.0 suite baseline. Rather than overwriting the record of what was previously claimed, the v5.4–v5.5 suite adds the exact algebraic resolution and documents why preliminary draft numbers were revised.
        </p>
      </div>
    </div>
  );
};
