import React, { useMemo } from 'react';
import { computeKagomeBands } from '../utils/bandStructure';
import { Compass, ShieldCheck, Info } from 'lucide-react';

interface BandStructureChartProps {
  breathingDelta: number;
  onDeltaChange: (delta: number) => void;
}

const fmtDelta = (d: number) => (d > 0 ? `+${d.toFixed(2)}` : d.toFixed(2));

export const BandStructureChart: React.FC<BandStructureChartProps> = ({ breathingDelta, onDeltaChange }) => {
  const bands = useMemo(() => computeKagomeBands(breathingDelta, 150), [breathingDelta]);

  // SVG dimensions
  const width = 500;
  const height = 280;
  const padding = { top: 25, right: 30, bottom: 40, left: 50 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // With t1 + t2 = 2 the spectrum always lies in [-4, 2]
  const yMin = -4.5;
  const yMax = 2.7;
  const getX = (kDist: number) => padding.left + kDist * plotWidth;
  const getY = (e: number) => padding.top + plotHeight * (1 - (e - yMin) / (yMax - yMin));

  const bandPath = (idx: 0 | 1 | 2) =>
    bands.pathPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.kDist).toFixed(1)} ${getY(p.bands[idx]).toFixed(1)}`)
      .join(' ');

  // Gap between the two dispersive bands at K
  const kDistK = bands.symmetryPoints[1].kDist;
  const xK = getX(kDistK);
  const kPoint = bands.pathPoints.reduce((prev, curr) =>
    Math.abs(curr.kDist - kDistK) < Math.abs(prev.kDist - kDistK) ? curr : prev
  );

  const atPaperValue = Math.abs(Math.abs(breathingDelta) - 0.18) < 1e-9;
  const phaseLabel =
    bands.phase === 'trivial'
      ? 'Trivial atomic phase (δb > 0)'
      : bands.phase === 'obstructed'
      ? 'Obstructed phase (δb < 0)'
      : 'Gap closed (δb = 0)';

  const presets: { value: number; label: string; active: string }[] = [
    { value: 0.18, label: '+0.18 (design)', active: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { value: -0.18, label: '−0.18', active: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
    { value: 0, label: '0.00', active: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* Spectrum card */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col h-full">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-zinc-100">Exact Bloch spectrum (Theorem 3.1)</h2>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono border ${
                  bands.phase === 'trivial'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                    : bands.phase === 'obstructed'
                    ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800'
                    : 'bg-cyan-950/60 text-cyan-300 border-cyan-800'
                }`}
              >
                {phaseLabel}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
              t₁ = 1 + δb (intracell △↑) = <span className="font-mono text-zinc-200">{bands.t1.toFixed(2)}</span>, t₂ = 1 − δb
              (intercell △↓) = <span className="font-mono text-zinc-200">{bands.t2.toFixed(2)}</span>. Gap at K = 3|t₁ − t₂| ={' '}
              <span className="font-mono text-zinc-200">{bands.gapAtK.toFixed(3)}</span>; flat band at t₁ + t₂ ={' '}
              <span className="font-mono text-zinc-200">{bands.flatBandEnergy.toFixed(3)}</span>.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => onDeltaChange(p.value)}
                className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
                  breathingDelta === p.value ? p.active : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dispersion plot */}
        <div className="relative my-3 flex-1 min-h-[280px] flex items-center justify-center">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-[300px]">
            {[-4, -2, 0, 2].map((e) => (
              <g key={`etick-${e}`}>
                <line
                  x1={padding.left}
                  y1={getY(e)}
                  x2={width - padding.right}
                  y2={getY(e)}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray={e === 0 ? 'none' : '3 3'}
                />
                <text x={padding.left - 8} y={getY(e) + 4} textAnchor="end" fontSize="10" fontFamily="monospace" fill="#71717a">
                  {e > 0 ? `+${e}` : e}
                </text>
              </g>
            ))}

            {bands.symmetryPoints.map((pt) => (
              <g key={`symm-${pt.label}-${pt.kDist}`}>
                <line
                  x1={getX(pt.kDist)}
                  y1={padding.top}
                  x2={getX(pt.kDist)}
                  y2={height - padding.bottom}
                  stroke="#3f3f46"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={getX(pt.kDist)}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="serif"
                  fill="#e4e4e7"
                >
                  {pt.label}
                </text>
              </g>
            ))}

            <path d={bandPath(2)} fill="none" stroke="#10b981" strokeWidth="2.5" />
            <path d={bandPath(1)} fill="none" stroke="#38bdf8" strokeWidth="2" />
            <path d={bandPath(0)} fill="none" stroke="#a855f7" strokeWidth="2" />

            {bands.gapAtK > 0.05 && (
              <g>
                <line
                  x1={xK + 10}
                  y1={getY(kPoint.bands[0])}
                  x2={xK + 10}
                  y2={getY(kPoint.bands[1])}
                  stroke="#f59e0b"
                  strokeWidth="2"
                />
                <circle cx={xK + 10} cy={getY(kPoint.bands[0])} r="2.5" fill="#f59e0b" />
                <circle cx={xK + 10} cy={getY(kPoint.bands[1])} r="2.5" fill="#f59e0b" />
                <text
                  x={xK + 16}
                  y={(getY(kPoint.bands[0]) + getY(kPoint.bands[1])) / 2 + 4}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill="#f59e0b"
                >
                  Gap = {bands.gapAtK.toFixed(3)}
                </text>
              </g>
            )}

            <text
              x={width - padding.right - 10}
              y={getY(bands.flatBandEnergy) - 6}
              textAnchor="end"
              fontSize="10"
              fontFamily="monospace"
              fill="#10b981"
            >
              Flat band (E = t₁ + t₂)
            </text>

            <text x={width / 2} y={height - 5} textAnchor="middle" fontSize="11" fontFamily="sans-serif" fill="#71717a">
              Path through the Brillouin zone
            </text>
            <text
              x={-height / 2}
              y={15}
              textAnchor="middle"
              transform="rotate(-90)"
              fontSize="11"
              fontFamily="sans-serif"
              fill="#71717a"
            >
              Energy (t₁ + t₂ = 2)
            </text>
          </svg>
        </div>

        <div className="pt-3 border-t border-zinc-800/80">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              Breathing parameter δb
            </span>
            <span className="font-mono text-zinc-100 font-semibold">{fmtDelta(breathingDelta)}</span>
          </div>
          <input
            type="range"
            min="-0.40"
            max="0.40"
            step="0.01"
            value={breathingDelta}
            onChange={(e) => onDeltaChange(Number(e.target.value))}
            className="w-full accent-indigo-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-0.5">
            <span>−0.40 (obstructed)</span>
            <span>0.00 (gap closed)</span>
            <span>+0.40 (trivial)</span>
          </div>
        </div>
      </div>

      {/* Notes card */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col space-y-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 mb-2">Which phase (Remark 3.3)</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The gap 3|t₁ − t₂| is the same for δb and −δb, so the spectrum alone does not identify the phase.
          </p>
        </div>

        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed space-y-2">
          {bands.phase === 'trivial' && (
            <p>
              <strong className="text-emerald-300">δb &gt; 0 (t₁ &gt; t₂):</strong> the gap stays open as t₂ → 0, which connects
              the lowest band to decoupled △↑ trimers with Wannier centres at the cell centres: the trivial atomic phase for a
              sample cut along complete △↑ cells.
            </p>
          )}
          {bands.phase === 'obstructed' && (
            <p>
              <strong className="text-indigo-300">δb &lt; 0 (t₁ &lt; t₂):</strong> the intracell hopping is the weaker one. This
              is the obstructed phase; the higher-order topological (HOTI) designation and its corner modes apply here, not to the
              design value δb = +0.18.
            </p>
          )}
          {bands.phase === 'gapless' && (
            <p>
              <strong className="text-cyan-300">δb = 0 (t₁ = t₂):</strong> the gap at K closes.
            </p>
          )}
          <p className="text-zinc-400">
            R_hex = 8 flake (217 cells), computed in the paper at δb = ±0.18:
          </p>
          <ul className="font-mono text-[11px] space-y-1">
            <li className={atPaperValue && breathingDelta > 0 ? 'text-emerald-300' : 'text-zinc-500'}>
              δb = +0.18: 217 states below the gap, 0 in the gap
            </li>
            <li className={atPaperValue && breathingDelta < 0 ? 'text-indigo-300' : 'text-zinc-500'}>
              δb = −0.18: 204 below, 21 in-gap boundary states (filling anomaly)
            </li>
          </ul>
        </div>

        <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-xs text-zinc-300 space-y-1">
          <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Compact localized states (Theorem 3.2)
          </div>
          <p className="text-zinc-400 leading-relaxed text-[11px]">
            For every internal hexagon, the state with alternating signs on its six vertices is an exact eigenstate at E = t₁ + t₂
            with zero amplitude elsewhere, for all t₁, t₂ &gt; 0. The flat band touches the upper dispersive band at Γ. The
            listing checks the Bloch formula at 400 random k to within <span className="font-mono text-emerald-300">2.3×10⁻¹⁵</span>{' '}
            and the CLS residual to <span className="font-mono text-emerald-300">2.7×10⁻¹⁷</span>.
          </p>
        </div>

        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
          <span>Revisions up to 3.8 called the design value δb = +0.18 a HOTI; Revision 3.9 withdrew this.</span>
        </div>
      </div>
    </div>
  );
};
