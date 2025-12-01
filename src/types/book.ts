// src/types/book.ts
export interface Book {
  book_id: string;
  book_name: string;
  author: string;
  abstract: string;
  thumb_url: string;
  stat_infos?: string[];
  show_creation_status?: string;
  word_number?: string;
  age_gate?: string;
  color_dominate?: string;
}

export interface MeloloBookMallResponse {
  cell?: {
    books?: any[];
    english_name?: string;
    name?: string;
  };
}

export interface MeloloSearchItem {
  book_id: string;
  title: string;
  author: string;
  abstract: string;
  cover: string;
  status?: string;
  read_count?: string;
  age_gate?: string;
}

export interface MeloloSearchResponse {
  query?: string;
  total?: number;
  items?: MeloloSearchItem[];
}
