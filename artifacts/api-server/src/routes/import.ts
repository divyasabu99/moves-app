import { Router } from "express";

const router = Router();

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScrapedPlace {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

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
  // Try named neighbourhood patterns
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

// ── HTML Scrapers ─────────────────────────────────────────────────────────────

function extractListName(html: string): string {
  const og = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/);
  if (og) return og[1].replace(" - Google Maps", "").trim();
  const title = html.match(/<title>([^<]+)<\/title>/);
  if (title) return title[1].replace(" - Google Maps", "").trim();
  return "Google Maps List";
}

/** Strategy 1 — LD+JSON structured data (cleanest, not always present) */
function fromLdJson(html: string): ScrapedPlace[] {
  const places: ScrapedPlace[] = [];
  const re = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const d = JSON.parse(m[1]);
      if (d["@type"] === "ItemList" && Array.isArray(d.itemListElement)) {
        for (const item of d.itemListElement) {
          const it = item.item ?? item;
          if (it?.name) {
            places.push({
              name: it.name,
              address: it.address?.streetAddress ?? it.address ?? "",
              lat: it.geo?.latitude,
              lng: it.geo?.longitude,
            });
          }
        }
      } else if (d?.name && d?.geo) {
        places.push({ name: d.name, address: d.address?.streetAddress ?? "", lat: d.geo.latitude, lng: d.geo.longitude });
      }
    } catch { /* skip */ }
  }
  return places;
}

/** Strategy 2 — Parse the large AF_initDataCallback arrays Google embeds */
function fromAfCallbacks(html: string): ScrapedPlace[] {
  const places: ScrapedPlace[] = [];
  const seen = new Set<string>();

  // Pull out every AF_initDataCallback or _AF_jss payload
  const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let sm: RegExpExecArray | null;
  while ((sm = scriptRe.exec(html))) {
    const block = sm[1];
    if (!block.includes("AF_initDataCallback") && !block.includes("_AF_jss")) continue;

    // Find every lat/lng pair that is in NYC
    const coordRe = /\[(\d{2}\.\d+),(-7[34]\.\d+)\]/g;
    let cm: RegExpExecArray | null;
    while ((cm = coordRe.exec(block))) {
      const lat = parseFloat(cm[1]);
      const lng = parseFloat(cm[2]);
      if (!isNYCCoord(lat, lng)) continue;

      // Walk backwards from this position to find the nearest non-trivial string
      const before = block.slice(0, cm.index);
      const strings = before.match(/"([^"\\]{3,80})"/g) ?? [];
      // Walk from the end backwards, skip URLs, hashes, and numeric strings
      let name = "";
      for (let i = strings.length - 1; i >= 0; i--) {
        const s = strings[i].slice(1, -1);
        if (s.match(/^https?:|^\d+$|^[a-f0-9]{10,}$/i)) continue;
        if (s.includes("\\u") || s.includes("AF_") || s.startsWith("_")) continue;
        name = s;
        break;
      }
      if (!name) continue;
      if (seen.has(name)) continue;
      seen.add(name);

      // Try to find an address string nearby (after the coordinates)
      const after = block.slice(cm.index, cm.index + 500);
      const addrM = after.match(/"(\d+[^"]{5,60}(?:Ave|St|Blvd|Dr|Rd|Ln|Pl|Way|Pkwy)[^"]*)"/i);
      const address = addrM ? addrM[1] : "";

      places.push({ name, address, lat, lng });
    }
  }
  return places;
}

/** Strategy 3 — Mine raw text for place-like patterns when other strategies fail */
function fromRawHtml(html: string): ScrapedPlace[] {
  // Strip tags
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  // NYC street address pattern
  const addrRe = /\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Place|Pl|Drive|Dr|Road|Rd|Lane|Ln|Way|Parkway|Pkwy|Broadway),?\s+(?:New York|Brooklyn|Queens|Bronx|Staten Island)/g;
  const places: ScrapedPlace[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = addrRe.exec(text))) {
    const address = m[0].trim();
    if (seen.has(address)) continue;
    seen.add(address);
    places.push({ name: address.split(",")[0], address });
  }
  return places;
}

// ── Coordinate → Place conversion ─────────────────────────────────────────────

function toImportPlace(sp: ScrapedPlace) {
  const neighborhood = sp.address ? neighborhoodFromAddress(sp.address) : "New York";
  return {
    id: makeId(),
    name: sp.name,
    category: inferCategory(sp.name),
    neighborhood,
    priceLevel: 2,
    source: "google_maps",
    vibes: [],
    address: sp.address || undefined,
    createdAt: new Date().toISOString(),
  };
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

  // Basic URL validation
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  const allowed = ["maps.app.goo.gl", "www.google.com", "google.com", "maps.google.com"];
  if (!allowed.some(h => parsed.hostname.endsWith(h))) {
    res.status(400).json({ error: "URL must be a Google Maps link" });
    return;
  }

  try {
    const html = await fetchPage(parsed.href);
    const listName = extractListName(html);

    // Try strategies in order
    let raw = fromLdJson(html);
    if (raw.length === 0) raw = fromAfCallbacks(html);
    if (raw.length === 0) raw = fromRawHtml(html);

    // Filter to NYC and shape into Place objects
    const nycPlaces = raw.filter(p =>
      p.lat !== undefined
        ? isNYCCoord(p.lat!, p.lng!)
        : p.address
          ? /\b(10\d{3}|11[012]\d{2})\b/.test(p.address) || /new york|brooklyn|queens|bronx/i.test(p.address)
          : false
    );

    const skipped = raw.length - nycPlaces.length;
    const places = nycPlaces.map(toImportPlace);

    // Deduplicate by name
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

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    },
    // @ts-ignore – Node 18+ built-in fetch supports redirect
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Google returned ${res.status}`);
  return res.text();
}

export default router;
