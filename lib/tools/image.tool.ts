/**
 * Image URL Tool — v7 (free sources, validated, cached)
 *
 * Goal: the photo must match the actual place/dish/hotel. We resolve from real
 * sources in an accuracy-first order per content type, VALIDATE named matches
 * (reject a wrong Wikipedia article), and only fall back to a deterministic
 * placeholder as the absolute last resort.
 *
 * Sources (all free):
 *  - TheMealDB      — exact dish photos (food)
 *  - Wikipedia      — article lead image for named landmarks/dishes (validated)
 *  - Wikimedia      — Commons file search (attractions/destinations)
 *  - Pexels         — real stock photos, strong query match (needs free PEXELS_API_KEY)
 *  - Pixabay        — real stock photos (needs free PIXABAY_API_KEY)
 *  - Picsum         — deterministic placeholder, last resort only
 *
 * Resolved URLs are cached in Redis (30 days) keyed by type+query.
 */

import { cacheGetJson, cacheSetJson } from "@/lib/redis";

type ImageType = "attraction" | "food" | "hotel" | "destination";

const FETCH_TIMEOUT_MS = 5000;
const RESOLVED_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// ─── helpers ─────────────────────────────────────────────────────────────────

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function fetchWithTimeout(
  url: string,
  timeoutMs = FETCH_TIMEOUT_MS,
  headers?: Record<string, string>
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal, headers }).finally(() =>
    clearTimeout(timer)
  );
}

function buildSearchQuery(query: string, type: ImageType): string {
  const q = query.trim();
  switch (type) {
    case "attraction":
      return `${q} landmark`;
    case "food":
      return `${q} dish food`;
    case "hotel":
      return `${q} hotel`;
    case "destination":
      return `${q} city travel`;
    default:
      return q;
  }
}

// ─── relevance validation ───────────────────────────────────────────────────
// Reject a candidate whose title shares no meaningful token with the query
// (e.g. query "Sri Ranganathaswamy Temple" → article "Temple" is too generic).

const STOP = new Set([
  "the", "and", "for", "with", "near", "best", "top", "famous", "tourist",
  "landmark", "hotel", "building", "dish", "meal", "food", "city", "travel",
  "place", "visit", "near", "resort", "inn",
]);

function significantTokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export function isRelevant(query: string, title: string): boolean {
  const q = significantTokens(query);
  const t = new Set(significantTokens(title));
  if (q.length === 0 || t.size === 0) return true; // not enough signal → accept
  return q.some((w) => t.has(w));
}

// ─── sources ─────────────────────────────────────────────────────────────────

async function getMealDbUrl(query: string): Promise<string | null> {
  try {
    const shortQuery = query.trim().split(/\s+/).slice(0, 3).join(" ");
    const res = await fetchWithTimeout(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(shortQuery)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.meals?.[0]?.strMealThumb ?? null;
  } catch {
    return null;
  }
}

/** Wikipedia article lead image + its title (for validation). */
async function getWikipediaThumb(
  query: string
): Promise<{ url: string; title: string } | null> {
  try {
    const searchParams = new URLSearchParams({
      action: "query", list: "search", srsearch: query, srlimit: "3",
      format: "json", origin: "*",
    });
    const searchRes = await fetchWithTimeout(
      `https://en.wikipedia.org/w/api.php?${searchParams}`
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const hits: any[] = searchData?.query?.search ?? [];
    if (hits.length === 0) return null;

    const bestTitle = hits[0].title;
    const imgParams = new URLSearchParams({
      action: "query", titles: bestTitle, prop: "pageimages",
      piprop: "thumbnail", pithumbsize: "800", format: "json",
      origin: "*", redirects: "1",
    });
    const imgRes = await fetchWithTimeout(
      `https://en.wikipedia.org/w/api.php?${imgParams}`
    );
    if (!imgRes.ok) return null;
    const imgData = await imgRes.json();
    const pages = Object.values(imgData?.query?.pages ?? {}) as any[];
    const url = pages[0]?.thumbnail?.source;
    return url ? { url, title: bestTitle } : null;
  } catch {
    return null;
  }
}

async function getWikimediaUrl(query: string): Promise<string | null> {
  try {
    const searchParams = new URLSearchParams({
      action: "query", list: "search", srnamespace: "6",
      srsearch: `${query} filetype:jpg`, srlimit: "4", format: "json", origin: "*",
    });
    const searchRes = await fetchWithTimeout(
      `https://commons.wikimedia.org/w/api.php?${searchParams}`
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const files: any[] = searchData?.query?.search ?? [];
    if (files.length === 0) return null;

    for (const file of files) {
      try {
        const infoParams = new URLSearchParams({
          action: "query", titles: file.title, prop: "imageinfo",
          iiprop: "url|mime", iiurlwidth: "800", format: "json", origin: "*",
        });
        const infoRes = await fetchWithTimeout(
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
      } catch {
        // try next file
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function getPexelsUrl(query: string): Promise<string | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  try {
    const res = await fetchWithTimeout(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      FETCH_TIMEOUT_MS,
      { Authorization: key }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.photos?.[0]?.src?.large ?? null;
  } catch {
    return null;
  }
}

async function getPixabayUrl(query: string): Promise<string | null> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return null;
  try {
    const res = await fetchWithTimeout(
      `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&per_page=3&image_type=photo&safesearch=true`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const hit = data?.hits?.[0];
    return hit?.largeImageURL ?? hit?.webformatURL ?? null;
  } catch {
    return null;
  }
}

const PICSUM_TYPE_OFFSET: Record<ImageType, number> = {
  food: 1000, attraction: 2000, hotel: 3000, destination: 4000,
};

function getPicsumUrl(query: string, type: ImageType = "destination", index = 0): string {
  const offset = PICSUM_TYPE_OFFSET[type] ?? 0;
  const seed = (hash(`${type}-${query}-${index}`) % 900) + offset;
  return `https://picsum.photos/seed/${seed}/800/600`;
}

// ─── resolution ──────────────────────────────────────────────────────────────

/** Resolve a single best-match real photo, or null if every source misses. */
async function resolveOne(raw: string, type: ImageType): Promise<string | null> {
  const augmented = buildSearchQuery(raw, type);

  const tryWiki = async () => {
    const w = await getWikipediaThumb(raw);
    return w && isRelevant(raw, w.title) ? w.url : null;
  };
  const tryWikimedia = () => getWikimediaUrl(augmented);
  const tryPexels = () => getPexelsUrl(raw);
  const tryPixabay = () => getPixabayUrl(raw);
  const tryMeal = () => getMealDbUrl(raw);

  // Accuracy-first ordering per type: exact-subject sources before stock photos.
  let order: Array<() => Promise<string | null>>;
  switch (type) {
    case "food":
      order = [tryMeal, tryWiki, tryPexels, tryPixabay];
      break;
    case "hotel": // hotels are rarely on Wikipedia → real stock photos first
      order = [tryPexels, tryPixabay, tryWiki];
      break;
    case "attraction":
      order = [tryWiki, tryWikimedia, tryPexels, tryPixabay];
      break;
    default: // destination
      order = [tryPexels, tryWiki, tryWikimedia, tryPixabay];
  }

  for (const fn of order) {
    try {
      const url = await fn();
      if (url) return url;
    } catch {
      // try next source
    }
  }
  return null;
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function getMultipleImageUrls(
  query: string,
  count: number = 1,
  type: ImageType = "destination"
): Promise<string[]> {
  if (!query?.trim()) {
    return Array.from({ length: count }, (_, i) => getPicsumUrl("travel", type, i));
  }

  const raw = query.trim();
  const cacheKey = `img:v1:${type}:${raw.toLowerCase()}`;

  // Single-image lookups (the common case from the Place agent) are cached.
  if (count === 1) {
    const cached = await cacheGetJson<string>(cacheKey);
    if (cached) return [cached];
  }

  const results: string[] = [];
  const resolved = await resolveOne(raw, type);
  if (resolved) {
    results.push(resolved);
    if (count === 1) await cacheSetJson(cacheKey, resolved, RESOLVED_TTL_SECONDS);
  }

  // Pad to requested count with deterministic placeholders (last resort).
  while (results.length < count) {
    results.push(getPicsumUrl(raw, type, results.length));
  }
  return results.slice(0, count);
}

export async function getImageUrl(
  query: string,
  type: ImageType = "destination"
): Promise<string> {
  const results = await getMultipleImageUrls(query, 1, type);
  return results[0];
}
