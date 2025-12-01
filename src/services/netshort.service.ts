// src/services/netshort.service.ts
import type { ShortPlayGroup } from "../types/netshort";

const API_BASE = "https://netshort-api-alpha.vercel.app";

export const NetshortService = {
  async getHome(params?: {
    tabId?: string;
    offset?: number;
    limit?: number;
  }): Promise<ShortPlayGroup[]> {
    const query = new URLSearchParams({
      tabId: params?.tabId || "1894773235170693121",
      offset: String(params?.offset ?? 0),
      limit: String(params?.limit ?? 20),
    });

    const res = await fetch(`${API_BASE}/api/get-home?${query.toString()}`);
    if (!res.ok) {
      throw new Error("Gagal memuat Netshort home");
    }
    const json = await res.json();

    // json.data.data adalah array group
    return json.data?.data || [];
  },
};
