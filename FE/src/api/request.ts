// src/api/request.ts
import { api } from './axios';
import type { ApiResponse } from '../types/common/apiResponse';

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export const request = async <T>(
  method: HttpMethod,
  url: string,
  options?: {
    params?: Record<string, unknown>;
    body?: unknown;
    signal?: AbortSignal;
  }
): Promise<T> => {
  const res = await api.request<ApiResponse<T>>({
    method,
    url,
    params: options?.params,
    data: options?.body,
    signal: options?.signal,
  });

  return res.data.data; // ⭐ 핵심
};