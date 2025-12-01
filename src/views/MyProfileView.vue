<!-- src/views/MyProfileView.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { TelegramApp } from "../tele/telegram";
import { getMembership } from "../lib/membership";

const API_BASE = "https://melolo-api-one.vercel.app";

interface VipPurchase {
  id: string;
  package_name: string;
  started_at: string;
  expired_at: string | null;
  price_label: string;
  status: "active" | "expired" | "pending";
}

interface AccountStatus {
  telegram_id: number;
  status: "free" | "vip";
  vip_label: string | null;
  vip_expired_at: string | null;
  purchases: VipPurchase[];
}

const router = useRouter();

// state utama
const user = ref<any | null>(null);
const account = ref<AccountStatus | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// membership lokal (misalnya dari localStorage / lib)
const membership = ref(getMembership());
const isVip = computed(() => membership.value.status === "vip");

// ========= Computed helper untuk template =========

const displayName = computed(
  () => user.value?.first_name || "Pengguna DramaKita"
);

const username = computed(() => user.value?.username || "guest");

const telegramId = computed<number | null>(() => user.value?.id ?? null);

const avatarInitial = computed(() => displayName.value.charAt(0).toUpperCase());

const vipLabelText = computed(
  () => account.value?.vip_label || (isVip.value ? "VIP Aktif" : "Free User")
);

const vipDescription = computed(() =>
  isVip.value
    ? "Kamu bisa menikmati semua episode & fitur premium."
    : "Upgrade ke VIP untuk membuka semua episode & fitur ekstra."
);

const vipExpiredText = computed(() => {
  if (!isVip.value) return "Belum ada paket VIP aktif.";
  if (account.value?.vip_expired_at) {
    return `Berlaku sampai: ${formatDate(account.value.vip_expired_at)}`;
  }
  return "Masa aktif VIP tidak diketahui (cek backend).";
});

const hasPurchases = computed(
  () => (account.value?.purchases?.length ?? 0) > 0
);

// ========= Navigation =========

function goBack() {
  router.back();
}

function goUpgradeVip() {
  router.push({ name: "upgradeVip" });
}

function goHistory() {
  router.push({ name: "history" });
}

function goBookmarks() {
  router.push({ name: "bookmarks" });
}

// ========= Helper formatting =========

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ========= API =========

async function fetchAccountStatus(telegramId: number) {
  loading.value = true;
  error.value = null;

  const url = `${API_BASE}/account/status?telegram_id=${encodeURIComponent(
    String(telegramId)
  )}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = (await res.json()) as AccountStatus;
    account.value = data;
  } catch (e: any) {
    console.error("Gagal fetch account status:", e);
    error.value =
      e?.message ??
      "Gagal mengambil status akun. Paket VIP akan ditampilkan sebagai FREE.";

    // fallback default
    account.value = {
      telegram_id: telegramId,
      status: "free",
      vip_label: null,
      vip_expired_at: null,
      purchases: [],
    };
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  const u = TelegramApp.getUser();
  user.value = u;

  if (u?.id) {
    fetchAccountStatus(u.id);
  } else {
    loading.value = false;
    account.value = {
      telegram_id: 0,
      status: "free",
      vip_label: null,
      vip_expired_at: null,
      purchases: [],
    };
  }
});
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
    <!-- Top bar -->
    <header
      class="border-b border-slate-800 bg-slate-950/70 backdrop-blur-lg sticky top-0 z-20"
    >
      <div
        class="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-3"
      >
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

        <div class="flex-1 min-w-0 text-center">
          <p class="text-[11px] text-slate-400 uppercase tracking-[0.2em]">
            Profil
          </p>
          <h1 class="text-sm font-semibold">Akun DramaKita</h1>
        </div>

        <div class="w-8" />
      </div>
    </header>

    <!-- Body -->
    <main class="mx-auto max-w-4xl w-full px-4 pt-4 pb-8 flex-1 space-y-4">
      <!-- Card profil -->
      <section
        class="rounded-3xl border border-slate-800 bg-slate-900/80 px-4 py-4 flex items-center gap-3"
      >
        <div
          class="h-11 w-11 rounded-full bg-tele-bg flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-sky-500/40 uppercase"
        >
          <span>{{ avatarInitial }}</span>
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold truncate">
            {{ displayName }}
          </p>
          <p class="text-[11px] text-slate-400 truncate">@{{ username }}</p>
          <p v-if="telegramId" class="text-[11px] text-slate-500">
            ID Telegram: <span class="font-mono">{{ telegramId }}</span>
          </p>
        </div>

        <div>
          <span
            v-if="isVip"
            class="inline-flex items-center gap-1 rounded-full bg-yellow-400/10 border border-yellow-400/60 px-2.5 py-1 text-[11px] text-yellow-100"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-yellow-300" />
            VIP
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 rounded-full bg-slate-800/80 border border-slate-600 px-2.5 py-1 text-[11px] text-slate-200"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-slate-400" />
            FREE
          </span>
        </div>
      </section>

      <!-- Status VIP -->
      <section
        class="rounded-3xl border border-slate-800 bg-slate-900/80 px-4 py-4 space-y-3"
      >
        <div class="flex items-center justify-between gap-2">
          <div>
            <p class="text-xs font-semibold text-slate-200">Status langganan</p>
            <p class="text-[11px] text-slate-400">
              Detail paket VIP & masa aktif kamu.
            </p>
          </div>
        </div>

        <div v-if="loading" class="mt-2 space-y-2">
          <div class="h-3 w-1/3 rounded-full bg-slate-800 animate-pulse" />
          <div class="h-3 w-1/2 rounded-full bg-slate-800 animate-pulse" />
        </div>

        <div v-else>
          <div class="flex items-center justify-between text-sm">
            <div>
              <p class="text-slate-200 font-medium">
                {{ vipLabelText }}
              </p>
              <p class="text-[11px] text-slate-400">
                {{ vipDescription }}
              </p>
            </div>

            <button
              type="button"
              @click="goUpgradeVip"
              class="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm shadow-pink-500/40 hover:brightness-110 transition"
            >
              {{ isVip ? "Perpanjang VIP" : "Upgrade VIP" }}
            </button>
          </div>

          <div class="mt-3 text-[11px] text-slate-400 space-y-1.5">
            <p>
              {{ vipExpiredText }}
            </p>
          </div>

          <p v-if="error" class="mt-2 text-[11px] text-red-300">
            {{ error }}
          </p>
        </div>
      </section>

      <!-- Riwayat pembelian -->
      <section
        class="rounded-3xl border border-slate-800 bg-slate-900/80 px-4 py-4 space-y-3"
      >
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-slate-200">Riwayat VIP</p>
        </div>

        <div v-if="loading" class="space-y-2">
          <div
            v-for="i in 3"
            :key="i"
            class="h-9 rounded-2xl bg-slate-800 animate-pulse"
          />
        </div>

        <div v-else-if="!hasPurchases" class="text-[11px] text-slate-400">
          Belum ada transaksi VIP yang tercatat.
        </div>

        <div v-else class="space-y-2 max-h-48 overflow-y-auto pr-1 text-[11px]">
          <div
            v-for="p in account?.purchases"
            :key="p.id"
            class="flex items-center justify-between rounded-2xl bg-slate-900/80 border border-slate-800 px-3 py-2"
          >
            <div class="min-w-0">
              <p class="text-slate-100 font-medium truncate">
                {{ p.package_name }}
              </p>
              <p class="text-[10px] text-slate-400">
                Mulai: {{ formatDate(p.started_at) }}
              </p>
              <p class="text-[10px] text-slate-500">
                Berakhir: {{ formatDate(p.expired_at) }}
              </p>
            </div>

            <div class="text-right">
              <p class="text-[11px] text-slate-100 font-medium">
                {{ p.price_label }}
              </p>
              <p
                class="text-[10px]"
                :class="{
                  'text-emerald-400': p.status === 'active',
                  'text-slate-400': p.status === 'expired',
                  'text-yellow-300': p.status === 'pending',
                }"
              >
                {{ p.status }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Tombol History & Bookmarks -->
      <section
        class="rounded-3xl border border-slate-800 bg-slate-900/80 px-4 py-4"
      >
        <p class="text-xs font-semibold text-slate-200 mb-3">Aktivitas kamu</p>
        <div class="grid grid-cols-2 gap-3 text-[12px]">
          <button
            type="button"
            @click="goHistory"
            class="flex items-center justify-center gap-2 rounded-2xl bg-slate-800/80 border border-slate-700 px-3 py-2 hover:border-pink-500/70 hover:text-pink-100 transition"
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
                d="M12 8v4l2.5 1.5M12 3a9 9 0 109 9"
              />
            </svg>
            <span>History</span>
          </button>

          <button
            type="button"
            @click="goBookmarks"
            class="flex items-center justify-center gap-2 rounded-2xl bg-slate-800/80 border border-slate-700 px-3 py-2 hover:border-pink-500/70 hover:text-pink-100 transition"
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
                d="M6 4.5A2.5 2.5 0 018.5 2h7A2.5 2.5 0 0118 4.5V21l-6-3-6 3V4.5z"
              />
            </svg>
            <span>Bookmarks</span>
          </button>
        </div>
      </section>
    </main>
  </div>
</template>
