/**
 * Image URL Tool — v6 (zero API keys, query-accurate)
 *
 * Sources by priority:
 *  1. TheMealDB          — real food photos (food type only, no key needed)
 *  2. Wikipedia search   — article lead image (accurate for named subjects)
 *  3. Wikimedia Commons  — file search fallback for landmarks/destinations
 *  4. Type-aware Picsum  — deterministic fallback scoped to content type
 *
 * NOTE: Unsplash Source API is REMOVED — it was deprecated and ignored
 * search queries entirely, returning random nature/landscape photos.
 */

type ImageType = "attraction" | "food" | "hotel" | "destination";

// ─── Deterministic hash ───────────────────────────────────────────────────────

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// ─── Fetch with timeout ──────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 5000;

function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

// ─── Query builder ────────────────────────────────────────────────────────────

function buildSearchQuery(query: string, type: ImageType): string {
  const q = query.trim();
  switch (type) {
    case "attraction":  return `${q} landmark tourist`;
    case "food":        return `${q} dish meal food`;
    case "hotel":       return `${q} hotel building`;
    case "destination": return `${q} city travel`;
    default:            return q;
  }
}

// ─── Source 1: Wikimedia Commons (best for real-world accuracy) ──────────────

async function getWikimediaUrl(query: string): Promise<string | null> {
  try {
    const searchParams = new URLSearchParams({
      action: "query",
      list: "search",
      srnamespace: "6",
      srsearch: `${query} filetype:jpg`,
      srlimit: "4",
      format: "json",
      origin: "*",
    });

    const searchRes = await fetchWithTimeout(
      `https://commons.wikimedia.org/w/api.php?${searchParams}`
    );
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const files: any[] = searchData?.query?.search ?? [];
    if (files.length === 0) return null;

    // Race all info fetches in parallel — return the first valid image URL.
    // Manual Promise.any (avoids requiring ES2021 lib types).
    const thumbUrl = await new Promise<string | null>((resolve) => {
      let settled = 0;
      const total = files.length;
      files.forEach(async (file) => {
        try {
          const infoParams = new URLSearchParams({
            action: "query",
            titles: file.title,
            prop: "imageinfo",
            iiprop: "url|mime",
            iiurlwidth: "800",
            format: "json",
            origin: "*",
          });
          const infoRes = await fetchWithTimeout(
            `https://commons.wikimedia.org/w/api.php?${infoParams}`
          );
          if (!infoRes.ok) throw new Error("not ok");
          const infoData = await infoRes.json();
          const pages = Object.values(infoData?.query?.pages ?? {}) as any[];
          const info = pages[0]?.imageinfo?.[0];
          if (
            info?.thumburl &&
            info?.mime?.startsWith("image/") &&
            !info.thumburl.endsWith(".svg")
          ) {
            resolve(info.thumburl as string);
            return;
          }
        } catch {
          // fall through
        }
        if (++settled === total) resolve(null);
      });
    });

    return thumbUrl ?? null;
  } catch (err) {
    console.warn("[Image Tool] Wikimedia failed:", err);
  }
  return null;
}

// ─── Source 2: TheMealDB (accurate food photos, no API key) ─────────────────
// Searches by meal name and returns the official meal thumbnail.
// Only used when type === "food".

async function getMealDbUrl(query: string): Promise<string | null> {
  try {
    // Use only the first 2-3 words to improve match rate (e.g. "Pad Thai noodles" → "Pad Thai")
    const shortQuery = query.trim().split(/\s+/).slice(0, 3).join(" ");
    const params = new URLSearchParams({ s: shortQuery });
    const res = await fetchWithTimeout(
      `https://www.themealdb.com/api/json/v1/1/search.php?${params}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const thumb = data?.meals?.[0]?.strMealThumb;
    return thumb ?? null;
  } catch (err) {
    console.warn("[Image Tool] TheMealDB failed:", err);
    return null;
  }
}

// ─── Source 3: Wikipedia page thumbnail (great for named dishes/places) ──────
// Does a full-text search first to find the best matching article title,
// then fetches that article's lead image. Handles non-exact query strings.

async function getWikipediaThumb(query: string): Promise<string | null> {
  try {
    // Step 1: Search for the best matching article title
    const searchParams = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: query,
      srlimit: "3",
      format: "json",
      origin: "*",
    });
    const searchRes = await fetchWithTimeout(
      `https://en.wikipedia.org/w/api.php?${searchParams}`
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const hits: any[] = searchData?.query?.search ?? [];
    if (hits.length === 0) return null;

    // Step 2: Fetch the lead image for the top result
    const bestTitle = hits[0].title;
    const imgParams = new URLSearchParams({
      action: "query",
      titles: bestTitle,
      prop: "pageimages",
      piprop: "thumbnail",
      pithumbsize: "800",
      format: "json",
      origin: "*",
      redirects: "1",
    });
    const imgRes = await fetchWithTimeout(
      `https://en.wikipedia.org/w/api.php?${imgParams}`
    );
    if (!imgRes.ok) return null;
    const imgData = await imgRes.json();
    const pages = Object.values(imgData?.query?.pages ?? {}) as any[];
    const thumb = pages[0]?.thumbnail?.source;
    return thumb ?? null;
  } catch (err) {
    console.warn("[Image Tool] Wikipedia thumb failed:", err);
    return null;
  }
}

// ─── Source 4: Type-aware Picsum (deterministic fallback scoped to content type)
// Uses the type as part of the seed so fallbacks are at least visually
// consistent with the content category (food vs. city vs. attraction).

const PICSUM_TYPE_OFFSET: Record<ImageType, number> = {
  food:        1000,
  attraction:  2000,
  hotel:       3000,
  destination: 4000,
};

function getPicsumUrl(query: string, type: ImageType = "destination", index = 0): string {
  const offset = PICSUM_TYPE_OFFSET[type] ?? 0;
  const seed = (hash(`${type}-${query}-${index}`) % 900) + offset;
  return `https://picsum.photos/seed/${seed}/800/600`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getMultipleImageUrls(
  query: string,
  count: number = 1,
  type: ImageType = "destination"
): Promise<string[]> {
  if (!query?.trim()) {
    return Array.from({ length: count }, (_, i) => getPicsumUrl("travel", type, i));
  }

  const searchQuery = buildSearchQuery(query, type);
  console.log(`[Image Tool] "${searchQuery}" | type: ${type}`);

  const results: string[] = [];

  // ── 1. TheMealDB (food only — most accurate for named dishes) ───────────
  if (type === "food" && results.length < count) {
    const mealUrl = await getMealDbUrl(query.trim());
    if (mealUrl) {
      results.push(mealUrl);
      console.log(`[Image Tool] TheMealDB: 1 result`);
    }
  }

  // ── 2. Wikipedia article thumbnail (accurate for named subjects) ─────────
  // Pass raw query — augmented searchQuery hurts title-matching accuracy.
  if (results.length < count) {
    const wikiThumb = await getWikipediaThumb(query.trim());
    if (wikiThumb && !results.includes(wikiThumb)) {
      results.push(wikiThumb);
      console.log(`[Image Tool] Wikipedia thumb: 1 result`);
    }
  }

  // ── 3. Wikimedia Commons file search ────────────────────────────────────
  // Good for additional images or when Wikipedia has no article thumbnail
  if (results.length < count) {
    const wikiUrl = await getWikimediaUrl(searchQuery);
    if (wikiUrl && !results.includes(wikiUrl)) {
      results.push(wikiUrl);
      console.log(`[Image Tool] Wikimedia Commons: 1 result`);
    }
  }

  // ── 4. Type-aware Picsum fallback (varied seeds to avoid duplicates) ─────
  while (results.length < count) {
    results.push(getPicsumUrl(query, type, results.length));
  }

  return results.slice(0, count);
}

// Convenience wrapper
export async function getImageUrl(
  query: string,
  type: ImageType = "destination"
): Promise<string> {
  const results = await getMultipleImageUrls(query, 1, type);
  return results[0];
}