export interface MindMapNodeItem {
  nodeId: string;
  parentId: number | null;
  title?: string;
  pointX: number;
  pointY: number;
}

export interface GetMindMapResponse {
  createdAt: string;
  updatedAt: string;
  nodes: MindMapNodeItem[];
}
