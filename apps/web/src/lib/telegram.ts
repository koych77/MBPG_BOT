export type TelegramWebApp = {
  initData: string;
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
