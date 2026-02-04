interface JwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
}

/**
 * JWT 토큰의 페이로드를 파싱합니다.
 * @param token JWT 토큰 문자열
 * @returns 파싱된 페이로드 또는 null
 */
export const parseJwtPayload = <T = JwtPayload>(token: string): T | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/**
 * 토큰이 지정된 시간 내에 만료되는지 확인합니다.
 * @param token JWT 토큰
 * @param thresholdMs 만료 임계값 (밀리초, 기본 60초)
 * @returns 곧 만료되면 true
 */
export const isTokenExpiringSoon = (
  token: string,
  thresholdMs: number = 60000
): boolean => {
  const payload = parseJwtPayload<JwtPayload>(token);
  if (!payload?.exp) return false;

  const expirationTimeMs = payload.exp * 1000;
  const now = Date.now();

  return expirationTimeMs - now < thresholdMs;
};

/**
 * 토큰이 이미 만료되었는지 확인합니다.
 * @param token JWT 토큰
 * @returns 만료되었으면 true
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = parseJwtPayload<JwtPayload>(token);
  if (!payload?.exp) return true;

  return Date.now() >= payload.exp * 1000;
};
