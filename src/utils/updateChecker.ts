const REPO = "LIN4CRE/KushCloud";
const API = `https://api.github.com/repos/${REPO}/releases/latest`;
const CACHE_KEY = "kc_update_check";
const CACHE_TTL = 3_600_000;

export interface UpdateInfo {
  latestVersion: string;
  downloadUrl: string;
  releaseUrl: string;
  publishedAt: string;
}

function parseVersion(tag: string): number[] {
  return tag.replace(/^v/, "").split(".").map(Number);
}

function isNewer(latest: string, current: string): boolean {
  const l = parseVersion(latest);
  const c = parseVersion(current);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const a = l[i] || 0;
    const b = c[i] || 0;
    if (a !== b) return a > b;
  }
  return false;
}

export async function checkForUpdate(currentVersion: string): Promise<UpdateInfo | null> {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) return data;
    }

    const res = await fetch(API, {
      headers: { Accept: "application/vnd.github.v3+json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const release = await res.json();
    const latestTag: string = release.tag_name || "";
    if (!latestTag || !isNewer(latestTag, currentVersion)) return null;

    const info: UpdateInfo = {
      latestVersion: latestTag,
      downloadUrl: release.assets?.[0]?.browser_download_url || "",
      releaseUrl: release.html_url || "",
      publishedAt: release.published_at || "",
    };

    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: info, timestamp: Date.now() }));
    return info;
  } catch {
    return null;
  }
}
