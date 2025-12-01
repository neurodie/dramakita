<!-- src/components/SeriesFilterBar.vue -->
<template>
  <div
    class="space-y-4 rounded-2xl bg-slate-900/70 p-4 md:p-5 shadow-lg shadow-black/40"
  >
    <!-- TOP TABS -->
    <div
      class="flex gap-4 text-xs font-semibold uppercase tracking-wide text-slate-400"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        @click="setActiveTab(tab.key)"
        class="rounded-xl px-4 py-2 transition-all"
        :class="[
          activeTab === tab.key
            ? 'bg-sky-600 text-white shadow-sky-500/40 shadow-md'
            : 'text-slate-400 hover:text-white hover:bg-slate-800',
        ]"
      >
        <span>{{ tab.label }}</span>
        <span v-if="tab.count !== undefined" class="ml-1 opacity-80">
          ({{ tab.count }})
        </span>
      </button>
    </div>

    <!-- SEARCH + TAGS WRAPPER -->
    <div
      class="rounded-2xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 md:px-5 md:py-4"
    >
      <!-- SEARCH -->
      <div
        class="flex items-center gap-3 rounded-xl bg-slate-900/80 px-3 py-2.5"
      >
        <span class="material-symbols-outlined text-lg text-slate-500">
          search
        </span>
        <input
          v-model="localSearch"
          type="text"
          placeholder="Search series..."
          class="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      <!-- TAGS -->
      <div class="mt-3 flex items-center gap-2 overflow-x-auto pb-1 pt-1">
        <button
          type="button"
          @click="setCategory(null)"
          class="flex-shrink-0 rounded-full px-4 py-2 text-xs md:text-sm font-medium transition-all"
          :class="[
            selectedCategory === null
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/40'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700',
          ]"
        >
          All
        </button>

        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          @click="setCategory(cat.id)"
          class="flex-shrink-0 rounded-full px-4 py-2 text-xs md:text-sm font-medium transition-all"
          :class="[
            selectedCategory === cat.id
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/40'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700',
          ]"
        >
          {{ cat.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from "vue";

interface TabItem {
  key: string;
  label: string;
  count?: number;
}

interface CategoryItem {
  id: string | number;
  name: string;
}

const props = defineProps<{
  tabs: TabItem[];
  modelValueTab: string; // v-model:tab
  modelValueCategory: string | number | null; // v-model:category
  modelValueSearch: string; // v-model:search
  categories: CategoryItem[]; // dari API
}>();

const emit = defineEmits<{
  (e: "update:modelValueTab", value: string): void;
  (e: "update:modelValueCategory", value: string | number | null): void;
  (e: "update:modelValueSearch", value: string): void;
}>();

const activeTab = computed({
  get: () => props.modelValueTab,
  set: (v: string) => emit("update:modelValueTab", v),
});

const selectedCategory = computed({
  get: () => props.modelValueCategory,
  set: (v: string | number | null) => emit("update:modelValueCategory", v),
});

const localSearch = ref(props.modelValueSearch);
watch(
  () => props.modelValueSearch,
  (v) => {
    if (v !== localSearch.value) localSearch.value = v;
  }
);
watch(localSearch, (v) => emit("update:modelValueSearch", v));

function setActiveTab(key: string) {
  activeTab.value = key;
}

function setCategory(id: string | number | null) {
  selectedCategory.value = id;
}
</script>

<style scoped>
/* pake material icons kalau mau, atau ganti dengan svg sendiri */
.material-symbols-outlined {
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
}
</style>
