// src/services/book.service.ts
import { apiRequest } from "../api/client";
import type {
  Book,
  MeloloBookMallResponse,
  MeloloSearchResponse,
} from "../types/book";

const MELOLO_BASE = "https://melolo-api-one.vercel.app"; // masih dipakai untuk proxy-img

// mapping helper: API → Book (model frontend)
function mapMeloloSearchItemToBook(item: any): Book {
  return {
    book_id: item.book_id,
    book_name: item.title,
    author: item.author,
    abstract: item.abstract,
    thumb_url: `${MELOLO_BASE}/proxy-img?url=${encodeURIComponent(item.cover)}`,
    stat_infos: item.status ? [item.status] : [],
    show_creation_status: item.status,
    word_number: item.read_count,
    age_gate: item.age_gate,
    color_dominate: undefined,
  };
}

function mapMeloloMallBookToBook(b: any): Book {
  return {
    ...b,
    thumb_url: `${MELOLO_BASE}/proxy-img?url=${encodeURIComponent(
      b.thumb_url
    )}`,
  };
}

export class BookService {
  // home bookmall (tanpa search)
  static async getHomeBooks(): Promise<Book[]> {
    const data = await apiRequest<MeloloBookMallResponse>(
      "melolo",
      "/bookmall"
    );
    const fromApi: any[] = data.cell?.books ?? [];
    return fromApi.map(mapMeloloMallBookToBook);
  }

  // search by query
  static async searchBooks(q: string): Promise<{
    books: Book[];
    total: number;
    query: string;
  }> {
    const data = await apiRequest<MeloloSearchResponse>("melolo", "/search", {
      query: { query: q },
    });

    const items = data.items ?? [];
    const books = items.map(mapMeloloSearchItemToBook);
    const total = data.total ?? items.length ?? 0;

    return {
      books,
      total,
      query: q,
    };
  }
}
