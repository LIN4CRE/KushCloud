import { showToast } from "../ui";

export async function shareScore(score: number, isNewBest: boolean): Promise<boolean> {
  const text = isNewBest
    ? `🌿 I just scored ${score} in KushCloud — a NEW PERSONAL BEST! Can you beat me?`
    : `🌿 I scored ${score} in KushCloud! Can you beat me?`;

  const url = "https://lin4cre.github.io/KushCloud/";
  const shareData: ShareData = {
    title: "KushCloud — Chill Arcade Flyer",
    text: `${text} ${url}`,
    url,
  };

  if (navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return false;
    }
  }

  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    showToast("Score copied to clipboard!", "success");
    return true;
  } catch {
    showToast("Could not share score", "error");
    return false;
  }
}
