import React, { useState, useMemo } from 'react';
import { LITERATURE_POINT, MaterialsParams } from './types/kagome';
import { computePhysics } from './utils/physics';
import { generateKagomeLattice } from './utils/kagomeLattice';
import { executeTomographySuite } from './utils/tomography';
import { VerdictBanner } from './components/VerdictBanner';
import { LatticeVisualizer } from './components/LatticeVisualizer';
import { DepthSensitivityChart } from './components/DepthSensitivityChart';
import { BandStructureChart } from './components/BandStructureChart';
import { MaterialsPhysicsBench } from './components/MaterialsPhysicsBench';
import { AuditReportTable } from './components/AuditReportTable';
import { SuiteConsole } from './components/SuiteConsole';
import { V54Identifiability } from './components/V54Identifiability';
import { V54AsymptoticLimit } from './components/V54AsymptoticLimit';
import { V54Comparison } from './components/V54Comparison';
import { 
  Activity, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  FileCheck2, 
  RotateCcw,
  Sparkles,
  Download,
  TrendingUp,
  Scale
} from 'lucide-react';

export type AppTab =
  | 'v54_identifiability'
  | 'v54_asymptotic'
  | 'v54_comparison'
  | 'tomography'
  | 'band'
  | 'materials'
  | 'audit'
  | 'console';

export default function App() {
  // Primary state for materials & physical parameters
  const [params, setParams] = useState<MaterialsParams>(LITERATURE_POINT);
  const [activeTab, setActiveTab] = useState<AppTab>('v54_identifiability');
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  // Derived physics
  const derived = useMemo(() => computePhysics(params), [params]);

  // Kagome lattice geometry
  const latticeData = useMemo(() => generateKagomeLattice(), []);

  // Tomography suite computation
  const suiteResult = useMemo(
    () => executeTomographySuite(params.snrDb, params.barrierG2),
    [params.snrDb, params.barrierG2]
  );

  const resetToLiterature = () => {
    setParams(LITERATURE_POINT);
    setSelectedAuditId(null);
  };

  const handleSelectAudit = (id: string) => {
    setSelectedAuditId(id);
    setActiveTab('audit');
  };

  const exportCertificate = () => {
    const content = `========================================================================
HIERARCHICAL BIO-KAGOME METAMATERIALS & BOUNDARY LAB — REVISION 5.4
Passive Tomography & Materials Transduction Verification Suite
Nicholas Clifford Maino III · Melbourne · 31 October 2026
========================================================================

1. REVISION 5.4 VERIFICATION SUMMARY
------------------------------------------------------------------------
[EXACT RANK PROGRESSION at R_hex = 8, N_I = 169]
  - Stage 1 (A_I boundary only): rank 45, kernel 124 (out of 169)
  - Stage 2 (+ 3 chord families): rank 87, kernel 82
  - Stage 3 (+ 4 chord families): rank 112, kernel 57
  - Stage 4 (+ mod-2 parity split): rank 163, kernel 6 (resolves hexadecapole)
  - Stage 5 (+ mod-3 period split): rank 169, kernel 0 (full rank at R=8)

[ASYMPTOTIC OBSTRUCTION (Theorem 5.14)]
  - No fixed split order works for all R_hex.
  - For k=3: full rank for R <= 9; provably deficient for R >= 10.
  - Growth disparity: T_k(R) = Θ(R²) while boundary data d(R) = Θ(R).
  - R_crit(k) = ceil((10k + 9 + sqrt(4k² + 120k + 33)) / 6).

[SCREENING & GHOST SEPARATION]
  - Closed 36-cell loop screens switching components to <= 6.27e-4 σ (P_err >= 0.4998).
  - Isolated ghost separation: 0.5265 σ (baseline y_base=1e-6 S) · 4.46 σ (design y_base=1e-7 S).
  - Cross-ratio 2.0 excluded by Gardner-Gritzmann; 8-cell convex mirror pair identified.

2. MATERIALS TRANSFORMATION ANCHORS
------------------------------------------------------------------------
- Sheet resistance (Rs): ${params.sheetResistance} Ω/sq (strut aspect 8 / 20.5)
- Conductance g1: ${derived.g1.toExponential(4)} S
- Effective permittivity (εeff): ${derived.epsEff.toFixed(3)}
- Piezo voltage constant (g33): ${derived.g33.toFixed(2)} mV·m/N
- Open-circuit wake: ${derived.wakeVoltageMv.toFixed(1)} mV (${derived.comparatorRatio.toFixed(2)}× a 50 mV comparator)
========================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BioKagome_v54_Verification_Certificate.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation & Masthead */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold tracking-wide">
                PAPER REVISION 5.4
              </span>
              <h1 className="text-lg font-bold text-zinc-100 tracking-tight">
                Kagome Boundary Lab
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Hierarchical solid-state metamaterials, multi-tier discrete tomography & exact rank resolution
            </p>
          </div>

          {/* Author Byline & Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-zinc-300">
                Nicholas Clifford Maino III
              </div>
              <div className="text-[11px] text-zinc-500 font-mono">
                Melbourne · Revision 5.4 · 31 October 2026
              </div>
            </div>

            <div className="flex items-center gap-2 border-l border-zinc-800 pl-3">
              <button
                onClick={resetToLiterature}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors flex items-center gap-1.5"
                title="Reset parameters to manuscript literature point"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reset Lit. Point</span>
              </button>

              <button
                onClick={exportCertificate}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/60 transition-colors flex items-center gap-1.5"
                title="Export v5.4 verification audit certificate"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Export Audit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-zinc-800/60 pt-1 pb-1">
          {/* v5.4 Current Suite Tabs */}
          <button
            onClick={() => setActiveTab('v54_identifiability')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'v54_identifiability'
                ? 'bg-emerald-950 text-emerald-200 shadow-sm border border-emerald-700'
                : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            v5.4 Identifiability
          </button>

          <button
            onClick={() => setActiveTab('v54_asymptotic')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'v54_asymptotic'
                ? 'bg-amber-950 text-amber-200 shadow-sm border border-amber-700'
                : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            v5.4 Asymptotic Limit
          </button>

          <button
            onClick={() => setActiveTab('v54_comparison')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'v54_comparison'
                ? 'bg-cyan-950 text-cyan-200 shadow-sm border border-cyan-700'
                : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            v5.4 vs v4.0
          </button>

          <div className="h-4 w-px bg-zinc-800 mx-1.5 shrink-0" />

          {/* v4.0 Historical Baseline / Archaeology Tabs */}
          <button
            onClick={() => setActiveTab('tomography')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tomography'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Tomography & Lattice (v4.0)
          </button>

          <button
            onClick={() => setActiveTab('band')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'band'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Band Structure & Topology (v4.0)
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'materials'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            Materials & Wake Bench (v4.0)
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
            v4.0 Audit
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'console'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
            Suite v4.0 Console
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full flex flex-col space-y-6">
        {/* Verification Verdicts */}
        <VerdictBanner onSelectAudit={handleSelectAudit} />

        {/* NEW v5.4 Tab 1: Identifiability */}
        {activeTab === 'v54_identifiability' && (
          <V54Identifiability />
        )}

        {/* NEW v5.4 Tab 2: Asymptotic Limit */}
        {activeTab === 'v54_asymptotic' && (
          <V54AsymptoticLimit />
        )}

        {/* NEW v5.4 Tab 3: v5.4 vs v4.0 Comparative Audit */}
        {activeTab === 'v54_comparison' && (
          <V54Comparison />
        )}

        {/* v4.0 Tab 1: Tomography & Lattice */}
        {activeTab === 'tomography' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <LatticeVisualizer
              cells={latticeData.cells}
              boundaryNodes={latticeData.boundaryNodes}
              truthCellIds={latticeData.truthCellIds}
              ghost1CellIds={latticeData.ghost1CellIds}
              ghost2CellIds={latticeData.ghost2CellIds}
              snrDb={params.snrDb}
              barrierG2={params.barrierG2}
            />

            <DepthSensitivityChart
              sensitivities={suiteResult.depthSensitivities}
              snrDb={params.snrDb}
              onSnrChange={(snr) => setParams({ ...params, snrDb: snr })}
              barrierG2={params.barrierG2}
              onBarrierChange={(g2) => setParams({ ...params, barrierG2: g2 })}
              ghostSeparationSigma={suiteResult.ghost1SeparationSigma}
              executionTimeMs={suiteResult.executionTimeMs}
            />
          </div>
        )}

        {/* v4.0 Tab 2: Band Structure & Topology */}
        {activeTab === 'band' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <BandStructureChart
              breathingDelta={params.breathingDelta}
              onDeltaChange={(delta) => setParams({ ...params, breathingDelta: delta })}
            />

            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-100 mb-2">
                  Topological Phase Diagnostics
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  In a breathing Kagome lattice, the ratio between intra-cell hopping <span className="font-mono text-zinc-200">t₁ = 1 - δb</span> and inter-cell hopping <span className="font-mono text-zinc-200">t₂ = 1 + δb</span> determines the quadrupole polarization and higher-order topological insulator (HOTI) corner state emergence.
                </p>
              </div>

              {/* Status Box */}
              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Breathing factor δb:</span>
                  <span className="text-indigo-400 font-bold">
                    {params.breathingDelta > 0 ? `+${params.breathingDelta.toFixed(2)}` : params.breathingDelta.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Dirac gap at K:</span>
                  <span className="text-amber-400 font-bold">
                    {derived.diracGap.toFixed(3)} (3|t₁ - t₂|)
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Flat band position:</span>
                  <span className="text-emerald-400 font-bold">
                    {derived.flatBandEnergy.toFixed(3)} (t₁ + t₂)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Wannier Center Location:</span>
                  <span className={params.breathingDelta > 0 ? 'text-emerald-300 font-bold' : 'text-indigo-300 font-bold'}>
                    {params.breathingDelta > 0 ? 'Inside unit cell (Trivial)' : 'At boundary edges (HOTI)'}
                  </span>
                </div>
              </div>

              {/* CLS Explanation */}
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-xs text-zinc-300 space-y-1">
                <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Compact Localized State (CLS) Plaquette Proof
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Setting wavefunctions with alternating signs (+1, -1, +1, -1, +1, -1) around any hexagonal star plaquette produces exact destructive interference on all outgoing legs. Numerical residual on the radius-3 flake is <span className="font-mono text-emerald-300">&lt; 10⁻¹²</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* v4.0 Tab 3: Materials & Wake Bench */}
        {activeTab === 'materials' && (
          <MaterialsPhysicsBench
            params={params}
            derived={derived}
            onChange={setParams}
            onReset={resetToLiterature}
          />
        )}

        {/* v4.0 Tab 4: v4.0 Audit (Retitled) */}
        {activeTab === 'audit' && (
          <AuditReportTable
            selectedAuditId={selectedAuditId}
            onSelectAudit={setSelectedAuditId}
          />
        )}

        {/* v4.0 Tab 5: Live Suite v4.0 Console */}
        {activeTab === 'console' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2">
              <SuiteConsole
                suiteResult={suiteResult}
                derived={derived}
                snrDb={params.snrDb}
                barrierG2={params.barrierG2}
              />
            </div>

            {/* Quick Metrics Summary Sidebar */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider mb-2">
                  Appendix A Benchmark Checklist
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800/80 flex justify-between">
                    <span className="text-zinc-400">Dark Nodes:</span>
                    <span className="text-zinc-100 font-bold">75 / 144</span>
                  </div>
                  <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800/80 flex justify-between">
                    <span className="text-zinc-400">rank(A_I):</span>
                    <span className="text-zinc-100 font-bold">45</span>
                  </div>
                  <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800/80 flex justify-between">
                    <span className="text-zinc-400">rank(C₃):</span>
                    <span className="text-zinc-100 font-bold">42 / 45</span>
                  </div>
                  <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800/80 flex justify-between">
                    <span className="text-zinc-400">rank(C₄):</span>
                    <span className="text-zinc-100 font-bold">67 / 74</span>
                  </div>
                  <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800/80 flex justify-between">
                    <span className="text-zinc-400">3-Chord Joint Rank:</span>
                    <span className="text-emerald-400 font-bold">87 (ker 82)</span>
                  </div>
                  <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800/80 flex justify-between">
                    <span className="text-zinc-400">4-Chord Joint Rank:</span>
                    <span className="text-emerald-400 font-bold">112 (ker 57)</span>
                  </div>
                  <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800/80 flex justify-between">
                    <span className="text-zinc-400">Fréchet Step 10⁻⁹:</span>
                    <span className="text-cyan-300 font-bold">6.329×10⁻⁴</span>
                  </div>
                  <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800/80 flex justify-between">
                    <span className="text-zinc-400">Wake Voltage:</span>
                    <span className="text-amber-400 font-bold">168.4 mV</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-[11px] text-zinc-400">
                The bench preserves the <strong className="text-zinc-200">v4.0 historical baseline</strong> while linking to the multi-tier resolution in Revision 5.4.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-4 bg-zinc-950/60 text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
          <div>
            Bio-Kagome Metamaterials & Boundary Lab · Revision 5.4 (supersedes v4.0 and v5.0–5.3)
          </div>
          <div>
            Nicholas Clifford Maino III · Melbourne · 31 October 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
