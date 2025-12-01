<!-- src/views/ShortPlayDetailView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

// kalau mau fleksibel, bisa di-set via .env
const API_BASE =
  import.meta.env.VITE_API_BASE_NETSHORT ??
  "https://netshort-api-alpha.vercel.app";

// =======================
//  Types
// =======================

interface EpisodeBasic {
  episodeNo: number;
  episodeId: string;
  isLock: boolean;
  hasPlayVoucher: boolean;
}

interface ShortPlayRawEpisodeInfo {
  episodeId: string;
  episodeNo: number;
  episodeCover?: string;
  likeNums?: string;
  chaseNums?: string;
  isLock?: boolean;
  episodeGoldCoinPrice?: number | null;
  playVoucher?: string | null;
  playClarity?: string | null;
}

interface ShortPlayRaw {
  shortPlayId: string;
  shortPlayLibraryId: string;
  shortPlayName: string;
  shortPlayCover: string;
  shortPlayLabels?: string[];
  isNewLabel?: boolean;
  shotIntroduce?: string;
  payPoint?: number;
  totalEpisode?: number;
  isFinish?: number;
  defaultLikeNums?: number;
  defaultChaseNums?: number;
  shortPlayEpisodeInfos?: ShortPlayRawEpisodeInfo[];
  [key: string]: any;
}

interface ShortPlayResponse {
  ok: boolean;
  shortPlayId: string;
  title: string;
  cover: string;
  episodeCount: number;
  episodes: EpisodeBasic[];
  raw: ShortPlayRaw;
}

// =======================
//  State
// =======================

const detail = ref<ShortPlayResponse | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const shortPlayId = computed(() => route.params.id as string);

// map episodeId -> meta (cover, likeNums, dll dari raw.shortPlayEpisodeInfos)
const episodeMetaMap = computed<Record<string, ShortPlayRawEpisodeInfo>>(() => {
  const map: Record<string, ShortPlayRawEpisodeInfo> = {};
  if (detail.value?.raw?.shortPlayEpisodeInfos) {
    for (const info of detail.value.raw.shortPlayEpisodeInfos) {
      map[info.episodeId] = info;
    }
  }
  return map;
});

// merge episode basic + meta
const mergedEpisodes = computed(() => {
  if (!detail.value) return [];
  return detail.value.episodes.map((ep) => {
    const meta = episodeMetaMap.value[ep.episodeId];
    return {
      ...ep,
      meta,
    };
  });
});

const unlockedEpisodes = computed(() =>
  mergedEpisodes.value.filter((e) => !e.isLock)
);
const lockedEpisodes = computed(() =>
  mergedEpisodes.value.filter((e) => e.isLock)
);

const labels = computed(() => detail.value?.raw?.shortPlayLabels ?? []);
const description = computed(() => detail.value?.raw?.shotIntroduce ?? "");
const isFinished = computed(() => detail.value?.raw?.isFinish === 1);
const payPoint = computed(() => detail.value?.raw?.payPoint ?? null);
const totalEpisode = computed(
  () => detail.value?.episodeCount ?? detail.value?.raw?.totalEpisode ?? 0
);

// =======================
//  Fetch
// =======================

async function fetchDetail(id: string) {
  loading.value = true;
  error.value = null;

  try {
    const res = await fetch(`${API_BASE}/api/getepisode/${id}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = (await res.json()) as ShortPlayResponse;
    if (!json.ok) {
      throw new Error("API mengembalikan ok=false");
    }
    detail.value = json;
  } catch (err: any) {
    console.error(err);
    error.value =
      err?.message ?? "Gagal memuat data shortplay. Cek backend / koneksi.";
  } finally {
    loading.value = false;
  }
}

// =======================
//  Actions
// =======================

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push({ name: "bookmall" }); // fallback ke home
  }
}

function handleEpisodeClick(ep: {
  episodeNo: number;
  episodeId: string;
  isLock: boolean;
  hasPlayVoucher: boolean;
  meta?: ShortPlayRawEpisodeInfo;
}) {
  //   if (ep.isLock) {
  //     alert("Episode ini terkunci. Nanti dihubungkan ke halaman unlock/VIP.");
  //     return;
  //   }

  router.push({
    name: "shortplay-episode",
    params: {
      id: shortPlayId.value,
      episodeId: ep.episodeId,
      episodeNo: ep.episodeNo,
    },
    query: {
      episodeNo: ep.episodeNo,
    },
  });
}

// =======================
//  Lifecycle
// =======================

onMounted(() => {
  if (shortPlayId.value) {
    fetchDetail(shortPlayId.value);
  }
});

watch(
  () => shortPlayId.value,
  (id) => {
    if (id) fetchDetail(id);
  }
);
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50">
    <!-- Top bar -->
    <header
      class="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-lg"
    >
      <div class="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          @click="goBack"
          class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/70 bg-slate-900/80 text-slate-200 hover:bg-slate-800 transition"
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
        <div class="min-w-0">
          <p class="text-[11px] uppercase tracking-[0.14em] text-slate-400">
            Netshort • Short Play
          </p>
          <p class="truncate text-sm font-semibold">
            {{ detail?.title || "Memuat..." }}
          </p>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 pb-10 pt-4">
      <!-- Loading -->
      <section v-if="loading" class="mt-6 space-y-4">
        <div
          class="flex gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-4"
        >
          <div class="h-40 w-28 animate-pulse rounded-2xl bg-slate-800/80" />
          <div class="flex-1 space-y-3">
            <div class="h-4 w-2/3 animate-pulse rounded-full bg-slate-800/80" />
            <div class="h-3 w-1/3 animate-pulse rounded-full bg-slate-800/80" />
            <div
              class="h-3 w-full animate-pulse rounded-full bg-slate-800/80"
            />
            <div class="h-3 w-4/5 animate-pulse rounded-full bg-slate-800/80" />
            <div class="h-3 w-3/5 animate-pulse rounded-full bg-slate-800/80" />
          </div>
        </div>
        <div class="space-y-2">
          <div
            v-for="i in 4"
            :key="i"
            class="h-10 animate-pulse rounded-2xl bg-slate-900/80"
          />
        </div>
      </section>

      <!-- Error -->
      <section v-else-if="error" class="mt-6">
        <div
          class="flex items-start gap-3 rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100"
        >
          <svg
            class="mt-0.5 h-4 w-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v4m0 4h.01M4.5 19.5l7.5-15 7.5 15H4.5z"
            />
          </svg>
          <div>
            <p class="font-medium">Gagal memuat shortplay</p>
            <p class="mt-0.5 opacity-80">
              {{ error }}
            </p>
          </div>
        </div>
      </section>

      <!-- Detail -->
      <section v-else-if="detail" class="mt-4 space-y-6">
        <!-- Hero -->
        <div
          class="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900/90 p-4 sm:flex-row sm:gap-5"
        >
          <!-- Cover -->
          <div class="relative mx-auto sm:mx-0">
            <div
              class="h-48 w-32 overflow-hidden rounded-2xl bg-slate-800 sm:h-60 sm:w-40 shadow-xl shadow-pink-500/10"
            >
              <img
                :src="detail.cover"
                :alt="detail.title"
                class="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div
              v-if="isFinished"
              class="absolute -bottom-1 left-1/2 flex -translate-x-1/2 translate-y-1 items-center gap-1 rounded-full border border-emerald-400/60 bg-slate-950/90 px-2 py-0.5 text-[10px] text-emerald-200 shadow"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Completed</span>
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0 space-y-3">
            <div class="space-y-1">
              <p
                class="text-[11px] uppercase tracking-[0.18em] text-pink-300/80"
              >
                {{ labels.join(" • ") || "Drama Romansa" }}
              </p>
              <h1
                class="text-lg font-semibold leading-snug text-slate-50 sm:text-xl"
              >
                {{ detail.title }}
              </h1>
            </div>

            <div
              class="flex flex-wrap items-center gap-2 text-xs text-slate-300"
            >
              <span
                class="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 border border-slate-700/70"
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
                    d="M4.5 4.5h15v15h-15z"
                  />
                </svg>
                {{ totalEpisode }} episode
              </span>

              <span
                v-if="payPoint !== null"
                class="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 border border-yellow-500/40 text-yellow-100"
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
                    d="M12 3l2.09 6.26H20l-5.17 3.76L16.91 21 12 16.99 7.09 21l1.08-7.98L3 9.26h5.91z"
                  />
                </svg>
                PayPoint {{ payPoint }}
              </span>

              <span
                class="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 border border-slate-700/70"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-pink-400" />
                Episode awal gratis, setelah itu kunci
              </span>
            </div>

            <p class="text-sm leading-relaxed text-slate-300">
              {{ description }}
            </p>
          </div>
        </div>

        <!-- Episodes -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-100">
              Episode ({{ totalEpisode }})
            </h2>
            <p class="text-[11px] text-slate-400">
              Tap episode untuk memutar. Episode dengan
              <span class="text-emerald-300 font-medium">tiket gratis</span>
              bisa langsung nonton.
            </p>
          </div>

          <!-- Episode free -->
          <div v-if="unlockedEpisodes.length" class="space-y-1.5">
            <p class="text-[11px] font-medium text-emerald-300">
              Gratis untuk ditonton
            </p>
            <div class="space-y-1.5">
              <button
                v-for="ep in unlockedEpisodes"
                :key="ep.episodeId"
                type="button"
                @click="handleEpisodeClick(ep as any)"
                class="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-left text-sm hover:border-emerald-400/60 hover:bg-slate-900 transition"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="relative h-10 w-7 overflow-hidden rounded-lg bg-slate-800"
                  >
                    <img
                      v-if="ep.meta?.episodeCover"
                      :src="ep.meta.episodeCover"
                      :alt="`Episode ${ep.episodeNo}`"
                      class="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center text-[11px] text-slate-400"
                    >
                      EP
                    </div>
                    <div
                      v-if="ep.hasPlayVoucher"
                      class="absolute -bottom-0.5 left-1/2 flex -translate-x-1/2 translate-y-1 items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-[1px] text-[9px] font-semibold text-emerald-950 shadow"
                    >
                      Free
                    </div>
                  </div>

                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-slate-50">
                      Episode {{ ep.episodeNo }}
                    </p>
                    <p
                      v-if="ep.meta?.likeNums"
                      class="text-[11px] text-slate-400 flex items-center gap-1"
                    >
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
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      {{ ep.meta.likeNums }} suka
                    </p>
                  </div>
                </div>

                <div
                  class="flex items-center gap-1 text-[11px] font-medium text-emerald-300"
                >
                  Tonton
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <!-- Episode locked -->
          <div v-if="lockedEpisodes.length" class="space-y-1.5 pt-2">
            <p class="text-[11px] font-medium text-slate-400">
              Episode terkunci (butuh koin / member)
            </p>
            <div class="space-y-1">
              <button
                v-for="ep in lockedEpisodes"
                :key="ep.episodeId"
                type="button"
                @click="handleEpisodeClick(ep as any)"
                class="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2.5 text-left text-sm hover:border-pink-500/50 hover:bg-slate-900 transition"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="relative h-10 w-7 overflow-hidden rounded-lg bg-slate-800/60"
                  >
                    <img
                      v-if="ep.meta?.episodeCover"
                      :src="ep.meta.episodeCover"
                      :alt="`Episode ${ep.episodeNo}`"
                      class="h-full w-full object-cover opacity-70"
                      loading="lazy"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center text-[11px] text-slate-500"
                    >
                      EP
                    </div>
                    <div
                      class="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px]"
                    />
                  </div>

                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-slate-200">
                      Episode {{ ep.episodeNo }}
                    </p>
                    <p
                      v-if="ep.meta?.episodeGoldCoinPrice"
                      class="text-[11px] text-slate-400 flex items-center gap-1"
                    >
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
                          d="M12 3v18m-6-9h12"
                        />
                      </svg>
                      {{ ep.meta.episodeGoldCoinPrice }} koin
                    </p>
                  </div>
                </div>

                <div
                  class="flex items-center gap-1 text-[11px] font-medium text-slate-300"
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
                      d="M12 15v3m-4.5 0h9a1.5 1.5 0 001.5-1.5v-6A1.5 1.5 0 0016.5 9H7.5A1.5 1.5 0 006 10.5v6A1.5 1.5 0 007.5 18zm1.5-9a3 3 0 116 0v1.5h-6V9z"
                    />
                  </svg>
                  Terkunci
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer kecil -->
      <footer class="mt-8 border-t border-slate-900 pt-4">
        <p class="text-center text-[10px] text-slate-500">
          kita drama • Netshort bridge
        </p>
      </footer>
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
