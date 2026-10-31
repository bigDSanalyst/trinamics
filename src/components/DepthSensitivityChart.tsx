import React, { useState } from 'react';
import { RingDepthSensitivity } from '../types/kagome';
import { ShieldAlert, Zap, Sliders, Info } from 'lucide-react';
import { formatSci } from '../utils/physics';

interface DepthSensitivityChartProps {
  sensitivities: RingDepthSensitivity[];
  snrDb: number;
  onSnrChange: (snr: number) => void;
  barrierG2: number;
  onBarrierChange: (g2: number) => void;
  ghostSeparationSigma: number;
  executionTimeMs: number;
}

export const DepthSensitivityChart: React.FC<DepthSensitivityChartProps> = ({
  sensitivities,
  snrDb,
  onSnrChange,
  barrierG2,
  onBarrierChange,
  ghostSeparationSigma,
  executionTimeMs,
}) => {
  const [hoveredRing, setHoveredRing] = useState<RingDepthSensitivity | null>(null);

  // SVG dimensions for chart
  const width = 520;
  const height = 280;
  const padding = { top: 30, right: 30, bottom: 40, left: 55 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Y-axis range: log10(sigma) from -16 to +2
  const yMin = -16;
  const yMax = 2;
  const xMin = 0;
  const xMax = 7;

  const getX = (ring: number) => padding.left + (ring / xMax) * plotWidth;
  const getY = (logSigma: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, logSigma));
    return padding.top + plotHeight * (1 - (clamped - yMin) / (yMax - yMin));
  };

  // 1-sigma oxide line y-coord (log10(1) = 0)
  const oxideLineY = getY(0);

  // Generate SVG path for sensitivity curve
  const pathD = sensitivities
    .map((s, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(s.ring).toFixed(1)} ${getY(s.detectionStatisticLogSigma).toFixed(1)}`)
    .join(' ');

  // Y-axis tick values: -16, -11, -6, 0, 2
  const yTicks = [-16, -11, -6, 0, 2];

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-100">How deep the perimeter can see</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 font-mono border border-zinc-700">
              Schur certificate in {executionTimeMs} ms
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Median boundary gain of one interior ridge, turned into a detection statistic against noise at{' '}
            <span className="font-mono text-zinc-200">{snrDb} dB</span>. Noise is i.i.d. on diag(Λ∂) with standard deviation ‖d‖₂ · 10^(−SNR/20) / √144.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSnrChange(34)}
            className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
              snrDb === 34
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            34 dB (Lit.)
          </button>
          <button
            onClick={() => onSnrChange(73)}
            className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
              snrDb === 73
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            73 dB (5σ Ring 7)
          </button>
        </div>
      </div>

      {/* Main Chart Graphic */}
      <div className="relative my-3 flex-1 min-h-[280px] flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-[300px]">
          {/* Grid lines */}
          {yTicks.map((yVal) => (
            <g key={`ygrid-${yVal}`}>
              <line
                x1={padding.left}
                y1={getY(yVal)}
                x2={width - padding.right}
                y2={getY(yVal)}
                stroke="#27272a"
                strokeWidth="1"
                strokeDasharray={yVal === 0 ? 'none' : '3 3'}
              />
              <text
                x={padding.left - 8}
                y={getY(yVal) + 4}
                textAnchor="end"
                fontSize="10"
                fontFamily="monospace"
                fill={yVal === 0 ? '#fbbf24' : '#71717a'}
              >
                {yVal > 0 ? `+${yVal}` : yVal}
              </text>
            </g>
          ))}

          {/* X-axis Ticks 0..7 */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((ring) => (
            <g key={`xtick-${ring}`}>
              <line
                x1={getX(ring)}
                y1={height - padding.bottom}
                x2={getX(ring)}
                y2={height - padding.bottom + 5}
                stroke="#52525b"
                strokeWidth="1"
              />
              <text
                x={getX(ring)}
                y={height - padding.bottom + 18}
                textAnchor="middle"
                fontSize="11"
                fontFamily="monospace"
                fill="#a1a1aa"
              >
                {ring}
              </text>
            </g>
          ))}

          {/* 1-Sigma Oxide Line marker (at log10(sigma) = 0) */}
          <line
            x1={padding.left}
            y1={oxideLineY}
            x2={width - padding.right}
            y2={oxideLineY}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x={width - padding.right - 6}
            y={oxideLineY - 6}
            textAnchor="end"
            fontSize="10"
            fontWeight="600"
            fontFamily="monospace"
            fill="#f59e0b"
          >
            1σ Oxide Line (Detection threshold)
          </text>

          {/* Shaded Area Under Curve */}
          <path
            d={`${pathD} L ${getX(7)} ${getY(yMin)} L ${getX(0)} ${getY(yMin)} Z`}
            fill="url(#curveGradient)"
            opacity="0.3"
          />

          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Sensitivity Curve Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Ring Points */}
          {sensitivities.map((s) => {
            const cx = getX(s.ring);
            const cy = getY(s.detectionStatisticLogSigma);
            const isHovered = hoveredRing?.ring === s.ring;
            const isAbove1Sigma = s.detectionStatisticLogSigma >= 0;

            return (
              <circle
                key={`point-${s.ring}`}
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 4}
                fill={isAbove1Sigma ? '#10b981' : '#38bdf8'}
                stroke="#09090b"
                strokeWidth="1.5"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredRing(s)}
                onMouseLeave={() => setHoveredRing(null)}
              />
            );
          })}

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fontSize="11"
            fontFamily="sans-serif"
            fill="#71717a"
          >
            Ring Depth (0 = Center Plaquette, 7 = Perimeter Rim)
          </text>
          <text
            x={-height / 2}
            y={14}
            textAnchor="middle"
            transform="rotate(-90)"
            fontSize="11"
            fontFamily="sans-serif"
            fill="#71717a"
          >
            log₁₀(Detection Statistic σ)
          </text>
        </svg>

        {/* Hover Tooltip */}
        {hoveredRing && (
          <div className="absolute top-2 right-4 bg-zinc-950/95 border border-zinc-700 p-2.5 rounded-lg shadow-xl text-xs font-mono backdrop-blur-sm z-10">
            <div className="font-semibold text-zinc-100 pb-1 mb-1 border-b border-zinc-800">
              Ring {hoveredRing.ring} Depth Analysis
            </div>
            <div className="space-y-0.5 text-zinc-300">
              <div>Detection: <span className="text-cyan-300 font-bold">{hoveredRing.detectionStatisticLogSigma} log₁₀(σ)</span> ({formatSci(hoveredRing.sigmaValue)} σ)</div>
              <div>Boundary Gain: <span className="text-zinc-400">{hoveredRing.boundaryGainDb.toFixed(1)} dB</span></div>
              <div>SNR for 5σ: <span className="text-amber-300 font-bold">{hoveredRing.snrRequiredFor5Sigma} dB</span></div>
              <div className="text-zinc-500 text-[10px] mt-1 pt-1 border-t border-zinc-800">
                {hoveredRing.ring <= 4 ? 'Interior blind zone at 34 dB (< 10⁻⁶ σ)' : 'Directly resolvable near boundary frame'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Critical Findings Footer & Controls */}
      <div className="pt-3 border-t border-zinc-800/80 space-y-3">
        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Measurement SNR
              </span>
              <span className="font-mono text-cyan-300 font-semibold">{snrDb} dB</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              step="1"
              value={snrDb}
              onChange={(e) => onSnrChange(Number(e.target.value))}
              className="w-full accent-cyan-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-0.5">
              <span>20 dB (Noisy)</span>
              <span>34 dB (Manuscript)</span>
              <span>73 dB (Ring 7 at 5σ)</span>
              <span>90 dB</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Barrier Conductance g₂
              </span>
              <span className="font-mono text-amber-300">{formatSci(barrierG2)} S</span>
            </div>
            <input
              type="range"
              min="-9"
              max="-3"
              step="0.2"
              value={Math.log10(barrierG2)}
              onChange={(e) => onBarrierChange(Math.pow(10, Number(e.target.value)))}
              className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-0.5">
              <span>10⁻⁹ S (Strict)</span>
              <span>10⁻⁷ S (Literature point)</span>
              <span>10⁻³ S (Leaky)</span>
            </div>
          </div>
        </div>

        {/* Narrative Callout */}
        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/90 text-xs text-zinc-300 space-y-1">
          <p className="leading-relaxed">
            <strong className="text-zinc-100">At the anchor conductances:</strong> Ring 7 reaches <span className="font-mono text-emerald-300">5σ</span> near <span className="font-mono text-emerald-300">73 dB</span>. The benchmark ridges sit on <span className="font-mono text-amber-300">rings 4 and inward</span>, where a single cell is still below <span className="font-mono text-rose-300">10⁻⁶ σ</span> at 34 dB.
          </p>
          <p className="text-zinc-400 text-[11px]">
            Ghost-to-truth separation on the full diagonal is <span className="font-mono text-zinc-200">&lt; 10⁻⁶ σ</span> at this SNR (exact model: <span className="font-mono text-rose-400">{formatSci(ghostSeparationSigma)} σ</span>).
          </p>
        </div>
      </div>
    </div>
  );
};
