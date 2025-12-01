// src/services/video.service.ts
import { fetchVideoApi, type VideoApiResponse } from "../api/melolo";

export class VideoService {
  static async getVideo(videoId: string): Promise<VideoApiResponse> {
    return fetchVideoApi(videoId);
  }
}

export type { VideoApiResponse };
