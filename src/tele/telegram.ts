// src/tele/telegram.ts
const tg = (window as any)?.Telegram?.WebApp;

function init() {
  if (!tg) {
    console.log(
      "[TelegramApp] WebApp not found, running in normal browser mode"
    );
    return;
  }

  tg.ready();
  tg.expand();
  tg.setBackgroundColor("#020617");
  tg.setHeaderColor("#020617");
}

function getUser() {
  if (!tg) return null;
  return tg.initDataUnsafe?.user ?? null;
}

function getInitData() {
  if (!tg) return "";
  return tg.initData ?? "";
}

export const TelegramApp = {
  raw: tg,
  init,
  getUser,
  getInitData,
};
