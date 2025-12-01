<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  addOrUpdateBookmark,
  removeBookmark,
  isSeriesBookmarked,
} from "../lib/bookmarks";
import {
  SeriesService,
  type SeriesMeta,
  type Episode,
} from "../services/series.service";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref<string | null>(null);

const seriesMeta = ref<SeriesMeta | null>(null);
const episodes = ref<Episode[]>([]);
const vidList = ref<string[]>([]);

// state bookmark
const isBookmarked = ref(false);

const seriesId = computed(() => route.params.id as string);

// 🔹 helper cover URL
const MELOLO_BASE = "https://melolo-api-one.vercel.app";

function buildProxyImageUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  return `${MELOLO_BASE}/proxy-img?url=${encodeURIComponent(rawUrl)}`;
}

function getSeriesCoverUrl(series: SeriesMeta): string {
  return buildProxyImageUrl(series.cover);
}

function getEpisodeCoverUrl(ep: Episode): string {
  return buildProxyImageUrl(ep.cover);
}

function goBack() {
  router.back();
}

function formatDuration(sec: number) {
  if (!sec || sec <= 0) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")} menit`;
}

function formatLikes(num: number) {
  if (!num) return "0";
  if (num >= 1_000_000)
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + " jt";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + " rb";
  return num.toString();
}

function syncBookmarkState() {
  if (!seriesMeta.value) return;
  isBookmarked.value = isSeriesBookmarked(seriesMeta.value.series_id);
}

async function fetchSeries() {
  if (!seriesId.value) return;

  loading.value = true;
  error.value = null;

  try {
    const data = await SeriesService.getSeries(seriesId.value);

    seriesMeta.value = data.series;
    episodes.value = data.episodes || [];
    vidList.value = data.vid_list || [];

    syncBookmarkState();
  } catch (err: any) {
    console.error(err);
    error.value =
      err?.message ?? "Gagal memuat detail series. Cek backend / koneksi.";
  } finally {
    loading.value = false;
  }
}

function openEpisode(ep: Episode) {
  router.push({
    name: "video",
    params: { id: ep.vid },
    query: { series_id: seriesId.value || "" },
  });
}

function toggleBookmark() {
  if (!seriesMeta.value) return;

  if (isBookmarked.value) {
    removeBookmark(seriesMeta.value.series_id);
    isBookmarked.value = false;
  } else {
    addOrUpdateBookmark({
      series_id: seriesId.value,
      title: seriesMeta.value.title,
      intro: seriesMeta.value.intro,
      cover: seriesMeta.value.cover,
      episode_count: seriesMeta.value.episode_count,
      episode_text: seriesMeta.value.episode_text,
      play_count: seriesMeta.value.play_count,
      added_at: new Date().toISOString(),
    });
    isBookmarked.value = true;
  }
}

onMounted(() => {
  fetchSeries();
});
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50">
    <!-- Top bar -->
    <header
      class="border-b border-slate-800 bg-slate-950/70 backdrop-blur-lg sticky top-0 z-20"
    >
      <div class="mx-auto max-w-4xl px-4 py-3 flex items-center gap-3">
        <button
          @click="goBack"
          class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800/80 transition"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <div>
          <p class="text-[11px] text-slate-400 uppercase tracking-[0.15em]">
            Detail Series
          </p>
          <h1 class="text-base font-semibold">
            {{ seriesMeta?.title || "Loading..." }}
          </h1>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-4 py-5">
      <!-- Loading -->
      <div v-if="loading" class="space-y-4">
        <div
          class="animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70 p-4"
        >
          <div class="flex gap-4">
            <div class="h-40 w-28 rounded-2xl bg-slate-800/90"></div>
            <div class="flex-1 space-y-3">
              <div class="h-4 w-2/3 rounded-full bg-slate-800/90"></div>
              <div class="h-3 w-1/3 rounded-full bg-slate-800/90"></div>
              <div class="h-3 w-full rounded-full bg-slate-800/90"></div>
              <div class="h-3 w-5/6 rounded-full bg-slate-800/90"></div>
              <div class="h-3 w-4/6 rounded-full bg-slate-800/90"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100"
      >
        <p class="font-medium">Gagal memuat detail</p>
        <p class="mt-1 opacity-80">
          {{ error }}
        </p>
        <button
          @click="fetchSeries"
          class="mt-2 inline-flex items-center gap-1 rounded-full border border-red-400/60 px-3 py-1 text-xs hover:bg-red-500/20"
        >
          Coba lagi
        </button>
      </div>

      <!-- Content -->
      <div v-else-if="seriesMeta" class="space-y-5">
        <!-- Card utama -->
        <section
          class="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 flex flex-col gap-4 sm:flex-row"
        >
          <div class="shrink-0">
            <div
              class="h-40 w-28 overflow-hidden rounded-2xl bg-slate-800 sm:h-48 sm:w-32"
            >
              <img
                :src="getSeriesCoverUrl(seriesMeta)"
                :alt="seriesMeta.title"
                class="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          <div class="flex-1 min-w-0 flex flex-col gap-2">
            <!-- Title + bookmark -->
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="text-xl font-semibold leading-snug">
                  {{ seriesMeta.title }}
                </h2>
                <p class="mt-1 text-xs text-slate-400">
                  {{ seriesMeta.episode_text }} •
                  <span class="text-slate-300">
                    {{ seriesMeta.play_count.toLocaleString("id-ID") }}
                    tayangan
                  </span>
                </p>
              </div>

              <button
                type="button"
                @click="toggleBookmark"
                class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition"
                :class="
                  isBookmarked
                    ? 'border-yellow-400/70 bg-yellow-400/10 text-yellow-100'
                    : 'border-slate-700 bg-slate-900/80 text-slate-200 hover:border-pink-500/70 hover:text-pink-100'
                "
              >
                <svg
                  class="h-3.5 w-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    v-if="isBookmarked"
                    d="M5 2.5A1.5 1.5 0 0 1 6.5 1h7A1.5 1.5 0 0 1 15 2.5V17l-5-3-5 3V2.5z"
                  />
                  <path
                    v-else
                    fill-rule="evenodd"
                    d="M6.5 2A.5.5 0 0 0 6 2.5V15.1l3.553-2.132a1 1 0 0 1 .894 0L14 15.1V2.5a.5.5 0 0 0-.5-.5h-7zM6.5 1A1.5 1.5 0 0 0 5 2.5V17l5-3 5 3V2.5A1.5 1.5 0 0 0 13.5 1h-7z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>{{ isBookmarked ? "Tersimpan" : "Bookmark" }}</span>
              </button>
            </div>

            <p
              v-if="seriesMeta.intro"
              class="mt-1 text-sm leading-relaxed text-slate-200"
            >
              {{ seriesMeta.intro }}
            </p>

            <div class="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span
                class="rounded-full border border-emerald-500/70 bg-emerald-500/10 px-2 py-0.5 text-emerald-200"
              >
                {{ seriesMeta.episode_count }} episode
              </span>
              <span
                v-if="seriesMeta.status === 1"
                class="rounded-full border border-pink-500/70 bg-pink-500/10 px-2 py-0.5 text-pink-200"
              >
                Status: Berjalan / On-going
              </span>
            </div>
          </div>
        </section>

        <!-- Daftar episode -->
        <section
          class="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5"
        >
          <div class="flex items-center justify-between gap-2">
            <div>
              <h3 class="text-sm font-semibold text-slate-100">
                Daftar episode
              </h3>
              <p class="mt-1 text-[11px] text-slate-500">
                Tap salah satu gambar untuk mulai nonton / pakai sebagai
                reference.
              </p>
            </div>
            <span class="text-[11px] text-slate-500">
              {{ episodes.length }} dari {{ seriesMeta.episode_count }} episode
            </span>
          </div>

          <div
            v-if="episodes.length"
            class="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1"
          >
            <button
              v-for="ep in episodes"
              :key="ep.vid"
              type="button"
              @click="openEpisode(ep)"
              class="group text-left rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-pink-500/70 hover:bg-slate-900 transition flex flex-col overflow-hidden"
            >
              <div class="relative">
                <div class="aspect-[9/16] w-full overflow-hidden bg-slate-800">
                  <img
                    :src="getEpisodeCoverUrl(ep)"
                    :alt="`Episode ${ep.index}`"
                    class="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                    loading="lazy"
                  />
                </div>
                <div
                  class="absolute bottom-1 left-1 right-1 flex items-center justify-between text-[10px]"
                >
                  <span
                    class="rounded-full bg-slate-950/80 px-2 py-0.5 text-slate-100 border border-slate-800/80"
                  >
                    Ep {{ ep.index }}
                  </span>
                  <span
                    class="rounded-full bg-slate-950/80 px-2 py-0.5 text-slate-100 border border-slate-800/80"
                  >
                    {{ formatDuration(ep.duration) }}
                  </span>
                </div>
              </div>

              <div class="px-2.5 py-2 space-y-1">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-slate-300 font-medium">
                    {{ formatLikes(ep.likes) }} suka
                  </span>
                  <span
                    v-if="ep.vertical"
                    class="rounded-full bg-slate-900/80 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-400"
                  >
                    Vertical
                  </span>
                </div>

                <p
                  v-if="ep.disclaimer"
                  class="text-[10px] text-amber-300/90 line-clamp-2"
                >
                  {{ ep.disclaimer }}
                </p>
              </div>
            </button>
          </div>

          <div
            v-else
            class="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-6 text-sm text-slate-300 text-center"
          >
            Belum ada data episode yang bisa ditampilkan.
          </div>
        </section>
      </div>

      <!-- Fallback kalau entah kenapa data kosong -->
      <div
        v-else
        class="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-6 text-sm text-slate-300 text-center"
      >
        Data series tidak ditemukan. Coba kembali, lalu klik judul lain.
      </div>
    </main>
  </div>
</template>
