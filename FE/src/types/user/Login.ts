export type AuthProvider = 'GOOGLE' | 'KAKAO' | 'NAVER';

export interface LoginUser {
  email: string;
  nickname: string;
  profileImageUrl: string;
  provider: AuthProvider;
}

export interface LoginResponse {
  accessToken: string;
  isNewUser: boolean;
  user: LoginUser;
}
