import { useState, useEffect, useCallback } from "react";

const DISMISS_KEY = "kc_pwa_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return !!localStorage.getItem(DISMISS_KEY); } catch { return false; }
  });
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    try {
      setInstalled(matchMedia("(display-mode: standalone)").matches || !!(navigator as unknown as Record<string, boolean>).standalone);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setDeferredPrompt(null);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
  }, []);

  const show = !installed && !!deferredPrompt && !dismissed;

  return { show, install, dismiss, installed };
}
