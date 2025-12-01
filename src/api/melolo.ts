// src/api/melolo.ts
import { apiRequest } from "./client";

// ---- Types dari melolo (boleh kamu lanjut rapihin di sini) ----

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

export interface BookMallResponse {
  cell?: {
    books?: Book[];
    english_name?: string;
    name?: string;
  };
}

export interface SearchItem {
  book_id: string;
  title: string;
  author: string;
  abstract: string;
  cover: string;
  status?: string;
  read_count?: string;
  age_gate?: string;
}

export interface SearchResponse {
  query: string;
  total?: number;
  items?: SearchItem[];
}

export interface SeriesMeta {
  series_id: number;
  title: string;
  intro: string;
  episode_count: number;
  episode_text: string;
  play_count: number;
  cover: string;
  status: number;
}

export interface Episode {
  index: number;
  vid: string;
  duration: number;
  likes: number;
  cover: string;
  vertical: boolean;
  disclaimer: string | null;
}

export interface SeriesApiResponse {
  series: SeriesMeta;
  episodes: Episode[];
  vid_list: string[];
}

export interface VideoApiResponse {
  summary: {
    duration: number | null;
    video_id: string;
  };
  raw: {
    data: {
      main_url: string;
      backup_url?: string;
      video_height: number;
      video_width: number;
      video_model?: string;
      poster_url?: string;
    };
  };
}

export interface VipPurchase {
  id: string;
  package_name: string;
  started_at: string;
  expired_at: string | null;
  price_label: string;
  status: "active" | "expired" | "pending";
}

export interface AccountStatus {
  telegram_id: number;
  status: "free" | "vip";
  vip_label: string | null;
  vip_expired_at: string | null;
  purchases: VipPurchase[];
}

// ---- Fungsi API ----

export function fetchBookMallApi() {
  return apiRequest<BookMallResponse>("melolo", "/bookmall");
}

export function searchBooksApi(query: string) {
  return apiRequest<SearchResponse>("melolo", "/search", {
    query: { query },
  });
}

export function fetchSeriesApi(seriesId: string) {
  return apiRequest<SeriesApiResponse>("melolo", "/series", {
    query: { series_id: seriesId },
  });
}

export function fetchVideoApi(videoId: string) {
  return apiRequest<VideoApiResponse>("melolo", "/video", {
    query: { video_id: videoId },
  });
}

export function fetchAccountStatusApi(telegramId: number) {
  return apiRequest<AccountStatus>("melolo", "/account/status", {
    query: { telegram_id: telegramId },
  });
}
