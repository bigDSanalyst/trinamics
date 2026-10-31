import React from 'react';
import { REVISION_HISTORY, RevisionItem } from '../data/audit_items_v54';
import { BookOpen } from 'lucide-react';

const BADGE: Record<RevisionItem['category'], { label: string; cls: string }> = {
  confirmed: { label: 'Confirmed', cls: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  corrected: { label: 'Corrected', cls: 'bg-amber-950 text-amber-300 border-amber-800' },
  new: { label: 'New', cls: 'bg-cyan-950 text-cyan-300 border-cyan-800' },
  not_adopted: { label: 'Not adopted', cls: 'bg-rose-950 text-rose-300 border-rose-800' },
};

export const V54Comparison: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800 font-semibold uppercase tracking-wider">
                Revision history
              </span>
              <span className="text-xs text-zinc-400 font-mono">Revisions 3.8 → 5.5</span>
            </div>
            <h2 className="text-xl font-bold text-zinc-100 mt-1 tracking-tight">What earlier revisions claimed, and what holds now</h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Every row comes from the revision notes at the end of the paper. Corrected claims are struck through; the right column
              is what Revision 5.5 states.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {(Object.keys(BADGE) as RevisionItem['category'][])
              .filter((c) => REVISION_HISTORY.some((i) => i.category === c))
              .map((c) => (
                <span key={c} className={`px-2 py-1 rounded border ${BADGE[c].cls}`}>
                  {BADGE[c].label}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider text-[11px] font-mono">
              <tr>
                <th className="p-3.5 w-1/4">Result</th>
                <th className="p-3.5 w-1/3">Earlier claim</th>
                <th className="p-3.5 w-5/12 text-zinc-200">Revision 5.5</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {REVISION_HISTORY.map((item) => {
                const badge = BADGE[item.category];
                const struck = item.category === 'corrected' || item.category === 'not_adopted';
                return (
                  <tr key={item.id} className="hover:bg-zinc-900/50 transition-colors align-top">
                    <td className="p-3.5">
                      <div className="font-semibold text-zinc-100">{item.result}</div>
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${badge.cls}`}>
                        {badge.label} · {item.changedIn}
                      </span>
                    </td>
                    <td className="p-3.5 text-zinc-400">
                      <div className={struck ? 'line-through text-zinc-500' : 'text-zinc-500'}>{item.earlier}</div>
                      {item.earlierRevision && <div className="text-[10px] font-mono text-zinc-600 mt-1">{item.earlierRevision}</div>}
                    </td>
                    <td className="p-3.5 text-zinc-200 leading-snug">{item.current}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-2">
        <div className="flex items-center gap-2 text-zinc-200 font-semibold uppercase tracking-wider text-[11px]">
          <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
          Source
        </div>
        <p className="leading-relaxed">
          The paper's revision notes (Revisions 3.9 to 5.5) list every withdrawn or corrected value. Earlier versions of this app
          also showed an audit of a Revision 4.0 printout and a simulated console; those tabs mixed in claims the notes do not
          record and were removed.
        </p>
      </div>
    </div>
  );
};
