import React, { useState } from 'react';
import { TOMOGRAPHY_V54, AsymptoticCurvePoint } from '../utils/tomography_v54';
import { AlertTriangle, CheckCircle2, TrendingUp, Info } from 'lucide-react';

export const V54AsymptoticLimit: React.FC = () => {
  const [hoveredPoint, setHoveredPoint] = useState<AsymptoticCurvePoint | null>(null);

  const points = TOMOGRAPHY_V54.asymptotic_k3;

  // SVG dimensions
  const width = 640;
  const height = 300;
  const padding = { top: 30, right: 35, bottom: 45, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const minR = 2;
  const maxR = 15;
  const minY = 0;
  const maxY = 660; // Max N_I at R=15 is 631

  const getX = (r: number) => padding.left + ((r - minR) / (maxR - minR)) * plotWidth;
  const getY = (val: number) => padding.top + plotHeight * (1 - (val - minY) / (maxY - minY));

  // Points for N_I(R) curve
  const niPath = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.R).toFixed(1)} ${getY(p.nInterior).toFixed(1)}`)
    .join(' ');

  // Points for rank[A_I; C^(3)] curve
  const rankPath = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.R).toFixed(1)} ${getY(p.rankMod3).toFixed(1)}`)
    .join(' ');

  // X coords for vertical zones
  const xR9 = getX(9.5);
  const xR10 = getX(10.5);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono border border-amber-800 font-semibold uppercase tracking-wider">
                Theorem 5.14
              </span>
              <span className="text-xs text-zinc-400 font-mono">Asymptotic Dimensional Obstruction</span>
            </div>
            <h2 className="text-xl font-bold text-zinc-100 mt-1 tracking-tight">
              No Fixed Split Order Works for All R_hex
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              While mod-3 interleaved reading achieves full rank 169/169 at R_hex = 8 and 217/217 at R_hex = 9, it becomes rank-deficient for every R_hex ≥ 10.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
            <span className="text-emerald-400 font-bold">R ≤ 9: Full Rank</span>
            <span className="text-zinc-600">|</span>
            <span className="text-yellow-400 font-bold">R = 10: Deficient 1–3</span>
            <span className="text-zinc-600">|</span>
            <span className="text-rose-400 font-bold">R ≥ 11: Deficient 25+</span>
          </div>
        </div>
      </div>

      {/* Main Asymptotic Plot */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
              N_I(R) vs Observable Rank under Mod-3 Interleaved Chords
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comparison of total interior cells N_I(R) = 3R² − 3R + 1 with rank[A_I; C^(3)](R)
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-zinc-400"></span>
              <span className="text-zinc-300">N_I(R) (Total cells, Θ(R²))</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400"></span>
              <span className="text-emerald-300 font-semibold">rank[A_I; C^(3)]</span>
            </div>
          </div>
        </div>

        {/* SVG Graphic */}
        <div className="relative my-2 min-h-[300px] flex items-center justify-center">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-[320px]">
            {/* Background Color Zones */}
            {/* Zone 1: Full Rank (R=2..9) */}
            <rect
              x={padding.left}
              y={padding.top}
              width={xR9 - padding.left}
              height={plotHeight}
              fill="#064e3b"
              fillOpacity="0.12"
            />
            {/* Zone 2: Threshold (R=10) */}
            <rect
              x={xR9}
              y={padding.top}
              width={xR10 - xR9}
              height={plotHeight}
              fill="#713f12"
              fillOpacity="0.15"
            />
            {/* Zone 3: Deficient (R=11..15) */}
            <rect
              x={xR10}
              y={padding.top}
              width={width - padding.right - xR10}
              height={plotHeight}
              fill="#881337"
              fillOpacity="0.15"
            />

            {/* Grid Lines */}
            {[100, 200, 300, 400, 500, 600].map((yVal) => (
              <g key={`ygrid-${yVal}`}>
                <line
                  x1={padding.left}
                  y1={getY(yVal)}
                  x2={width - padding.right}
                  y2={getY(yVal)}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={getY(yVal) + 4}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="monospace"
                  fill="#71717a"
                >
                  {yVal}
                </text>
              </g>
            ))}

            {/* X-axis Ticks R=2..15 */}
            {points.map((pt) => (
              <g key={`xtick-${pt.R}`}>
                <line
                  x1={getX(pt.R)}
                  y1={height - padding.bottom}
                  x2={getX(pt.R)}
                  y2={height - padding.bottom + 5}
                  stroke="#52525b"
                  strokeWidth="1"
                />
                <text
                  x={getX(pt.R)}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="monospace"
                  fill={pt.R === 8 ? '#10b981' : pt.R === 10 ? '#facc15' : pt.R >= 11 ? '#f43f5e' : '#a1a1aa'}
                  fontWeight={pt.R === 8 || pt.R === 10 ? 'bold' : 'normal'}
                >
                  {pt.R}
                </text>
              </g>
            ))}

            {/* Shaded Area of Rank Deficiency (Between N_I and Rank) */}
            <path
              d={`${niPath} L ${getX(15)} ${getY(points[points.length - 1].rankMod3)} L ${getX(10)} ${getY(points[8].rankMod3)} Z`}
              fill="#ef4444"
              fillOpacity="0.18"
            />

            {/* N_I Curve (Dashed White/Zinc) */}
            <path
              d={niPath}
              fill="none"
              stroke="#71717a"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Observable Rank Curve (Solid Emerald/Yellow/Red) */}
            <path
              d={rankPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Point circles */}
            {points.map((pt) => {
              const cx = getX(pt.R);
              const cyRank = getY(pt.rankMod3);
              const isHovered = hoveredPoint?.R === pt.R;
              const color = pt.status === 'full' ? '#10b981' : pt.status === 'threshold' ? '#facc15' : '#f43f5e';

              return (
                <g key={`pt-${pt.R}`}>
                  <circle
                    cx={cx}
                    cy={cyRank}
                    r={isHovered ? 6 : pt.R === 8 ? 5.5 : 4}
                    fill={color}
                    stroke="#09090b"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {pt.R === 8 && (
                    <text
                      x={cx}
                      y={cyRank - 10}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill="#10b981"
                    >
                      R=8 (169/169)
                    </text>
                  )}
                  {pt.R === 10 && (
                    <text
                      x={cx}
                      y={cyRank - 10}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill="#facc15"
                    >
                      Deficient
                    </text>
                  )}
                </g>
              );
            })}

            {/* Zone Label Watermarks */}
            <text
              x={(padding.left + xR9) / 2}
              y={padding.top + 20}
              textAnchor="middle"
              fontSize="10"
              fontFamily="monospace"
              fill="#10b981"
              fillOpacity="0.8"
              fontWeight="bold"
            >
              ZONE 1: FULL RANK (R ≤ 9)
            </text>
            <text
              x={(xR10 + width - padding.right) / 2}
              y={padding.top + 20}
              textAnchor="middle"
              fontSize="10"
              fontFamily="monospace"
              fill="#f43f5e"
              fillOpacity="0.8"
              fontWeight="bold"
            >
              ZONE 2: ASYMPTOTICALLY DEFICIENT (R ≥ 10)
            </text>
          </svg>

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-2 right-4 bg-zinc-950/95 border border-zinc-700 p-3 rounded-lg shadow-xl text-xs font-mono backdrop-blur-sm z-10 space-y-1">
              <div className="font-semibold text-zinc-100 border-b border-zinc-800 pb-1 flex justify-between gap-4">
                <span>R_hex = {hoveredPoint.R}</span>
                <span className={hoveredPoint.status === 'full' ? 'text-emerald-400 font-bold' : hoveredPoint.status === 'threshold' ? 'text-yellow-400 font-bold' : 'text-rose-400 font-bold'}>
                  {hoveredPoint.status === 'full' ? 'FULL RANK' : hoveredPoint.status === 'threshold' ? 'DEFICIENT (1–3)' : 'DEFICIENT (25+)'}
                </span>
              </div>
              <div className="text-zinc-300">Total Cells N_I: <span className="font-bold text-zinc-100">{hoveredPoint.nInterior}</span></div>
              <div className="text-zinc-300">Rank [A_I; C^(3)]: <span className="font-bold text-emerald-400">{hoveredPoint.rankMod3}</span></div>
              <div className="text-zinc-300">Kernel Dimension: <span className="font-bold text-amber-400">{hoveredPoint.nInterior - hoveredPoint.rankMod3}</span></div>
              <div className="text-zinc-400 text-[11px] pt-1 border-t border-zinc-800">
                Dilated translates T_3(R): {hoveredPoint.tCount} · Boundary d(R): {hoveredPoint.distinctBoundaryD}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mathematical Breakdown & Critical Radius Formula */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Closed-Form Corollary Card */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              Critical Radius Corollary: R_crit(k)
            </h4>
          </div>
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-xs text-amber-300">
            R_crit(k) = ⌈ (10k + 9 + √(4k² + 120k + 33)) / 6 ⌉
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            The exact threshold where the number of dilated switching components T_k(R) exceeds the boundary dimension d(R) = 6R − 3:
          </p>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            {TOMOGRAPHY_V54.r_crit_values.map((item) => (
              <div key={item.k} className="p-2 bg-zinc-950 rounded border border-zinc-800/80">
                <div className="text-zinc-400 font-bold">Split k = {item.k} → R_crit = {item.rCrit}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{item.note}</div>
              </div>
            ))}
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            * Note: At k=4, R_crit = 13 (not 12; the informal "2k+4" heuristic fails at k ≥ 4).
          </div>
        </div>

        {/* Honest Scope & Scientific Implication */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <Info className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Honest Scope Statement & Theoretical Limit
              </h4>
            </div>
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-300 space-y-2 leading-relaxed">
              <p>
                <strong className="text-zinc-100">For k=3:</strong> Full algebraic rank holds for all <span className="font-mono text-emerald-300">R ≤ 9</span>. It is provably deficient for every <span className="font-mono text-rose-300">R ≥ 10</span>.
              </p>
              <p className="text-zinc-400">
                The deficiency grows because <span className="font-mono text-zinc-200">T_k(R) = Θ(R²)</span> while <span className="font-mono text-zinc-200">d(R) = Θ(R)</span>. 
                This is not a bug or artifact in the mod-3 probe; it is an insurmountable <strong className="text-zinc-200">design limit of any fixed-order interleaved split</strong> on expanding lattice domains.
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/40 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>R_hex = 8 is within the certified full-rank window (dim ker = 0).</span>
          </div>
        </div>
      </div>
    </div>
  );
};
