<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { SeriesService, type SeriesMeta } from "../services/series.service";
import { VideoService } from "../services/video.service";

const route = useRoute();
const router = useRouter();

// ========== State ==========

const loadingVideo = ref(true);
const videoError = ref<string | null>(null);
const videoUrl = ref<string | null>(null);
const posterUrl = ref<string | null>(null);
const videoDuration = ref<number | null>(null);

const seriesMeta = ref<SeriesMeta | null>(null);
const vidList = ref<string[]>([]);

const isFullscreen = ref(false);

// ========== Route derived state ==========

const videoId = computed(() => route.params.id as string);
const seriesId = computed(() => route.query.series_id as string | undefined);

// index video saat ini di vid_list
const currentIndex = computed(() => {
  if (!vidList.value.length || !videoId.value) return -1;
  return vidList.value.indexOf(videoId.value);
});

const hasNext = computed(
  () => currentIndex.value >= 0 && currentIndex.value < vidList.value.length - 1
);

const nextVid = computed(() =>
  hasNext.value ? vidList.value[currentIndex.value + 1] : null
);

const nextLabel = computed(() => {
  if (!seriesMeta.value || !hasNext.value) return null;
  return `Next episode (${currentIndex.value + 2}/${
    seriesMeta.value.episode_count
  })`;
});

// ========== Helpers ==========

function normalizeVideoUrl(url: string): string {
  if (url.startsWith("http://")) {
    return url.replace(/^http:\/\//, "https://");
  }
  return url;
}

function formatDuration(sec: number) {
  if (!sec || sec <= 0) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")} menit`;
}

// ========== Navigation ==========

function goBack() {
  router.back();
}

function goNext() {
  if (!nextVid.value) return;

  router.replace({
    name: "video",
    params: { id: nextVid.value },
    query: {
      series_id: seriesId.value || "",
    },
  });
}

function handleEnded() {
  if (hasNext.value) {
    goNext();
  }
}

// ========== Fullscreen (fake overlay) ==========

function enterFullscreen() {
  isFullscreen.value = true;
}

function exitFullscreen() {
  isFullscreen.value = false;
}

// ========== API calls via services ==========

async function fetchVideo() {
  if (!videoId.value) return;

  loadingVideo.value = true;
  videoError.value = null;
  videoUrl.value = null;
  posterUrl.value = null;
  videoDuration.value = null;

  try {
    const data = await VideoService.getVideo(videoId.value);
    const rawData = data.raw?.data;

    if (!rawData) {
      throw new Error("Data video tidak ditemukan dalam respons.");
    }

    // main_url => fallback ke backup_url
    const rawUrl = rawData.main_url || rawData.backup_url;
    if (!rawUrl) {
      throw new Error("URL video tidak ditemukan dalam respons.");
    }

    // normalisasi ke HTTPS, menghindari mixed-content
    videoUrl.value = normalizeVideoUrl(rawUrl);

    // coba ambil poster & duration dari video_model kalau ada
    if (rawData.video_model) {
      try {
        const model = JSON.parse(rawData.video_model);

        if (model.poster_url) {
          posterUrl.value = model.poster_url;
        } else if (rawData.poster_url) {
          posterUrl.value = rawData.poster_url;
        }

        if (typeof model.video_duration === "number") {
          videoDuration.value = model.video_duration;
        } else if (data.summary.duration != null) {
          videoDuration.value = data.summary.duration;
        }
      } catch {
        if (rawData.poster_url) {
          posterUrl.value = rawData.poster_url;
        }
      }
    } else if (rawData.poster_url) {
      posterUrl.value = rawData.poster_url;
    }

    if (data.summary.duration != null && !videoDuration.value) {
      videoDuration.value = data.summary.duration;
    }
  } catch (err: any) {
    console.error(err);
    videoError.value =
      err?.message ?? "Gagal memuat video. Cek backend / koneksi.";
  } finally {
    loadingVideo.value = false;
  }
}

async function fetchSeriesVidList() {
  if (!seriesId.value) return;

  try {
    const data = await SeriesService.getSeries(seriesId.value);
    seriesMeta.value = data.series;
    vidList.value = data.vid_list || [];
  } catch (e) {
    console.error("Gagal fetch series vid_list", e);
  }
}

// ========== Lifecycle & watchers ==========

onMounted(() => {
  fetchVideo();
  if (seriesId.value) {
    fetchSeriesVidList();
  }
});

watch(
  () => videoId.value,
  () => {
    fetchVideo();
  }
);

watch(
  () => seriesId.value,
  (val) => {
    if (val) fetchSeriesVidList();
  }
);
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
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

        <div class="flex-1 min-w-0">
          <p class="text-[11px] text-slate-400 uppercase tracking-[0.15em]">
            Player
          </p>
          <div class="flex items-center gap-2">
            <h1 class="text-sm font-semibold truncate">
              {{ seriesMeta?.title || "DramaKita" }}
            </h1>
            <span
              v-if="currentIndex >= 0"
              class="rounded-full bg-slate-900/80 border border-slate-700/80 px-2 py-0.5 text-[10px] text-slate-400"
            >
              Ep {{ currentIndex + 1 }}
            </span>
          </div>
        </div>

        <div v-if="hasNext" class="hidden sm:flex items-center gap-1.5">
          <span class="text-[10px] text-slate-500">Auto next</span>
          <span
            class="inline-flex h-4 w-7 items-center justify-start rounded-full bg-slate-900 border border-slate-700 p-0.5"
          >
            <span
              class="h-3 w-3 rounded-full bg-emerald-400 translate-x-3 transition-transform"
            />
          </span>
        </div>
      </div>
    </header>

    <!-- Body -->
    <main class="flex-1 mx-auto max-w-4xl w-full px-4 pb-6 pt-4 flex flex-col">
      <!-- Loading -->
      <div v-if="loadingVideo" class="flex-1 flex items-center justify-center">
        <div
          class="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-4 animate-pulse"
        >
          <div class="aspect-[9/16] w-full rounded-2xl bg-slate-800"></div>
          <div class="mt-4 space-y-2">
            <div class="h-3 w-1/3 rounded-full bg-slate-800"></div>
            <div class="h-3 w-1/2 rounded-full bg-slate-800"></div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div
        v-else-if="videoError"
        class="flex-1 flex items-center justify-center"
      >
        <div
          class="w-full max-w-md rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100"
        >
          <p class="font-medium">Gagal memuat video</p>
          <p class="mt-1 opacity-80">
            {{ videoError }}
          </p>
          <button
            @click="fetchVideo"
            class="mt-2 inline-flex items-center gap-1 rounded-full border border-red-400/60 px-3 py-1 text-xs hover:bg-red-500/20"
          >
            Coba lagi
          </button>
        </div>
      </div>

      <!-- Player -->
      <div v-else class="flex-1 flex flex-col gap-3">
        <!-- Normal / fake fullscreen -->
        <div
          :class="[
            isFullscreen
              ? 'fixed inset-0 z-50 bg-black flex items-center justify-center'
              : 'w-full flex justify-center',
          ]"
        >
          <div
            :class="[
              'relative',
              isFullscreen
                ? 'w-full h-full max-w-none'
                : 'w-full max-w-[420px]',
            ]"
          >
            <video
              v-if="videoUrl"
              :key="videoId"
              class="w-full h-full max-h-[80vh] rounded-2xl bg-black object-contain"
              :class="isFullscreen ? 'max-h-none' : ''"
              :src="videoUrl"
              :poster="posterUrl || undefined"
              controls
              playsinline
              autoplay
              @ended="handleEnded"
            />

            <!-- Fullscreen enter -->
            <button
              v-if="!isFullscreen"
              type="button"
              @click="enterFullscreen"
              class="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white border border-white/30 backdrop-blur-sm transition hover:bg-black/80"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4 9V5a1 1 0 0 1 1-1h4m10 4V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4m10-4v4a1 1 0 0 1-1 1h-4"
                />
              </svg>
            </button>

            <!-- Fullscreen exit -->
            <button
              v-if="isFullscreen"
              type="button"
              @click="exitFullscreen"
              class="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white border border-white/40"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Info & next (hidden saat fullscreen) -->
        <div v-if="!isFullscreen" class="mt-2 flex flex-col gap-2">
          <div class="flex items-center justify-between text-xs">
            <div class="text-slate-400">
              <span v-if="videoDuration">
                ~{{ Math.round(videoDuration) }} detik
              </span>
              <span v-else>Video pendek</span>
            </div>

            <button
              v-if="hasNext"
              type="button"
              @click="goNext"
              class="inline-flex items-center gap-1 rounded-full bg-slate-900/80 border border-slate-700/80 px-3 py-1 text-[11px] text-slate-100 hover:border-pink-500/70 hover:text-pink-100 transition"
            >
              <span>{{ nextLabel || "Next episode" }}</span>
              <svg
                class="h-3 w-3"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M5 12h14M13 6l6 6-6 6"
                />
              </svg>
            </button>
          </div>

          <p
            v-if="seriesMeta?.intro"
            class="text-[11px] text-slate-400 line-clamp-3"
          >
            {{ seriesMeta.intro }}
          </p>
        </div>

        <!-- Progress (hidden saat fullscreen) -->
        <div
          v-if="!isFullscreen && seriesMeta && vidList.length"
          class="mt-2 flex items-center justify-between text-[10px] text-slate-500"
        >
          <span>
            Episode {{ currentIndex + 1 }} dari
            {{ seriesMeta.episode_count }}
          </span>
        </div>
      </div>
    </main>
  </div>
</template>
