// utils/id.ts
import { v7 as uuidv7 } from 'uuid';

/**
 * UUID v7 생성
 * - 시간순 정렬 가능
 * - MongoDB 인덱스 효율적
 */
export function generateBlockId(): string {
    return uuidv7();
}

/**
 * UUID에서 timestamp 추출 (디버깅용)
 * @param uuid - UUID v7 문자열
 * @returns 추출된 Date 객체
 */
export function getTimestampFromUUID(uuid: string): Date {
    const hex = uuid.replace(/-/g, '');
    const timestampHex = hex.substring(0, 12);
    const timestamp = parseInt(timestampHex, 16);
    return new Date(timestamp);
}

// 테스트 (필요 시 주석 처리 또는 별도 테스트 파일로 이동)
// const id = generateBlockId();
// console.log(id); 
// console.log(getTimestampFromUUID(id));