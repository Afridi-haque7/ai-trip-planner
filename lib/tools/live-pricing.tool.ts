import Amadeus from 'amadeus';
import { fetchTravelpayoutsFlights, fetchTravelpayoutsHotels } from '@/lib/tools/travelpayouts.tool';

// Initialize Amadeus client (works in Node.js)
let amadeusClient: any = null;
if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
  try {
    amadeusClient = new Amadeus({
      clientId: process.env.AMADEUS_CLIENT_ID,
      clientSecret: process.env.AMADEUS_CLIENT_SECRET,
    });
  } catch (e) {
    console.error("[Live Pricing] Failed to initialize Amadeus client:", e);
  }
}

/**
 * Helper to wrap any promise in a strict abort timeout.
 * Vercel Hobby limits API routes to 10 seconds.
 * We must abort at 6s to allow fallback logic to execute so Vercel doesn't 504.
 */
function withStrictTimeout<T>(
  promiseSupplier: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = 6000
): Promise<T | null> {
  return new Promise((resolve) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn(`[Live Pricing] ⏱️ Timeout reached (${timeoutMs}ms). Fetch aborted to save execution time.`);
      resolve(null);
    }, timeoutMs);

    promiseSupplier(controller.signal)
      .then((res) => {
        clearTimeout(timeoutId);
        resolve(res);
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          // Handled by timeout
        } else {
          console.error(`[Live Pricing] ❌ Fetch Error:`, err.message);
          clearTimeout(timeoutId);
          resolve(null);
        }
      });
  });
}

/**
 * Fetch Flights using Amadeus Test API
 * Test API caches massive amounts of data for top global routes, perfectly free.
 */
export async function fetchLiveFlights(
  originIata: string,
  destIata: string,
  departureDate: string,
  adults: number = 1
) {
  // Primary: Travelpayouts (free + affiliate links). Falls through to Amadeus.
  const tp = await fetchTravelpayoutsFlights(originIata, destIata, departureDate, adults);
  if (tp) return tp;

  if (!amadeusClient) {
    console.log("[Live Pricing] No Travelpayouts/Amadeus result, skipping live flights.");
    return null;
  }
  
  // Ensure we have 3 letter IATA codes
  if (!originIata || !destIata || originIata.length !== 3 || destIata.length !== 3) {
    console.log(`[Live Pricing] Invalid IATA codes (${originIata}, ${destIata}), skipping.`);
    return null;
  }

  const start = Date.now();
  console.log(`[Live Pricing] ✈️ Fetching Amadeus: ${originIata} -> ${destIata} on ${departureDate}`);

  return withStrictTimeout(async () => {
    const response = await amadeusClient.shopping.flightOffersSearch.get({
      originLocationCode: originIata,
      destinationLocationCode: destIata,
      departureDate: departureDate,
      adults: Math.max(1, Math.min(9, adults)), // Amadeus limits to 9
      max: 10,
      currencyCode: "USD" // Fetch in USD as base anchor
    });

    const data = response.data;
    if (!data || data.length === 0) return null;

    // Extract Total prices (includes taxes)
    const prices = data.map((offer: any) => parseFloat(offer.price.total));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length);

    console.log(`[Live Pricing] ✈️ Success in ${Date.now() - start}ms. Min: $${min}, Avg: $${avg}`);
    
    // Per Person calculation
    const perPerson = {
        min: Math.round(min / adults),
        average: Math.round(avg / adults),
        max: Math.round(max / adults)
    };

    return { pricePerPerson: perPerson, currency: "USD", source: "amadeus_live" };
  }, 6000);
}

/**
 * Fetch Hotels using RapidAPI Booking.com wrapper
 */
export async function fetchLiveHotels(
    destName: string,
    checkInDate: string,
    checkOutDate: string,
    adults: number = 2
) {
    // Primary: Travelpayouts Hotellook (free + affiliate links). Falls through to RapidAPI.
    const tp = await fetchTravelpayoutsHotels(destName, checkInDate, checkOutDate, adults);
    if (tp) return tp;

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
        console.log("[Live Pricing] No Travelpayouts/RapidAPI result, skipping live hotels.");
        return null;
    }

    const start = Date.now();
    console.log(`[Live Pricing] 🏨 Fetching RapidAPI Hotels for: ${destName}`);

    return withStrictTimeout(async (signal) => {
        // First step: location search to get dest_id
        const url = `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?query=${encodeURIComponent(destName)}`;
        const response = await fetch(url, {
            headers: {
                'x-rapidapi-key': rapidApiKey,
                'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
            },
            signal
        });

        if (!response.ok) throw new Error(`RapidAPI destination search status ${response.status}`);
        
        const data = await response.json();
        const destId = data?.data?.[0]?.dest_id;
        if (!destId) return null;

        // Second step: hotels search
        const hotelsUrl = `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels?dest_id=${destId}&search_type=city&arrival_date=${checkInDate}&departure_date=${checkOutDate}&adults=${adults}`;
        const hotelsRes = await fetch(hotelsUrl, {
             headers: {
                'x-rapidapi-key': rapidApiKey,
                'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
            },
            signal
        });
        
        if (!hotelsRes.ok) throw new Error(`RapidAPI hotels search status ${hotelsRes.status}`);

        const hotelsData = await hotelsRes.json();
        const results = hotelsData?.data?.hotels || [];
        if (results.length === 0) return null;

        const checkOut = new Date(checkOutDate).getTime();
        const checkIn = new Date(checkInDate).getTime();
        const nights = Math.max(1, Math.round((checkOut - checkIn) / 86400000));

        // Extract prices and approximate per-night cost
        const prices = results.map((h: any) => {
             const price = h.property?.priceBreakdown?.grossPrice?.value;
             return price ? price / nights : null;
        }).filter((p: number | null) => p !== null && p > 0);

        if (prices.length === 0) return null;

        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const avg = Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length);

        console.log(`[Live Pricing] 🏨 Success in ${Date.now() - start}ms. Min: $${min}, Avg: $${avg}/night`);
        return { min, average: avg, max, currency: "USD", source: "rapidapi_booking_live" };
    }, 6000);
}
