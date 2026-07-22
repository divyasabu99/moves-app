import { Router } from "express";

const router = Router();

// ── NYC helpers ───────────────────────────────────────────────────────────────

const NYC_LAT = [40.4, 40.95] as const;
const NYC_LNG = [-74.35, -73.65] as const;

function isNYCCoord(lat: number, lng: number) {
  return lat >= NYC_LAT[0] && lat <= NYC_LAT[1] && lng >= NYC_LNG[0] && lng <= NYC_LNG[1];
}

const ZIP_TO_NEIGHBORHOOD: Record<string, string> = {
  "10001": "Chelsea", "10002": "Lower East Side", "10003": "East Village",
  "10004": "Financial District", "10005": "Financial District", "10006": "Financial District",
  "10007": "Tribeca", "10009": "East Village", "10010": "Chelsea", "10011": "Chelsea",
  "10012": "SoHo", "10013": "Tribeca", "10014": "West Village", "10016": "Midtown",
  "10017": "Midtown", "10018": "Midtown", "10019": "Midtown", "10021": "Upper East Side",
  "10022": "Midtown", "10023": "Upper West Side", "10024": "Upper West Side",
  "10025": "Upper West Side", "10026": "Harlem", "10027": "Harlem", "10028": "Upper East Side",
  "10029": "Harlem", "10030": "Harlem", "10031": "Harlem", "10036": "Midtown",
  "10038": "Financial District", "10128": "Upper East Side", "10280": "Financial District",
  "10282": "Tribeca",
  "11201": "Brooklyn Heights", "11205": "Fort Greene", "11206": "Williamsburg",
  "11211": "Williamsburg", "11213": "Crown Heights", "11215": "Park Slope",
  "11216": "Bed-Stuy", "11217": "Gowanus", "11218": "Park Slope", "11221": "Bushwick",
  "11222": "Greenpoint", "11225": "Prospect Heights", "11226": "Crown Heights",
  "11231": "Carroll Gardens", "11232": "Gowanus", "11233": "Bed-Stuy", "11237": "Bushwick",
  "11238": "Prospect Heights", "11249": "Williamsburg",
  "11101": "Astoria", "11102": "Astoria", "11103": "Astoria", "11104": "Astoria",
  "11105": "Astoria", "11106": "Astoria", "11375": "Forest Hills",
};

function neighborhoodFromAddress(address: string): string {
  const zip = address.match(/\b(1\d{4})\b/)?.[1];
  if (zip && ZIP_TO_NEIGHBORHOOD[zip]) return ZIP_TO_NEIGHBORHOOD[zip];
  for (const [hood, pat] of [
    ["Williamsburg", /williamsburg/i], ["Bushwick", /bushwick/i],
    ["Astoria", /astoria/i], ["Greenpoint", /greenpoint/i],
    ["Park Slope", /park slope/i], ["Bed-Stuy", /bed-?stuy|bedford.stuyvesant/i],
    ["Crown Heights", /crown heights/i], ["Carroll Gardens", /carroll gardens/i],
    ["Fort Greene", /fort greene/i], ["Gowanus", /gowanus/i],
    ["Upper East Side", /upper east side/i], ["Upper West Side", /upper west side/i],
    ["West Village", /west village/i], ["East Village", /east village/i],
    ["Lower East Side", /lower east side/i], ["SoHo", /\bsoho\b/i],
    ["Tribeca", /tribeca/i], ["Chelsea", /\bchelsea\b/i],
    ["Midtown", /midtown/i], ["Harlem", /harlem/i],
    ["Financial District", /financial district|fidi/i],
    ["Brooklyn Heights", /brooklyn heights/i],
  ] as [string, RegExp][]) {
    if (pat.test(address)) return hood;
  }
  if (/brooklyn/i.test(address)) return "Brooklyn";
  if (/queens/i.test(address)) return "Queens";
  if (/bronx/i.test(address)) return "Bronx";
  return "New York";
}

function inferCategory(name: string): string {
  const n = name.toLowerCase();
  if (/\b(bar|pub|tavern|brewery|taproom|lounge|speakeasy|dive|cocktail|wine bar|winery|distillery)\b/.test(n)) return "bar";
  if (/\b(cafe|coffee|espresso|bakery|patisserie|boulangerie|roastery)\b/.test(n)) return "cafe";
  if (/\b(museum|gallery|moma|whitney|guggenheim|smithsonian|institute)\b/.test(n)) return "museum";
  if (/\b(park|garden|plaza|commons|greenway|promenade|boardwalk|reserve|nature)\b/.test(n)) return "park";
  if (/\b(shop|store|boutique|market|supply|goods|vintage|records)\b/.test(n)) return "shop";
  if (/\b(gym|yoga|pilates|climbing|fitness|spin|studio|skating|rink|bowling|golf|escape)\b/.test(n)) return "activity";
  return "restaurant";
}

function makeId() {
  return "gm_" + Math.random().toString(36).slice(2, 10);
}

// ── Google Maps Internal API ───────────────────────────────────────────────────

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
};

/**
 * Resolve a maps.app.goo.gl short link to the canonical placelists URL
 * by following the HTTP redirect without executing JavaScript.
 */
async function resolveShortLink(url: string): Promise<string> {
  // Use a minimal User-Agent only — a full Accept: text/html header causes
  // Firebase Dynamic Links to serve an interstitial page (200) instead of
  // returning the redirect destination (302).
  const res = await fetch(url, {
    method: "HEAD",
    headers: { "User-Agent": "curl/8.1" },
    redirect: "manual",
  });
  const location = res.headers.get("location");
  if (!location) {
    return url;
  }
  return location;
}

/**
 * Extract the placelist ID from a Google Maps placelists URL.
 * Handles:
 *   https://www.google.com/maps/placelists/list/{id}
 *   https://www.google.com/maps/@/data=!3m1!4b1!4m3!11m2!2s{id}!4s...
 */
function extractListId(url: string): string | null {
  // Standard placelists URL
  const m1 = url.match(/\/maps\/placelists\/list\/([A-Za-z0-9_-]+)/);
  if (m1) return m1[1];

  // @/data= encoded URL — list ID is after !2s or !11m2!2s
  const m2 = url.match(/!2s([A-Za-z0-9_-]{20,})/);
  if (m2) return m2[1];

  return null;
}

interface RawPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

/**
 * Fetch a Google Maps saved list using the internal entitylist API.
 * Returns the list name and an array of raw places.
 *
 * The endpoint is:
 *   GET /maps/preview/entitylist/getlist?authuser=0&hl=en&gl=us&pb=!1m1!1s{listId}!2e2!3e2!4i500
 *
 * Response format (after stripping the ")]}'" XSSI prefix):
 *   data[0][4]  = list name (string)
 *   data[0][8]  = array of place entries, where each entry:
 *     p[2]      = place name
 *     p[1][4]   = address string
 *     p[1][5]   = [null, null, lat, lng]
 */
async function fetchPlaceList(listId: string): Promise<{ listName: string; places: RawPlace[] }> {
  const pb = `!1m1!1s${encodeURIComponent(listId)}!2e2!3e2!4i500`;
  const apiUrl = `https://www.google.com/maps/preview/entitylist/getlist?authuser=0&hl=en&gl=us&pb=${pb}`;

  const res = await fetch(apiUrl, {
    headers: {
      ...FETCH_HEADERS,
      Accept: "*/*",
      Referer: "https://www.google.com/maps/",
    },
  });

  if (!res.ok) {
    throw new Error(`Google Maps API returned ${res.status}`);
  }

  const text = await res.text();
  // Strip XSSI prefix ")]}'\n"
  const json = text.replace(/^\)\]\}'\n/, "");
  const data = JSON.parse(json);

  const header = data[0];
  const listName: string = header[4] ?? "Google Maps List";
  const rawEntries: any[] = header[8] ?? [];

  const places: RawPlace[] = [];
  for (const entry of rawEntries) {
    try {
      const name: string = entry[2];
      const info = entry[1];
      const address: string = info?.[4] ?? "";
      const coords = info?.[5];
      const lat = coords?.[2];
      const lng = coords?.[3];

      if (!name || typeof lat !== "number" || typeof lng !== "number") continue;

      places.push({ name, address, lat, lng });
    } catch {
      // skip malformed entries
    }
  }

  return { listName, places };
}

// ── Route ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/import/google-maps-list
 * Body: { url: string }
 * Response: { listName, places, total, skippedOutsideNYC }
 */
router.post("/import/google-maps-list", async (req, res) => {
  const { url } = req.body as { url?: string };
  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "url is required" });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  const allowed = ["maps.app.goo.gl", "www.google.com", "google.com", "maps.google.com"];
  if (!allowed.some(h => parsed.hostname === h || parsed.hostname.endsWith("." + h))) {
    res.status(400).json({ error: "URL must be a Google Maps link" });
    return;
  }

  try {
    // Step 1: resolve short links to get the canonical placelists URL
    let canonicalUrl = url.trim();
    if (parsed.hostname === "maps.app.goo.gl") {
      canonicalUrl = await resolveShortLink(canonicalUrl);
    }

    // Step 2: extract the list ID
    const listId = extractListId(canonicalUrl);
    if (!listId) {
      res.status(400).json({
        error:
          "Could not find a saved list in that URL. Make sure you are sharing a saved list, not a single place.",
      });
      return;
    }

    // Step 3: fetch place data from the internal API
    const { listName, places: raw } = await fetchPlaceList(listId);

    // Step 4: filter to NYC
    const nycPlaces = raw.filter(p => isNYCCoord(p.lat, p.lng));
    const skipped = raw.length - nycPlaces.length;

    // Step 5: shape into Place objects
    const places = nycPlaces.map(p => ({
      id: makeId(),
      name: p.name,
      category: inferCategory(p.name),
      neighborhood: p.address ? neighborhoodFromAddress(p.address) : "New York",
      priceLevel: 2,
      source: "google_maps",
      vibes: [],
      address: p.address || undefined,
      createdAt: new Date().toISOString(),
    }));

    // Step 6: deduplicate by name
    const seen = new Set<string>();
    const deduped = places.filter(p => {
      const k = p.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    res.json({ listName, places: deduped, total: raw.length, skippedOutsideNYC: skipped });
  } catch (err: any) {
    res.status(502).json({ error: err?.message ?? "Failed to fetch the Google Maps list" });
  }
});

export default router;
