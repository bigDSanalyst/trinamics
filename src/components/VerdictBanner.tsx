import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface VerdictBannerProps {
  onSelectAudit?: (id: string) => void;
}

export const VerdictBanner: React.FC<VerdictBannerProps> = ({ onSelectAudit }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* 1. HOLDS */}
      <div 
        onClick={() => onSelectAudit?.('rank_obstruction')}
        className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-5 hover:border-emerald-700/60 transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Holds
          </span>
          <span className="text-xs text-zinc-400 font-mono">dim(ker) = 82</span>
        </div>
        <h3 className="text-base font-semibold text-zinc-100 group-hover:text-emerald-300 transition-colors">
          Rank obstruction
        </h3>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          Three chords plus the Schur map have rank <span className="font-mono text-zinc-200">87</span> on 169 interior cells. Kernel dimension 82.
        </p>
      </div>

      {/* 2. HOLDS, NARROWER */}
      <div 
        onClick={() => onSelectAudit?.('fourth_chord')}
        className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-5 hover:border-amber-700/60 transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-amber-900/60 text-amber-300 border border-amber-700/50">
            <AlertTriangle className="w-3.5 h-3.5" />
            Holds, narrower
          </span>
          <span className="text-xs text-zinc-400 font-mono">dim(ker) = 57</span>
        </div>
        <h3 className="text-base font-semibold text-zinc-100 group-hover:text-amber-300 transition-colors">
          Fourth chord
        </h3>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          On this dual-ridge the m−n family leaves one binary solution. The joint operator is still rank <span className="font-mono text-zinc-200">112</span>, not full.
        </p>
      </div>

      {/* 3. DOES NOT HOLD */}
      <div 
        onClick={() => onSelectAudit?.('ghost_separation')}
        className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-5 hover:border-rose-700/60 transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-rose-900/60 text-rose-300 border border-rose-700/50">
            <XCircle className="w-3.5 h-3.5" />
            Does not hold
          </span>
          <span className="text-xs text-zinc-400 font-mono">0.5265σ · 4.46σ</span>
        </div>
        <h3 className="text-base font-semibold text-zinc-100 group-hover:text-rose-300 transition-colors">
          0.53σ ghosts
        </h3>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          0.5265σ (baseline y_base=10⁻⁶ S, P_err ≥ 0.396) · 4.46σ (design y_base=10⁻⁷ S, P_err ≥ 0.0128).
          <span className="block text-[10px] text-zinc-500 mt-0.5">* Previously cited as 1.2×10⁻¹⁴σ in v5.0; withdrawn in v5.1 notes</span>
        </p>
      </div>
    </div>
  );
};
