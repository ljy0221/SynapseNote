import { randomBytes } from 'crypto';

/**
 * UUID v7 생성기 (RFC 9562)
 * - 48비트: 유닉스 밀리초 타임스탬프
 * - 4비트: 버전 (7)
 * - 12비트: 시퀀스/분수 타임스탬프 (여기서는 랜덤)
 * - 2비트: 베리언트 (2)
 * - 62비트: 랜덤
 */
export function generateUuidV7(): string {
    const bytes = randomBytes(16);

    // 현재 시간 (밀리초)
    const timestamp = Date.now();

    // 타임스탬프 주입 (48비트)
    bytes.set(Uint8Array.from([
        (timestamp / 0x10000000000) & 0xff,
        (timestamp / 0x100000000) & 0xff,
        (timestamp / 0x1000000) & 0xff,
        (timestamp / 0x10000) & 0xff,
        (timestamp / 0x100) & 0xff,
        timestamp & 0xff,
    ]), 0);

    // 버전 (Bits 48-51: 0111 = 7)
    bytes[6] = (bytes[6] & 0x0f) | 0x70;

    // 베리언트 (Bits 64-65: 10 = RFC 4122/9562)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    // Hex 문자열 변환
    const hex = bytes.toString('hex');
    return [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20, 32)
    ].join('-');
}
