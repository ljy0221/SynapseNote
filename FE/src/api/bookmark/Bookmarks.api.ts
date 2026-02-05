// src/api/bookmarks/Bookmarks.api.ts
import { request } from '../request';
import type {
  AddBookmarkResponse,
  RemoveBookmarkResponse,
  GetBookmarksResponse,
} from '../../types/bookmark/BookmarkResponse';
import type { GetBookmarkBlocksResponse } from '../../types/bookmark/BookmarkBlockResponse';

/** 즐겨찾기 추가 */
export const addBookmarkApi = (noteId: string) => {
  return request<AddBookmarkResponse>(
    'post',
    `/v1/notes/${noteId}/bookmarks`
  );
};

/** 즐겨찾기 제거 */
export const removeBookmarkApi = (noteId: string) => {
  return request<RemoveBookmarkResponse>(
    'delete',
    `/v1/notes/${noteId}/bookmarks`
  );
};

/** 즐겨찾기 목록 조회 */
export const getBookmarksApi = () => {
  return request<GetBookmarksResponse>(
    'get',
    '/v1/notes/bookmarks'
  );
};


/** 블록 즐겨찾기 목록 조회 */
export const getBlockBookmarksApi = (params?: {
  page?: number;
  size?: number;
}) => {
  return request<GetBookmarkBlocksResponse>(
    'get',
    '/v1/notes/blocks/bookmarks',
    {
      params,
    }
  );
};

/** 블록 즐겨찾기 추가 */
export const addBlockBookmarkApi = (noteId: string, blockId: string) => {
  return request<void>(
    'post',
    `/v1/notes/${noteId}/blocks/${blockId}/bookmarks`
  );
};

/** 블록 즐겨찾기 제거 */
export const removeBlockBookmarkApi = (noteId: string, blockId: string) => {
  return request<void>(
    'delete',
    `/v1/notes/${noteId}/blocks/${blockId}/bookmarks`
  );
};
