// src/lib/bookmarks.ts
export interface Bookmark {
  series_id: number | string;
  title: string;
  intro: string;
  cover: string;
  episode_count: number;
  episode_text: string;
  play_count: number;
  added_at: string; // ISO string
}

const STORAGE_KEY = "dramakita_bookmarks_v1";

function safeParse(json: string | null): Bookmark[] {
  if (!json) return [];
  try {
    const data = JSON.parse(json);
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

export function getBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return safeParse(raw);
}

export function saveBookmarks(list: Bookmark[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addOrUpdateBookmark(b: Bookmark): void {
  const list = getBookmarks();
  const idx = list.findIndex(
    (x) => String(x.series_id) === String(b.series_id)
  );

  if (idx >= 0) {
    list[idx] = { ...list[idx], ...b };
  } else {
    list.unshift(b); // baru masuk di atas
  }

  saveBookmarks(list);
}

export function removeBookmark(series_id: number | string): void {
  const list = getBookmarks().filter(
    (b) => String(b.series_id) !== String(series_id)
  );
  saveBookmarks(list);
}

export function isSeriesBookmarked(series_id: number | string): boolean {
  return getBookmarks().some((b) => String(b.series_id) === String(series_id));
}

export function clearBookmarks(): void {
  saveBookmarks([]);
}
