// src/types/common/apiResponse.ts
export interface ApiResponse<T=void> {
  success: boolean;
  code: string;
  message: string;
  path: string;
  data: T;
}
