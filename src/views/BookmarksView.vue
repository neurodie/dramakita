<!-- src/views/BookmarksView.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import {
  getBookmarks,
  removeBookmark,
  clearBookmarks,
  type Bookmark,
} from "../lib/bookmarks";

const router = useRouter();

const loading = ref(true);
const items = ref<Bookmark[]>([]);

// kalau nanti mau ganti backend image proxy, cukup ganti sini
const IMAGE_PROXY_BASE = "https://melolo-api-one.vercel.app/proxy-img?url=";

// ---------- Navigation ----------
function goBack() {
  router.back();
}

function openSeries(b: Bookmark) {
  router.push({
    name: "series",
    params: { id: b.series_id },
  });
}

// ---------- Bookmark actions ----------
function load() {
  loading.value = true;
  items.value = getBookmarks();
  loading.value = false;
}

function deleteOne(b: Bookmark) {
  removeBookmark(b.series_id);
  load();
}

function clearAll() {
  clearBookmarks();
  load();
}

// ---------- Helpers ----------
const hasItems = computed(() => items.value.length > 0);

function formatPlayCount(num: number) {
  if (!num) return "0 tayangan";
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + " jt tayangan";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + " rb tayangan";
  }
  return num.toLocaleString("id-ID") + " tayangan";
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCoverUrl(b: Bookmark) {
  return `${IMAGE_PROXY_BASE}${encodeURIComponent(b.cover)}`;
}

onMounted(() => {
  load();
});
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
    <!-- Top bar -->
    <header
      class="border-b border-slate-800 bg-slate-950/70 backdrop-blur-lg sticky top-0 z-20"
    >
      <div class="mx-auto max-w-4xl px-4 py-3 flex items-center gap-3">
        <button
          type="button"
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

        <div class="flex-1 flex items-center justify-between gap-2">
          <div>
            <p class="text-[11px] text-slate-400 uppercase tracking-[0.15em]">
              Bookmark
            </p>
            <h1 class="text-sm font-semibold">Drama tersimpan</h1>
          </div>

          <button
            v-if="hasItems"
            type="button"
            @click="clearAll"
            class="text-[11px] text-slate-400 hover:text-red-300"
          >
            Hapus semua
          </button>
        </div>
      </div>
    </header>

    <!-- Body -->
    <main class="mx-auto max-w-4xl w-full px-4 pt-4 pb-8 flex-1">
      <!-- Loading -->
      <div v-if="loading" class="mt-3 space-y-3">
        <div
          v-for="i in 3"
          :key="i"
          class="animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70 p-3 flex gap-3"
        >
          <div class="h-24 w-20 rounded-2xl bg-slate-800"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3 w-2/3 rounded-full bg-slate-800"></div>
            <div class="h-3 w-1/2 rounded-full bg-slate-800"></div>
            <div class="h-3 w-full rounded-full bg-slate-800"></div>
          </div>
        </div>
      </div>

      <!-- Kosong -->
      <div
        v-else-if="!hasItems"
        class="mt-10 text-center text-sm text-slate-400"
      >
        <p>Belum ada series yang kamu bookmark.</p>
        <p class="mt-1 text-xs text-slate-500">
          Buka salah satu drama lalu tekan tombol
          <span class="text-pink-300 font-medium">Bookmark</span>.
        </p>
      </div>

      <!-- List -->
      <div v-else class="mt-3 space-y-3 pb-4">
        <article
          v-for="b in items"
          :key="b.series_id"
          class="rounded-3xl border border-slate-800 bg-slate-900/80 p-3 sm:p-4 flex gap-3 sm:gap-4"
        >
          <button
            type="button"
            @click="openSeries(b)"
            class="shrink-0 focus:outline-none"
          >
            <div
              class="h-28 w-20 sm:h-32 sm:w-24 overflow-hidden rounded-2xl bg-slate-800"
            >
              <img
                :src="getCoverUrl(b)"
                :alt="b.title"
                class="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </button>

          <div class="flex-1 min-w-0 flex flex-col gap-1">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h2
                  class="text-sm sm:text-base font-semibold leading-snug line-clamp-2"
                >
                  {{ b.title }}
                </h2>
                <p class="mt-0.5 text-[11px] text-slate-400">
                  {{ b.episode_text }} •
                  <span class="text-slate-300">
                    {{ formatPlayCount(b.play_count) }}
                  </span>
                </p>
              </div>

              <button
                type="button"
                @click.stop="deleteOne(b)"
                class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-700/70 text-slate-400 hover:text-red-300 hover:border-red-400/70 transition"
              >
                <svg
                  class="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12"
                  />
                </svg>
              </button>
            </div>

            <p
              v-if="b.intro"
              class="mt-1 text-[11px] text-slate-400 line-clamp-2"
            >
              {{ b.intro }}
            </p>

            <p class="mt-auto text-[10px] text-slate-500">
              Disimpan:
              <span class="text-slate-300">
                {{ formatDate(b.added_at) }}
              </span>
            </p>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>
