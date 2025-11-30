// src/router.ts
import { createRouter, createWebHistory } from "vue-router";
import BookMallView from "./views/BookMallView.vue";
import SeriesDetailView from "./views/SeriesDetailView.vue";
import VideoPlayerView from "./views/VideoPlayerView.vue";
import MyProfileView from "./views/MyProfileView.vue";
import BookmarksView from "./views/BookmarksView.vue";
import UpgradeVipView from "./views/UpgradeVipView.vue";

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
    {
      path: "/profile",
      name: "profile",
      component: MyProfileView,
    },
    {
      path: "/bookmarks",
      name: "bookmarks",
      component: BookmarksView,
    },
    {
      path: "/upgrade-vip",
      name: "upgradeVip",
      component: UpgradeVipView,
    },
  ],
});

export default router;
