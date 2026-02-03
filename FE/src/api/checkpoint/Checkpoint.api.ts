// src/api/checkpoint/Checkpoint.api.ts
import { request } from '../request';
import type { GetCheckpointsData, SlotHistory } from '../../types/checkpoint/GetCheckpoints';

/** 
 * 특정 블록의 버전 히스토리(슬롯 목록) 조회 
 */
export const getCheckpointsApi = (noteId: string, blockId: string) => {
    return request<GetCheckpointsData>(
        'get',
        `/v1/notes/${noteId}/blocks/${blockId}/history`
    ).then(res => {
        return res;
    }).catch(err => {
        throw err;
    });
};

/** 
 * 특정 블록의 히스토리 상세 내용(코드 등) 조회 
 */
export const getCheckpointDetailApi = (noteId: string, blockId: string, slotNumber: number) => {
    return request<SlotHistory>(
        'get',
        `/v1/notes/${noteId}/blocks/${blockId}/history/slots/${slotNumber}`
    ).then(res => {
        return res;
    }).catch(err => {
        throw err;
    });
};

/** 
 * 특정 블록의 현재 상태를 특정 히스토리 슬롯에 저장 
 */
export const createCheckpointApi = (noteId: string, blockId: string, slotNumber: number) => {
    const url = `/v1/notes/${noteId}/blocks/${blockId}/history/slots/${slotNumber}`;
    return request<void>(
        'post',
        url
    ).then(res => {
        return res;
    }).catch(err => {
        throw err;
    });
};
