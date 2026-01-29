// src/api/request.ts
import { api } from './axios';

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

export const request = async <T>(
  method: HttpMethod,
  url: string,
  options?: {
    params?: Record<string, unknown>;
    body?: unknown;
  }
): Promise<T> => {
  const res = await api.request<T>({
    method,
    url,
    params: options?.params,
    data: options?.body,
  });
  return res.data;
};
