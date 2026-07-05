"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ZoomIn, ZoomOut, Maximize2, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GraphNode, GraphEdge, GraphEdgeKind } from "@/actions/graph";

interface Pt {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed?: boolean;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  projectId: string;
}

const STATUS_FILL: Record<string, string> = {
  backlog: "#94a3b8",
  todo: "#64748b",
  in_progress: "#f59e0b",
  in_review: "#a78bfa",
  done: "#10b981",
  cancelled: "#6b7280",
  not_started: "#94a3b8",
  achieved: "#10b981",
};

const EDGE_STYLE: Record<GraphEdgeKind, { stroke: string; dash?: string; label: string }> = {
  dependency: { stroke: "var(--color-primary)", label: "의존성 (작업 순서)" },
  epic: { stroke: "#a78bfa", dash: "5 4", label: "에픽 소속" },
  story: { stroke: "#38bdf8", dash: "5 4", label: "스토리 소속" },
  subtask: { stroke: "#94a3b8", dash: "2 4", label: "서브태스크" },
};

export function ConnectionGraph({ nodes, edges, projectId }: Props) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const posRef = useRef<Map<string, Pt>>(new Map());
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);

  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const W = 1000;
  const H = 680;

  // degree (connection count) per node → drives node size; hubs stand out.
  const degree = useMemo(() => {
    const d = new Map<string, number>();
    nodes.forEach((n) => d.set(n.id, 0));
    edges.forEach((e) => {
      d.set(e.source, (d.get(e.source) ?? 0) + 1);
      d.set(e.target, (d.get(e.target) ?? 0) + 1);
    });
    return d;
  }, [nodes, edges]);

  const radiusOf = useCallback(
    (n: GraphNode) => {
      const base = n.type === "epic" ? 11 : n.type === "story" ? 9 : 6;
      return base + Math.sqrt(degree.get(n.id) ?? 0) * 2.4;
    },
    [degree]
  );

  // adjacency for highlight
  const adjacency = useMemo(() => {
    const m = new Map<string, Set<string>>();
    nodes.forEach((n) => m.set(n.id, new Set()));
    edges.forEach((e) => {
      m.get(e.source)?.add(e.target);
      m.get(e.target)?.add(e.source);
    });
    return m;
  }, [nodes, edges]);

  const fitToContent = useCallback(() => {
    const pts = [...posRef.current.values()];
    if (pts.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    const pad = 80;
    const cw = maxX - minX + pad * 2;
    const ch = maxY - minY + pad * 2;
    const k = Math.min(2, Math.max(0.4, Math.min(W / cw, H / ch)));
    setView({
      k,
      x: W / 2 - ((minX + maxX) / 2) * k,
      y: H / 2 - ((minY + maxY) / 2) * k,
    });
  }, []);

  // seed positions + force simulation
  useEffect(() => {
    const map = new Map<string, Pt>();
    const n = nodes.length || 1;
    nodes.forEach((node, i) => {
      const angle = (i / n) * Math.PI * 2;
      const radius = 120 + (i % 7) * 30;
      map.set(node.id, {
        x: W / 2 + Math.cos(angle) * radius,
        y: H / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      });
    });
    posRef.current = map;

    let alpha = 1;
    let raf = 0;
    const idealLen = 78;
    const tick = () => {
      const pts = posRef.current;
      const arr = nodes.map((nd) => ({ id: nd.id, p: pts.get(nd.id)! })).filter((x) => x.p);
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const a = arr[i].p, b = arr[j].p;
          let dx = a.x - b.x, dy = a.y - b.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 0.01) { d2 = 0.01; dx = Math.random(); dy = Math.random(); }
          const d = Math.sqrt(d2);
          const f = (2900 / d2) * alpha;
          const fx = (dx / d) * f, fy = (dy / d) * f;
          a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
        }
      }
      for (const e of edges) {
        const a = pts.get(e.source), b = pts.get(e.target);
        if (!a || !b) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const f = ((d - idealLen) / d) * 0.05 * alpha;
        const fx = dx * f, fy = dy * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
      for (const { p } of arr) {
        if (p.fixed) { p.vx = 0; p.vy = 0; continue; }
        p.vx += (W / 2 - p.x) * 0.0018 * alpha;
        p.vy += (H / 2 - p.y) * 0.0018 * alpha;
        p.vx *= 0.85; p.vy *= 0.85;
        p.x += p.vx; p.y += p.vy;
      }
      alpha *= 0.97;
      rerender();
      if (alpha > 0.02) raf = requestAnimationFrame(tick);
      else fitToContent();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  // ── interaction ──
  const drag = useRef<{ mode: "pan" | "node"; id?: string; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  function toWorld(clientX: number, clientY: number) {
    const rect = svgRef.current!.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * W;
    const sy = ((clientY - rect.top) / rect.height) * H;
    return { x: (sx - view.x) / view.k, y: (sy - view.y) / view.k };
  }

  function onPointerDownNode(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    const w = toWorld(e.clientX, e.clientY);
    const p = posRef.current.get(id)!;
    drag.current = { mode: "node", id, sx: w.x, sy: w.y, ox: p.x, oy: p.y, moved: false };
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function onPointerDownBg(e: React.PointerEvent) {
    drag.current = { mode: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    if (d.mode === "node") {
      const w = toWorld(e.clientX, e.clientY);
      const p = posRef.current.get(d.id!)!;
      p.x = d.ox + (w.x - d.sx); p.y = d.oy + (w.y - d.sy); p.fixed = true;
      d.moved = true; rerender();
    } else {
      const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
      setView((v) => ({ ...v, x: d.ox + dx, y: d.oy + dy }));
    }
  }
  function onPointerUp() {
    const d = drag.current;
    if (d?.mode === "pan" && !d.moved) setSelected(null);
    drag.current = null;
  }
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const rect = svgRef.current!.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const my = ((e.clientY - rect.top) / rect.height) * H;
    setView((v) => {
      const k = Math.min(3, Math.max(0.3, v.k * (e.deltaY < 0 ? 1.12 : 0.89)));
      return { k, x: mx - ((mx - v.x) / v.k) * k, y: my - ((my - v.y) / v.k) * k };
    });
  }
  function zoom(factor: number) {
    setView((v) => {
      const k = Math.min(3, Math.max(0.3, v.k * factor));
      return { k, x: W / 2 - ((W / 2 - v.x) / v.k) * k, y: H / 2 - ((H / 2 - v.y) / v.k) * k };
    });
  }

  const activeId = hover ?? selected;
  const activeSet = useMemo(() => {
    if (!activeId) return null;
    const s = adjacency.get(activeId) ?? new Set<string>();
    return new Set([activeId, ...s]);
  }, [activeId, adjacency]);

  const selectedNode = selected ? nodes.find((n) => n.id === selected) : null;

  if (nodes.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-muted-foreground">
        <GitBranch className="h-10 w-10 opacity-40" />
        <p className="text-sm">연결할 태스크가 없습니다. 태스크·에픽·스토리를 만들면 여기에서 연결 구조가 자동으로 그려집니다.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card">
      {/* controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1 rounded-lg border border-border bg-background/80 p-1 backdrop-blur">
        <Button variant="ghost" size="icon-sm" onClick={() => zoom(1.2)} title="확대"><ZoomIn className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => zoom(0.83)} title="축소"><ZoomOut className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={fitToContent} title="전체 맞춤"><Maximize2 className="h-4 w-4" /></Button>
      </div>

      {/* legend */}
      <div className="absolute left-3 top-3 z-10 flex max-w-[60%] flex-wrap gap-x-3 gap-y-1 rounded-lg border border-border bg-background/80 px-3 py-2 text-[11px] backdrop-blur">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full" style={{ background: "#a78bfa" }} />에픽</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#38bdf8" }} />스토리</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "#f59e0b" }} />태스크(상태색)</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <svg width="22" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="var(--color-primary)" strokeWidth="1.6" markerEnd="url(#legendArrow)" /><defs><marker id="legendArrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" fill="var(--color-primary)" /></marker></defs></svg>
          의존성→
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-[68vh] w-full touch-none select-none"
        style={{ cursor: drag.current?.mode === "pan" ? "grabbing" : "grab" }}
        onPointerDown={onPointerDownBg}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      >
        <defs>
          <marker id="dep-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L7,3 L0,6 z" fill="var(--color-primary)" />
          </marker>
        </defs>
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          {/* edges (trimmed to node edges; arrows on dependencies) */}
          {edges.map((e, i) => {
            const a = posRef.current.get(e.source);
            const b = posRef.current.get(e.target);
            if (!a || !b) return null;
            const an = nodes.find((n) => n.id === e.source);
            const bn = nodes.find((n) => n.id === e.target);
            if (!an || !bn) return null;
            const dx = b.x - a.x, dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const ux = dx / len, uy = dy / len;
            const ra = radiusOf(an) + 1;
            const rb = radiusOf(bn) + (e.kind === "dependency" ? 8 : 2);
            const st = EDGE_STYLE[e.kind];
            const dim = activeSet && !(activeSet.has(e.source) && activeSet.has(e.target));
            const active = activeSet && activeSet.has(e.source) && activeSet.has(e.target);
            return (
              <line
                key={i}
                x1={a.x + ux * ra} y1={a.y + uy * ra}
                x2={b.x - ux * rb} y2={b.y - uy * rb}
                stroke={st.stroke}
                strokeWidth={e.kind === "dependency" ? 1.8 : 1.1}
                strokeDasharray={st.dash}
                markerEnd={e.kind === "dependency" ? "url(#dep-arrow)" : undefined}
                opacity={dim ? 0.05 : active ? 0.85 : 0.32}
              />
            );
          })}
          {/* nodes */}
          {nodes.map((n) => {
            const p = posRef.current.get(n.id);
            if (!p) return null;
            const r = radiusOf(n);
            const fill = n.type === "epic" ? "#a78bfa" : n.type === "story" ? "#38bdf8" : (STATUS_FILL[n.status] ?? "#94a3b8");
            const dim = activeSet && !activeSet.has(n.id);
            const isActive = activeId === n.id;
            const showLabel = n.type !== "task" || view.k > 0.9 || isActive;
            return (
              <g
                key={n.id}
                transform={`translate(${p.x} ${p.y})`}
                opacity={dim ? 0.18 : 1}
                style={{ cursor: "pointer" }}
                onPointerDown={(e) => onPointerDownNode(e, n.id)}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  if (!drag.current?.moved) setSelected((s) => (s === n.id ? null : n.id));
                  drag.current = null;
                }}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
              >
                <title>{n.label} · {n.status} · 연결 {degree.get(n.id) ?? 0}</title>
                <circle
                  r={r}
                  fill={fill}
                  stroke={isActive ? "var(--color-primary)" : "var(--color-card)"}
                  strokeWidth={isActive ? 3 : 1.5}
                />
                {showLabel && (
                  <text
                    x={r + 4}
                    y={3.5}
                    fontSize={n.type === "epic" ? 12 : n.type === "story" ? 11 : 10}
                    fontWeight={n.type === "task" ? 400 : 600}
                    fill="var(--color-foreground)"
                    className="pointer-events-none"
                    opacity={dim ? 0.3 : 0.92}
                  >
                    {n.label.length > 24 ? n.label.slice(0, 24) + "…" : n.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* selection detail */}
      {selectedNode && (
        <div className="absolute bottom-3 left-3 z-10 w-72 rounded-lg border border-border bg-background/95 p-3 text-sm shadow-lg backdrop-blur">
          <div className="mb-1 flex items-center gap-2">
            <span className={cn(
              "rounded px-1.5 py-px text-[10px] font-medium",
              selectedNode.type === "epic" ? "bg-violet-500/15 text-violet-500"
                : selectedNode.type === "story" ? "bg-sky-500/15 text-sky-500"
                : "bg-muted text-muted-foreground"
            )}>
              {selectedNode.type === "epic" ? "에픽" : selectedNode.type === "story" ? "스토리" : "태스크"}
            </span>
            <span className="text-xs text-muted-foreground">{selectedNode.status}</span>
          </div>
          <p className="font-medium leading-snug">{selectedNode.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            직접 연결 {adjacency.get(selectedNode.id)?.size ?? 0}개
          </p>
          <Button
            variant="outline" size="sm" className="mt-2 w-full"
            onClick={() => {
              const q =
                selectedNode.type === "task" ? `?task=${selectedNode.id}` :
                selectedNode.type === "epic" ? `?epic=${selectedNode.id}` :
                selectedNode.type === "story" ? `?story=${selectedNode.id}` : "";
              router.push(`/projects/${projectId}/board${q}`);
            }}
          >
            {selectedNode.type === "task" ? "태스크 열기" : "보드에서 보기"}
          </Button>
        </div>
      )}
    </div>
  );
}
