"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Plus, Trash2, Link2, Pencil, Palette, X, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useServerAction } from "@/hooks/use-server-action";
import { createNode, updateNode, deleteNode, convertNodeToEpic, convertNodeToTask, convertNodeToStory } from "@/actions/mindmap";
import { cn } from "@/lib/utils";
import type { MindMapNode } from "@prisma/client";

interface MindMapCanvasProps {
  mindMapId: string;
  projectId?: string | null;
  nodes: MindMapNode[];
}

const NODE_COLORS = [
  "rgba(99,102,241,0.7)", "rgba(59,130,246,0.7)", "rgba(16,185,129,0.7)", "rgba(245,158,11,0.7)",
  "rgba(239,68,68,0.7)", "rgba(236,72,153,0.7)", "rgba(139,92,246,0.7)", "rgba(20,184,166,0.7)",
];

const DEPTH_CONFIG: Record<number, { label: string; desc: string; action: string; color: string; glow: string }> = {
  0: { label: "에픽", desc: "왜 하는가 (대분류)", action: "에픽으로 변환", color: "rgba(99,102,241,0.75)", glow: "rgba(99,102,241,0.4)" },
  1: { label: "스토리", desc: "무엇을 하는가 (기능)", action: "스토리로 변환", color: "rgba(59,130,246,0.75)", glow: "rgba(59,130,246,0.4)" },
  2: { label: "태스크", desc: "어떻게 하는가 (작업)", action: "태스크로 변환", color: "rgba(16,185,129,0.75)", glow: "rgba(16,185,129,0.4)" },
  3: { label: "서브태스크", desc: "세부 단계 (체크리스트)", action: "서브태스크로 변환", color: "rgba(245,158,11,0.75)", glow: "rgba(245,158,11,0.4)" },
};

function getDepthConfig(depth: number) {
  return DEPTH_CONFIG[Math.min(depth, 3)];
}

export function MindMapCanvas({ mindMapId, projectId, nodes: initialNodes }: MindMapCanvasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  // 노드 중심으로 자동 포커스
  useEffect(() => {
    if (initialNodes.length === 0 || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xs = initialNodes.map((n) => n.positionX);
    const ys = initialNodes.map((n) => n.positionY);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const spread = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 300);
    const newZoom = Math.max(0.3, Math.min(1.5, Math.min(rect.width, rect.height) / (spread + 200)));
    setPan({ x: rect.width / 2 - cx * newZoom, y: rect.height / 2 - cy * newZoom });
    setZoom(newZoom);
  }, [initialNodes.length]);

  // 마우스 휠 줌
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.2, Math.min(3, zoom * delta));
    setPan({ x: mouseX - (mouseX - pan.x) * (newZoom / zoom), y: mouseY - (mouseY - pan.y) * (newZoom / zoom) });
    setZoom(newZoom);
  }, [zoom, pan]);

  // 배경 팬 (드래그)
  function handlePanStart(e: React.MouseEvent) {
    if (e.target !== svgRef.current && !(e.target as SVGElement).classList.contains("canvas-bg")) return;
    panRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    function onMove(ev: MouseEvent) {
      if (!panRef.current) return;
      setPan({ x: panRef.current.panX + ev.clientX - panRef.current.startX, y: panRef.current.panY + ev.clientY - panRef.current.startY });
    }
    function onUp() {
      panRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  // 각 노드의 깊이 계산
  const depthMap = useMemo(() => {
    const map = new Map<string, number>();
    function calcDepth(nodeId: string): number {
      if (map.has(nodeId)) return map.get(nodeId)!;
      const node = initialNodes.find((n) => n.id === nodeId);
      if (!node || !node.parentNodeId) { map.set(nodeId, 0); return 0; }
      const parentDepth = calcDepth(node.parentNodeId);
      const depth = parentDepth + 1;
      map.set(nodeId, depth);
      return depth;
    }
    initialNodes.forEach((n) => calcDepth(n.id));
    return map;
  }, [initialNodes]);

  const { execute: addNode } = useServerAction(async (input: unknown) => createNode(input), { successMessage: "노드 추가됨" });
  const { execute: moveNode } = useServerAction(async (input: { id: string; data: unknown }) => updateNode(input.id, input.data));
  const { execute: editNodeAction } = useServerAction(async (input: { id: string; data: unknown }) => updateNode(input.id, input.data), { successMessage: "수정됨" });
  const { execute: removeNode } = useServerAction(async (id: string) => deleteNode(id), { successMessage: "삭제됨", onSuccess: () => setSelectedId(null) });
  const { execute: toEpic } = useServerAction(async (input: { nodeId: string; projectId: string }) => convertNodeToEpic(input.nodeId, input.projectId), { successMessage: "에픽으로 변환됨" });
  const { execute: toStory } = useServerAction(async (input: { nodeId: string; projectId: string }) => convertNodeToStory(input.nodeId, input.projectId), { successMessage: "스토리로 변환됨" });
  const { execute: toTask } = useServerAction(async (input: { nodeId: string; projectId: string }) => convertNodeToTask(input.nodeId, input.projectId), { successMessage: "태스크로 변환됨" });

  const selectedNode = initialNodes.find((n) => n.id === selectedId);
  const selectedDepth = selectedId ? (depthMap.get(selectedId) ?? 0) : 0;
  const selectedConfig = getDepthConfig(selectedDepth);

  function handleAddNode() {
    if (!newContent.trim()) return;
    const x = 200 + Math.random() * 500;
    const y = 100 + Math.random() * 350;
    addNode({ mindMapId, content: newContent.trim(), positionX: Math.round(x), positionY: Math.round(y), parentNodeId: selectedId });
    setNewContent("");
  }

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (e.target === svgRef.current) {
      if (connectMode) { setConnectMode(false); setConnectFrom(null); }
      else { setSelectedId(null); }
    }
  }

  function handleNodeClick(id: string) {
    if (connectMode && connectFrom) {
      if (connectFrom !== id) editNodeAction({ id, data: { parentNodeId: connectFrom } });
      setConnectMode(false);
      setConnectFrom(null);
    } else {
      setSelectedId(id === selectedId ? null : id);
    }
  }

  function handleConvert() {
    if (!selectedId || !projectId) return;
    const depth = depthMap.get(selectedId) ?? 0;
    if (depth === 0) toEpic({ nodeId: selectedId, projectId });
    else if (depth === 1) toStory({ nodeId: selectedId, projectId });
    else toTask({ nodeId: selectedId, projectId });
  }

  function handleDragStart(id: string, e: React.MouseEvent) {
    const node = initialNodes.find((n) => n.id === id);
    if (!node) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = nodePositions.get(id);
    const nodeX = pos?.x ?? node.positionX;
    const nodeY = pos?.y ?? node.positionY;
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, nodeX, nodeY };

    const dragId = id;
    const startX = e.clientX;
    const startY = e.clientY;

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      setNodePositions((prev) => {
        const next = new Map(prev);
        next.set(dragId, { x: nodeX + dx, y: nodeY + dy });
        return next;
      });
    }
    function onUp(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        moveNode({ id: dragId, data: { positionX: Math.round(nodeX + dx), positionY: Math.round(nodeY + dy) } });
      }
      dragRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function getNodePos(node: MindMapNode) {
    const override = nodePositions.get(node.id);
    return { x: override?.x ?? node.positionX, y: override?.y ?? node.positionY };
  }

  const edges = initialNodes
    .filter((n) => n.parentNodeId)
    .map((n) => { const p = initialNodes.find((x) => x.id === n.parentNodeId); return p ? { from: p, to: n } : null; })
    .filter(Boolean) as { from: MindMapNode; to: MindMapNode }[];

  return (
    <div className="space-y-3">
      {/* 입력 + 툴바 */}
      <div className="flex gap-2 flex-wrap items-center">
        <Input
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder={selectedId ? `하위 노드 추가 (${getDepthConfig(selectedDepth + 1).label} 레벨)...` : "루트 노드 추가 (에픽 레벨)..."}
          onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleAddNode()}
          className="flex-1 min-w-[200px] h-9 text-sm"
        />
        <Button onClick={handleAddNode} disabled={!newContent.trim()} size="sm" className="h-9 px-4 rounded-full text-xs font-medium gap-1.5">
          <Plus className="h-3.5 w-3.5" /> 추가
        </Button>
      </div>

      {/* 선택된 노드 액션 바 */}
      {selectedId && (
        <div className="flex gap-1.5 flex-wrap items-center bg-muted/30 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-border/50">
          <Badge className="text-[10px] rounded-full px-2.5 py-0.5 text-white border-0" style={{ backgroundColor: selectedConfig.color }}>
            {selectedConfig.label} {selectedDepth}
          </Badge>
          <span className="text-xs text-muted-foreground truncate max-w-[180px]">{selectedNode?.content}</span>
          <div className="h-4 border-l mx-0.5" />
          <Button variant="ghost" size="sm" onClick={() => { setConnectFrom(selectedId); setConnectMode(true); }} className={cn("h-7 rounded-full text-[11px] gap-1", connectMode && "ring-2 ring-primary")}>
            <Link2 className="h-3 w-3" /> 연결
          </Button>
          {selectedNode?.parentNodeId && (
            <Button variant="ghost" size="sm" className="h-7 rounded-full text-[11px] gap-1" onClick={() => editNodeAction({ id: selectedId, data: { parentNodeId: null } })}>
              <X className="h-3 w-3" /> 해제
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 rounded-full text-[11px] gap-1" onClick={() => { setEditingId(selectedId); setEditContent(selectedNode?.content ?? ""); }}>
            <Pencil className="h-3 w-3" /> 편집
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 rounded-full text-[11px] gap-1"><Palette className="h-3 w-3" /> 색상</Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex gap-1.5">{NODE_COLORS.map((c) => (
                <button key={c} className="h-5 w-5 rounded-full border-2 border-transparent hover:border-foreground hover:scale-110 transition-transform" style={{ backgroundColor: c }} onClick={() => editNodeAction({ id: selectedId, data: { color: c } })} />
              ))}</div>
            </PopoverContent>
          </Popover>
          {projectId && !selectedNode?.convertedToTaskId && (
            <>
              <div className="h-4 border-l mx-0.5" />
              <Button size="sm" className="h-7 rounded-full text-[11px] gap-1 text-white border-0" style={{ backgroundColor: selectedConfig.color }} onClick={handleConvert}>
                <Layers className="h-3 w-3" /> {selectedConfig.action}
              </Button>
              {selectedDepth !== 0 && (
                <Button variant="ghost" size="sm" className="h-7 rounded-full text-[11px]" onClick={() => selectedId && toEpic({ nodeId: selectedId, projectId })}>에픽</Button>
              )}
              {selectedDepth !== 1 && (
                <Button variant="ghost" size="sm" className="h-7 rounded-full text-[11px]" onClick={() => selectedId && toStory({ nodeId: selectedId, projectId })}>스토리</Button>
              )}
              {selectedDepth < 2 && (
                <Button variant="ghost" size="sm" className="h-7 rounded-full text-[11px]" onClick={() => selectedId && toTask({ nodeId: selectedId, projectId })}>태스크</Button>
              )}
            </>
          )}
          {selectedNode?.convertedToTaskId && (
            <Badge variant="secondary" className="text-[10px] rounded-full">변환됨</Badge>
          )}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full text-destructive ml-auto" onClick={() => removeNode(selectedId)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* 안내 */}
      {connectMode && (
        <div className="bg-primary/10 rounded-md px-3 py-2 text-xs">연결할 대상 노드를 클릭하세요. 선택한 노드가 부모가 됩니다. 배경 클릭 시 취소.</div>
      )}
      {!connectMode && initialNodes.length === 0 && (
        <div className="bg-muted/50 rounded-md px-3 py-2 text-xs text-muted-foreground">
          텍스트를 입력하고 추가 버튼을 눌러 첫 노드를 만드세요. 노드 깊이에 따라 에픽/스토리/태스크/서브태스크로 변환됩니다.
        </div>
      )}
      {!connectMode && initialNodes.length > 0 && !selectedId && (
        <div className="flex gap-4 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          <span><strong>깊이 0</strong> 에픽 (왜)</span>
          <span><strong>깊이 1</strong> 스토리 (무엇)</span>
          <span><strong>깊이 2</strong> 태스크 (어떻게)</span>
          <span><strong>깊이 3+</strong> 서브태스크 (세부)</span>
        </div>
      )}

      {/* 편집 인라인 */}
      {editingId && (
        <div className="flex gap-2 bg-muted/50 rounded-md p-2">
          <Input value={editContent} onChange={(e) => setEditContent(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { editNodeAction({ id: editingId, data: { content: editContent.trim() } }); setEditingId(null); } }} className="flex-1" autoFocus />
          <Button size="sm" onClick={() => { editNodeAction({ id: editingId, data: { content: editContent.trim() } }); setEditingId(null); }}>저장</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>취소</Button>
        </div>
      )}

      {/* SVG 캔버스 */}
      <div ref={containerRef} className="border rounded-lg bg-muted/10 overflow-hidden" style={{ height: 550 }} onWheel={handleWheel}>
        <svg ref={svgRef} width="100%" height="100%" className="select-none" onClick={handleSvgClick} onMouseDown={handlePanStart}>
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* 배경 (팬 대상) */}
          <rect className="canvas-bg" x={-10000} y={-10000} width={20000} height={20000} fill="transparent" />
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {edges.map((edge, i) => {
            const fromPos = getNodePos(edge.from);
            const toPos = getNodePos(edge.to);
            return (
              <line key={i} x1={fromPos.x} y1={fromPos.y} x2={toPos.x} y2={toPos.y}
                stroke="rgba(148,163,184,0.4)" strokeWidth={1.5} strokeDasharray="6 3" markerEnd="url(#arrowhead)" />
            );
          })}
          {initialNodes.map((node) => {
            const pos = getNodePos(node);
            const isSelected = selectedId === node.id;
            const isConnectTarget = connectMode && connectFrom !== node.id;
            const depth = depthMap.get(node.id) ?? 0;
            const config = getDepthConfig(depth);
            const label = node.content.length > 16 ? node.content.slice(0, 14) + "..." : node.content;
            const w = Math.max(130, Math.min(220, node.content.length * 9 + 30));
            const nodeColor = node.color ?? config.color;
            const glowColor = config.glow;
            return (
              <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}
                onClick={(e) => { e.stopPropagation(); handleNodeClick(node.id); }}
                style={{ cursor: connectMode ? "crosshair" : "pointer" }}
                filter={isSelected ? "url(#glow)" : undefined}>
                {/* 글로우 배경 */}
                <rect x={-w/2-2} y={-24} width={w+4} height={48} rx={14}
                  fill={glowColor} opacity={isSelected ? 0.6 : 0.2} />
                {/* 메인 노드 */}
                <rect x={-w/2} y={-22} width={w} height={44} rx={12}
                  fill={nodeColor}
                  stroke={isSelected ? "rgba(255,255,255,0.8)" : isConnectTarget ? "rgba(59,130,246,0.8)" : "rgba(255,255,255,0.15)"}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeDasharray={isConnectTarget ? "4 2" : "none"}
                  style={{ backdropFilter: "blur(8px)" }}
                  onMouseDown={(e) => !connectMode && handleDragStart(node.id, e)} />
                {/* 깊이 레벨 배지 */}
                <rect x={-w/2+4} y={-18} width={28} height={14} rx={7} fill="rgba(255,255,255,0.2)" />
                <text x={-w/2+18} y={-8} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize={8} fontWeight={600} className="pointer-events-none select-none">
                  {config.label.charAt(0)}{depth}
                </text>
                {/* 노드 텍스트 */}
                <text x={0} y={8} textAnchor="middle" fill="white" fontSize={12} fontWeight={500} className="pointer-events-none select-none">
                  {label}
                </text>
                {node.convertedToTaskId && (
                  <g transform={`translate(${w/2-8}, -18)`}>
                    <circle r={7} fill="#10b981" />
                    <text x={0} y={4} textAnchor="middle" fill="white" fontSize={9} className="pointer-events-none">V</text>
                  </g>
                )}
              </g>
            );
          })}
          </g>
        </svg>
      </div>
    </div>
  );
}
