import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// 갱신 중 대기할 요청의 타입 정의
interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

// 상태 관리 변수
let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

// 큐에 대기 중인 요청들을 처리하는 함수
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) prom.resolve(token);
    else prom.reject(error);
  });
  failedQueue = [];
};

export const api = axios.create({
  baseURL: '/api', // Vite Proxy 설정에 따름
  withCredentials: true, // 쿠키(RefreshToken) 전송 허용
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 모든 요청에 액세스 토큰 첨부
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 401이면 refresh 후 재시도
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // 이미 갱신 중이면 큐에 넣고 대기
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // refresh는 axios 직접 호출 (인터셉터 순환 방지)
        const response = await axios.post(
          '/v1/refresh',
          {},
          {
            baseURL: '/api',
            withCredentials: true,
          }
        );

        const newAccessToken = response.data?.data?.accessToken;
        if (!newAccessToken) throw new Error('Failed to retrieve access token');

        // Store 업데이트 (persist면 LocalStorage도 자동 동기화)
        useAuthStore.getState().setAccessToken(newAccessToken);

        // 대기 중 요청들 처리
        processQueue(null, newAccessToken);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);