import { Place, PlaceCategory, BudgetLevel } from '@/types';

// ── Zip code → NYC neighbourhood ─────────────────────────────────────────────
const ZIP_TO_NEIGHBORHOOD: Record<string, string> = {
  // Manhattan
  '10001': 'Chelsea',       '10002': 'Lower East Side', '10003': 'East Village',
  '10004': 'Financial District', '10005': 'Financial District', '10006': 'Financial District',
  '10007': 'Tribeca',       '10009': 'East Village',    '10010': 'Chelsea',
  '10011': 'Chelsea',       '10012': 'SoHo',            '10013': 'Tribeca',
  '10014': 'West Village',  '10016': 'Midtown',         '10017': 'Midtown',
  '10018': 'Midtown',       '10019': 'Midtown',         '10020': 'Midtown',
  '10021': 'Upper East Side','10022': 'Midtown',        '10023': 'Upper West Side',
  '10024': 'Upper West Side','10025': 'Upper West Side','10026': 'Harlem',
  '10027': 'Harlem',        '10028': 'Upper East Side', '10029': 'Harlem',
  '10030': 'Harlem',        '10031': 'Harlem',          '10032': 'Harlem',
  '10033': 'Harlem',        '10034': 'Harlem',          '10036': 'Midtown',
  '10037': 'Harlem',        '10038': 'Financial District','10039': 'Harlem',
  '10040': 'Harlem',        '10128': 'Upper East Side', '10280': 'Financial District',
  '10282': 'Tribeca',       '10301': 'Staten Island',
  // Brooklyn
  '11201': 'Brooklyn Heights','11205': 'Fort Greene',   '11206': 'Williamsburg',
  '11207': 'Bushwick',      '11208': 'Bushwick',        '11211': 'Williamsburg',
  '11213': 'Crown Heights', '11215': 'Park Slope',      '11216': 'Bed-Stuy',
  '11217': 'Gowanus',       '11218': 'Park Slope',      '11221': 'Bushwick',
  '11222': 'Greenpoint',    '11225': 'Prospect Heights','11226': 'Crown Heights',
  '11231': 'Carroll Gardens','11232': 'Gowanus',        '11233': 'Bed-Stuy',
  '11237': 'Bushwick',      '11238': 'Prospect Heights','11249': 'Williamsburg',
  // Queens
  '11101': 'Astoria',       '11102': 'Astoria',         '11103': 'Astoria',
  '11104': 'Astoria',       '11105': 'Astoria',         '11106': 'Astoria',
  '11385': 'Ridgewood',     '11386': 'Ridgewood',
};

// NYC zip prefixes (first 3 digits)
const NYC_PREFIXES = new Set([
  '100', '101', '102', '103', '104', // Manhattan
  '112', '113', '114',               // Brooklyn
  '111', '116',                      // Queens / Staten Island fringe
]);

function extractZip(address: string): string | null {
  const m = address.match(/\b(1\d{4})\b/);
  return m ? m[1] : null;
}

function isNYC(address: string): boolean {
  const zip = extractZip(address);
  return zip ? NYC_PREFIXES.has(zip.slice(0, 3)) : false;
}

function inferNeighborhood(address: string): string {
  const zip = extractZip(address);
  if (zip) {
    if (ZIP_TO_NEIGHBORHOOD[zip]) return ZIP_TO_NEIGHBORHOOD[zip];
    if (zip.startsWith('112') || zip.startsWith('113') || zip.startsWith('114'))
      return 'Brooklyn Heights'; // generic Brooklyn fallback
    if (zip.startsWith('111') || zip.startsWith('116'))
      return 'Astoria'; // generic Queens fallback
  }
  return 'New York';
}

function inferCategory(name: string): PlaceCategory {
  const n = name.toLowerCase();
  if (/\b(bar|pub|tavern|brewery|taproom|lounge|speakeasy|dive|bier|biergarten)\b/.test(n)) return 'bar';
  if (/\b(cafe|coffee|espresso|bakery|patisserie|boulangerie|roastery|brew\s?bar)\b/.test(n)) return 'cafe';
  if (/\b(museum|gallery|art\s|institute|moma|whitney|met |guggenheim|smithsonian)\b/.test(n)) return 'museum';
  if (/\b(park|garden|plaza|commons|greenway|promenade|boardwalk|reserve|nature)\b/.test(n)) return 'park';
  if (/\b(shop|store|boutique|market|supply|goods|vintage|records)\b/.test(n)) return 'shop';
  if (/\b(gym|yoga|pilates|climbing|bowl|golf|escape|fitness|spin|class|studio|skating|rink)\b/.test(n)) return 'activity';
  if (/\b(cocktail|wine bar|winery|distillery|cellar)\b/.test(n)) return 'bar';
  // Explicit food keywords
  if (/\b(restaurant|kitchen|grill|diner|bistro|eatery|brasserie|osteria|trattoria|ramen|sushi|pizza|taco|burger|steak|seafood|bbq|smokehouse|dim\s?sum|izakaya|chophouse|steakhouse|buffet|cantina|taqueria|noodle|dumpling|pho|curry|shawarma)\b/.test(n)) return 'restaurant';
  // Default — most saved places are restaurants
  return 'restaurant';
}

function inferPriceLevel(name: string): BudgetLevel {
  const n = name.toLowerCase();
  // Luxury keywords → 4
  if (/\b(per se|le bernardin|eleven madison|masa|chef.s table|daniel|jean-georges|gabriel kreuther|blue hill)\b/.test(n)) return 4;
  // Mid-upscale → 3
  if (/\b(upscale|fine dining|tasting menu|omakase|prix fixe)\b/.test(n)) return 3;
  // Cheap → 1
  if (/\b(bodega|deli|dollar|hot dog|street|cart|halal|slice|cheap eats)\b/.test(n)) return 1;
  return 2; // moderate default
}

// ── Main parser ───────────────────────────────────────────────────────────────

export interface ImportResult {
  imported: Place[];
  /** Places that had an address but weren't in NYC */
  skippedOutsideNYC: number;
  /** Total features in the file */
  total: number;
}

export function parseGoogleMapsJson(raw: unknown): ImportResult {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid JSON structure');

  const obj = raw as Record<string, unknown>;
  let features: unknown[] = [];

  if (Array.isArray(obj['features'])) {
    features = obj['features']; // GeoJSON FeatureCollection (standard Takeout format)
  } else if (Array.isArray(raw)) {
    features = raw as unknown[];
  } else {
    throw new Error('Unrecognized format — expected a GeoJSON FeatureCollection');
  }

  const total = features.length;
  let skippedOutsideNYC = 0;
  const imported: Place[] = [];
  const seenNames = new Set<string>();

  for (const feature of features) {
    try {
      const f = feature as Record<string, unknown>;
      const props = (f['properties'] ?? f) as Record<string, unknown>;
      const location = (props['Location'] ?? {}) as Record<string, unknown>;

      const name = String(props['Title'] ?? location['Business Name'] ?? '').trim();
      if (!name || name === 'undefined') continue;

      // Deduplicate by name
      const nameKey = name.toLowerCase();
      if (seenNames.has(nameKey)) continue;
      seenNames.add(nameKey);

      const address = String(location['Address'] ?? props['address'] ?? '').trim();

      // Filter to NYC only (skip if address present but clearly non-NYC)
      if (address && !isNYC(address)) {
        skippedOutsideNYC++;
        continue;
      }

      const neighborhood = address ? inferNeighborhood(address) : 'New York';
      const category = inferCategory(name);
      const priceLevel = inferPriceLevel(name);
      const createdAt = String(props['Published'] ?? props['Updated'] ?? new Date().toISOString());

      imported.push({
        id: `gm_${Math.random().toString(36).slice(2, 10)}`,
        name,
        category,
        neighborhood,
        priceLevel,
        source: 'google_maps',
        vibes: [],
        address: address || undefined,
        createdAt,
      });
    } catch {
      // skip malformed entries silently
    }
  }

  return { imported, skippedOutsideNYC, total };
}
