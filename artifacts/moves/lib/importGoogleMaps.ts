import { Place, PlaceCategory, BudgetLevel } from '@/types';

// ── Zip code → NYC neighbourhood ─────────────────────────────────────────────
const ZIP_TO_NEIGHBORHOOD: Record<string, string> = {
  // Manhattan
  '10001': 'Chelsea',         '10002': 'Lower East Side', '10003': 'East Village',
  '10004': 'Financial District','10005': 'Financial District','10006': 'Financial District',
  '10007': 'Tribeca',         '10009': 'East Village',    '10010': 'Chelsea',
  '10011': 'Chelsea',         '10012': 'SoHo',            '10013': 'Tribeca',
  '10014': 'West Village',    '10016': 'Midtown',         '10017': 'Midtown',
  '10018': 'Midtown',         '10019': 'Midtown',         '10020': 'Midtown',
  '10021': 'Upper East Side', '10022': 'Midtown',         '10023': 'Upper West Side',
  '10024': 'Upper West Side', '10025': 'Upper West Side', '10026': 'Harlem',
  '10027': 'Harlem',          '10028': 'Upper East Side', '10029': 'Harlem',
  '10030': 'Harlem',          '10031': 'Harlem',          '10032': 'Harlem',
  '10033': 'Harlem',          '10034': 'Harlem',          '10036': 'Midtown',
  '10037': 'Harlem',          '10038': 'Financial District','10039': 'Harlem',
  '10040': 'Harlem',          '10128': 'Upper East Side', '10280': 'Financial District',
  '10282': 'Tribeca',
  // Brooklyn
  '11201': 'Brooklyn Heights','11205': 'Fort Greene',     '11206': 'Williamsburg',
  '11207': 'Bushwick',        '11208': 'Bushwick',        '11211': 'Williamsburg',
  '11213': 'Crown Heights',   '11215': 'Park Slope',      '11216': 'Bed-Stuy',
  '11217': 'Gowanus',         '11218': 'Park Slope',      '11221': 'Bushwick',
  '11222': 'Greenpoint',      '11225': 'Prospect Heights','11226': 'Crown Heights',
  '11231': 'Carroll Gardens', '11232': 'Gowanus',         '11233': 'Bed-Stuy',
  '11237': 'Bushwick',        '11238': 'Prospect Heights','11249': 'Williamsburg',
  // Queens
  '11101': 'Astoria',         '11102': 'Astoria',         '11103': 'Astoria',
  '11104': 'Astoria',         '11105': 'Astoria',         '11106': 'Astoria',
  '11385': 'Ridgewood',       '11386': 'Ridgewood',
};

const NYC_PREFIXES = new Set(['100','101','102','103','104','112','113','114','111','116']);

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
    if (zip.startsWith('112') || zip.startsWith('113') || zip.startsWith('114')) return 'Brooklyn Heights';
    if (zip.startsWith('111') || zip.startsWith('116')) return 'Astoria';
  }
  return 'New York';
}

function inferCategory(name: string): PlaceCategory {
  const n = name.toLowerCase();
  if (/\b(bar|pub|tavern|brewery|taproom|lounge|speakeasy|dive|biergarten|cocktail|wine bar|winery|distillery|cellar)\b/.test(n)) return 'bar';
  if (/\b(cafe|coffee|espresso|bakery|patisserie|boulangerie|roastery)\b/.test(n)) return 'cafe';
  if (/\b(museum|gallery|art\s|institute|moma|whitney|met |guggenheim|smithsonian)\b/.test(n)) return 'museum';
  if (/\b(park|garden|plaza|commons|greenway|promenade|boardwalk|reserve|nature)\b/.test(n)) return 'park';
  if (/\b(shop|store|boutique|market|supply|goods|vintage|records)\b/.test(n)) return 'shop';
  if (/\b(gym|yoga|pilates|climbing|bowl|golf|escape|fitness|spin|studio|skating|rink)\b/.test(n)) return 'activity';
  if (/\b(restaurant|kitchen|grill|diner|bistro|eatery|brasserie|osteria|trattoria|ramen|sushi|pizza|taco|burger|steak|seafood|bbq|smokehouse|dim\s?sum|izakaya|chophouse|noodle|dumpling|pho|curry|cantina|taqueria)\b/.test(n)) return 'restaurant';
  return 'restaurant';
}

function inferPriceLevel(name: string): BudgetLevel {
  const n = name.toLowerCase();
  if (/\b(per se|le bernardin|eleven madison|masa|daniel|jean-georges|gabriel kreuther)\b/.test(n)) return 4;
  if (/\b(omakase|prix fixe|tasting menu|fine dining)\b/.test(n)) return 3;
  if (/\b(bodega|deli|dollar|street cart|halal cart|slice)\b/.test(n)) return 1;
  return 2;
}

// ── Format parsers ────────────────────────────────────────────────────────────

/**
 * Old Takeout format:
 *   properties.Title / properties.Location.Business Name
 *   properties.Location.Address
 */
function parseOldFormat(features: any[]): { places: Place[]; skipped: number } {
  const places: Place[] = [];
  let skipped = 0;
  const seen = new Set<string>();

  for (const f of features) {
    try {
      const props = f.properties ?? {};
      const location = props.Location ?? {};
      const name = String(props.Title ?? location['Business Name'] ?? '').trim();
      if (!name || name === 'undefined') continue;
      const nameKey = name.toLowerCase();
      if (seen.has(nameKey)) continue;
      seen.add(nameKey);

      const address = String(location.Address ?? '').trim();
      if (address && !isNYC(address)) { skipped++; continue; }

      places.push({
        id: `gm_${Math.random().toString(36).slice(2, 10)}`,
        name,
        category: inferCategory(name),
        neighborhood: address ? inferNeighborhood(address) : 'New York',
        priceLevel: inferPriceLevel(name),
        source: 'google_maps',
        vibes: [],
        address: address || undefined,
        createdAt: String(props.Published ?? props.Updated ?? new Date().toISOString()),
      });
    } catch { /* skip */ }
  }
  return { places, skipped };
}

/**
 * New Takeout format (2025+):
 *   properties.google_maps_url  (address encoded in ?q= param)
 *   properties.date
 *   No business name provided by Google
 */
function parseNewFormat(features: any[]): { places: Place[]; skipped: number } {
  const places: Place[] = [];
  let skipped = 0;
  const seen = new Set<string>();

  for (const f of features) {
    try {
      const props = f.properties ?? {};
      const url: string = String(props.google_maps_url ?? props['Google Maps URL'] ?? '');
      if (!url) continue;

      // Extract the q= parameter
      const qMatch = url.match(/[?&]q=([^&]+)/);
      if (!qMatch) continue;
      const rawQ = decodeURIComponent(qMatch[1].replace(/\+/g, ' ')).trim();
      if (!rawQ) continue;

      // rawQ is typically "308 E 8th St, New York, NY 10009"
      // Use just the street part (before the city) as the name
      const commaParts = rawQ.split(',');
      const streetPart = commaParts[0].trim();

      // Check if NYC
      if (!isNYC(rawQ)) { skipped++; continue; }

      // Deduplicate on the full address
      if (seen.has(rawQ.toLowerCase())) continue;
      seen.add(rawQ.toLowerCase());

      const neighborhood = inferNeighborhood(rawQ);

      places.push({
        id: `gm_${Math.random().toString(36).slice(2, 10)}`,
        name: streetPart,  // best we can do without business name
        category: 'restaurant', // can't infer from address alone
        neighborhood,
        priceLevel: 2,
        source: 'google_maps',
        vibes: [],
        address: rawQ,
        createdAt: String(props.date ?? new Date().toISOString()),
      });
    } catch { /* skip */ }
  }
  return { places, skipped };
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface ImportResult {
  imported: Place[];
  skippedOutsideNYC: number;
  total: number;
  /** True when Google's new format was detected (no business names) */
  noNames: boolean;
}

export function parseGoogleMapsJson(raw: unknown): ImportResult {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid JSON structure');

  const obj = raw as Record<string, unknown>;
  let features: any[] = [];

  if (Array.isArray(obj['features'])) {
    features = obj['features'];
  } else if (Array.isArray(raw)) {
    features = raw as any[];
  } else {
    throw new Error('Unrecognized format — expected a GeoJSON FeatureCollection');
  }

  const total = features.length;
  if (total === 0) return { imported: [], skippedOutsideNYC: 0, total, noNames: false };

  // Detect format by inspecting the first feature with data
  const sample = features.find(f => f?.properties);
  const props = sample?.properties ?? {};
  const isNewFormat = !props.Title && !props.Location && !!props.google_maps_url;

  const { places, skipped } = isNewFormat
    ? parseNewFormat(features)
    : parseOldFormat(features);

  return { imported: places, skippedOutsideNYC: skipped, total, noNames: isNewFormat };
}
