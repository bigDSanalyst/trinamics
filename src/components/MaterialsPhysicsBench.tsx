import React from 'react';
import { MaterialsParams, PhysicsDerived } from '../types/kagome';
import { RotateCcw, Zap, SlidersHorizontal, Info } from 'lucide-react';

interface MaterialsPhysicsBenchProps {
  params: MaterialsParams;
  derived: PhysicsDerived;
  onChange: (updated: MaterialsParams) => void;
  onReset: () => void;
}

interface SliderProps {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  note?: string;
  accent: string;
}

const Slider: React.FC<SliderProps> = ({ label, value, display, min, max, step, onChange, note, accent }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-zinc-400">{label}</span>
      <span className="font-mono text-zinc-100">{display}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full ${accent} bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer`}
    />
    {note && <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{note}</div>}
  </div>
);

export const MaterialsPhysicsBench: React.FC<MaterialsPhysicsBenchProps> = ({ params, derived, onChange, onReset }) => {
  const update = <K extends keyof MaterialsParams>(field: K, value: MaterialsParams[K]) =>
    onChange({ ...params, [field]: value });

  const wakes = derived.wakeVoltageMv > params.thresholdMv;

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-zinc-100">Piezoelectric wake-up (Section 3.1)</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono border border-zinc-700">
              BaTiO₃/chitin top-cap film
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Maxwell–Garnett permittivity and open-circuit wake voltage, with the paper's formulas and values.
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-2.5 py-1 text-xs font-medium rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
          title="Reset to the values used in the paper"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to paper values
        </button>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className={`bg-zinc-950 p-3.5 rounded-lg border shadow-inner ${wakes ? 'border-emerald-900/50' : 'border-rose-900/50'}`}>
          <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Wake voltage</div>
          <div className={`text-xl font-bold font-mono mt-1 ${wakes ? 'text-emerald-400' : 'text-rose-400'}`}>
            {derived.wakeVoltageMv.toFixed(2)} mV
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1">
            {wakes ? '>' : '≤'} V_th = {params.thresholdMv.toFixed(0)} mV ({derived.thresholdRatio.toFixed(2)}×)
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Paper: 70.2 mV (listing: 70.16)</div>
        </div>

        <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 shadow-inner">
          <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Permittivity</div>
          <div className="text-xl font-bold font-mono text-zinc-100 mt-1">{derived.epsEff.toFixed(4)}</div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1">ε_eff, with β = {derived.beta.toFixed(4)}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Paper: 5.58 (listing: 5.5831)</div>
        </div>

        <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 shadow-inner">
          <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Voltage constant</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {derived.g33.toFixed(2)} <span className="text-xs text-amber-500 font-normal">mV·m/N</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1">g₃₃ = d₃₃,eff / (ε₀ ε_eff)</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Paper: 40.5 (listing: 40.46)</div>
        </div>

        <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 shadow-inner">
          <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Node stress</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {(derived.stressPa / 1000).toFixed(1)} <span className="text-xs text-cyan-500 font-normal">kPa</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1">F_z / A_node, A_node = {(params.nodeArea * 1e6).toFixed(2)} mm²</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">one a₁ unit cell</div>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-1">
        <div className="space-y-4 bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-800/80">
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-zinc-800">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Piezo film
          </h3>
          <Slider
            label="d₃₃,eff (empirical)"
            value={params.d33Eff * 1e12}
            display={`${(params.d33Eff * 1e12).toFixed(1)} pC/N`}
            min={0.5}
            max={5}
            step={0.1}
            onChange={(v) => update('d33Eff', v * 1e-12)}
            note="paper: 2.0 pC/N"
            accent="accent-amber-500"
          />
          <Slider
            label="BaTiO₃ volume fraction φ_p"
            value={params.phiP}
            display={params.phiP.toFixed(2)}
            min={0.05}
            max={0.4}
            step={0.01}
            onChange={(v) => update('phiP', v)}
            note="paper: 0.20 (20 vol%)"
            accent="accent-zinc-400"
          />
        </div>

        <div className="space-y-4 bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-800/80">
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-zinc-800">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            Load
          </h3>
          <Slider
            label="Force F_z"
            value={params.forceZ}
            display={`${params.forceZ.toFixed(2)} N`}
            min={0.2}
            max={5}
            step={0.1}
            onChange={(v) => update('forceZ', v)}
            note="paper: 1.5 N"
            accent="accent-emerald-500"
          />
          <div className="text-[11px] text-zinc-400 font-mono space-y-1">
            <div>
              Film thickness h_node = {(params.nodeThickness * 1e6).toFixed(1)} µm
            </div>
            <div>
              ε_m = {params.epsM}, ε_BT = {params.epsBT}
            </div>
          </div>
        </div>

        <div className="space-y-3 bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed">
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-zinc-800">
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            Model
          </h3>
          <div className="font-mono text-zinc-300 space-y-1">
            <div>β = (ε_BT − ε_m) / (ε_BT + 2ε_m)</div>
            <div>ε_eff = ε_m (1 + 2φβ) / (1 − φβ)</div>
            <div>V_wake = g₃₃ (F_z / A_node) h_node</div>
          </div>
          <p>
            Sections 1–4 of the paper describe an illustrative material stack with assumed parameters; no device was fabricated or
            measured. The borax–cellulose-LIG system proposed in Revision 5.0 (g₁ = 7.227×10⁻³ S, V_wake = 168.6 mV) was not
            adopted (Revision 5.1 notes).
          </p>
        </div>
      </div>
    </div>
  );
};
