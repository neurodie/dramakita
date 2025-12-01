// src/services/series.service.ts
import {
  fetchSeriesApi,
  type SeriesApiResponse,
  type SeriesMeta,
  type Episode,
} from "../api/melolo";

export class SeriesService {
  static async getSeries(seriesId: string): Promise<SeriesApiResponse> {
    // kalau nanti butuh logging / transform / caching, taruh di sini
    return fetchSeriesApi(seriesId);
  }

  // contoh helper kalau mau nanti:
  static mapPlayCount(playCount: number): string {
    return playCount.toLocaleString("id-ID");
  }
}

export type { SeriesMeta, Episode, SeriesApiResponse };
