export type TelegramWebApp = {
  initData: string;
  version?: string;
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
  ready: () => void;
  expand: () => void;
  requestFullscreen?: () => void;
  disableVerticalSwipes?: () => void;
  isVersionAtLeast?: (version: string) => boolean;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegram() {
  return window.Telegram?.WebApp;
}

export function getInitData() {
  return getTelegram()?.initData ?? "";
}

export function getDevTelegramId() {
  return localStorage.getItem("mbpg_dev_telegram_id") ?? "";
}

export function openFullscreen() {
  const tg = getTelegram();
  try {
    tg?.ready();
    tg?.expand();
    if (tg?.isVersionAtLeast?.("8.0")) {
      tg.requestFullscreen?.();
    }
    if (tg?.isVersionAtLeast?.("7.7")) {
      tg.disableVerticalSwipes?.();
    }
  } catch {
    tg?.expand();
  }
}
