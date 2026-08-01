import { useEffect } from 'react';

export function useTelegram() {
  const tg = (window as any).Telegram?.WebApp;

  useEffect(() => {
    if (!tg) return;
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation?.();
  }, []);

  const user = tg?.initDataUnsafe?.user ?? null;

  function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light') {
    tg?.HapticFeedback?.impactOccurred?.(style);
  }

  function hapticNotification(type: 'success' | 'warning' | 'error' = 'success') {
    tg?.HapticFeedback?.notificationOccurred?.(type);
  }

  function setMainButton(text: string, onClick: () => void) {
    if (!tg?.MainButton) return;
    tg.MainButton.setText(text);
    tg.MainButton.onClick(onClick);
    tg.MainButton.show();
  }

  function hideMainButton() {
    tg?.MainButton?.hide?.();
  }

  const themeParams = tg?.themeParams ?? {};
  const isDark = tg?.colorScheme !== 'light';
  const isInTelegram = !!tg;

  return {
    tg,
    user,
    isInTelegram,
    isDark,
    themeParams,
    hapticImpact,
    hapticNotification,
    setMainButton,
    hideMainButton,
  };
}
