<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import {
  getMembership,
  upgradeToVip,
  downgradeToFree,
  type Membership,
} from "../lib/membership";

const router = useRouter();

const loading = ref(true);
const membership = ref<Membership>({ status: "free" });
const message = ref<string | null>(null);

// ========= Navigation =========
function goBack() {
  router.back();
}

// ========= Load & state =========
function loadMembership() {
  loading.value = true;
  membership.value = getMembership();
  loading.value = false;
}

const isVip = computed(() => membership.value.status === "vip");

// ========= Helpers =========
function formatPlanLabel(plan?: string) {
  if (!plan) return "";
  if (plan === "weekly") return "VIP Mingguan";
  if (plan === "monthly") return "VIP Bulanan";
  if (plan === "lifetime") return "VIP Lifetime";
  return plan;
}

function formatDate(dateStr?: string | null) {
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

function showMessage(text: string, timeout = 2500) {
  message.value = text;
  window.setTimeout(() => {
    message.value = null;
  }, timeout);
}

// computed tambahan biar template lebih enak dibaca
const statusChipLabel = computed(() => (isVip.value ? "VIP" : "Free user"));

const planLabel = computed(() =>
  isVip.value && membership.value.plan
    ? formatPlanLabel(membership.value.plan)
    : ""
);

// ========= Actions =========
function handleUpgrade(plan: "weekly" | "monthly" | "lifetime") {
  const m = upgradeToVip(plan);
  membership.value = m;

  if (plan === "lifetime") {
    showMessage("Berhasil upgrade ke VIP Lifetime 🎉", 2500);
  } else {
    showMessage(`Berhasil upgrade ke ${formatPlanLabel(plan)} 🎉`, 2500);
  }
}

function handleDowngrade() {
  const m = downgradeToFree();
  membership.value = m;
  showMessage("Status dikembalikan ke Free user.", 2000);
}

onMounted(() => {
  loadMembership();
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
              Upgrade
            </p>
            <h1 class="text-sm font-semibold">Paket VIP DramaKita</h1>
          </div>

          <span
            v-if="isVip"
            class="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-400/50 px-3 py-1 text-[11px] font-medium text-amber-200"
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
                d="M3 10.5l4.5 4.5L21 4.5"
              />
            </svg>
            VIP Aktif
          </span>
        </div>
      </div>
    </header>

    <!-- Body -->
    <main class="mx-auto max-w-4xl w-full px-4 pt-4 pb-8 flex-1 space-y-4">
      <!-- Info status -->
      <section
        class="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5"
      >
        <p class="text-xs text-slate-400 mb-2">Status akun kamu</p>

        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div>
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border"
                :class="
                  isVip
                    ? 'bg-amber-500/10 text-amber-200 border-amber-400/60'
                    : 'bg-slate-800/80 text-slate-200 border-slate-700/80'
                "
              >
                {{ statusChipLabel }}
              </span>

              <span
                v-if="planLabel && isVip"
                class="text-[11px] text-slate-400"
              >
                {{ planLabel }}
              </span>
            </div>

            <p class="mt-2 text-xs text-slate-400">
              <span v-if="isVip && membership.started_at">
                Aktif sejak:
                <span class="text-slate-200">
                  {{ formatDate(membership.started_at) }}
                </span>
              </span>
              <span v-else>
                Kamu masih menggunakan paket
                <span class="text-slate-200">Free</span>.
              </span>
            </p>

            <p
              v-if="isVip && membership.expires_at"
              class="mt-1 text-xs text-slate-400"
            >
              Berlaku sampai:
              <span class="text-slate-200">
                {{ formatDate(membership.expires_at) }}
              </span>
            </p>

            <p
              v-else-if="isVip && !membership.expires_at"
              class="mt-1 text-xs text-slate-400"
            >
              Paket:
              <span class="text-slate-200">Lifetime (tanpa kadaluarsa)</span>
            </p>
          </div>

          <button
            v-if="isVip"
            type="button"
            @click="handleDowngrade"
            class="self-start inline-flex items-center gap-1 rounded-full border border-slate-700/80 px-3 py-1.5 text-[11px] text-slate-300 hover:border-red-400/70 hover:text-red-200 transition"
          >
            Turunkan ke Free
          </button>
        </div>
      </section>

      <!-- Notif kecil -->
      <section v-if="message" class="-mt-1">
        <div
          class="rounded-2xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-[11px] text-emerald-100"
        >
          {{ message }}
        </div>
      </section>

      <!-- Paket VIP -->
      <section
        class="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5"
      >
        <h2 class="text-sm font-semibold text-slate-100">Pilih paket VIP</h2>
        <p class="mt-1 text-[11px] text-slate-500">
          Semua paket hanya simulasi lokal (belum terhubung pembayaran asli).
        </p>

        <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Weekly -->
          <div
            class="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col"
          >
            <p class="text-xs font-semibold text-slate-100">VIP Mingguan</p>
            <p class="mt-1 text-[11px] text-slate-400">
              Cocok buat coba-coba dulu.
            </p>

            <p class="mt-3 text-lg font-bold text-slate-50">
              Rp 25.000
              <span class="text-[10px] text-slate-500 font-normal">
                / 7 hari
              </span>
            </p>

            <ul class="mt-2 space-y-1 text-[11px] text-slate-400">
              <li>• Bebas iklan</li>
              <li>• Akses semua drama VIP</li>
              <li>• History & bookmark sinkron</li>
            </ul>

            <button
              type="button"
              @click="handleUpgrade('weekly')"
              class="mt-3 inline-flex items-center justify-center rounded-full bg-pink-500 px-3 py-1.5 text-[11px] font-medium text-white hover:brightness-110 transition"
            >
              Pilih paket ini
            </button>
          </div>

          <!-- Monthly -->
          <div
            class="rounded-2xl border border-pink-500/60 bg-slate-950 p-3 flex flex-col shadow-lg shadow-pink-500/20"
          >
            <p
              class="text-xs font-semibold text-slate-50 flex items-center gap-1"
            >
              VIP Bulanan
              <span
                class="text-[10px] rounded-full bg-pink-500/20 text-pink-200 px-2 py-0.5"
              >
                Rekomendasi
              </span>
            </p>
            <p class="mt-1 text-[11px] text-slate-400">
              Paling balance untuk pengguna aktif.
            </p>

            <p class="mt-3 text-lg font-bold text-slate-50">
              Rp 60.000
              <span class="text-[10px] text-slate-500 font-normal">
                / 30 hari
              </span>
            </p>

            <ul class="mt-2 space-y-1 text-[11px] text-slate-400">
              <li>• Semua fitur VIP Mingguan</li>
              <li>• Prioritas antrian server</li>
              <li>• Early access judul baru</li>
            </ul>

            <button
              type="button"
              @click="handleUpgrade('monthly')"
              class="mt-3 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 px-3 py-1.5 text-[11px] font-medium text-white hover:brightness-110 transition"
            >
              Pilih paket ini
            </button>
          </div>

          <!-- Lifetime -->
          <div
            class="rounded-2xl border border-amber-500/70 bg-slate-950/80 p-3 flex flex-col"
          >
            <p class="text-xs font-semibold text-slate-100">VIP Lifetime</p>
            <p class="mt-1 text-[11px] text-slate-400">
              Sekali bayar, nikmati selamanya.
            </p>

            <p class="mt-3 text-lg font-bold text-amber-300">
              Rp 250.000
              <span class="text-[10px] text-slate-500 font-normal">
                sekali
              </span>
            </p>

            <ul class="mt-2 space-y-1 text-[11px] text-slate-400">
              <li>• Semua fitur VIP Bulanan</li>
              <li>• Badge eksklusif Lifetime</li>
              <li>• Prioritas fitur baru</li>
            </ul>

            <button
              type="button"
              @click="handleUpgrade('lifetime')"
              class="mt-3 inline-flex items-center justify-center rounded-full bg-amber-500 px-3 py-1.5 text-[11px] font-medium text-slate-900 hover:brightness-110 transition"
            >
              Pilih paket ini
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
