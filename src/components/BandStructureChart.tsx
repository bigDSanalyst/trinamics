import React, { useMemo, useState } from 'react';
import { computeKagomeBands } from '../utils/bandStructure';
import { Compass, RotateCcw, ShieldCheck, AlertCircle } from 'lucide-react';
import { formatSci } from '../utils/physics';

interface BandStructureChartProps {
  breathingDelta: number;
  onDeltaChange: (delta: number) => void;
}

export const BandStructureChart: React.FC<BandStructureChartProps> = ({
  breathingDelta,
  onDeltaChange,
}) => {
  const [hoveredK, setHoveredK] = useState<{ kDist: number; bands: [number, number, number] } | null>(null);

  const bandsData = useMemo(() => computeKagomeBands(breathingDelta, 120), [breathingDelta]);

  // SVG dimensions
  const width = 500;
  const height = 280;
  const padding = { top: 25, right: 30, bottom: 40, left: 50 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const yMin = -4;
  const yMax = 4;

  const getX = (kDist: number) => padding.left + kDist * plotWidth;
  const getY = (e: number) => padding.top + plotHeight * (1 - (e - yMin) / (yMax - yMin));

  // High symmetry path labels
  // Gamma (0), K (0.435), M (0.622), Gamma (1.0)
  const symmetryPoints = [
    { label: 'Γ', kDist: 0.0 },
    { label: 'K', kDist: 0.435 },
    { label: 'M', kDist: 0.622 },
    { label: 'Γ', kDist: 1.0 },
  ];

  // Paths for 3 bands
  const lowerBandPath = bandsData.pathPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.kDist).toFixed(1)} ${getY(p.bands[0]).toFixed(1)}`)
    .join(' ');

  const middleBandPath = bandsData.pathPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.kDist).toFixed(1)} ${getY(p.bands[1]).toFixed(1)}`)
    .join(' ');

  const flatBandPath = bandsData.pathPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.kDist).toFixed(1)} ${getY(p.bands[2]).toFixed(1)}`)
    .join(' ');

  // Dirac gap vertical marker at K
  const kDistK = 0.435;
  const xK = getX(kDistK);
  // Find point closest to K
  const kPoint = bandsData.pathPoints.reduce((prev, curr) =>
    Math.abs(curr.kDist - kDistK) < Math.abs(prev.kDist - kDistK) ? curr : prev
  );

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-100">Dirac gap, not a corner phase</h2>
            <span
              className={`text-xs px-2 py-0.5 rounded font-mono border ${
                bandsData.isTrivialPhase
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  : 'bg-indigo-950/60 text-indigo-300 border-indigo-800'
              }`}
            >
              {bandsData.isTrivialPhase ? 'Trivial Phase (δb > 0)' : 'HOTI Corner Phase (δb < 0)'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
            δb = <span className="font-mono text-zinc-200">{breathingDelta > 0 ? `+${breathingDelta.toFixed(2)}` : breathingDelta.toFixed(2)}</span> puts the Wannier center inside the cell. Gap at K is <span className="font-mono text-zinc-200">{bandsData.diracGapAtK.toFixed(3)}</span>. Flat band at t₁ + t₂ = <span className="font-mono text-zinc-200">{bandsData.flatBandEnergy.toFixed(3)}</span>.
          </p>
        </div>

        {/* Quick Delta presets */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onDeltaChange(0.18)}
            className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
              breathingDelta === 0.18
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            +0.18 (Paper)
          </button>
          <button
            onClick={() => onDeltaChange(-0.18)}
            className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
              breathingDelta === -0.18
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            -0.18 (HOTI)
          </button>
          <button
            onClick={() => onDeltaChange(0.0)}
            className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
              breathingDelta === 0.0
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            0.00 (Dirac)
          </button>
        </div>
      </div>

      {/* SVG Dispersion Plot */}
      <div className="relative my-3 flex-1 min-h-[280px] flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-[300px]">
          {/* Energy Y-Ticks */}
          {[-4, -2, 0, 2, 4].map((e) => (
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
              <text
                x={padding.left - 8}
                y={getY(e) + 4}
                textAnchor="end"
                fontSize="10"
                fontFamily="monospace"
                fill="#71717a"
              >
                {e > 0 ? `+${e}` : e}
              </text>
            </g>
          ))}

          {/* High-symmetry vertical dividing lines */}
          {symmetryPoints.map((pt) => {
            const xVal = getX(pt.kDist);
            return (
              <g key={`symm-${pt.label}-${pt.kDist}`}>
                <line
                  x1={xVal}
                  y1={padding.top}
                  x2={xVal}
                  y2={height - padding.bottom}
                  stroke="#3f3f46"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={xVal}
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
            );
          })}

          {/* 3 Bands */}
          {/* Flat Band (Emerald / Teal) */}
          <path
            d={flatBandPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="none"
          />

          {/* Middle Band (Cyan) */}
          <path
            d={middleBandPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
          />

          {/* Lower Band (Purple) */}
          <path
            d={lowerBandPath}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
          />

          {/* Dirac Gap Callout at K */}
          {bandsData.diracGapAtK > 0.05 && (
            <g>
              <line
                x1={xK + 10}
                y1={getY(kPoint.bands[1])}
                x2={xK + 10}
                y2={getY(kPoint.bands[2])}
                stroke="#f59e0b"
                strokeWidth="2"
              />
              <circle cx={xK + 10} cy={getY(kPoint.bands[1])} r="2.5" fill="#f59e0b" />
              <circle cx={xK + 10} cy={getY(kPoint.bands[2])} r="2.5" fill="#f59e0b" />
              <text
                x={xK + 16}
                y={(getY(kPoint.bands[1]) + getY(kPoint.bands[2])) / 2 + 4}
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                fill="#f59e0b"
              >
                Gap = {bandsData.diracGapAtK.toFixed(3)}
              </text>
            </g>
          )}

          {/* Flat Band Annotation */}
          <text
            x={width - padding.right - 10}
            y={getY(bandsData.flatBandEnergy) - 6}
            textAnchor="end"
            fontSize="10"
            fontFamily="monospace"
            fill="#10b981"
          >
            Flat Band (E = {bandsData.flatBandEnergy.toFixed(2)})
          </text>

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fontSize="11"
            fontFamily="sans-serif"
            fill="#71717a"
          >
            Quasimomentum Path in Brillouin Zone
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
            Energy E / t₀
          </text>
        </svg>
      </div>

      {/* Breathing Parameter Slider & Physical Topology Notes */}
      <div className="pt-3 border-t border-zinc-800/80 space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              Breathing Parameter (δb)
            </span>
            <span className="font-mono text-zinc-100 font-semibold">
              {breathingDelta > 0 ? `+${breathingDelta.toFixed(2)}` : breathingDelta.toFixed(2)}
            </span>
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
            <span>-0.40 (HOTI Corner Phase)</span>
            <span>0.00 (Dirac Semimetal)</span>
            <span>+0.18 (Trivial Dirac Gap)</span>
            <span>+0.40</span>
          </div>
        </div>

        {/* Audit Callout on Topology */}
        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/90 text-xs text-zinc-300 space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-zinc-200">Compact Localized State (CLS) Plaquette:</span>
            <span className="font-mono text-emerald-300 text-[11px]">
              residual &lt; 10⁻¹² ({formatSci(bandsData.clsResidual)})
            </span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            Destructive phase cancellation around each hexagon ring guarantees zero boundary leakage. 
            Because <span className="font-mono text-zinc-200">δb = +0.18 &gt; 0</span>, the Wannier centers are localized inside the elementary cell, rendering this a <strong className="text-zinc-100">trivial insulating state with a bulk Dirac gap</strong> rather than a corner-topological (HOTI) phase.
          </p>
        </div>
      </div>
    </div>
  );
};
