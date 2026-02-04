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
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
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
    // Zustand Store의 상태를 직접 조회 (LocalStorage 직접 접근 X)
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// [응답 인터셉터] 401 에러 핸들링 및 토큰 갱신
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 에러(Unauthorized)가 발생했고, 아직 재시도하지 않은 요청일 경우
    if (error.response?.status === 401 && !originalRequest._retry) {

      // 이미 토큰 갱신이 진행 중이라면, 요청을 큐에 넣고 대기
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

      // 갱신 시작 플래그 설정
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 1. 리프레시 토큰으로 액세스 토큰 갱신 요청 (쿠키 사용)
        // 주의: api 인스턴스 대신 axios 직접 사용 (인터셉터 순환 방지)
        const response = await axios.post('/v1/refresh', {}, {
          baseURL: '/api',
          withCredentials: true,
        });

        const newAccessToken = response.data?.data?.accessToken;

        if (!newAccessToken) {
           throw new Error("Failed to retrieve access token");
        }

        // 2. 성공 시: 스토어 업데이트 (persist 미들웨어가 LocalStorage 동기화 수행)
        useAuthStore.getState().setAccessToken(newAccessToken);

        // 3. 대기 중이던 요청들 처리 (새 토큰 전달)
        processQueue(null, newAccessToken);

        // 4. 원래 실패했던 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // 5. 갱신 실패 시: 대기 열 비우고 에러 전파
        processQueue(refreshError, null);

        // 결합도를 낮추기 위해 직접 로그아웃 함수를 호출하지 않고 이벤트 발생
        // (App.tsx에서 이 이벤트를 감지하여 로그아웃 및 리다이렉트 처리)
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));

        return Promise.reject(refreshError);
      } finally {
        // 갱신 상태 해제
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
