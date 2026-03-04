/**
 * Image URL Tool — v4 (zero API keys required)
 *
 * Priority chain:
 *  1. Unsplash Source API  — follows redirect to get real, query-specific photo URL
 *  2. Wikimedia Commons    — accurate for landmarks / cultural sites (attractions only)
 *  3. Picsum               — deterministic, always-working photo fallback
 */

type ImageType = "attraction" | "food" | "hotel" | "destination";

// ─── Query builder ────────────────────────────────────────────────────────────

function buildSearchQuery(query: string, type: ImageType): string {
  const q = query.trim();
  switch (type) {
    case "attraction":  return `${q} landmark`;
    case "food":        return `${q} food`;
    case "hotel":       return `${q} hotel`;
    case "destination": return `${q} travel`;
    default:            return q;
  }
}

// ─── Deterministic hash ───────────────────────────────────────────────────────

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// ─── Source 1: Unsplash Source (no auth) ─────────────────────────────────────

/**
 * The old code returned the REDIRECT url (source.unsplash.com/...)
 * which resolves to a different image on every request.
 *
 * Fix: follow the redirect and capture the final resolved URL.
 * That final URL is stable and actually matches the query.
 */
async function getUnsplashUrl(query: string): Promise<string | null> {
  const redirectUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
  try {
    const res = await fetch(redirectUrl, {
      method: "GET",
      redirect: "follow",
    });

    // After redirect, res.url is the actual Unsplash image CDN URL
    // e.g. https://images.unsplash.com/photo-xxxxx?...
    if (res.ok && res.url && res.url.includes("images.unsplash.com")) {
      return res.url;
    }
  } catch (err) {
    console.warn("[Image Tool] Unsplash redirect failed:", err);
  }
  return null;
}

// ─── Source 2: Wikimedia Commons (no auth) ───────────────────────────────────

async function getWikimediaUrl(query: string): Promise<string | null> {
  try {
    const searchParams = new URLSearchParams({
      action: "query",
      list: "search",
      srnamespace: "6",
      srsearch: `${query} filetype:jpg`,
      srlimit: "5",
      format: "json",
      origin: "*",
    });

    const searchRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?${searchParams}`
    );
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const files: any[] = searchData?.query?.search ?? [];
    if (files.length === 0) return null;

    // Try each file until we get a valid image URL
    for (const file of files) {
      const infoParams = new URLSearchParams({
        action: "query",
        titles: file.title,
        prop: "imageinfo",
        iiprop: "url|mime",
        iiurlwidth: "800",
        format: "json",
        origin: "*",
      });

      const infoRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?${infoParams}`
      );
      if (!infoRes.ok) continue;

      const infoData = await infoRes.json();
      const pages = Object.values(infoData?.query?.pages ?? {}) as any[];
      const info = pages[0]?.imageinfo?.[0];

      if (
        info?.thumburl &&
        info?.mime?.startsWith("image/") &&
        !info.thumburl.endsWith(".svg")
      ) {
        return info.thumburl as string;
      }
    }
  } catch (err) {
    console.warn("[Image Tool] Wikimedia failed:", err);
  }
  return null;
}

// ─── Source 3: Picsum (guaranteed fallback) ───────────────────────────────────

function getPicsumUrl(query: string, index = 0): string {
  const seed = hash(`${query}-${index}`);
  return `https://picsum.photos/seed/${seed}/800/600`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getMultipleImageUrls(
  query: string,
  count: number = 1,
  type: ImageType = "destination"
): Promise<string[]> {
  if (!query?.trim()) {
    return Array.from({ length: count }, (_, i) => getPicsumUrl("travel", i));
  }

  const searchQuery = buildSearchQuery(query, type);
  console.log(`[Image Tool] "${searchQuery}" | type: ${type}`);

  const results: string[] = [];

  // ── 1. Unsplash ─────────────────────────────────────────────────
  // Fetch in parallel when count > 1 (each call returns a different photo)
  if (results.length < count) {
    const needed = count - results.length;
    const unsplashResults = await Promise.all(
      Array.from({ length: needed }, () => getUnsplashUrl(searchQuery))
    );
    const valid = unsplashResults.filter(Boolean) as string[];
    results.push(...valid);
    console.log(`[Image Tool] Unsplash: ${valid.length} results`);
  }

  // ── 2. Wikimedia (attractions + destinations) ───────────────────
  if (results.length < count && ["attraction", "destination"].includes(type)) {
    const wikiUrl = await getWikimediaUrl(searchQuery);
    if (wikiUrl) {
      results.push(wikiUrl);
      console.log(`[Image Tool] Wikimedia: 1 result`);
    }
  }

  // ── 3. Picsum fallback ──────────────────────────────────────────
  while (results.length < count) {
    results.push(getPicsumUrl(query, results.length));
  }

  return results.slice(0, count);
}

// Convenience wrappers
export async function getImageUrl(
  query: string,
  type: ImageType = "destination"
): Promise<string> {
  const results = await getMultipleImageUrls(query, 1, type);
  return results[0];
}