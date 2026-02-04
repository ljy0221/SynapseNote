// utils/UUIDV7.ts

// 브라우저 안전 random
function randomBytesBrowser(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function generateUuidV7(): string {
  const bytes = randomBytesBrowser(16);
  const t = Date.now();

  // timestamp (48bit)
  bytes.set([
    Math.floor(t / 0x10000000000) & 0xff,
    Math.floor(t / 0x100000000) & 0xff,
    Math.floor(t / 0x1000000) & 0xff,
    Math.floor(t / 0x10000) & 0xff,
    Math.floor(t / 0x100) & 0xff,
    t & 0xff,
  ], 0);

  // version = 7
  bytes[6] = (bytes[6] & 0x0f) | 0x70;

  // variant = RFC 4122 / 9562 (10xxxxxx)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return (
    hex.slice(0, 8) + '-' +
    hex.slice(8, 12) + '-' +
    hex.slice(12, 16) + '-' +
    hex.slice(16, 20) + '-' +
    hex.slice(20)
  );
}
