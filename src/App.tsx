import React, { useState, useMemo } from 'react';
import { PAPER_DEFAULTS, MaterialsParams } from './types/kagome';
import { computePhysics } from './utils/physics';
import { BandStructureChart } from './components/BandStructureChart';
import { MaterialsPhysicsBench } from './components/MaterialsPhysicsBench';
import { V54Identifiability } from './components/V54Identifiability';
import { V54AsymptoticLimit } from './components/V54AsymptoticLimit';
import { V54Comparison } from './components/V54Comparison';
import { Layers, Cpu, RotateCcw, Sparkles, Download, TrendingUp, Scale } from 'lucide-react';

export type AppTab = 'identifiability' | 'asymptotic' | 'revisions' | 'band' | 'wake';

const TABS: { id: AppTab; label: string; icon: React.ElementType; group: 'tomography' | 'physics'; active: string }[] = [
  { id: 'identifiability', label: 'Identifiability', icon: Sparkles, group: 'tomography', active: 'bg-emerald-950 text-emerald-200 border-emerald-700' },
  { id: 'asymptotic', label: 'Asymptotic Limit', icon: TrendingUp, group: 'tomography', active: 'bg-amber-950 text-amber-200 border-amber-700' },
  { id: 'revisions', label: 'Revision History', icon: Scale, group: 'tomography', active: 'bg-cyan-950 text-cyan-200 border-cyan-700' },
  { id: 'band', label: 'Bloch Spectrum (§3.2)', icon: Layers, group: 'physics', active: 'bg-indigo-950 text-indigo-200 border-indigo-700' },
  { id: 'wake', label: 'Piezo Wake-Up (§3.1)', icon: Cpu, group: 'physics', active: 'bg-zinc-800 text-zinc-100 border-zinc-600' },
];

export default function App() {
  const [params, setParams] = useState<MaterialsParams>(PAPER_DEFAULTS);
  const [activeTab, setActiveTab] = useState<AppTab>('identifiability');

  const derived = useMemo(() => computePhysics(params), [params]);

  const resetToPaper = () => setParams(PAPER_DEFAULTS);

  const exportSummary = () => {
    const t1 = 1 + params.breathingDelta;
    const t2 = 1 - params.breathingDelta;
    const content = `========================================================================
KAGOME BOUNDARY LAB — PAPER REVISION 5.5 SUMMARY
Hierarchical Bio-Kagome Solid-State Metamaterials
Nicholas Clifford Maino III · Melbourne · 31 October 2026
========================================================================

1. IDENTIFIABILITY AT R_hex = 8 (N_I = 169), SECTION 5
------------------------------------------------------------------------
  - A_I (boundary diagonal only):     rank 45,  kernel 124
  - [A_I; C], three chord families:   rank 87,  kernel 82
  - [A_I; C], four chord families:    rank 112, kernel 57
  - [A_I; C^(2)], parity split:       rank 163, kernel 6
  - [A_I; C^(3)], mod-3 split:        rank 169, kernel 0

2. GHOSTS AND SCREENING
------------------------------------------------------------------------
  - Test-ridge ghosts (three families): 0.5265 sigma at y_base = 1e-6 S (P_err >= 0.396),
    4.46 sigma at y_base = 1e-7 S (P_err >= 0.0128).
  - Closed 36-cell ridge loop: 1.4445e-8 to 6.2732e-4 sigma over 44 placements (P_err >= 0.4998).
  - Chord slopes have cross ratio 2 (excluded by Gardner-Gritzmann); two convex 8-cell
    parallelograms share all four-family chord data at 102 placements.

3. SPLIT-CHORD LIMIT (THEOREM 5.14, COROLLARY 5.15)
------------------------------------------------------------------------
  - k = 3: full rank for R <= 9, deficient for every R >= 10.
  - If d(R) = 6R - 3: deficient for R >= floor((10k + 9 + sqrt(4k^2 + 120k + 33)) / 6) + 1
    = 6, 8, 10, 13, 15 for k = 1..5; equal to 2k + 7 exactly when k >= 58.
  - Using only d(R) <= 18R: deficient for R >= floor((10k + 21 + sqrt(4k^2 + 360k + 429)) / 6) + 1
    (R >= 16 for k = 3).

4. SECTION 3 AT THE CURRENT APP SETTINGS
------------------------------------------------------------------------
  - Bloch spectrum: delta_b = ${params.breathingDelta.toFixed(2)}, t1 = ${t1.toFixed(2)}, t2 = ${t2.toFixed(2)},
    gap at K = ${(3 * Math.abs(t1 - t2)).toFixed(3)}, flat band at t1 + t2 = ${(t1 + t2).toFixed(3)}.
  - Wake-up: phi_p = ${params.phiP.toFixed(2)}, d33,eff = ${(params.d33Eff * 1e12).toFixed(1)} pC/N, F_z = ${params.forceZ.toFixed(2)} N
    -> eps_eff = ${derived.epsEff.toFixed(4)}, g33 = ${derived.g33.toFixed(2)} mV m/N, V_wake = ${derived.wakeVoltageMv.toFixed(2)} mV
    (threshold ${params.thresholdMv} mV). Paper values: 5.58, 40.5 mV m/N, 70.2 mV.
========================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'KagomeBoundaryLab_v55_summary.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabButton = (t: (typeof TABS)[number]) => {
    const Icon = t.icon;
    return (
      <button
        key={t.id}
        onClick={() => setActiveTab(t.id)}
        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap border ${
          activeTab === t.id ? `${t.active} shadow-sm` : 'border-transparent text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900'
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        {t.label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Masthead */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold tracking-wide">
                PAPER REVISION 5.5
              </span>
              <h1 className="text-lg font-bold text-zinc-100 tracking-tight">Kagome Boundary Lab</h1>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Interactive companion to the paper: identifiability of boundary tomography, split-chord limits and Section 3 physics
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-zinc-300">Nicholas Clifford Maino III</div>
              <div className="text-[11px] text-zinc-500 font-mono">Melbourne · Revision 5.5 · 31 October 2026</div>
            </div>

            <div className="flex items-center gap-2 border-l border-zinc-800 pl-3">
              <button
                onClick={resetToPaper}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors flex items-center gap-1.5"
                title="Reset the Section 3 sliders to the paper's values"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reset to paper values</span>
              </button>
              <button
                onClick={exportSummary}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/60 transition-colors flex items-center gap-1.5"
                title="Download a text summary of the Revision 5.5 results"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Export summary</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-zinc-800/60 pt-1 pb-1">
          {TABS.filter((t) => t.group === 'tomography').map(tabButton)}
          <div className="w-px h-5 bg-zinc-800 mx-2 shrink-0" />
          {TABS.filter((t) => t.group === 'physics').map(tabButton)}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full flex flex-col space-y-6">
        {activeTab === 'identifiability' && <V54Identifiability />}
        {activeTab === 'asymptotic' && <V54AsymptoticLimit />}
        {activeTab === 'revisions' && <V54Comparison />}
        {activeTab === 'band' && (
          <BandStructureChart
            breathingDelta={params.breathingDelta}
            onDeltaChange={(delta) => setParams({ ...params, breathingDelta: delta })}
          />
        )}
        {activeTab === 'wake' && (
          <MaterialsPhysicsBench params={params} derived={derived} onChange={setParams} onReset={resetToPaper} />
        )}
      </main>

      <footer className="border-t border-zinc-800/60 py-4 bg-zinc-950/60 text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
          <div>Bio-Kagome Metamaterials &amp; Boundary Lab · Revision 5.5 (supersedes v4.0 and v5.0–5.4)</div>
          <div>Nicholas Clifford Maino III · Melbourne · 31 October 2026</div>
        </div>
      </footer>
    </div>
  );
}
