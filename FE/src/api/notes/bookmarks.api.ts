// src/api/notes/bookmarks.api.ts
import { api } from '../axios';
import type { GetBookmarksResponse } from '../../types/bookmark/getBookmarks';

export const getBookmarksApi =
  async (): Promise<GetBookmarksResponse> => {
    const res = await api.get<GetBookmarksResponse>(
      '/v1/notes/bookmarks'
    );
    return res.data;
  };
