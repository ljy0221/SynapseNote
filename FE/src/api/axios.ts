import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore'; // AuthStore 가져오기

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // 쿠키(RefreshToken) 전송을 위해 필수
});

// 요청 인터셉터: 모든 요청에 액세스 토큰 첨부
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 토큰 만료(401) 처리 미들웨어 추가
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고 재시도하지 않은 요청인 경우 처리
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 1. 서버에 토큰 갱신 요청 전송 (새 토큰은 응답 바디나 쿠키로 수신)
        const response = await axios.post('/api/v1/refresh', {}, {
          withCredentials: true // RefreshToken 쿠키 포함
        });

        const newAccessToken = response.data.data.accessToken;

        // 2. 새로운 토큰을 로컬 스토리지에 저장 및 스토어 업데이트
        localStorage.setItem('authToken', newAccessToken);
        
        // 3. 원래 실패했던 요청의 헤더를 새 토큰으로 교체 후 재요청
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 갱신 실패 시 (리프래시 토큰 만료 등) 로그아웃 처리
        console.error('Token refresh failed:', refreshError);
        useAuthStore.getState().logout(); // 스토어의 로그아웃 기능 호출
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);