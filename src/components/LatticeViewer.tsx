import React, { useMemo, useState } from 'react';
import { LATTICE_DATA as D } from '../data/lattice_v55';
import type { Cell, Placement } from '../data/latticeTypes';
import { formatSci, toSuperscript } from '../utils/physics';
import { Grid3x3, Info } from 'lucide-react';

/*
 * Lattice tab. Every cell set, node class, placement and separation shown here is exported from the
 * paper's verification code by scripts/export_lattice_data.py; chord sums and the CLS residual are
 * recomputed here from the paper's definitions.
 */

type Mode = 'ridge' | 'pairs' | 'nodes' | 'response' | 'cls';

// Reference palette, dark steps (validated on this card surface, all pairs, CVD-safe).
const COL = {
  s1: '#3987e5', // blue
  s2: '#d95926', // orange
  s3: '#199e70', // aqua
  neg: '#e66767', // red (CLS minus sign)
  muted: '#898781',
  cellEmpty: '#2c2c2a',
  cellFrame: '#383835',
  bond: '#5c5b57',
  ink: '#f0efec',
  ink2: '#c3c2b7',
};
// Sequential blue ramp, dark mode: low values recede to the dark surface (step 700) and rise to step 150.
const SEQ = ['#0d366b', '#104281', '#184f95', '#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#5598e7', '#6da7ec', '#86b6ef', '#9ec5f4', '#b7d3f6'];
const SEQ_MIN = -9; // log10 S, half-decade bins
const seqColor = (log10: number) => SEQ[Math.max(0, Math.min(SEQ.length - 1, Math.floor((log10 - SEQ_MIN) / 0.5)))];

const SQ3 = Math.sqrt(3);
const S = 30; // px per lattice constant a
const OFFS: [number, number][] = [
  [0, 0],
  [0.5, 0],
  [0.25, SQ3 / 4],
];
const key = (c: Cell) => `${c[0]},${c[1]}`;
const depthOf = (c: Cell) => Math.max(Math.abs(c[0]), Math.abs(c[1]), Math.abs(c[0] + c[1]));
const origin = (m: number, n: number): [number, number] => [m + n / 2, (n * SQ3) / 2];
const shift = (cells: Cell[], s: [number, number]): Cell[] => cells.map(([m, n]) => [m + s[0], n + s[1]]);
const FAMILY = ['m', 'n', 'm+n', 'm−n'];
const lineValue = (c: Cell, f: number) => [c[0], c[1], c[0] + c[1], c[0] - c[1]][f];

/** number of chord lines (per family, first `fams` families) on which two cell sets have different sums */
function chordDiff(a: Cell[], b: Cell[], fams: number): number[] {
  return [0, 1, 2, 3].slice(0, fams).map((f) => {
    const cnt = new Map<number, number>();
    a.forEach((c) => cnt.set(lineValue(c, f), (cnt.get(lineValue(c, f)) || 0) + 1));
    b.forEach((c) => cnt.set(lineValue(c, f), (cnt.get(lineValue(c, f)) || 0) - 1));
    return [...cnt.values()].filter((v) => v !== 0).length;
  });
}

const fmtSep = (x: number) => (x >= 0.01 ? String(Number(x.toPrecision(6))) : formatSci(x, 4));
const fmtPerr = (p: number) => (p === 0 ? '< 10⁻⁶' : `≥ ${p}`);

interface Hover {
  x: number;
  y: number;
  title: string;
  lines: string[];
}

interface LatticeViewerProps {
  breathingDelta: number;
}

export const LatticeViewer: React.FC<LatticeViewerProps> = ({ breathingDelta }) => {
  const [mode, setMode] = useState<Mode>('ridge');
  const [fams, setFams] = useState<3 | 4>(3);
  const [ridgeView, setRidgeView] = useState<'truth' | 0 | 1>('truth');
  const [showCand, setShowCand] = useState(true);
  const [pairBase, setPairBase] = useState<'bare' | 'convex'>('bare');
  const [pairCtx, setPairCtx] = useState<'isolated' | 'framed'>('framed');
  const [pairIdx, setPairIdx] = useState(0);
  const [showLines, setShowLines] = useState(false);
  const [hexIdx, setHexIdx] = useState<number | null>(null);
  const [hoverCell, setHoverCell] = useState<number | null>(null);
  const [hoverNode, setHoverNode] = useState<number | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  // ---------- static geometry ----------
  const geo = useMemo(() => {
    const idx = new Map<string, number>();
    D.cells.forEach((c, i) => idx.set(key(c), i));
    const nodeXY = (node: number): [number, number] => {
      const [m, n] = D.cells[Math.floor(node / 3)];
      const [ox, oy] = origin(m, n);
      const [dx, dy] = OFFS[node % 3];
      return [(ox + dx) * S, -(oy + dy) * S];
    };
    const tri = D.cells.map((_, i) => [0, 1, 2].map((k) => nodeXY(3 * i + k)));
    const centroid = D.cells.map(([m, n]) => {
      const [ox, oy] = origin(m, n);
      return [(ox + 0.25) * S, -(oy + SQ3 / 12) * S] as [number, number];
    });
    let bonds = '';
    D.edges.forEach(([u, v, kind]) => {
      if (kind !== 2) return; // intracell bonds are the triangle edges
      const [x1, y1] = nodeXY(u);
      const [x2, y2] = nodeXY(v);
      bonds += `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
    });
    const pts = tri.flat();
    const pad = 16;
    const minX = Math.min(...pts.map((p) => p[0])) - pad;
    const maxX = Math.max(...pts.map((p) => p[0])) + pad;
    const minY = Math.min(...pts.map((p) => p[1])) - pad;
    const maxY = Math.max(...pts.map((p) => p[1])) + pad;
    // hexagonal plaquettes: cells (m,n), (m+1,n), (m,n+1); vertices in cyclic order (Theorem 3.2)
    const hexes: { anchor: Cell; verts: number[]; cx: number; cy: number }[] = [];
    D.cells.forEach((c, i) => {
      const j = idx.get(key([c[0] + 1, c[1]]));
      const k = idx.get(key([c[0], c[1] + 1]));
      if (j === undefined || k === undefined) return;
      const [ox, oy] = origin(c[0], c[1]);
      hexes.push({ anchor: c, verts: [3 * i + 1, 3 * j, 3 * j + 2, 3 * k + 1, 3 * k, 3 * i + 2], cx: (ox + 0.75) * S, cy: -(oy + SQ3 / 4) * S });
    });
    const lineCount = [0, 1, 2, 3].map((f) => new Set(D.interior.map((i) => lineValue(D.cells[i], f))).size);
    const nodeInfo = new Map(D.boundaryNodes.map((b) => [b.node, b]));
    const clsSize = new Map<number, number>();
    D.boundaryNodes.forEach((b) => b.cls >= 0 && clsSize.set(b.cls, (clsSize.get(b.cls) || 0) + 1));
    const response = new Map(D.response.map((r) => [key(r.cell), r]));
    return { idx, nodeXY, tri, centroid, bonds, box: [minX, minY, maxX - minX, maxY - minY], hexes, lineCount, nodeInfo, clsSize, response };
  }, []);

  const centreHex = useMemo(() => {
    let best = 0;
    geo.hexes.forEach((h, i) => {
      if (Math.hypot(h.cx, h.cy) < Math.hypot(geo.hexes[best].cx, geo.hexes[best].cy)) best = i;
    });
    return best;
  }, [geo]);

  // ---------- mode state ----------
  const ghosts = D.ridge.threeFamilies.ghosts;
  const truth = D.ridge.truth;
  const ghostCells = ridgeView === 'truth' ? null : ghosts[ridgeView].cells;
  const candidates = fams === 3 ? D.ridge.threeFamilies.candidates : D.ridge.fourFamilies.candidates;

  const placements: Placement[] = D.switching[pairBase][pairCtx];
  const pIdx = Math.min(pairIdx, placements.length - 1);
  const place = placements[pIdx];
  const plusCells = shift(D.switching.plus, place.shift);
  const minusCells = shift(D.switching.minus, place.shift);
  const sharedCells = pairBase === 'convex' ? shift(D.switching.convexShared, place.shift) : [];
  const ringOn = pairCtx === 'framed';

  const hex = geo.hexes[hexIdx ?? centreHex];
  const t1 = 1 + breathingDelta;
  const t2 = 1 - breathingDelta;
  const clsResidual = useMemo(() => {
    const n = 3 * D.cells.length;
    const psi = new Float64Array(n);
    hex.verts.forEach((v, j) => (psi[v] = (j % 2 === 0 ? 1 : -1) / Math.sqrt(6)));
    const h = new Float64Array(n);
    D.edges.forEach(([u, v, kind]) => {
      const t = kind === 1 ? t1 : t2;
      h[u] -= t * psi[v];
      h[v] -= t * psi[u];
    });
    let r = 0;
    for (let a = 0; a < n; a++) r = Math.max(r, Math.abs(h[a] - (t1 + t2) * psi[a]));
    return r;
  }, [hex, t1, t2]);

  // ---------- cell styling per mode ----------
  const sets = useMemo(() => {
    const has = (cells: Cell[]) => new Set(cells.map(key));
    return {
      truth: has(truth),
      ghost: ghostCells ? has(ghostCells) : new Set<string>(),
      cand: has(candidates),
      plus: has(plusCells),
      minus: has(minusCells),
      shared: has(sharedCells),
      ring: has(D.switching.ring),
    };
  }, [truth, ghostCells, candidates, plusCells, minusCells, sharedCells]);

  const cellFill = (c: Cell): string => {
    const k = key(c);
    if (depthOf(c) === D.rHex) return COL.cellFrame;
    if (mode === 'ridge') {
      const inT = sets.truth.has(k);
      if (ridgeView === 'truth') return inT ? COL.s1 : COL.cellEmpty;
      const inG = sets.ghost.has(k);
      if (inT && inG) return COL.s3;
      if (inT) return COL.s1;
      if (inG) return COL.s2;
      return COL.cellEmpty;
    }
    if (mode === 'pairs') {
      if (sets.shared.has(k)) return COL.s3;
      if (sets.plus.has(k)) return COL.s1;
      if (sets.minus.has(k)) return COL.s2;
      if (ringOn && sets.ring.has(k)) return COL.muted;
      return COL.cellEmpty;
    }
    if (mode === 'response') {
      const r = geo.response.get(k);
      return r ? seqColor(r.log10Max) : COL.cellEmpty;
    }
    return COL.cellEmpty;
  };

  // chord lines through the hovered cell
  const lineSet = useMemo(() => {
    if (!showLines || hoverCell === null || (mode !== 'ridge' && mode !== 'pairs')) return new Set<number>();
    const c = D.cells[hoverCell];
    const nf = mode === 'ridge' ? fams : 4;
    const out = new Set<number>();
    D.interior.forEach((i) => {
      for (let f = 0; f < nf; f++) if (lineValue(D.cells[i], f) === lineValue(c, f)) out.add(i);
    });
    return out;
  }, [showLines, hoverCell, mode, fams]);

  // ---------- hover text ----------
  const cellHover = (i: number) => {
    const c = D.cells[i];
    const k = key(c);
    const [x, y] = geo.centroid[i];
    const d = depthOf(c);
    const lines: string[] = [];
    let title = `(m, n) = (${c[0]}, ${c[1]}) · depth ${d}`;
    if (d === D.rHex) {
      lines.push('Outer ring: its 3 sites are boundary nodes');
    } else if (mode === 'response') {
      const r = geo.response.get(k)!;
      title = `${formatSci(Math.pow(10, r.log10Max), 2)} S`;
      lines.push(`max over boundary nodes of ∂Λ_bb/∂s_c · (m, n) = (${c[0]}, ${c[1]}), depth ${d}`);
    } else if (mode === 'ridge') {
      const role = sets.truth.has(k) && sets.ghost.has(k) ? 'in truth and ghost' : sets.truth.has(k) ? 'in truth' : sets.ghost.has(k) ? 'in ghost' : 'not in the pattern';
      lines.push(role + (sets.cand.has(k) ? ' · gate candidate' : ''));
      lines.push(`lines: m = ${c[0]}, n = ${c[1]}, m+n = ${c[0] + c[1]}, m−n = ${c[0] - c[1]}`);
    } else if (mode === 'pairs') {
      const role = sets.shared.has(k) ? 'in both sets (I)' : sets.plus.has(k) ? 'S₊' : sets.minus.has(k) ? 'S₋' : ringOn && sets.ring.has(k) ? 'closed loop (wall)' : 'empty';
      lines.push(role);
      lines.push(`lines: m = ${c[0]}, n = ${c[1]}, m+n = ${c[0] + c[1]}, m−n = ${c[0] - c[1]}`);
    } else {
      lines.push(`lines: m = ${c[0]}, n = ${c[1]}, m+n = ${c[0] + c[1]}, m−n = ${c[0] - c[1]}`);
    }
    setHoverCell(i);
    setHover({ x, y, title, lines });
  };

  const nodeHover = (node: number) => {
    const b = geo.nodeInfo.get(node)!;
    const [x, y] = geo.nodeXY(node);
    const c = D.cells[Math.floor(node / 3)];
    let title = 'Dark: no interior neighbour';
    const lines = [`site ${node % 3 + 1} of cell (${c[0]}, ${c[1]})`];
    if (b.cls >= 0) {
      const size = geo.clsSize.get(b.cls) || 1;
      title = size === 2 ? 'Paired: same column of L_IB as its partner' : 'Single: its own column of L_IB';
      lines.push(`bonded to interior site ${b.nbrs.map((n) => `${n % 3 + 1} of (${D.cells[Math.floor(n / 3)].join(', ')})`).join(', ')}`);
    }
    setHoverNode(node);
    setHover({ x, y, title, lines });
  };

  const clearHover = () => {
    setHover(null);
    setHoverCell(null);
    setHoverNode(null);
  };

  // highlighted nodes: partner + interior neighbour (nodes mode), best boundary node (response mode)
  const nodeHighlights = useMemo(() => {
    const out = new Set<number>();
    if (mode === 'nodes' && hoverNode !== null) {
      const b = geo.nodeInfo.get(hoverNode)!;
      b.nbrs.forEach((n) => out.add(n));
      if (b.cls >= 0) D.boundaryNodes.forEach((o) => o.cls === b.cls && out.add(o.node));
    }
    if (mode === 'response' && hoverCell !== null) {
      const r = geo.response.get(key(D.cells[hoverCell]));
      if (r) out.add(r.bestNode);
    }
    return out;
  }, [mode, hoverNode, hoverCell, geo]);

  const [bx, by, bw, bh] = geo.box;
  const pct = (x: number, y: number) => ({ left: `${((x - bx) / bw) * 100}%`, top: `${((y - by) / bh) * 100}%` });

  // ---------- derived numbers for the panel ----------
  const ridgeDiff = ghostCells ? chordDiff(truth, ghostCells, fams) : [0, 0, 0, 0].slice(0, fams);
  const pairDiff = chordDiff([...plusCells, ...sharedCells], [...minusCells, ...sharedCells], 4);
  const totalLines = (nf: number) => geo.lineCount.slice(0, nf).reduce((s, x) => s + x, 0);
  const sepRange = [placements[0].sep, placements[placements.length - 1].sep];
  const byDepth = useMemo(() => {
    const rows: { d: number; max: number; min: number; n: number }[] = [];
    for (let d = 0; d < D.rHex; d++) {
      const vals = D.response.filter((r) => depthOf(r.cell) === d).map((r) => r.log10Max);
      rows.push({ d, max: Math.max(...vals), min: Math.min(...vals), n: vals.length });
    }
    return rows;
  }, []);

  const modes: { id: Mode; label: string }[] = [
    { id: 'ridge', label: 'Test ridge & ghosts' },
    { id: 'pairs', label: 'Switching pairs' },
    { id: 'nodes', label: 'Boundary nodes' },
    { id: 'response', label: 'Boundary response' },
    { id: 'cls', label: 'CLS' },
  ];

  const legend: { color: string; label: string; outline?: boolean }[] =
    mode === 'ridge'
      ? ridgeView === 'truth'
        ? [{ color: COL.s1, label: 'test ridge (12 cells)' }, ...(showCand ? [{ color: COL.ink2, label: `gate candidates (K = ${candidates.length})`, outline: true }] : [])]
        : [
            { color: COL.s1, label: 'truth only' },
            { color: COL.s2, label: `ghost ${ridgeView + 1} only` },
            { color: COL.s3, label: 'both' },
            ...(showCand ? [{ color: COL.ink2, label: `gate candidates (K = ${candidates.length})`, outline: true }] : []),
          ]
      : mode === 'pairs'
      ? [
          { color: COL.s1, label: 'S₊' },
          { color: COL.s2, label: 'S₋' },
          ...(pairBase === 'convex' ? [{ color: COL.s3, label: 'shared I (4 cells)' }] : []),
          ...(ringOn ? [{ color: COL.muted, label: 'closed loop, 36 cells' }] : []),
        ]
      : mode === 'nodes'
      ? [
          { color: COL.s1, label: 'paired active node (48)' },
          { color: COL.s2, label: 'single active node (21)' },
          { color: COL.muted, label: 'dark node (75)' },
        ]
      : mode === 'cls'
      ? [
          { color: COL.s1, label: '+1/√6' },
          { color: COL.neg, label: '−1/√6' },
        ]
      : [];

  const segBtn = (active: boolean) =>
    `px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
      active ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
    }`;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
      {/* Lattice card */}
      <div className="xl:col-span-3 bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Grid3x3 className="w-4 h-4 text-zinc-400" />
              Kagome flake, R_hex = {D.rHex}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
              {D.cells.length} cells (up-triangles): {D.interior.length} interior, {D.cells.length - D.interior.length} in the outer
              ring whose {3 * (D.cells.length - D.interior.length)} sites are the boundary nodes. Lines are the intercell bonds.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {modes.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className={segBtn(mode === m.id)}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="relative" onMouseLeave={clearHover}>
          <svg
            viewBox={`${bx} ${by} ${bw} ${bh}`}
            className="block w-full h-auto select-none"
            role="img"
            aria-label={`Kagome flake with ${D.cells.length} cells; view: ${modes.find((m) => m.id === mode)!.label}`}
          >
            <path d={geo.bonds} stroke={COL.bond} strokeWidth="1" fill="none" />
            {geo.tri.map((t, i) => (
              <polygon
                key={`c${i}`}
                points={t.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}
                fill={cellFill(D.cells[i])}
                stroke={
                  hoverCell === i
                    ? COL.ink
                    : lineSet.has(i)
                    ? COL.ink2
                    : mode === 'ridge' && showCand && sets.cand.has(key(D.cells[i]))
                    ? COL.ink2
                    : 'none'
                }
                strokeWidth={hoverCell === i ? 2 : 1.2}
                strokeDasharray={mode === 'ridge' && showCand && sets.cand.has(key(D.cells[i])) && hoverCell !== i ? '3 2' : undefined}
                strokeLinejoin="round"
              />
            ))}

            {/* boundary nodes */}
            {D.boundaryNodes.map((b) => {
              const [x, y] = geo.nodeXY(b.node);
              const size = b.cls >= 0 ? geo.clsSize.get(b.cls) || 1 : 0;
              const fill = mode === 'nodes' ? (b.cls < 0 ? COL.muted : size === 2 ? COL.s1 : COL.s2) : COL.muted;
              const hi = nodeHighlights.has(b.node);
              return (
                <g key={`b${b.node}`}>
                  <circle cx={x} cy={y} r={mode === 'nodes' ? (b.cls < 0 ? 2.5 : 4) : 2} fill={fill} stroke={hi ? COL.ink : 'none'} strokeWidth="1.5" />
                  {mode === 'nodes' && (
                    <circle cx={x} cy={y} r={7} fill="transparent" onMouseEnter={() => nodeHover(b.node)} onClick={() => nodeHover(b.node)} />
                  )}
                </g>
              );
            })}

            {/* highlighted interior neighbour sites (nodes mode) */}
            {[...nodeHighlights]
              .filter((n) => !geo.nodeInfo.has(n))
              .map((n) => {
                const [x, y] = geo.nodeXY(n);
                return <circle key={`h${n}`} cx={x} cy={y} r={4.5} fill="none" stroke={COL.ink} strokeWidth="1.5" />;
              })}

            {/* cell hit targets */}
            {mode !== 'nodes' &&
              mode !== 'cls' &&
              geo.centroid.map(([x, y], i) => (
                <circle key={`t${i}`} cx={x} cy={y} r={11} fill="transparent" onMouseEnter={() => cellHover(i)} onClick={() => cellHover(i)} />
              ))}

            {/* CLS: hexagon centres and the selected state */}
            {mode === 'cls' && (
              <g>
                {geo.hexes.map((h, i) => (
                  <circle
                    key={`x${i}`}
                    cx={h.cx}
                    cy={h.cy}
                    r={9}
                    fill={i === (hexIdx ?? centreHex) ? 'rgba(240,239,236,0.12)' : 'transparent'}
                    stroke={i === (hexIdx ?? centreHex) ? COL.ink2 : 'none'}
                    onClick={() => setHexIdx(i)}
                    onMouseEnter={() => setHover({ x: h.cx, y: h.cy, title: `Hexagon at (${h.anchor[0]}, ${h.anchor[1]})`, lines: ['click to place the compact localized state here'] })}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
                {hex.verts.map((v, j) => {
                  const [x, y] = geo.nodeXY(v);
                  const plus = j % 2 === 0;
                  return (
                    <g key={`v${v}`}>
                      <circle cx={x} cy={y} r={6} fill={plus ? COL.s1 : COL.neg} stroke="#131316" strokeWidth="2" />
                      <text x={x} y={y + 3.5} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff">
                        {plus ? '+' : '−'}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>

          {hover && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[115%] bg-zinc-950/95 border border-zinc-700 rounded-md px-2.5 py-1.5 shadow-lg max-w-[260px]"
              style={pct(hover.x, hover.y)}
            >
              <div className="text-xs font-semibold text-zinc-100 font-mono">{hover.title}</div>
              {hover.lines.map((l, i) => (
                <div key={i} className="text-[11px] text-zinc-400 leading-snug">
                  {l}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        {mode === 'response' ? (
          <div className="space-y-1">
            <div className="flex h-3 rounded overflow-hidden">
              {SEQ.map((c) => (
                <div key={c} className="flex-1" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              {[-9, -8, -7, -6, -5, -4, -3].map((t) => (
                <span key={t}>10{toSuperscript(t)} S</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-zinc-300">
            {legend.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={l.outline ? { border: `1.5px dashed ${l.color}` } : { backgroundColor: l.color }}
                />
                {l.label}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-500">
          <span>
            {mode === 'nodes'
              ? 'Hover or tap a boundary node.'
              : mode === 'cls'
              ? 'Tap a hexagon to move the state.'
              : 'Hover or tap a cell for its coordinates and chord lines.'}
          </span>
          {(mode === 'ridge' || mode === 'pairs') && (
            <label className="flex items-center gap-1.5 text-zinc-400">
              <input type="checkbox" checked={showLines} onChange={(e) => setShowLines(e.target.checked)} />
              Outline the chord lines through the hovered cell
            </label>
          )}
        </div>
      </div>

      {/* Panel */}
      <div className="xl:col-span-2 bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 space-y-4 text-xs text-zinc-300">
        {mode === 'ridge' && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Test ridge and its ghosts (Theorem 5.2)</h3>
              <p className="text-zinc-400 mt-1 leading-relaxed">
                The 12-cell test ridge, the cells the noise-free chord gate keeps, and every 0/1 pattern on them with the same
                chord sums.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button className={segBtn(fams === 3)} onClick={() => setFams(3)}>
                3 families (Rev. 3.9)
              </button>
              <button className={segBtn(fams === 4)} onClick={() => setFams(4)}>
                4 families (Rev. 4.0)
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button className={segBtn(ridgeView === 'truth')} onClick={() => setRidgeView('truth')}>
                Truth
              </button>
              {ghosts.map((_, g) => (
                <button key={g} className={segBtn(ridgeView === g)} onClick={() => setRidgeView(g as 0 | 1)}>
                  Ghost {g + 1} vs truth
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-zinc-400">
              <input type="checkbox" checked={showCand} onChange={(e) => setShowCand(e.target.checked)} />
              Show gate candidates
            </label>

            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 space-y-1.5 font-mono text-[11px]">
              <div>
                K = {candidates.length} candidates;{' '}
                {(fams === 3 ? D.ridge.threeFamilies.patterns : D.ridge.fourFamilies.patterns) > 1
                  ? `${fams === 3 ? D.ridge.threeFamilies.patterns : D.ridge.fourFamilies.patterns} patterns share the chord data`
                  : 'only the true pattern has this chord data'}
              </div>
              {ghostCells && (
                <div className={ridgeDiff.every((x) => x === 0) ? 'text-emerald-300' : 'text-amber-300'}>
                  {ridgeDiff.every((x) => x === 0)
                    ? `Chord sums of truth and ghost ${(ridgeView as number) + 1} agree on all ${totalLines(fams)} lines (computed here).`
                    : `Ghost ${(ridgeView as number) + 1} changes ${ridgeDiff.reduce((s, x) => s + x, 0)} line sums (${ridgeDiff
                        .map((x, f) => (x ? `${x} on ${FAMILY[f]}` : ''))
                        .filter(Boolean)
                        .join(', ')}), so the ${fams} families rule it out (computed here).`}
                </div>
              )}
            </div>

            {ghostCells && fams === 3 && (
              <table className="w-full font-mono text-[11px]">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="text-left font-normal">Boundary separation of ghost {(ridgeView as number) + 1}</th>
                    <th className="text-right font-normal">σ_Λ</th>
                    <th className="text-right font-normal">P_err</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>y_base = 10⁻⁶ S (ball arithmetic)</td>
                    <td className="text-right text-zinc-100">{ghosts[ridgeView as number].sepBaselineBall}</td>
                    <td className="text-right">≥ {ghosts[ridgeView as number].perrBaseline}</td>
                  </tr>
                  <tr>
                    <td>y_base = 10⁻⁷ S</td>
                    <td className="text-right text-zinc-100">{ghosts[ridgeView as number].sepDesign}</td>
                    <td className="text-right">≥ {ghosts[ridgeView as number].perrDesign}</td>
                  </tr>
                </tbody>
              </table>
            )}
            {fams === 4 && (
              <p className="text-zinc-400 leading-relaxed">
                With the fourth family (m − n) the gate keeps K = {D.ridge.fourFamilies.candidates.length} cells and only the true
                pattern fits, so the chords alone determine this ridge (2000/2000 recoveries in the paper). The ghost buttons show
                the three-family ghosts against the four-family chords.
              </p>
            )}
          </>
        )}

        {mode === 'pairs' && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                {pairBase === 'bare' ? 'Switching component (Theorems 5.2(5), 5.7)' : 'Convex pair (Proposition 5.18)'}
              </h3>
              <p className="text-zinc-400 mt-1 leading-relaxed">
                {pairBase === 'bare'
                  ? 'S₊ and S₋ (4 cells each) have the same sum on every line of all four families, so no chord data can tell them apart.'
                  : `S₊ ∪ I and S₋ ∪ I are convex lattice sets with identical chord data in all four families (${D.switching.convex.total} placements in the flake): the cross-ratio-2 obstruction.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button className={segBtn(pairBase === 'bare')} onClick={() => { setPairBase('bare'); setPairIdx(0); }}>
                Switching component
              </button>
              <button className={segBtn(pairBase === 'convex')} onClick={() => { setPairBase('convex'); setPairIdx(0); }}>
                Convex pair
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button className={segBtn(pairCtx === 'isolated')} onClick={() => { setPairCtx('isolated'); setPairIdx(0); }}>
                Isolated ({D.switching[pairBase].isolated.length})
              </button>
              <button className={segBtn(pairCtx === 'framed')} onClick={() => { setPairCtx('framed'); setPairIdx(0); }}>
                Inside the 36-cell loop ({D.switching[pairBase].framed.length})
              </button>
            </div>
            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>Placement, sorted by separation</span>
                <span className="font-mono text-zinc-200">
                  {pIdx + 1} / {placements.length} · shift ({place.shift[0]}, {place.shift[1]})
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={placements.length - 1}
                step={1}
                value={pIdx}
                onChange={(e) => setPairIdx(Number(e.target.value))}
                className="w-full accent-zinc-300 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 space-y-1.5 font-mono text-[11px]">
              <div className="text-sm text-zinc-100">
                {fmtSep(place.sep)} σ_Λ <span className="text-xs text-zinc-500">boundary separation, design point</span>
              </div>
              {place.ball !== undefined && <div className="text-zinc-400">ball arithmetic: {formatSci(place.ball, 6)} σ_Λ</div>}
              <div>Any decoder errs with probability {fmtPerr(place.perr)} on one of the two.</div>
              {place.wallDepth !== undefined && <div className="text-zinc-400">{place.wallDepth} ring(s) between the pair and the loop</div>}
              <div className={pairDiff.every((x) => x === 0) ? 'text-emerald-300' : 'text-amber-300'}>
                Chord sums identical on all {totalLines(4)} lines: {pairDiff.every((x) => x === 0) ? 'yes' : 'no'} (computed here)
              </div>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              {pairCtx === 'isolated'
                ? `With every cell at least two rings deep, the ${placements.length} placements are separated by ${fmtSep(sepRange[0])} to ${fmtSep(sepRange[1])} σ_Λ.`
                : `Inside the closed loop the ${placements.length} placements are separated by only ${fmtSep(sepRange[0])} to ${fmtSep(sepRange[1])} σ_Λ, so every decoder errs with probability ≥ 0.4998 on one ridge of each pair.`}{' '}
              Separations come from the listing's forward model; the two loop extremes were confirmed in 256-bit ball arithmetic.
            </p>
          </>
        )}

        {mode === 'nodes' && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Boundary nodes and data collapse (Theorem 5.6)</h3>
              <p className="text-zinc-400 mt-1 leading-relaxed">
                Of the 144 boundary nodes, 75 have no bond into the interior and see nothing. The other 69 form 24 pairs that are
                bonded to the same interior site (identical columns of L_IB) and 21 single nodes: 45 distinct rows, so rank J(s) ≤
                45 for every state s.
              </p>
            </div>
            <table className="w-full font-mono text-[11px]">
              <tbody>
                <tr><td>dark nodes</td><td className="text-right text-zinc-100">{D.boundaryNodes.filter((b) => b.cls < 0).length}</td></tr>
                <tr><td>paired active nodes</td><td className="text-right text-zinc-100">{[...geo.clsSize.values()].filter((s) => s === 2).length * 2}</td></tr>
                <tr><td>single active nodes</td><td className="text-right text-zinc-100">{[...geo.clsSize.values()].filter((s) => s === 1).length}</td></tr>
                <tr className="border-t border-zinc-800"><td>distinct rows (rank bound)</td><td className="text-right text-zinc-100">{geo.clsSize.size}</td></tr>
              </tbody>
            </table>
            <p className="text-zinc-500">Hover a node to outline its partner and the interior site it is bonded to.</p>
          </>
        )}

        {mode === 'response' && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">How strongly the boundary sees each cell (Lemma 5.5)</h3>
              <p className="text-zinc-400 mt-1 leading-relaxed">
                ∂Λ_bb/∂s_c at s = 0 for the best boundary node b of each cell c, at the design point (y_base = 10⁻⁷ S). Hover a
                cell to outline that node. The smallest entry over the 69 active nodes and all cells is{' '}
                {formatSci(D.responseMin, 3)} S.
              </p>
            </div>
            <table className="w-full font-mono text-[11px]">
              <thead className="text-zinc-500">
                <tr>
                  <th className="text-left font-normal">depth</th>
                  <th className="text-right font-normal">cells</th>
                  <th className="text-right font-normal">best cell (S)</th>
                  <th className="text-right font-normal">worst cell (S)</th>
                </tr>
              </thead>
              <tbody>
                {byDepth.map((r) => (
                  <tr key={r.d}>
                    <td>{r.d}</td>
                    <td className="text-right">{r.n}</td>
                    <td className="text-right text-zinc-100">{formatSci(Math.pow(10, r.max), 1)}</td>
                    <td className="text-right">{formatSci(Math.pow(10, r.min), 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {mode === 'cls' && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Compact localized state (Theorem 3.2)</h3>
              <p className="text-zinc-400 mt-1 leading-relaxed">
                Alternating amplitudes ±1/√6 on the six vertices of a hexagon form an exact eigenstate of the flake at E = t₁ + t₂,
                with zero amplitude everywhere else, for all t₁, t₂ &gt; 0. Click any hexagon to move it.
              </p>
            </div>
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 space-y-1.5 font-mono text-[11px]">
              <div>
                hexagon at ({hex.anchor[0]}, {hex.anchor[1]}) · δb = {breathingDelta.toFixed(2)}: t₁ = {t1.toFixed(2)}, t₂ = {t2.toFixed(2)}
              </div>
              <div className="text-sm text-zinc-100">max |Hψ − (t₁ + t₂)ψ| = {clsResidual === 0 ? '0' : formatSci(clsResidual, 1)}</div>
              <div className="text-zinc-500">computed here over all {3 * D.cells.length} sites; the listing reports ≤ 2.7×10⁻¹⁷</div>
            </div>
            <p className="text-zinc-500">δb follows the slider on the Bloch Spectrum tab.</p>
          </>
        )}

        <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Generated by scripts/export_lattice_data.py from the paper's verification code; the export stops if any count differs
            from the paper.
          </span>
        </div>
      </div>
    </div>
  );
};
