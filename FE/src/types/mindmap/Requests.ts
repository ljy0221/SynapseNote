// src/types/mindmap/Requests.ts

/** 노드 위치 일괄 변경 */
export interface UpdateMindmapNodePosition {
  nodeId: string;
  pointX: number;
  pointY: number;
}

export interface UpdateMindmapNodesPositionRequest {
  nodes: UpdateMindmapNodePosition[];
}

/** 마인드맵 연결 추가 */
export interface CreateMindmapEdgeRequest {
  parentId: string;
  childId: string;
}

/** 마인드맵 연결 삭제 */
export interface DeleteMindmapEdgeRequest {
  parentId: string;
  childId: string;
}

// ----------------------------------------------------
// [New] 마인드맵 싱크 (위치+연결 일괄 저장)
// ----------------------------------------------------

export interface NodePositionDto {
  nodeId: string;
  x: number;
  y: number;
}

export interface MindmapEdgeDto {
  fromId: string;
  toId: string;
}

export interface SyncMindmapRequest {
  nodes: NodePositionDto[];
  edges: MindmapEdgeDto[];
}
