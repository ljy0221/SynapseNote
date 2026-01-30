// src/api/bookmarks/Bookmarks.api.ts
import { request } from '../request';
import type {
  AddBookmarkResponse,
  RemoveBookmarkResponse,
  GetBookmarksResponse,
} from '../../types/bookmark/BookmarkResponse';

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
