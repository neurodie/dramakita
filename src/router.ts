// src/router.ts
import { createRouter, createWebHistory } from "vue-router";
import BookMallView from "./views/BookMallView.vue";
import SeriesDetailView from "./views/SeriesDetailView.vue";
import VideoPlayerView from "./views/VideoPlayerView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: BookMallView,
    },
    {
      path: "/series/:id",
      name: "series",
      component: SeriesDetailView,
      props: true,
    },
    {
      path: "/video/:id",
      name: "video",
      component: VideoPlayerView,
    },
  ],
});

export default router;
