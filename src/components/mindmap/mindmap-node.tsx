"use client";

import { Link2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MindMapNodeProps {
  id: string;
  content: string;
  color?: string | null;
  x: number;
  y: number;
  isConverted: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
}

export function MindMapNodeComponent({
  id, content, color, x, y, isConverted, isSelected, onSelect, onDragStart,
}: MindMapNodeProps) {
  return (
    <g transform={`translate(${x}, ${y})`} onClick={() => onSelect(id)} style={{ cursor: "pointer" }}>
      <rect
        x={-60} y={-16} width={120} height={32} rx={8}
        fill={color ?? "#6366f1"}
        stroke={isSelected ? "#000" : "transparent"}
        strokeWidth={2}
        opacity={0.9}
        onMouseDown={(e) => { e.stopPropagation(); onDragStart(id, e); }}
      />
      <text x={0} y={4} textAnchor="middle" fill="white" fontSize={12} fontWeight={500} className="pointer-events-none select-none">
        {content.length > 14 ? content.slice(0, 12) + "…" : content}
      </text>
      {isConverted && (
        <g transform="translate(48, -12)">
          <circle r={8} fill="#10b981" />
          <Check x={-4} y={-4} width={8} height={8} className="text-white" />
        </g>
      )}
    </g>
  );
}
