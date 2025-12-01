<!-- src/views/BookMallView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { TelegramApp } from "../tele/telegram";
import type { Book } from "../types/book";
import { BookService } from "../services/book.service";

// 🔥 Netshort imports
import EpisodeList from "../components/netshort/EpisodeList.vue";
import { NetshortService } from "../services/netshort.service";
import type { ShortPlayGroup } from "../types/netshort";

const MIN_SEARCH_LENGTH = 3;
const router = useRouter();

// =======================
//  State utama
// =======================
const books = ref<Book[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const searchQuery = ref("");
const selectedTag = ref<string | null>(null);

const lastSearchTotal = ref<number | null>(null);
const lastSearchQuery = ref<string>("");

// user Telegram (kalau dibuka dari mini app)
const user = ref<any | null>(null);

// 🔥 State Netshort
const netshortGroups = ref<ShortPlayGroup[]>([]);
const loadingNetshort = ref(true);
const netshortError = ref<string | null>(null);

// =======================
//  Derived state
// =======================

// ambil daftar tag unik dari stat_infos (kalau nanti filter diaktifkan lagi)
const allTags = computed(() => {
  const set = new Set<string>();
  books.value.forEach((b) => {
    b.stat_infos?.forEach((tag) => set.add(tag));
  });
  return Array.from(set);
});

// list untuk ditampilkan (backend sudah handle search, di sini cukup filter tag)
const filteredBooks = computed(() => {
  if (!selectedTag.value) return books.value;
  return books.value.filter((b) => b.stat_infos?.includes(selectedTag.value!));
});

// optional: bisa dipakai di UI kalau mau bedain state "sedang lihat hasil search"
const isSearching = computed(
  () => !!lastSearchQuery.value && lastSearchTotal.value !== null
);

// =======================
//  Helper functions
// =======================

function selectTag(tag: string | null) {
  selectedTag.value = tag;
}

function formatWordNumber(num?: string) {
  if (!num) return "";
  const n = Number(num);
  if (!Number.isFinite(n) || n === 0) return "";
  return n.toLocaleString("id-ID") + " kata";
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
//  Data fetching
// =======================

async function loadHomeBooks() {
  loading.value = true;
  error.value = null;
  lastSearchQuery.value = "";
  lastSearchTotal.value = null;

  try {
    const list = await BookService.getHomeBooks();
    books.value = list;
  } catch (err) {
    setError(err, "Gagal memuat data. Cek backend / koneksi kamu.");
  } finally {
    loading.value = false;
  }
}

// 🔥 Netshort home
async function loadNetshortHome() {
  loadingNetshort.value = true;
  netshortError.value = null;

  try {
    const groups = await NetshortService.getHome({
      tabId: "1894773235170693121",
      offset: 0,
      limit: 2, // misal: ambil 2 group dulu (Rilisan Baru + Baru)
    });
    netshortGroups.value = groups;
  } catch (err) {
    if (err instanceof Error) {
      netshortError.value = err.message || "Gagal memuat Netshort.";
    } else {
      netshortError.value = "Gagal memuat Netshort.";
    }
  } finally {
    loadingNetshort.value = false;
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
    setError(err, "Gagal memuat data. Cek backend / koneksi kamu.");
  } finally {
    loading.value = false;
  }
}

function refresh() {
  const q = searchQuery.value.trim();

  if (!q) {
    // balik ke mode home
    loadHomeBooks();
    loadNetshortHome(); // sekalian refresh Netshort
    return;
  }

  if (q.length < MIN_SEARCH_LENGTH) {
    // jangan tembak API kalau input terlalu pendek
    lastSearchTotal.value = null;
    lastSearchQuery.value = "";
    return;
  }

  runSearch(q);
}

// =======================
//  Navigation
// =======================

function goToSeries(bookId: string) {
  router.push({
    name: "series",
    params: { id: bookId },
  });
}

function goToProfile() {
  router.push({ name: "profile" });
}

// =======================
//  Watcher + lifecycle
// =======================

// debounce sederhana supaya tidak spam API tiap keypress
let searchTimeout: number | undefined;

watch(searchQuery, () => {
  window.clearTimeout(searchTimeout);
  searchTimeout = window.setTimeout(() => {
    refresh();
  }, 300); // 300ms: cukup responsif tapi nggak barbar
});

onMounted(() => {
  // ambil user Telegram kalau ada (kalau dibuka di browser biasa = null)
  user.value = TelegramApp.getUser();
  loadHomeBooks();
  loadNetshortHome();
});
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50">
    <!-- Top bar -->
    <header
      class="border-b border-slate-800 bg-slate-950/70 backdrop-blur-lg sticky top-0 z-20"
    >
      <div class="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <!-- Kiri: brand + user, bisa diklik ke profil -->
        <button
          type="button"
          @click="goToProfile"
          class="flex items-center gap-3 text-left focus:outline-none w-full"
        >
          <!-- Avatar -->
          <div
            class="h-9 w-9 rounded-full bg-[#3390ec] flex items-center justify-center text-sm font-bold uppercase text-white shadow-lg shadow-blue-500/30"
          >
            {{ user?.first_name?.substring(0, 1) || "U" }}
          </div>

          <!-- Info -->
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h1 class="text-base font-semibold tracking-tight">
                {{ user?.first_name || "Guest" }}
              </h1>

              <span
                v-if="user"
                class="inline-flex items-center gap-1 rounded-full bg-pink-500/10 border border-pink-400/20 px-2 py-0.5 text-[10px] font-medium text-pink-300"
              >
                freemium
              </span>
            </div>

            <!-- Subtext -->
            <div class="flex items-center gap-1 text-[11px] text-slate-400">
              <svg
                class="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12h3m0 0l-2-2m2 2l-2 2m-4-6a4 4 0 11-8 0 4 4 0 018 0zM5 20h8a2 2 0 002-2v-1a6 6 0 00-12 0v1a2 2 0 002 2z"
                />
              </svg>
              <span>Akses ke profile kamu</span>
            </div>
          </div>
        </button>

        <!-- Kanan: tombol refresh -->
        <div class="flex-1 flex justify-end">
          <button
            @click="refresh"
            class="hidden sm:inline-flex items-center gap-1 rounded-full border border-slate-700/70 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/80 transition"
          >
            <span class="relative inline-flex h-1.5 w-1.5">
              <span
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"
              ></span>
            </span>
            Refresh
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 pb-10 pt-4">
      <!-- Search & Info -->
      <section
        class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex-1">
          <div
            class="flex items-center gap-2 text-xs font-medium text-pink-300/90"
          >
            <!-- badge / subtitle kalau mau -->
          </div>
          <h2 class="mt-1 text-xl font-semibold tracking-tight">
            Koleksi romansa panas & CEO drama
          </h2>
          <p class="mt-1 text-xs text-slate-400">
            Nikmati drama short dari berbagai sumber online :)
          </p>
        </div>

        <!-- Search bar -->
        <div class="w-full mt-2 sm:mt-0 sm:w-auto sm:flex sm:justify-end">
          <label class="relative block w-full max-w-full sm:w-72 md:w-80">
            <span
              class="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400"
            >
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M10.5 6.75a3.75 3.75 0 013.75 3.75m3.75 7.5L16 16.5m1-6.75a6.75 6.75 0 11-13.5 0 6.75 6.75 0 0113.5 0z"
                />
              </svg>
            </span>

            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari judul, penulis, atau sinopsis…"
              class="w-full rounded-full border border-slate-600 bg-slate-900 py-3 pl-11 pr-4 text-sm sm:text-base text-slate-100 placeholder:text-slate-500 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/40 transition shadow-sm"
            />
          </label>
        </div>
      </section>

      <!-- 🔥 Section Netshort: Episode list -->
      <section class="mt-2 space-y-2">
        <div v-if="loadingNetshort" class="text-xs text-slate-400 px-1">
          Memuat rekomendasi video pendek…
        </div>

        <div
          v-else-if="netshortError"
          class="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-[11px] text-yellow-100"
        >
          {{ netshortError }}
        </div>

        <EpisodeList
          v-for="group in netshortGroups"
          v-else
          :key="group.groupId"
          :title="group.contentName"
          :subtitle="
            group.contentRemark === 'new_weekly'
              ? 'Update setiap minggu'
              : group.contentRemark === 'new_release'
              ? 'Rilisan terbaru hari ini'
              : undefined
          "
          :group-id="group.groupId"
          :items="group.contentInfos"
          :show-more="false"
        />
      </section>

      <!-- Loading buku -->
      <section v-if="loading" class="mt-6 space-y-3">
        <div
          v-for="i in 4"
          :key="i"
          class="animate-pulse rounded-3xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4 flex gap-3"
        >
          <div class="h-28 w-20 rounded-2xl bg-slate-800/80"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3 w-1/3 rounded-full bg-slate-800/80"></div>
            <div class="h-4 w-2/3 rounded-full bg-slate-800/80"></div>
            <div class="h-3 w-full rounded-full bg-slate-800/80"></div>
            <div class="h-3 w-3/5 rounded-full bg-slate-800/80"></div>
            <div class="flex gap-2 pt-1">
              <div class="h-5 w-16 rounded-full bg-slate-800/80"></div>
              <div class="h-5 w-20 rounded-full bg-slate-800/80"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Error buku -->
      <section v-else-if="error" class="mt-8">
        <div
          class="rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-100 flex items-start gap-3"
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
            <p class="font-medium">Gagal memuat drama</p>
            <p class="mt-0.5 opacity-80">
              {{ error }}
            </p>
            <button
              @click="refresh"
              class="mt-2 inline-flex items-center gap-1 rounded-full border border-red-400/60 px-3 py-1 text-xs hover:bg-red-500/20"
            >
              Coba lagi
            </button>
          </div>
        </div>
      </section>

      <!-- Info hasil pencarian -->
      <section
        v-if="lastSearchTotal !== null && lastSearchQuery"
        class="mt-2 mb-2 text-xs text-slate-400"
      >
        Found
        <span class="font-semibold text-pink-300">
          "{{ lastSearchTotal }}"
        </span>
        dari pencarian
        <span class="font-semibold text-slate-200">
          "{{ lastSearchQuery }}"
        </span>
      </section>

      <!-- List drama (buku) -->
      <section class="mt-4 space-y-3 pb-4">
        <div
          v-if="!filteredBooks.length && !loading && !error"
          class="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-6 text-sm text-slate-300 text-center"
        >
          Tidak ada hasil untuk filter saat ini.
        </div>

        <article
          v-for="book in filteredBooks"
          :key="book.book_id"
          class="group rounded-3xl border border-slate-800/80 bg-slate-900/70 p-3 sm:p-4 flex gap-3 sm:gap-4 hover:border-pink-500/60 hover:bg-slate-900/90 transition shadow-sm hover:shadow-pink-500/10"
        >
          <!-- Cover -->
          <div class="relative">
            <div
              class="h-32 w-24 overflow-hidden rounded-2xl bg-slate-800 sm:h-40 sm:w-28"
            >
              <img
                :src="book.thumb_url"
                :alt="book.book_name"
                loading="lazy"
                class="h-full w-full object-cover"
              />
            </div>
            <div
              class="absolute -bottom-1 left-1/2 flex -translate-x-1/2 translate-y-1 items-center gap-1 rounded-full bg-slate-950/90 px-2 py-0.5 text-[10px] text-slate-200 shadow-lg shadow-slate-900/80 border border-slate-700/80"
            >
              <span
                class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
              ></span>
              <span class="uppercase tracking-wide">Selesai</span>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 flex flex-col gap-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <h3
                class="text-sm font-semibold leading-snug text-slate-50 sm:text-base line-clamp-2"
              >
                {{ book.book_name }}
              </h3>
              <span
                v-if="book.age_gate === '18'"
                class="rounded-full border border-pink-500/80 bg-pink-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-pink-200"
              >
                18+
              </span>
            </div>

            <p class="text-xs text-slate-400">
              oleh
              <span class="text-slate-200 font-medium">
                {{ book.author }}
              </span>
            </p>

            <p
              class="mt-1 text-xs leading-relaxed text-slate-300 line-clamp-3 sm:line-clamp-2"
            >
              {{ book.abstract }}
            </p>

            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                v-for="tag in book.stat_infos"
                :key="tag"
                class="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-200 border border-slate-700/80 group-hover:border-pink-500/60 group-hover:text-pink-100 transition"
              >
                {{ tag }}
              </span>

              <span
                v-if="formatWordNumber(book.word_number)"
                class="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-400 border border-slate-800"
              >
                {{ formatWordNumber(book.word_number) }}
              </span>
            </div>

            <div class="mt-auto flex items-center justify-between pt-1">
              <div class="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span class="inline-flex h-4 w-4 items-center justify-center">
                  <svg
                    class="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4.5 5.25h9.75M4.5 9.75h6M4.5 14.25h3M9 19.5l2.25-2.25H19.5V4.5h-6.75"
                    />
                  </svg>
                </span>
                <span>Swipe untuk detail</span>
              </div>

              <button
                @click="goToSeries(book.book_id)"
                class="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm shadow-pink-500/40 hover:shadow-pink-500/60 hover:brightness-110 transition"
              >
                Baca sekarang
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
          </div>
        </article>
      </section>

      <!-- footer kecil -->
      <footer class="mt-6 border-t border-slate-900 pt-4">
        <p class="text-[10px] text-slate-500 text-center">
          kita drama <span class="text-pink-300">2025</span>
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
