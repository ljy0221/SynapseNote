// src/api/checkpoint/Checkpoint.api.ts
import { request } from '../request';
import type { GetCheckpointsData, SlotHistory } from '../../types/checkpoint/GetCheckpoints';

/** 
 * 특정 블록의 버전 히스토리(슬롯 목록) 조회 
 */
export const getCheckpointsApi = (noteId: string, blockId: string) => {
    console.log('[API] getCheckpointsApi called:', { noteId, blockId });
    return request<GetCheckpointsData>(
        'get',
        `/v1/notes/${noteId}/blocks/${blockId}/history`
    ).then(res => {
        console.log('[API] getCheckpointsApi response:', res);
        return res;
    }).catch(err => {
        console.error('[API] getCheckpointsApi error:', err);
        throw err;
    });
};

/** 
 * 특정 블록의 히스토리 상세 내용(코드 등) 조회 
 */
export const getCheckpointDetailApi = (noteId: string, blockId: string, slotNumber: number) => {
    console.log('[API] getCheckpointDetailApi called:', { noteId, blockId, slotNumber });
    return request<SlotHistory>(
        'get',
        `/v1/notes/${noteId}/blocks/${blockId}/history/slots/${slotNumber}`
    ).then(res => {
        console.log('[API] getCheckpointDetailApi response:', res);
        return res;
    }).catch(err => {
        console.error('[API] getCheckpointDetailApi error:', err);
        throw err;
    });
};

/** 
 * 특정 블록의 현재 상태를 특정 히스토리 슬롯에 저장 
 */
export const createCheckpointApi = (noteId: string, blockId: string, slotNumber: number) => {
    console.log('[API] createCheckpointApi called:', { noteId, blockId, slotNumber });
    const url = `/v1/notes/${noteId}/blocks/${blockId}/history/slots/${slotNumber}`;
    console.log('[API] Request URL:', url);
    return request<void>(
        'post',
        url
    ).then(res => {
        console.log('[API] createCheckpointApi SUCCESS response:', res);
        return res;
    }).catch(err => {
        console.error('[API] createCheckpointApi ERROR:', err);
        console.error('[API] Error details:', {
            message: err.message,
            response: err.response,
            status: err.response?.status,
            data: err.response?.data
        });
        throw err;
    });
};

/** 
 * 특정 히스토리 슬롯 초기화(삭제) 
 */
export const deleteCheckpointApi = (noteId: string, blockId: string, slotNumber: number) => {
    console.log('[API] deleteCheckpointApi called:', { noteId, blockId, slotNumber });
    return request<void>(
        'delete',
        `/v1/notes/${noteId}/blocks/${blockId}/history/slots/${slotNumber}`
    ).then(res => {
        console.log('[API] deleteCheckpointApi response:', res);
        return res;
    }).catch(err => {
        console.error('[API] deleteCheckpointApi error:', err);
        throw err;
    });
};
