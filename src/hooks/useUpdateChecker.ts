import { useState, useEffect, useCallback, useRef } from "react";
import { checkForUpdate, dismissUpdate, isVersionDismissed, isVersionSkipped, skipVersion } from "../utils/updateChecker";
import type { UpdateInfo, InstallType } from "../utils/updateChecker";
import { detectInstallType } from "../utils/updateChecker";

export interface UpdateState {
  update: UpdateInfo | null;
  installType: InstallType;
  show: boolean;
  dismissed: boolean;
}

export function useUpdateChecker(currentVersion: string) {
  const [state, setState] = useState<UpdateState>({
    update: null,
    installType: "web",
    show: false,
    dismissed: false,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const check = useCallback(async () => {
    const installType = detectInstallType();
    const update = await checkForUpdate(currentVersion);
    if (!update) {
      setState((s) => ({ ...s, update: null, show: false, installType }));
      return;
    }
    const dismissed = isVersionDismissed(update.latestVersion);
    const skipped = isVersionSkipped(update.latestVersion);
    const show = !dismissed && !skipped;
    setState({ update, installType, show, dismissed });
    if (!show) {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [currentVersion]);

  useEffect(() => {
    check();
    intervalRef.current = setInterval(check, 3_600_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [check]);

  const dismiss = useCallback(() => {
    if (state.update) {
      dismissUpdate(state.update.latestVersion);
      setState((s) => ({ ...s, show: false, dismissed: true }));
    }
  }, [state.update]);

  const skip = useCallback(() => {
    if (state.update) {
      skipVersion(state.update.latestVersion);
      setState((s) => ({ ...s, show: false, dismissed: true }));
    }
  }, [state.update]);

  return { ...state, dismiss, skip, recheck: check };
}

function isStandalone(): boolean {
  try {
    return matchMedia("(display-mode: standalone)").matches || !!(navigator as unknown as Record<string, boolean>).standalone;
  } catch {
    return false;
  }
}

export function useIsStandalone(): boolean {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    setStandalone(isStandalone());
  }, []);
  return standalone;
}
