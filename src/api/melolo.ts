// src/api/melolo.ts
import { api } from "./client";

export interface BookItem {
  book_id: string;
  book_name: string;
  author: string;
  abstract: string;
  thumb_url: string;
  stat_infos?: string[];
}

export async function searchBooks(query: string) {
  const resp = await api.get("/search", {
    params: { query: query },
  });

  // Sesuaikan dengan shape JSON backend-mu
  // Anggap backend cukup forward field "search_data"
  const searchData = resp.data?.data?.search_data ?? [];

  const books: BookItem[] = [];

  for (const cell of searchData) {
    const cellBooks = cell.books ?? [];
    for (const b of cellBooks) {
      books.push({
        book_id: b.book_id,
        book_name: b.book_name,
        author: b.author,
        abstract: b.abstract,
        thumb_url: b.thumb_url,
        stat_infos: b.stat_infos,
      });
    }
  }

  return books;
}
