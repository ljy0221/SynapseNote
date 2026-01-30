export type AuthProvider = 'GOOGLE' | 'KAKAO' | 'NAVER';

export interface GetProfileResponse {
  email: string;
  nickname: string;
  profileImageUrl: string;
  provider: AuthProvider;
  createdAt: string;
}
