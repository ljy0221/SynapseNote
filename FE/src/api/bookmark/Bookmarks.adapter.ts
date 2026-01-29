// src/api/bookmark/Bookmarks.adapter.ts
import type { ApiResponse } from '../../types/common/apiResponse';
import { GetBookmarksResponse } from '../../types/bookmark/BookmarkResponse';

export const adaptBookmarkIds = (
  res: ApiResponse<GetBookmarksResponse>
): Set<string> => {
  return new Set(
    res.data.content.map(note => note.id)
  );
};
