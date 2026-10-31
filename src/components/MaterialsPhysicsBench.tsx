import React from 'react';
import { MaterialsParams, PhysicsDerived, LITERATURE_POINT } from '../types/kagome';
import { formatSci } from '../utils/physics';
import { RotateCcw, Zap, Sparkles, SlidersHorizontal, BookOpen } from 'lucide-react';

interface MaterialsPhysicsBenchProps {
  params: MaterialsParams;
  derived: PhysicsDerived;
  onChange: (updated: MaterialsParams) => void;
  onReset: () => void;
}

export const MaterialsPhysicsBench: React.FC<MaterialsPhysicsBenchProps> = ({
  params,
  derived,
  onChange,
  onReset,
}) => {
  const updateField = <K extends keyof MaterialsParams>(field: K, value: MaterialsParams[K]) => {
    onChange({
      ...params,
      [field]: value,
    });
  };

  const setWangChitosanBound = () => {
    onChange({
      ...params,
      d33Proxy: 13.0e-12, // 13 pC/N
    });
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-100">Materials Parameterization & Wake Bench</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono border border-zinc-700">
              Borax-LIG + BaTiO₃ Proxy
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Transduction parameters anchored in Liu, Zheng & Wan (2026) and Mahadeva, Walus & Stoeber (2014)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={setWangChitosanBound}
            className="px-2.5 py-1 text-xs font-medium rounded border border-indigo-700/60 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/50 transition-colors flex items-center gap-1.5"
            title="Set d33 = 13 pC/N (Wang et al. chitosan upper bound, wake scales to 456 mV)"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Wang 13 pC/N Bound
          </button>
          <button
            onClick={onReset}
            className="px-2.5 py-1 text-xs font-medium rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
            title="Reset all parameters to literature point"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to literature point
          </button>
        </div>
      </div>

      {/* Primary Transduction Metric Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        {/* Wake Voltage */}
        <div className="bg-zinc-950 p-3.5 rounded-lg border border-amber-900/40 shadow-inner">
          <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Wake Voltage</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {derived.wakeVoltageMv.toFixed(1)} mV
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1">
            <span className="text-amber-300 font-bold">{derived.comparatorRatio.toFixed(2)}×</span> a 50 mV comparator
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            (Manuscript: 168.6 mV when g₃₃ rounded to 97.2)
          </div>
        </div>

        {/* g1 from Rs */}
        <div className="bg-zinc-950 p-3.5 rounded-lg border border-cyan-900/40 shadow-inner">
          <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">g₁ from Rs</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {formatSci(derived.g1)} S
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1">
            Strut aspect: 8 / 20.5
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Rs = {params.sheetResistance} Ω/sq (BWCNF)
          </div>
        </div>

        {/* Epsilon Eff */}
        <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 shadow-inner">
          <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">εeff (Dielectric)</div>
          <div className="text-xl font-bold font-mono text-zinc-100 mt-1">
            {derived.epsEff.toFixed(3)}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1">
            BaTiO₃ fraction: {params.btFraction.toFixed(2)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Yamada 0-3 composite model
          </div>
        </div>

        {/* Piezoelectric g33 & Barrier Ratio */}
        <div className="bg-zinc-950 p-3.5 rounded-lg border border-emerald-900/40 shadow-inner">
          <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">g₃₃ Voltage Const.</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {derived.g33.toFixed(2)} <span className="text-xs text-emerald-500 font-normal">mV·m/N</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-1">
            g₁ / g₂: <span className="text-emerald-300 font-bold">{formatSci(derived.g1OverG2, 2)}</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Barrier ratio: 7.227×10⁴
          </div>
        </div>
      </div>

      {/* Interactive Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-1">
        {/* Column 1: Conductance & Sheet Resistance */}
        <div className="space-y-4 bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-800/80">
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-zinc-800">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            Conductive Network
          </h3>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Sheet Resistance (Rs)</span>
              <span className="font-mono text-cyan-300">{params.sheetResistance} Ω/sq</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="1"
              value={params.sheetResistance}
              onChange={(e) => updateField('sheetResistance', Number(e.target.value))}
              className="w-full accent-cyan-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Barrier Conductance (g₂)</span>
              <span className="font-mono text-amber-300">{formatSci(params.barrierG2)} S</span>
            </div>
            <input
              type="range"
              min="-9"
              max="-3"
              step="0.2"
              value={Math.log10(params.barrierG2)}
              onChange={(e) => updateField('barrierG2', Math.pow(10, Number(e.target.value)))}
              className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Shunt y_base</span>
              <span className="font-mono text-zinc-300">{formatSci(params.shuntYBase)} S</span>
            </div>
            <input
              type="range"
              min="-8"
              max="-4"
              step="0.2"
              value={Math.log10(params.shuntYBase)}
              onChange={(e) => updateField('shuntYBase', Math.pow(10, Number(e.target.value)))}
              className="w-full accent-zinc-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Column 2: Dielectric & Piezo Properties */}
        <div className="space-y-4 bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-800/80">
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-zinc-800">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Transduction & Dielectric
          </h3>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Piezo Proxy (d₃₃)</span>
              <span className="font-mono text-amber-300">{(params.d33Proxy * 1e12).toFixed(1)} pC/N</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="15.0"
              step="0.2"
              value={params.d33Proxy * 1e12}
              onChange={(e) => updateField('d33Proxy', Number(e.target.value) * 1e-12)}
              className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-0.5">
              <span>4.8 pC/N (Literature)</span>
              <span>13.0 pC/N (Wang Bound)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">BaTiO₃ Volume Fraction</span>
              <span className="font-mono text-zinc-100">{params.btFraction.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.01"
              value={params.btFraction}
              onChange={(e) => updateField('btFraction', Number(e.target.value))}
              className="w-full accent-zinc-400 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Matrix / BT Permittivity</span>
              <span className="font-mono text-zinc-300">{params.matrixEps} / {params.btEps}</span>
            </div>
            <div className="text-[10px] text-zinc-500">
              εm = 3.2 (cellulose), εBT = 1700 (barium titanate nanoparticles)
            </div>
          </div>
        </div>

        {/* Column 3: Mechanical & Geometry */}
        <div className="space-y-4 bg-zinc-950/40 p-3.5 rounded-lg border border-zinc-800/80">
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-zinc-800">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            Mechanical Loading
          </h3>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Actuation Force (Fz)</span>
              <span className="font-mono text-emerald-300">{params.forceZ.toFixed(2)} N</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="5.0"
              step="0.1"
              value={params.forceZ}
              onChange={(e) => updateField('forceZ', Number(e.target.value))}
              className="w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Film Thickness</span>
              <span className="font-mono text-zinc-300">{(params.filmThickness * 1e6).toFixed(1)} µm</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-400 mt-1">
              <span>Node Area</span>
              <span className="font-mono text-zinc-300">{(params.nodeArea * 1e6).toFixed(2)} mm²</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Stress σz = {(params.forceZ / params.nodeArea / 1000).toFixed(1)} kPa
            </div>
          </div>

          <div className="p-2.5 bg-zinc-900 rounded border border-zinc-800 text-[11px] text-zinc-400 leading-snug">
            <strong className="text-zinc-200">Literature anchors:</strong> Fixed with manuscript: Fz = 1.5 N, node area 3.46 mm², film 4.0 µm, εm = 3.2, εBT = 1700, ridge shunt 2.5 mS. Liu, Zheng and Wan (2026); Mahadeva, Walus and Stoeber (2014).
          </div>
        </div>
      </div>
    </div>
  );
};
