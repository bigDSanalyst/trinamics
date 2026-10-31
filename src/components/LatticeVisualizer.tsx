import React, { useState, useMemo } from 'react';
import { KagomeBoundaryNode, KagomeCell } from '../types/kagome';
import { computeLatticeHeatmap, CellHeatmapMetric, getHeatmapColor } from '../utils/heatmap';
import { Eye, Info, ZoomIn, ZoomOut, RotateCcw, Flame, Sparkles } from 'lucide-react';
import { formatSci } from '../utils/physics';

interface LatticeVisualizerProps {
  cells: KagomeCell[];
  boundaryNodes: KagomeBoundaryNode[];
  truthCellIds: number[];
  ghost1CellIds: number[];
  ghost2CellIds: number[];
  snrDb: number;
  barrierG2: number;
}

export type LatticeViewMode = 'truth' | 'ghost1' | 'ghost2' | 'diff' | 'cls' | 'heatmap';
export type HeatmapMetricType = 'suppression' | 'error' | 'logSigma';

export const LatticeVisualizer: React.FC<LatticeVisualizerProps> = ({
  cells,
  boundaryNodes,
  truthCellIds,
  ghost1CellIds,
  ghost2CellIds,
  snrDb,
  barrierG2,
}) => {
  const [viewMode, setViewMode] = useState<LatticeViewMode>('heatmap'); // Default or toggleable
  const [heatmapType, setHeatmapType] = useState<HeatmapMetricType>('suppression');
  const [hoveredCell, setHoveredCell] = useState<KagomeCell | null>(null);
  const [hoveredBoundary, setHoveredBoundary] = useState<KagomeBoundaryNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [highlightDarkNodes, setHighlightDarkNodes] = useState(false);
  const [showOxideContour, setShowOxideContour] = useState(true);

  // Group cells by ring
  const cellsByRing = useMemo(() => {
    const map = new Map<number, KagomeCell[]>();
    cells.forEach((c) => {
      if (!map.has(c.ring)) map.set(c.ring, []);
      map.get(c.ring)!.push(c);
    });
    return map;
  }, [cells]);

  // Compute spatial heatmap distribution based on current parameters (SNR & barrier g2)
  const heatmapData = useMemo(
    () => computeLatticeHeatmap(cells, snrDb, barrierG2),
    [cells, snrDb, barrierG2]
  );

  const hoveredHeatmapMetric = useMemo(() => {
    if (!hoveredCell) return null;
    return heatmapData.cellMetrics.get(hoveredCell.id) || null;
  }, [hoveredCell, heatmapData]);

  // Determine radius where logSigma crosses 0 (1-sigma oxide line)
  // At 34 dB, logSigma is 0 between ring 6 (-2.6) and ring 7 (+2.1)
  // Linear interpolation: ring = 6 + (0 - (-2.6))/(2.1 - (-2.6)) = 6 + 2.6/4.7 = 6.55 rings
  const oxideRingRadius = useMemo(() => {
    const baseByRing = [-16.0, -15.1, -13.2, -11.0, -8.3, -6.1, -2.6, 2.1];
    const snrShift = (snrDb - 34) / 20;
    const effectiveByRing = baseByRing.map((b) => b + snrShift);

    // Find crossing of 0
    for (let r = 0; r < 7; r++) {
      if (effectiveByRing[r] <= 0 && effectiveByRing[r + 1] >= 0) {
        const fraction = (0 - effectiveByRing[r]) / (effectiveByRing[r + 1] - effectiveByRing[r]);
        return (r + fraction) * 22; // 22px per ring
      }
    }
    if (effectiveByRing[0] > 0) return 10; // All cells observable
    if (effectiveByRing[7] < 0) return 7 * 22 + 15; // Beyond perimeter
    return 6.55 * 22;
  }, [snrDb]);

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col h-full">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-100">Kagome Boundary & Tomography Map</h2>
            <span className="text-xs font-mono text-zinc-400">
              169 cells · 144 boundary terminals (75 dark)
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Spatial distribution of ghost suppression efficiency & detection errors across the lattice
          </p>
        </div>

        {/* View Mode Buttons */}
        <div className="flex flex-wrap items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              viewMode === 'heatmap'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
            Error Heatmap
          </button>
          <button
            onClick={() => setViewMode('truth')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'truth'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Truth (12)
          </button>
          <button
            onClick={() => setViewMode('ghost1')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'ghost1'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ghost 1
          </button>
          <button
            onClick={() => setViewMode('ghost2')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'ghost2'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ghost 2
          </button>
          <button
            onClick={() => setViewMode('diff')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'diff'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Diff
          </button>
          <button
            onClick={() => setViewMode('cls')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'cls'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            CLS Plaquette
          </button>
        </div>

        {/* View Options & Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setHighlightDarkNodes(!highlightDarkNodes)}
            className={`px-2 py-1 text-xs font-medium rounded border transition-colors flex items-center gap-1.5 ${
              highlightDarkNodes
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
            }`}
            title="Highlight 75 dark nodes with no interior neighbor"
          >
            <Eye className="w-3.5 h-3.5" />
            75 Dark Nodes
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
            className="p-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
            className="p-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            title="Reset zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Heatmap Sub-Controls (shown when in heatmap mode) */}
      {viewMode === 'heatmap' && (
        <div className="flex flex-wrap items-center justify-between gap-3 py-2 px-3 bg-zinc-950/80 rounded-lg border border-zinc-800 my-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">Color Metric:</span>
            <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
              <button
                onClick={() => setHeatmapType('suppression')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  heatmapType === 'suppression'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Ghost Suppression (0–100%)
              </button>
              <button
                onClick={() => setHeatmapType('error')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  heatmapType === 'error'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Detection Error (0.0–1.0)
              </button>
              <button
                onClick={() => setHeatmapType('logSigma')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  heatmapType === 'logSigma'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Sensitivity log₁₀(σ)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOxideContour}
                onChange={(e) => setShowOxideContour(e.target.checked)}
                className="accent-amber-500 rounded"
              />
              <span className="text-[11px]">Show 1σ Oxide Line contour</span>
            </label>
            <span className="text-zinc-500 font-mono text-[11px]">
              SNR: <strong className="text-cyan-300">{snrDb} dB</strong>
            </span>
          </div>
        </div>
      )}

      {/* SVG Canvas Container */}
      <div className="relative flex-1 min-h-[440px] flex items-center justify-center overflow-hidden my-2 select-none bg-zinc-950/60 rounded-lg border border-zinc-900">
        <svg
          viewBox="-240 -240 480 480"
          className="w-full h-full max-h-[480px]"
          style={{ transform: `scale(${zoom})`, transition: 'transform 0.15s ease-out' }}
        >
          <defs>
            <radialGradient id="ringGlow" cx="0%" cy="0%" r="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="blindZoneGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b0764" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Blind Zone Interior Underlay in Heatmap Mode */}
          {viewMode === 'heatmap' && (
            <circle
              cx="0"
              cy="0"
              r={oxideRingRadius}
              fill="url(#blindZoneGlow)"
              pointerEvents="none"
            />
          )}

          {/* Concentric Guide Rings 0 to 7 */}
          {[1, 2, 3, 4, 5, 6, 7].map((ring) => (
            <circle
              key={ring}
              cx="0"
              cy="0"
              r={ring * 22}
              fill="none"
              stroke="#27272a"
              strokeWidth="0.7"
              strokeDasharray={ring % 2 === 0 ? '3 3' : 'none'}
            />
          ))}

          {/* 1-Sigma Oxide Line Contour on the 2D plane */}
          {viewMode === 'heatmap' && showOxideContour && oxideRingRadius > 0 && (
            <g pointerEvents="none">
              <circle
                cx="0"
                cy="0"
                r={oxideRingRadius}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.8"
                strokeDasharray="4 4"
              />
              <text
                x={0}
                y={-oxideRingRadius - 4}
                textAnchor="middle"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
                fill="#f59e0b"
              >
                1σ Oxide Line (Detection Boundary)
              </text>
            </g>
          )}

          {/* Boundary terminal ring (Radius 176) */}
          <circle
            cx="0"
            cy="0"
            r="176"
            fill="none"
            stroke="#3f3f46"
            strokeWidth="1.2"
          />

          {/* Inter-cell dual graph edges (subtle) */}
          {Array.from(cellsByRing.entries()).map(([ring, ringCells]) => {
            if (ring === 0) return null;
            return ringCells.map((cell, idx) => {
              const nextCell = ringCells[(idx + 1) % ringCells.length];
              return (
                <line
                  key={`edge-${cell.id}-${nextCell.id}`}
                  x1={cell.x}
                  y1={cell.y}
                  x2={nextCell.x}
                  y2={nextCell.y}
                  stroke={viewMode === 'heatmap' ? '#18181b' : '#27272a'}
                  strokeWidth="0.8"
                />
              );
            });
          })}

          {/* Boundary Spoke Connections to Ring 7 active cells */}
          {boundaryNodes.map((b) => {
            if (b.isDark) return null;
            return (
              <line
                key={`bspoke-${b.id}`}
                x1={b.x}
                y1={b.y}
                x2={b.x * 0.88}
                y2={b.y * 0.88}
                stroke="#0e7490"
                strokeWidth="0.6"
                strokeOpacity="0.5"
              />
            );
          })}

          {/* Interior Dual Cells */}
          {cells.map((cell) => {
            const metric = heatmapData.cellMetrics.get(cell.id);
            let fillColor = '#3f3f46';
            let strokeColor = '#18181b';
            let strokeWidth = 0.8;
            let radius = 4.2;

            if (viewMode === 'heatmap' && metric) {
              if (heatmapType === 'suppression') {
                fillColor = metric.color;
              } else if (heatmapType === 'error') {
                // High error = red/rose, low error = emerald
                fillColor = getHeatmapColor((1 - metric.detectionError) * 100);
              } else {
                // logSigma
                fillColor = metric.color;
              }

              // Highlight cells in the manuscript dual-ridge subtly
              if (cell.isTruth) {
                strokeColor = '#fef08a';
                strokeWidth = 1.4;
                radius = 5.2;
              } else {
                radius = 4.6;
              }
            } else if (viewMode === 'truth') {
              if (cell.isTruth) {
                fillColor = '#f59e0b';
                strokeColor = '#fef3c7';
                strokeWidth = 1.6;
                radius = 6.2;
              }
            } else if (viewMode === 'ghost1') {
              if (cell.isGhost1) {
                fillColor = '#06b6d4';
                strokeColor = '#cffafe';
                strokeWidth = 1.6;
                radius = 6.2;
              }
            } else if (viewMode === 'ghost2') {
              if (cell.isGhost2) {
                fillColor = '#6366f1';
                strokeColor = '#e0e7ff';
                strokeWidth = 1.6;
                radius = 6.2;
              }
            } else if (viewMode === 'diff') {
              const inTruth = cell.isTruth;
              const inGhost = cell.isGhost1;
              if (inTruth && inGhost) {
                fillColor = '#a855f7';
                radius = 6.0;
              } else if (inTruth) {
                fillColor = '#f59e0b';
                radius = 6.0;
              } else if (inGhost) {
                fillColor = '#06b6d4';
                radius = 6.0;
              }
            } else if (viewMode === 'cls') {
              if (cell.clsWeight === 1) {
                fillColor = '#10b981';
                radius = 6.5;
                strokeColor = '#ffffff';
                strokeWidth = 1.5;
              } else if (cell.clsWeight === -1) {
                fillColor = '#f43f5e';
                radius = 6.5;
                strokeColor = '#ffffff';
                strokeWidth = 1.5;
              }
            }

            const isHovered = hoveredCell?.id === cell.id;

            return (
              <g key={`cell-${cell.id}`}>
                <circle
                  cx={cell.x}
                  cy={cell.y}
                  r={isHovered ? radius + 2.5 : radius}
                  fill={fillColor}
                  stroke={isHovered ? '#38bdf8' : strokeColor}
                  strokeWidth={isHovered ? 2 : strokeWidth}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => {
                    setHoveredCell(cell);
                    setHoveredBoundary(null);
                  }}
                  onMouseLeave={() => setHoveredCell(null)}
                />
                {/* CLS Phase Labels */}
                {viewMode === 'cls' && cell.clsWeight !== 0 && (
                  <text
                    x={cell.x}
                    y={cell.y + 3.2}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="bold"
                    fill="#ffffff"
                    pointerEvents="none"
                  >
                    {cell.clsWeight > 0 ? '+' : '−'}
                  </text>
                )}
              </g>
            );
          })}

          {/* 144 Boundary Perimeter Nodes */}
          {boundaryNodes.map((b) => {
            const isDark = b.isDark;
            const isHovered = hoveredBoundary?.id === b.id;
            let bColor = isDark ? '#52525b' : '#38bdf8';
            let strokeColor = '#09090b';

            if (highlightDarkNodes && isDark) {
              bColor = '#ef4444';
              strokeColor = '#fee2e2';
            }

            return (
              <circle
                key={`bnode-${b.id}`}
                cx={b.x}
                cy={b.y}
                r={isHovered ? 3.5 : isDark ? 2.0 : 2.5}
                fill={isDark && !highlightDarkNodes ? 'transparent' : bColor}
                stroke={isDark && !highlightDarkNodes ? '#71717a' : strokeColor}
                strokeWidth={isDark && !highlightDarkNodes ? 0.9 : 0.6}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => {
                  setHoveredBoundary(b);
                  setHoveredCell(null);
                }}
                onMouseLeave={() => setHoveredBoundary(null)}
              />
            );
          })}
        </svg>

        {/* Hover Inspector Card */}
        {hoveredCell && (
          <div className="absolute top-3 left-3 bg-zinc-950/95 border border-zinc-700/80 p-3 rounded-lg shadow-xl text-xs font-mono backdrop-blur-sm z-10 max-w-xs">
            <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-1 mb-1.5">
              <span className="font-semibold text-zinc-200">Cell #{hoveredCell.id}</span>
              <span className="text-amber-400">Ring {hoveredCell.ring} / 7</span>
            </div>

            {/* Heatmap Metrics */}
            {hoveredHeatmapMetric && (
              <div className="space-y-1 mb-2 pb-2 border-b border-zinc-800">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Ghost Suppression:</span>
                  <span
                    className="font-bold"
                    style={{ color: hoveredHeatmapMetric.color }}
                  >
                    {hoveredHeatmapMetric.ghostSuppressionEfficiency}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Detection Error:</span>
                  <span className="text-zinc-200 font-bold">
                    {hoveredHeatmapMetric.detectionError}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Local Sensitivity:</span>
                  <span className="text-cyan-300 font-bold">
                    {hoveredHeatmapMetric.logSigma} log₁₀(σ) ({formatSci(hoveredHeatmapMetric.sigma)} σ)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Kernel Subspace:</span>
                  <span className={hoveredHeatmapMetric.inKernelSubspace ? 'text-amber-400' : 'text-zinc-500'}>
                    {hoveredHeatmapMetric.inKernelSubspace ? 'In ker([A_I; C₃])' : 'Observable'}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-zinc-400 text-[11px]">
              <div>Coord: ({hoveredCell.x.toFixed(1)}, {hoveredCell.y.toFixed(1)})</div>
              <div>In Truth: <span className={hoveredCell.isTruth ? 'text-amber-400 font-bold' : 'text-zinc-500'}>{hoveredCell.isTruth ? 'YES (Dual-ridge)' : 'No'}</span></div>
              <div>Ghost 1: <span className={hoveredCell.isGhost1 ? 'text-cyan-400' : 'text-zinc-500'}>{hoveredCell.isGhost1 ? 'YES' : 'No'}</span></div>
              <div>Ghost 2: <span className={hoveredCell.isGhost2 ? 'text-indigo-400' : 'text-zinc-500'}>{hoveredCell.isGhost2 ? 'YES' : 'No'}</span></div>
            </div>
          </div>
        )}

        {hoveredBoundary && (
          <div className="absolute top-3 left-3 bg-zinc-950/95 border border-zinc-700/80 p-3 rounded-lg shadow-xl text-xs font-mono backdrop-blur-sm z-10 max-w-xs">
            <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-1 mb-1.5">
              <span className="font-semibold text-zinc-200">Terminal #{hoveredBoundary.terminalIndex}</span>
              <span className={hoveredBoundary.isDark ? 'text-red-400 font-bold' : 'text-cyan-400'}>
                {hoveredBoundary.isDark ? 'DARK NODE (75)' : 'ACTIVE TERMINAL (69)'}
              </span>
            </div>
            <div className="text-zinc-400 text-[11px] leading-snug">
              {hoveredBoundary.isDark
                ? 'Uncoupled corner node. Contributes to rank obstruction of boundary operator A_I.'
                : 'Directly reads out boundary potential from Ring 7 outer interior cells.'}
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Colorbar & Summary Footer */}
      {viewMode === 'heatmap' ? (
        <div className="pt-3 border-t border-zinc-800/80 space-y-3 text-xs">
          {/* Gradient Colorbar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1 text-purple-400">
                <span>0% Suppression (Blind Zone, Error = 1.0)</span>
              </span>
              <span className="text-amber-400 font-semibold">50% (1σ Oxide Line)</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span>100% Suppression (Perimeter Resolved, Error = 0)</span>
              </span>
            </div>

            <div
              className="h-3 rounded-md w-full border border-zinc-800"
              style={{
                background:
                  'linear-gradient(to right, #3b0764 0%, #9333ea 15%, #e11d48 30%, #f97316 45%, #eab308 55%, #06b6d4 75%, #10b981 100%)',
              }}
            />
          </div>

          {/* Heatmap Statistics Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-zinc-300 font-mono text-[11px]">
            <div className="p-2 bg-zinc-950 rounded border border-zinc-800/80">
              <div className="text-zinc-500 text-[10px]">Mean Ghost Suppression</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {heatmapData.summary.meanSuppressionEfficiency}%
              </div>
            </div>
            <div className="p-2 bg-zinc-950 rounded border border-zinc-800/80">
              <div className="text-zinc-500 text-[10px]">Mean Detection Error</div>
              <div className="text-sm font-bold text-rose-400 mt-0.5">
                {heatmapData.summary.meanDetectionError}
              </div>
            </div>
            <div className="p-2 bg-zinc-950 rounded border border-zinc-800/80">
              <div className="text-zinc-500 text-[10px]">Resolvable Cells (≥ 1σ)</div>
              <div className="text-sm font-bold text-cyan-400 mt-0.5">
                {heatmapData.summary.resolvableCellsCount} / 169
              </div>
            </div>
            <div className="p-2 bg-zinc-950 rounded border border-zinc-800/80">
              <div className="text-zinc-500 text-[10px]">Core Blind Zone (&lt; 10⁻⁶σ)</div>
              <div className="text-sm font-bold text-amber-400 mt-0.5">
                {heatmapData.summary.blindZoneCellsCount} / 169
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Truth (12 cells)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
              <span>Ghost 1 (3-chord equiv)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>Overlap</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-zinc-500"></span>
              <span>75 Dark Nodes</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400 font-mono">
            <Info className="w-3.5 h-3.5 text-zinc-500" />
            <span>Manuscript dual-ridge, 12 interior cells. Outer frame is perimeter terminal ring.</span>
          </div>
        </div>
      )}
    </div>
  );
};
