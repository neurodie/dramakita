<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import "../assets/main.css";

import { TelegramApp } from "../tele/telegram";
import type { Book } from "../types/book";
import { BookService } from "../services/book.service";

import EpisodeList from "../components/netshort/EpisodeList.vue";
import { NetshortService } from "../services/netshort.service";
import type { ShortPlayGroup } from "../types/netshort";

// =======================
//  Konstanta
// =======================
const MIN_SEARCH_LENGTH = 3;
const NETSHORT_TAB_HOME = "1894773235170693121";
const NETSHORT_TAB_DUB = "1965372594714603522";

const router = useRouter();

// =======================
//  Tabs atas
// =======================
const topTabs = [
  { key: "NEW", label: "Terbaru", count: 30 },
  { key: "TRENDING", label: "Melolo", count: 30 },
  { key: "POPULAR", label: "Netshort", count: 929 },
  { key: "ALL", label: "Semua", count: 929 },
];

const activeTopTab = ref<"NEW" | "TRENDING" | "POPULAR" | "ALL">("ALL");

// =======================
//  State: Buku (Melolo)
// =======================
const books = ref<Book[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const searchQuery = ref("");
const selectedTag = ref<string | null>(null);

const lastSearchTotal = ref<number | null>(null);
const lastSearchQuery = ref<string>("");

// =======================
//  State: User Telegram
// =======================
const user = ref<any | null>(null);

// =======================
//  State: Netshort
// =======================
const netshortGroups = ref<ShortPlayGroup[]>([]);
const loadingNetshort = ref(true);
const netshortError = ref<string | null>(null);
const netshortNewReleaseGroups = computed(() =>
  netshortGroups.value.filter((g) => g.contentName === "Baru")
);

const dubGroups = ref<ShortPlayGroup[]>([]);
const loadingDub = ref(true);
const dubError = ref<string | null>(null);

// =======================
//  Helper
// =======================
function formatWordNumber(num?: string) {
  if (!num) return "";
  const n = Number(num);
  if (!Number.isFinite(n) || n === 0) return "";
  // Format singkat: 1.2k kata
  if (n >= 1000) return (n / 1000).toFixed(1) + "k kata";
  return n + " kata";
}

function setError(err: unknown, fallback: string) {
  if (err instanceof Error) {
    error.value = err.message || fallback;
  } else if (typeof err === "string") {
    error.value = err;
  } else {
    error.value = fallback;
  }
}

// =======================
//  Labels & Computeds
// =======================
const meloloLabels = computed(() => {
  const set = new Set<string>();
  books.value.forEach((b) => {
    b.stat_infos?.forEach((tag) => set.add(tag));
    if (b.age_gate === "18") set.add("18+");
  });
  return Array.from(set);
});

const netshortLabels = ref<string[]>(["18+", "Aksi", "Anak Imut", "Animasi"]);

const activeLabels = computed(() => {
  if (activeTopTab.value === "TRENDING") return meloloLabels.value;
  if (activeTopTab.value === "POPULAR") return netshortLabels.value;
  return Array.from(new Set([...meloloLabels.value, ...netshortLabels.value]));
});

const showMeloloList = computed(() =>
  ["NEW", "TRENDING", "ALL"].includes(activeTopTab.value)
);

const showNetshortSections = computed(() =>
  ["NEW", "POPULAR", "ALL"].includes(activeTopTab.value)
);

const filteredBooks = computed(() => {
  if (!selectedTag.value) return books.value;
  if (selectedTag.value === "18+") {
    return books.value.filter((b) => b.age_gate === "18");
  }
  return books.value.filter((b) =>
    b.stat_infos?.includes(selectedTag.value as string)
  );
});

// =======================
//  Data fetching
// =======================
async function loadHomeBooks() {
  loading.value = true;
  error.value = null;
  lastSearchQuery.value = "";
  lastSearchTotal.value = null;
  try {
    books.value = await BookService.getHomeBooks();
  } catch (err) {
    setError(err, "Gagal memuat data.");
  } finally {
    loading.value = false;
  }
}

async function runSearch(q: string) {
  loading.value = true;
  error.value = null;
  try {
    const { books: list, total, query } = await BookService.searchBooks(q);
    books.value = list;
    lastSearchTotal.value = total;
    lastSearchQuery.value = query;
  } catch (err) {
    setError(err, "Gagal mencari data.");
  } finally {
    loading.value = false;
  }
}

function refresh() {
  const q = searchQuery.value.trim();
  if (!q) {
    loadHomeBooks();
    loadNetshortHome();
    loadNetshortDub();
    return;
  }
  if (q.length < MIN_SEARCH_LENGTH) {
    lastSearchTotal.value = null;
    return;
  }
  runSearch(q);
}

async function loadNetshortHome() {
  loadingNetshort.value = true;
  netshortError.value = null;
  try {
    netshortGroups.value = await NetshortService.getHome({
      tabId: NETSHORT_TAB_HOME,
      offset: 0,
      limit: 2,
    });
  } catch (err) {
    netshortError.value = "Gagal memuat Netshort.";
  } finally {
    loadingNetshort.value = false;
  }
}

async function loadNetshortDub() {
  loadingDub.value = true;
  dubError.value = null;
  try {
    dubGroups.value = await NetshortService.getHome({
      tabId: NETSHORT_TAB_DUB,
      offset: 0,
      limit: 5,
    });
  } catch (err) {
    dubError.value = "Gagal memuat Sulih suara.";
  } finally {
    loadingDub.value = false;
  }
}

// =======================
//  Navigation & Watchers
// =======================
function goToSeries(bookId: string) {
  router.push({ name: "series", params: { id: bookId } });
}
function goToProfile() {
  router.push({ name: "profile" });
}

let searchTimeout: number | undefined;
watch(searchQuery, () => {
  window.clearTimeout(searchTimeout);
  searchTimeout = window.setTimeout(() => refresh(), 400);
});

onMounted(() => {
  user.value = TelegramApp.getUser();
  loadHomeBooks();
  loadNetshortHome();
  loadNetshortDub();
});
</script>

<template>
  <div
    class="relative min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-pink-500/30"
  >
    <div
      class="fixed top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-900/20 via-slate-900/10 to-transparent pointer-events-none z-0"
    ></div>

    <header
      class="sticky top-0 z-40 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl transition-all duration-300"
    >
      <div
        class="mx-auto flex max-w-2xl items-center justify-between px-4 py-3"
      >
        <button
          @click="goToProfile"
          class="group flex items-center gap-3 rounded-full pr-3 transition active:scale-95 focus:outline-none"
        >
          <div class="relative">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-tele-bg text-sm font-bold text-white ring-2 ring-[#0f172a] shadow-[0_0_12px_rgba(0,109,163,0.45)]"
            >
              {{ user?.first_name?.substring(0, 1) || "G" }}
            </div>

            <div
              class="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0f172a] bg-emerald-500"
            ></div>
          </div>

          <div class="flex flex-col items-start">
            <span
              class="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors"
            >
              {{ user?.first_name || "Guest" }}
            </span>
            <span class="text-[10px] font-medium text-slate-400">
              Free Plan
            </span>
          </div>
        </button>

        <button
          @click="refresh"
          class="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16l5 5v-5" />
          </svg>
        </button>
      </div>

      <div class="mx-auto max-w-2xl px-4 pb-0 pt-1">
        <div
          class="flex gap-6 overflow-x-auto no-scrollbar border-b border-white/5"
        >
          <button
            v-for="tab in topTabs"
            :key="tab.key"
            @click="activeTopTab = tab.key as any"
            class="relative pb-3 text-sm font-medium transition-colors whitespace-nowrap"
            :class="
              activeTopTab === tab.key
                ? 'text-white'
                : 'text-red hover:text-slate-300'
            "
          >
            {{ tab.label }}
            <span
              v-if="activeTopTab === tab.key"
              class="absolute bottom-0 left-0 h-0.5 w-full bg-white rounded-t-full"
            ></span>
          </button>
        </div>
      </div>
    </header>

    <main class="relative z-10 mx-auto max-w-2xl px-4 pt-5 pb-24">
      <section class="mb-6">
        <div class="group relative">
          <div
            class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none"
          >
            <svg
              class="h-5 w-5 text-slate-500 group-focus-within:text-pink-400 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            class="block w-full rounded-2xl border border-white/10 bg-gray-700 py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 shadow-sm backdrop-blur-sm focus:border-pink-500/50 focus:bg-slate-900 focus:ring-1 focus:ring-pink-500/50 focus:outline-none transition-all"
            placeholder="Cari judul, genre, atau penulis..."
          />
          <div
            v-if="loading"
            class="absolute inset-y-0 right-3 flex items-center"
          >
            <div
              class="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-pink-500"
            ></div>
          </div>
        </div>

        <div class="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            @click="selectedTag = null"
            class="flex-shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-300"
            :class="
              !selectedTag
                ? 'bg-white text-slate-900 border-white'
                : 'border-white/10 bg-transparent text-slate-400 hover:border-white/30 hover:text-slate-200'
            "
          >
            Semua
          </button>
          <button
            v-for="label in activeLabels"
            :key="label"
            @click="selectedTag = label"
            class="flex-shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-300"
            :class="
              selectedTag === label
                ? 'bg-tele-bg border-transparent text-white shadow-[0_0_10px_rgba(0,109,163,0.4)]'
                : 'border-white/10 bg-transparent text-slate-400 hover:border-white/30 hover:text-slate-200'
            "
          >
            {{ label }}
          </button>
        </div>
      </section>

      <Transition name="fade" mode="out-in">
        <div v-if="showNetshortSections" class="space-y-6">
          <div v-if="loadingNetshort" class="animate-pulse space-y-2">
            <div class="h-4 w-24 bg-slate-800 rounded"></div>
            <div class="flex gap-3 overflow-hidden">
              <div class="h-32 w-24 bg-slate-800 rounded-xl"></div>
              <div class="h-32 w-24 bg-slate-800 rounded-xl"></div>
              <div class="h-32 w-24 bg-slate-800 rounded-xl"></div>
            </div>
          </div>
          <div
            v-else-if="netshortError"
            class="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20"
          >
            {{ netshortError }}
          </div>
          <div v-else>
            <EpisodeList
              v-for="group in netshortNewReleaseGroups"
              :key="group.groupId"
              :title="group.contentName"
              :subtitle="'Rilisan Terbaru'"
              :group-id="group.groupId"
              :items="group.contentInfos"
              :show-more="false"
              class="mb-6"
            />
          </div>

          <div v-if="!loadingDub && dubGroups.length">
            <div class="flex items-center gap-2 mb-2 px-1">
              <span class="h-5 w-1 rounded-full bg-pink-500"></span>
              <h3 class="text-lg font-bold text-white tracking-tight">
                Sulih Suara
              </h3>
            </div>

            <div class="space-y-6">
              <EpisodeList
                v-for="group in dubGroups"
                :key="group.groupId"
                :title="group.contentName || 'Pilihan Editor'"
                :group-id="group.groupId"
                :items="group.contentInfos"
                :show-more="false"
              />
            </div>
          </div>
        </div>
      </Transition>

      <section v-if="showMeloloList" class="mt-6">
        <div
          v-if="lastSearchTotal !== null && lastSearchQuery"
          class="mb-4 flex items-center justify-between text-xs text-slate-400"
        >
          <span
            >Menampilkan hasil untuk
            <span class="text-white">"{{ lastSearchQuery }}"</span></span
          >
          <span class="rounded bg-slate-800 px-2 py-0.5 text-white">{{
            lastSearchTotal
          }}</span>
        </div>

        <div v-if="loading" class="space-y-4">
          <div
            v-for="i in 3"
            :key="i"
            class="flex gap-4 rounded-2xl bg-slate-800/40 p-3 animate-pulse"
          >
            <div class="h-32 w-24 rounded-xl bg-slate-700/50"></div>
            <div class="flex-1 py-1 space-y-3">
              <div class="h-4 w-3/4 rounded bg-slate-700/50"></div>
              <div class="h-3 w-1/2 rounded bg-slate-700/50"></div>
              <div class="h-10 w-full rounded bg-slate-700/30"></div>
            </div>
          </div>
        </div>

        <div
          v-else-if="!filteredBooks.length && !error"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <div class="mb-3 rounded-full bg-slate-800/50 p-4">
            <svg
              class="h-8 w-8 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <p class="text-slate-400 text-sm">Tidak ada buku ditemukan.</p>
        </div>

        <TransitionGroup name="list" tag="div" class="space-y-4 pb-8">
          <article
            v-for="book in filteredBooks"
            :key="book.book_id"
            class="group relative flex gap-4 overflow-hidden rounded-2xl border border-white/5 bg-slate-800/30 p-3 transition-all duration-300 hover:bg-slate-800/60 hover:shadow-lg hover:shadow-purple-900/10"
          >
            <div
              class="relative flex-shrink-0 cursor-pointer"
              @click="goToSeries(book.book_id)"
            >
              <div
                class="h-36 w-26 overflow-hidden rounded-xl bg-slate-900 shadow-md"
              >
                <img
                  :src="book.thumb_url"
                  :alt="book.book_name"
                  loading="lazy"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div
                v-if="book.age_gate === '18'"
                class="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-pink-600 text-[10px] font-bold text-white shadow-md ring-2 ring-[#0f172a]"
              >
                18+
              </div>
            </div>

            <div class="flex min-w-0 flex-1 flex-col justify-between py-1">
              <div>
                <h3
                  @click="goToSeries(book.book_id)"
                  class="cursor-pointer line-clamp-2 text-base font-bold leading-tight text-white group-hover:text-pink-400 transition-colors"
                >
                  {{ book.book_name }}
                </h3>
                <p class="mt-1 text-xs text-slate-400 font-medium">
                  {{ book.author }}
                </p>

                <p
                  class="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-300 opacity-80"
                >
                  {{ book.abstract }}
                </p>
              </div>

              <div class="mt-3 flex items-center justify-between gap-2">
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="tag in book.stat_infos?.slice(0, 2)"
                    :key="tag"
                    class="rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-300"
                  >
                    {{ tag }}
                  </span>
                  <span
                    v-if="book.word_number"
                    class="text-[10px] text-slate-500 py-0.5"
                  >
                    • {{ formatWordNumber(book.word_number) }}
                  </span>
                </div>

                <button
                  @click.stop="goToSeries(book.book_id)"
                  class="shrink-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-transform active:scale-95 hover:brightness-110"
                >
                  Baca
                </button>
              </div>
            </div>
          </article>
        </TransitionGroup>
      </section>

      <footer class="mt-10 border-t border-white/5 py-6 text-center">
        <p class="text-xs text-slate-600">
          © 2025 Kita Drama. All rights reserved.
        </p>
      </footer>
    </main>
  </div>
</template>

<style scoped>
/* Custom Scrollbar Hide */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* List Transitions */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.list-leave-active {
  position: absolute;
  width: 100%;
}
</style>
