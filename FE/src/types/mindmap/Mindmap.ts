// src/types/mindmap/Mindmap.ts

/** 마인드맵 노드 */
export interface MindmapNode {
  id: string;
  title: string;
  x: number;
  y: number;
  priority: number;
  isShared?: boolean;
}

/** 마인드맵 엣지 */
export interface MindmapEdge {
  fromId: string;
  toId: string;
}

/** 마인드맵 조회 응답 data */
export interface MindmapDetail {
  createdAt: string;
  updatedAt: string;
  nodes: MindmapNode[];
  edges: MindmapEdge[];
}
