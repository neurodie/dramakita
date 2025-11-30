import { createApp } from "vue";
import App from "./App.vue";
import "./assets/main.css";
import router from "./router";
import { TelegramApp } from "./tele/telegram";

const app = createApp(App);

app.use(router);
app.mount("#app");

// aman walau buka di browser biasa
TelegramApp.init();
