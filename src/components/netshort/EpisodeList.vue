<template>
  <section class="mb-6">
    <!-- Header -->
    <div class="mb-2 flex items-center justify-between px-4">
      <div class="space-y-0.5">
        <h2 class="text-sm font-semibold text-slate-50">
          {{ title }}
        </h2>
        <p v-if="subtitle" class="text-[11px] text-slate-400">
          {{ subtitle }}
        </p>
      </div>

      <button
        v-if="showMore"
        type="button"
        class="text-[11px] font-medium text-pink-400 hover:text-pink-300"
        @click="onMoreClick"
      >
        Lihat semua
      </button>
    </div>

    <!-- List -->
    <div
      v-if="items && items.length"
      class="flex gap-3 overflow-x-auto px-4 pb-1"
    >
      <div
        v-for="item in items"
        :key="item.id || item.shortPlayId"
        class="w-36 shrink-0 cursor-pointer"
        @click="goToDetail(item)"
      >
        <div
          class="relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-800"
        >
          <img
            :src="item.shortPlayCover || item.groupShortPlayCover"
            :alt="item.shortPlayName"
            class="h-full w-full object-cover"
            loading="lazy"
          />

          <!-- Badge 'Sulih Suara' / 'Baru' / dll -->
          <div
            v-if="item.scriptName"
            class="absolute left-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-emerald-300"
          >
            {{ item.scriptName }}
          </div>

          <!-- Badge NEW -->
          <div
            v-if="item.isNewLabel"
            class="absolute right-1 top-1 rounded-full bg-pink-500 px-2 py-0.5 text-[10px] font-semibold text-white"
          >
            Baru
          </div>
        </div>

        <h3 class="mt-1 line-clamp-2 text-xs font-semibold text-slate-50">
          {{ item.shortPlayName }}
        </h3>

        <p
          v-if="item.labelArray && item.labelArray.length"
          class="mt-0.5 line-clamp-1 text-[11px] text-slate-400"
        >
          {{ item.labelArray.join(" · ") }}
        </p>

        <p v-if="item.heatScore" class="mt-0.5 text-[11px] text-slate-500">
          {{ formatHeat(item.heatScore) }} penonton
        </p>
      </div>
    </div>

    <!-- Empty state kecil -->
    <div v-else class="px-4 py-3 text-center text-xs text-slate-500">
      Belum ada konten untuk ditampilkan.
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

interface ShortPlayItem {
  id?: string;
  shortPlayId: string;
  shortPlayLibraryId?: string;
  shortPlayName: string;
  shortPlayCover?: string;
  groupShortPlayCover?: string;
  labelArray?: string[];
  isNewLabel?: boolean;
  script?: number;
  scriptName?: string | null;
  scriptType?: number;
  heatScore?: number;
}

const props = defineProps<{
  title: string; // contoh: "Rilisan Baru", "Baru"
  subtitle?: string; // optional: bisa diisi "Rekomendasi hari ini" dsb
  groupId?: string; // dari API: groupId
  items: ShortPlayItem[]; // contentInfos dari API
  showMore?: boolean; // kalau mau munculin tombol "Lihat semua"
}>();

const emit = defineEmits<{
  (e: "more", groupId?: string): void;
}>();

function formatHeat(n: number): string {
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (n >= 1_000) {
    return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return String(n);
}

function goToDetail(item: ShortPlayItem) {
  // Sesuaikan dengan definisi route-mu
  router.push({
    // kalau kamu pakai name:
    // name: "shortPlayDetail",
    // params: { shortPlayId: item.shortPlayId },

    // untuk aman, pakai path dulu saja:
    path: `/shortplay/${item.shortPlayId}`,
  });
}

function onMoreClick() {
  emit("more", props.groupId);
}
</script>

<style scoped>
/* Kalau kamu punya util `no-scrollbar`, ini bisa dihapus */
::-webkit-scrollbar {
  display: none;
}
</style>
