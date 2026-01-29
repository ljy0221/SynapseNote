// src/api/notes/Bookmarks.adapter.ts
import type { ApiResponse } from '../../types/common/apiResponse';
import type { GetBookmarksResponse } from '../../types/bookmark/Bookmark';

export const adaptBookmarkIds = (
  res: ApiResponse<GetBookmarksResponse>
): Set<string> => {
  return new Set(
    res.data.content.map(note => note.id)
  );
};
