import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// 큐에 담길 요청의 타입 정의
interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

// 대기 중인 요청들을 처리하는 함수
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
  baseURL: '/api',
  withCredentials: true,
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

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // 갱신 중이라면 큐에 담고 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
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
        const response = await axios.post('/api/v1/refresh', {}, { withCredentials: true });
        const newAccessToken = response.data.data.accessToken;

        localStorage.setItem('authToken', newAccessToken);
        
        // 큐에 대기 중인 요청들 모두 실행
        processQueue(null, newAccessToken);
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 갱신 실패 시 큐에 대기 중인 요청들 모두 거절
        processQueue(refreshError, null);
        
        // [결합도 해소] 직접적인 logout() 호출 대신 커스텀 에러를 던지거나 
        // 전역 이벤트(CustomEvent)를 발생시켜 App 레이어에서 처리하게 합니다.
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);