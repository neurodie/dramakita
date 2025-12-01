<!-- src/views/ShortVideoPlayerView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const API_BASE =
  import.meta.env.VITE_API_BASE_NETSHORT ??
  "https://netshort-api-alpha.vercel.app";

// =======================
//  Types
// =======================

interface SubtitleItem {
  url: string;
  format: string;
  sub_id: string;
  language_id: number;
  subtitleLanguage: string; // "id_ID"
  expireTime: number;
}

interface EpisodeListItem {
  episodeId: string;
  episodeNo: number;
  episodeType: number;
  playVoucher: string | null;
  playClarity: string | null;
  sdkVid: string | null;
  subtitleList: SubtitleItem[] | null;
}

interface UnlockResult {
  code: number;
  msg: string;
  data: boolean;
}

interface Done2 {
  data: {
    episodeList: EpisodeListItem[];
    isMember: number;
  };
  possibleVideo: string | null;
}

interface EpisodePlayResponse {
  ok: boolean;
  shortPlayId: string;
  episodeNo: number;
  episodeId: string;
  playClarity: string | null;
  configId: string;
  videoUrl: string | null;
  unlockResult: UnlockResult;
  done2: Done2;
}

// dari endpoint /api/getepisode/:shortPlayId
interface EpisodeSummary {
  episodeNo: number;
  episodeId: string;
  isLock: boolean;
  hasPlayVoucher: boolean;
}

// =======================
//  State
// =======================

const data = ref<EpisodePlayResponse | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const isFullscreen = ref(false);

// list semua episode untuk auto next
const episodeList = ref<EpisodeSummary[]>([]);

const shortPlayId = computed(() => route.params.id as string);
const episodeId = computed(() => route.params.episodeId as string);
const episodeNoParam = computed(() => {
  return Number(route.query.episodeNo ?? "1");
});

// ambil episode pertama di done2.data.episodeList (harusnya cuma 1)
const apiEpisode = computed<EpisodeListItem | null>(() => {
  const list = data.value?.done2?.data?.episodeList;
  if (!list || !list.length) return null;
  return list[0];
});

// video url final (prioritas: videoUrl → done2.possibleVideo → playVoucher)
const videoUrl = computed<string | null>(() => {
  if (data.value?.videoUrl) return data.value.videoUrl;
  if (data.value?.done2?.possibleVideo) return data.value.done2.possibleVideo;
  if (apiEpisode.value?.playVoucher) return apiEpisode.value.playVoucher;
  return null;
});

// subtitle utama (kalau ada)
const mainSubtitle = computed<SubtitleItem | null>(() => {
  const subs = apiEpisode.value?.subtitleList;
  if (!subs || !subs.length) return null;
  return subs[0];
});

const subtitleLangCode = computed(() => {
  const lang = mainSubtitle.value?.subtitleLanguage || "id_ID";
  return lang.toLowerCase().replace("_", "-"); // id_ID -> id-id
});

const subtitleLabel = computed(
  () => mainSubtitle.value?.subtitleLanguage || "Bahasa Indonesia"
);

// info kecil
const clarity = computed(
  () => data.value?.playClarity || apiEpisode.value?.playClarity || "540p"
);
const unlockInfo = computed(() => data.value?.unlockResult);

// =======================
//  AUTO NEXT ala Melolo
// =======================

// index episode sekarang, kita pakai episodeNo dari data (lebih aman)
const currentIndex = computed(() => {
  if (!episodeList.value.length || !data.value) return -1;
  return episodeList.value.findIndex(
    (ep) => ep.episodeNo === data.value!.episodeNo
  );
});

// ada next?
const hasNext = computed(
  () =>
    currentIndex.value >= 0 && currentIndex.value < episodeList.value.length - 1
);

// episode berikutnya
const nextEpisode = computed(() =>
  hasNext.value ? episodeList.value[currentIndex.value + 1] : null
);

// label kecil (optional, kalau mau dipakai di UI)
const nextLabel = computed(() => {
  if (!data.value || !hasNext.value) return null;
  return `Next episode (${data.value.episodeNo + 1}/${
    episodeList.value.length
  })`;
});

// =======================
//  Fetch
// =======================

async function fetchEpisodeVideo() {
  if (!shortPlayId.value || !episodeId.value) return;

  loading.value = true;
  error.value = null;

  try {
    const url = `${API_BASE}/api/getepisode/${shortPlayId.value}/${episodeId.value}?episodeNo=${episodeNoParam.value}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = (await res.json()) as EpisodePlayResponse;
    if (!json.ok) {
      throw new Error("API mengembalikan ok=false");
    }
    data.value = json;
  } catch (err: any) {
    console.error(err);
    error.value =
      err?.message || "Gagal memuat video episode. Cek backend/koneksi.";
  } finally {
    loading.value = false;
  }
}

async function fetchEpisodeList() {
  if (!shortPlayId.value) return;

  try {
    const url = `${API_BASE}/api/getepisode/${shortPlayId.value}`;
    const res = await fetch(url);
    if (!res.ok) return;

    const json = await res.json();
    const episodes = (json.episodes || []) as EpisodeSummary[];

    // sort berdasarkan episodeNo biar rapi (dan konsisten)
    episodeList.value = [...episodes].sort((a, b) => a.episodeNo - b.episodeNo);
  } catch (e) {
    console.error("Gagal fetch episode list untuk auto next", e);
  }
}

// =======================
//  Actions
// =======================

function goBack() {
  router.back();
}

function enterFullscreen() {
  isFullscreen.value = true;
}

function exitFullscreen() {
  isFullscreen.value = false;
}

// PERSIS kayak Melolo: handleEnded cuma manggil goNext
function goNext() {
  if (!nextEpisode.value) return;

  router.replace({
    name: "shortplay-episode",
    params: {
      id: shortPlayId.value,
      episodeId: nextEpisode.value.episodeId,
    },
    query: {
      episodeNo: nextEpisode.value.episodeNo,
    },
  });
}

function handleEnded() {
  if (hasNext.value) {
    goNext();
  }
}

// =======================
//  Lifecycle
// =======================

onMounted(() => {
  fetchEpisodeVideo();
  fetchEpisodeList();
});

watch(
  () => [shortPlayId.value, episodeId.value, episodeNoParam.value],
  () => {
    fetchEpisodeVideo();
  }
);
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
    <!-- Top bar ala Melolo -->
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
              {{
                data?.shortPlayId
                  ? `ShortPlay ${data.shortPlayId.slice(-6)}`
                  : "Netshort"
              }}
            </h1>
            <span
              v-if="data"
              class="rounded-full bg-slate-900/80 border border-slate-700/80 px-2 py-0.5 text-[10px] text-slate-400"
            >
              Ep {{ data.episodeNo }} · {{ clarity }}
            </span>
          </div>
        </div>

        <!-- Indicator kecil unlocked + auto-next ON (visual doang) -->
        <div class="hidden sm:flex items-center gap-3">
          <div
            v-if="unlockInfo?.code === 200 && unlockInfo?.data"
            class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 px-2 py-0.5 text-[10px] text-emerald-300"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Unlocked
          </div>

          <div v-if="episodeList.length" class="flex items-center gap-1.5">
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
      </div>
    </header>

    <!-- Body -->
    <main class="flex-1 mx-auto max-w-4xl w-full px-4 pb-6 pt-4 flex flex-col">
      <!-- Loading (Melolo style) -->
      <div v-if="loading" class="flex-1 flex items-center justify-center">
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
      <div v-else-if="error" class="flex-1 flex items-center justify-center">
        <div
          class="w-full max-w-md rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100"
        >
          <p class="font-medium">Gagal memuat video</p>
          <p class="mt-1 opacity-80">
            {{ error }}
          </p>
          <button
            @click="fetchEpisodeVideo"
            class="mt-2 inline-flex items-center gap-1 rounded-full border border-red-400/60 px-3 py-1 text-xs hover:bg-red-500/20"
          >
            Coba lagi
          </button>
        </div>
      </div>

      <!-- Player -->
      <div v-else-if="data && videoUrl" class="flex-1 flex flex-col gap-3">
        <!-- Normal / fake fullscreen ala Melolo -->
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
              :key="`${data.episodeId}-${data.episodeNo}`"
              class="w-full h-full max-h-[80vh] rounded-2xl bg-black object-contain"
              :class="isFullscreen ? 'max-h-none' : ''"
              :src="videoUrl"
              controls
              playsinline
              autoplay
              @ended="handleEnded"
            >
              <track
                v-if="mainSubtitle"
                kind="subtitles"
                :src="mainSubtitle.url"
                :srclang="subtitleLangCode"
                :label="subtitleLabel"
                default
              />
            </video>

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

            <!-- Badge clarity & ep -->
            <div
              class="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-slate-100 border border-slate-700/70"
            >
              <span
                class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
              />
              <span>Ep {{ data.episodeNo }} • {{ clarity }}</span>
            </div>
          </div>
        </div>

        <!-- Info & progress (disembunyikan saat fullscreen) -->
        <div v-if="!isFullscreen" class="mt-2 flex flex-col gap-2">
          <div class="flex items-center justify-between text-xs text-slate-400">
            <div>
              ShortPlay:
              <span class="font-semibold text-slate-100">
                {{ data.shortPlayId }}
              </span>
            </div>

            <button
              v-if="hasNext && nextLabel"
              type="button"
              @click="goNext"
              class="inline-flex items-center gap-1 rounded-full bg-slate-900/80 border border-slate-700/80 px-3 py-1 text-[11px] text-slate-100 hover:border-pink-500/70 hover:text-pink-100 transition"
            >
              <span>{{ nextLabel }}</span>
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

          <div
            v-if="mainSubtitle"
            class="flex items-center gap-2 text-[11px] text-slate-400"
          >
            <svg
              class="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4.5 5.25h15v13.5h-15zM8 9.75h2.25M8 14.25h2.25M13.75 9.75h2.25M13.75 14.25h2.25"
              />
            </svg>
            Subtitle:
            <span class="font-medium text-slate-200">
              {{ subtitleLabel }}
            </span>
          </div>

          <p class="text-[11px] text-slate-500 leading-relaxed">
            Kalau video tidak jalan atau expired, logika backend bisa diatur
            ulang untuk refresh
            <span class="text-pink-300">playVoucher</span> /
            <span class="text-pink-300">videoUrl</span> dari API Netshort asli.
          </p>

          <div
            v-if="episodeList.length && currentIndex >= 0"
            class="mt-1 flex items-center justify-between text-[10px] text-slate-500"
          >
            <span>
              Episode {{ currentIndex + 1 }} dari {{ episodeList.length }}
            </span>
          </div>
        </div>
      </div>

      <!-- Fallback kalau tidak ada videoUrl -->
      <div v-else class="flex-1 flex items-center justify-center mt-6">
        <div
          class="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 max-w-md w-full"
        >
          <p class="font-medium">Video URL kosong</p>
          <p class="mt-0.5 text-[13px] opacity-90">
            Respon API tidak mengembalikan <code>videoUrl</code> /
            <code>possibleVideo</code>. Cek lagi log proxy / backend saat unlock
            episode.
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(30, 64, 175, 0.4);
  border-radius: 999px;
}
</style>
