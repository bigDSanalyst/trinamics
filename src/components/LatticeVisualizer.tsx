import React, { useState, useMemo } from 'react';
import { KagomeBoundaryNode, KagomeCell } from '../types/kagome';
import { Eye, Info, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface LatticeVisualizerProps {
  cells: KagomeCell[];
  boundaryNodes: KagomeBoundaryNode[];
  truthCellIds: number[];
  ghost1CellIds: number[];
  ghost2CellIds: number[];
}

export type LatticeViewMode = 'truth' | 'ghost1' | 'ghost2' | 'diff' | 'cls' | 'all';

export const LatticeVisualizer: React.FC<LatticeVisualizerProps> = ({
  cells,
  boundaryNodes,
  truthCellIds,
  ghost1CellIds,
  ghost2CellIds,
}) => {
  const [viewMode, setViewMode] = useState<LatticeViewMode>('truth');
  const [hoveredCell, setHoveredCell] = useState<KagomeCell | null>(null);
  const [hoveredBoundary, setHoveredBoundary] = useState<KagomeBoundaryNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [highlightDarkNodes, setHighlightDarkNodes] = useState(false);

  // Group cells by ring
  const cellsByRing = useMemo(() => {
    const map = new Map<number, KagomeCell[]>();
    cells.forEach((c) => {
      if (!map.has(c.ring)) map.set(c.ring, []);
      map.get(c.ring)!.push(c);
    });
    return map;
  }, [cells]);

  const darkNodeCount = useMemo(() => boundaryNodes.filter((b) => b.isDark).length, [boundaryNodes]);

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 flex flex-col h-full">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-100">Kagome Boundary & Dual Lattice</h2>
            <span className="text-xs font-mono text-zinc-400">
              169 cells · 144 boundary terminals (75 dark)
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manuscript dual-ridge (12 interior cells) vs chord-equivalent ghost configurations
          </p>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
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
            Diff (Truth Δ Ghost)
          </button>
          <button
            onClick={() => setViewMode('cls')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'cls'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            CLS Plaquette
          </button>
        </div>

        {/* Zoom & Dark Node toggle */}
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

      {/* SVG Canvas Container */}
      <div className="relative flex-1 min-h-[460px] flex items-center justify-center overflow-hidden my-2 select-none bg-zinc-950/50 rounded-lg border border-zinc-900">
        <svg
          viewBox="-240 -240 480 480"
          className="w-full h-full max-h-[500px]"
          style={{ transform: `scale(${zoom})`, transition: 'transform 0.15s ease-out' }}
        >
          <defs>
            {/* Gradients */}
            <radialGradient id="ringGlow" cx="0%" cy="0%" r="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
          </defs>

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
                  stroke="#27272a"
                  strokeWidth="0.8"
                />
              );
            });
          })}

          {/* Boundary Spoke Connections to Ring 7 active cells */}
          {boundaryNodes.map((b) => {
            if (b.isDark) return null;
            // Draw radial link to nearest outer cell
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
            let fillColor = '#3f3f46'; // default dormant cell
            let strokeColor = '#18181b';
            let strokeWidth = 0.8;
            let radius = 4.2;

            if (viewMode === 'truth') {
              if (cell.isTruth) {
                fillColor = '#f59e0b'; // Amber-500
                strokeColor = '#fef3c7';
                strokeWidth = 1.6;
                radius = 6.2;
              }
            } else if (viewMode === 'ghost1') {
              if (cell.isGhost1) {
                fillColor = '#06b6d4'; // Cyan-500
                strokeColor = '#cffafe';
                strokeWidth = 1.6;
                radius = 6.2;
              }
            } else if (viewMode === 'ghost2') {
              if (cell.isGhost2) {
                fillColor = '#6366f1'; // Indigo-500
                strokeColor = '#e0e7ff';
                strokeWidth = 1.6;
                radius = 6.2;
              }
            } else if (viewMode === 'diff') {
              const inTruth = cell.isTruth;
              const inGhost = cell.isGhost1;
              if (inTruth && inGhost) {
                fillColor = '#a855f7'; // Purple (Overlap)
                radius = 6.0;
              } else if (inTruth) {
                fillColor = '#f59e0b'; // Truth only
                radius = 6.0;
              } else if (inGhost) {
                fillColor = '#06b6d4'; // Ghost only
                radius = 6.0;
              }
            } else if (viewMode === 'cls') {
              if (cell.clsWeight === 1) {
                fillColor = '#10b981'; // Emerald (+1 phase)
                radius = 6.5;
                strokeColor = '#ffffff';
                strokeWidth = 1.5;
              } else if (cell.clsWeight === -1) {
                fillColor = '#f43f5e'; // Rose (-1 phase)
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
              bColor = '#ef4444'; // Red highlight for dark nodes
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
              <span className="font-semibold text-zinc-200">Interior Cell #{hoveredCell.id}</span>
              <span className="text-amber-400">Ring {hoveredCell.ring} / 7</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-zinc-400">
              <div>Coord: ({hoveredCell.x.toFixed(1)}, {hoveredCell.y.toFixed(1)})</div>
              <div>In Truth Ridge: <span className={hoveredCell.isTruth ? 'text-amber-400 font-bold' : 'text-zinc-500'}>{hoveredCell.isTruth ? 'YES (Dual-ridge)' : 'No'}</span></div>
              <div>Ghost 1: <span className={hoveredCell.isGhost1 ? 'text-cyan-400' : 'text-zinc-500'}>{hoveredCell.isGhost1 ? 'YES' : 'No'}</span></div>
              <div>Ghost 2: <span className={hoveredCell.isGhost2 ? 'text-indigo-400' : 'text-zinc-500'}>{hoveredCell.isGhost2 ? 'YES' : 'No'}</span></div>
            </div>
            {hoveredCell.clsWeight !== 0 && (
              <div className="mt-1.5 pt-1 border-t border-zinc-800 text-emerald-400">
                Plaquette CLS weight: {hoveredCell.clsWeight > 0 ? '+1' : '-1'} (Exact destructive interference)
              </div>
            )}
          </div>
        )}

        {hoveredBoundary && (
          <div className="absolute top-3 left-3 bg-zinc-950/95 border border-zinc-700/80 p-3 rounded-lg shadow-xl text-xs font-mono backdrop-blur-sm z-10 max-w-xs">
            <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-1 mb-1.5">
              <span className="font-semibold text-zinc-200">Perimeter Terminal #{hoveredBoundary.terminalIndex}</span>
              <span className={hoveredBoundary.isDark ? 'text-red-400 font-bold' : 'text-cyan-400'}>
                {hoveredBoundary.isDark ? 'DARK NODE (No interior link)' : 'ACTIVE TERMINAL'}
              </span>
            </div>
            <div className="text-zinc-400">
              {hoveredBoundary.isDark ? (
                <p className="text-zinc-400 leading-tight">
                  One of 75 uncoupled frame nodes. Outer ring pairs create the 45-rank sub-operator A_I.
                </p>
              ) : (
                <p className="text-cyan-300 leading-tight">
                  Coupled to interior ring 7 dual-ridge entry channels. Total active: 69 / 144.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend & Summary Footer */}
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
    </div>
  );
};
