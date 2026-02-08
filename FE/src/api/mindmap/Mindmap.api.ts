// 한 페이지에 작성한 이유 = CRUD가 밀집해 있어 관련 API를 한 눈에 보기 편하도록 하기 위함

// src/api/mindmap/Mindmap.api.ts
import { request } from '../request';
import type { ApiResponse } from '../../types/common/apiResponse';
import type { MindmapDetail } from '../../types/mindmap/Mindmap';
import type {
  UpdateMindmapNodesPositionRequest,
  CreateMindmapEdgeRequest,
  DeleteMindmapEdgeRequest,
  SyncMindmapRequest, // [New]
} from '../../types/mindmap/Requests';

/** 마인드맵 동기화 (노드 위치 + 엣지 정보 일괄 저장) */
export const syncMindmapApi = (
  body: SyncMindmapRequest
) => {
  return request<ApiResponse>(
    'post',
    `/v1/mindmaps`,
    { body }
  );
};

/** 마인드맵 조회 */
export const getMindmapApi = () => {
  return request<MindmapDetail>(
    'get',
    `/v1/mindmaps`
  );
};

/** 마인드맵 최초 노드 추가 (body 없음) */
export const createInitialMindmapNodeApi = (
  mindmapId: string
) => {
  return request<ApiResponse>(
    'post',
    `/v1/mindmaps/${mindmapId}/nodes`
  );
};

/** 마인드맵 노드 위치 정렬 */
export const updateMindmapNodesPositionApi = (
  mindmapId: string,
  body: UpdateMindmapNodesPositionRequest
) => {
  return request<ApiResponse>(
    'put',
    `/v1/mindmaps/${mindmapId}/nodes/positions`,
    { body }
  );
};

/** 마인드맵 연결 추가 */
export const createMindmapEdgeApi = (
  mindmapId: string,
  body: CreateMindmapEdgeRequest
) => {
  return request<ApiResponse>(
    'post',
    `/v1/mindmaps/${mindmapId}/edges`,
    { body }
  );
};

/** 마인드맵 노드 삭제 */
export const deleteMindmapNodeApi = (
  mindmapId: string,
  nodeId: string
) => {
  return request<ApiResponse>(
    'delete',
    `/v1/mindmaps/${mindmapId}/nodes/${nodeId}`
  );
};

/** 마인드맵 특정 연결 삭제 */
export const deleteMindmapEdgeApi = (
  mindmapId: string,
  body: DeleteMindmapEdgeRequest
) => {
  return request<ApiResponse>(
    'delete',
    `/v1/mindmap/${mindmapId}/connection`,
    { body }
  );
};

/** 마인드맵 전체 삭제 */
export const deleteMindmapApi = (mindmapId: string) => {
  return request<ApiResponse>(
    'delete',
    `/v1/mindmap/${mindmapId}`
  );
};
