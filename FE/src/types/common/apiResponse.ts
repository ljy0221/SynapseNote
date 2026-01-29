// src/types/common/apiResponse.ts
export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  path: string;
  data: T;
}
