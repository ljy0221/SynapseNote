// src/api/authApi.ts
import { api } from './axios';

export interface LoginResult {
  accessToken: string;
  memberId: string;
}

interface LoginResponse {
  accessToken: string;
  member: {
    id: string;
    email: string;
    name: string;
  };
}

interface ApiResponse<T> {
  data: T;
}

export const socialLogin = async (provider: string, code: string, platform?: string): Promise<LoginResult> => {
  const response = await api.post<ApiResponse<LoginResponse>>('/v1/login', {
    provider: provider.toUpperCase(),
    authorizationCode: code,
    platform: platform || 'WEB', // Default to WEB if not specified, though caller should provide it
  });

  const data = response.data.data;

  return {
    accessToken: data.accessToken,
    memberId: data.member.id,
  };
};

export interface UserInfo {
  memberId: string;
  email: string;
  name: string;
  provider: string;
  createdAt: string;
}

interface MemberResponse {
  id: string;
  email: string;
  name: string;
  provider: string;
  createdAt: string;
}

/**
 * 토큰은 api(axios) 인터셉터가 자동으로 Authorization 헤더에 넣어줌
 * => token 파라미터 제거
 */
export const getUserInfo = async (): Promise<UserInfo> => {
  const response = await api.get<ApiResponse<MemberResponse>>('/v1/members/me');
  const data = response.data.data;

  return {
    ...data,
    memberId: data.id,
  };
};

export const updateNickname = async (newNickname: string): Promise<UserInfo> => {
  const response = await api.patch<ApiResponse<MemberResponse>>('/v1/members/me', {
    name: newNickname,
  });

  const data = response.data.data;

  return {
    ...data,
    memberId: data.id,
  };
};

/**
 * 회원 탈퇴
 * refreshToken은 쿠키로 자동 전송됨 (withCredentials: true)
 */
export const deleteAccount = async (): Promise<void> => {
  await api.delete('/v1/members');
};

export type Theme = 'LIGHT' | 'DARK' | 'COOKIE' | 'DEEPBLUE';

export const updateTheme = async (theme: Theme): Promise<void> => {
  await api.patch('/v1/members/me/theme', {
    theme,
  });
};

/**
 * 로그아웃
 * refreshToken은 쿠키로 자동 전송됨 (withCredentials: true)
 */
export const logoutApi = async (): Promise<void> => {
  await api.post('/v1/logout');
};