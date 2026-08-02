import { Place, PlaceCategory, GeneratedItinerary, PlanInput, Stop, BudgetLevel, Transit, GroupMemberPlaces } from '@/types';

// ── Transit computation ───────────────────────────────────────────────────────

const BOROUGH_MANHATTAN = new Set([
  'West Village', 'East Village', 'SoHo', 'Lower East Side', 'Midtown', 'Chelsea',
  'Upper West Side', 'Upper East Side', 'Harlem', 'Tribeca', 'NoLIta',
  'Greenwich Village', 'Financial District', 'Meatpacking District',
]);
const BOROUGH_BROOKLYN = new Set([
  'Williamsburg', 'Brooklyn Heights', 'Park Slope', 'Bushwick', 'DUMBO',
  'Crown Heights', 'Greenpoint', 'Gowanus', 'Fort Greene', 'Cobble Hill',
  'Carroll Gardens', 'Bed-Stuy', 'Prospect Heights',
]);
const BOROUGH_QUEENS = new Set(['Astoria', 'Ridgewood']);

function borough(neighborhood: string): string {
  if (BOROUGH_MANHATTAN.has(neighborhood)) return 'manhattan';
  if (BOROUGH_BROOKLYN.has(neighborhood)) return 'brooklyn';
  if (BOROUGH_QUEENS.has(neighborhood)) return 'queens';
  return 'other';
}

// Neighborhoods that are genuinely walkable to each other (≤15 min on foot)
const WALKABLE_PAIRS = new Set([
  'West Village|Greenwich Village', 'Greenwich Village|West Village',
  'West Village|Meatpacking District', 'Meatpacking District|West Village',
  'West Village|Chelsea', 'Chelsea|West Village',
  'SoHo|NoLIta', 'NoLIta|SoHo',
  'SoHo|Lower East Side', 'Lower East Side|SoHo',
  'Tribeca|Financial District', 'Financial District|Tribeca',
  'East Village|Lower East Side', 'Lower East Side|East Village',
  'Williamsburg|Greenpoint', 'Greenpoint|Williamsburg',
  'Williamsburg|Bushwick', 'Bushwick|Williamsburg',
  'Park Slope|Gowanus', 'Gowanus|Park Slope',
  'Fort Greene|DUMBO', 'DUMBO|Fort Greene',
  'Cobble Hill|Carroll Gardens', 'Carroll Gardens|Cobble Hill',
  'Brooklyn Heights|DUMBO', 'DUMBO|Brooklyn Heights',
  'Crown Heights|Prospect Heights', 'Prospect Heights|Crown Heights',
]);

export function computeTransit(from: Place, to: Place): Transit {
  const a = from.neighborhood;
  const b = to.neighborhood;

  // Same spot
  if (a === b) return { mode: 'walk', estimatedMinutes: 7 };

  // Walkable neighbour pairs
  if (WALKABLE_PAIRS.has(`${a}|${b}`)) return { mode: 'walk', estimatedMinutes: 12 };

  const ba = borough(a);
  const bb = borough(b);

  // Same borough → subway/bus
  if (ba === bb && ba !== 'other') {
    const mins = ba === 'manhattan' ? 14 : 18;
    return { mode: 'subway', estimatedMinutes: mins };
  }

  // Brooklyn ↔ Queens fringe
  if ((ba === 'brooklyn' && bb === 'queens') || (ba === 'queens' && bb === 'brooklyn')) {
    return { mode: 'subway', estimatedMinutes: 16 };
  }

  // Cross-borough → rideshare
  return { mode: 'rideshare', estimatedMinutes: 24 };
}

export const VIBES = [
  'Dinner & Drinks',
  'Date Night',
  'Night Out',
  'Brunch Run',
  'Foodie Crawl',
  'Low-Key Vibes',
  'Sports Day',
  'Self Care Day',
  'Park Day',
  'Dog Day',
  // Legacy — kept for existing itineraries
  'Museum Day',
  'Cultural Day',
] as const;

export type Vibe = (typeof VIBES)[number];

export const VIBE_SEQUENCES: Record<string, PlaceCategory[][]> = {
  'Dinner & Drinks': [
    ['restaurant', 'bar'],
    ['cafe', 'restaurant', 'bar'],
    ['restaurant', 'bar', 'bar'],
  ],
  'Date Night': [
    ['activity', 'restaurant', 'bar'],
    ['museum', 'restaurant', 'bar'],
    ['restaurant', 'bar'],
  ],
  'Museum Day': [
    ['museum', 'cafe'],
    ['museum', 'museum', 'cafe'],
    ['museum', 'activity', 'cafe'],
  ],
  'Brunch Run': [
    ['cafe', 'activity'],
    ['cafe', 'cafe'],
    ['cafe', 'park'],
  ],
  'Night Out': [
    ['restaurant', 'bar', 'bar'],
    ['bar', 'restaurant', 'bar'],
    ['activity', 'bar', 'restaurant'],
  ],
  'Foodie Crawl': [
    ['cafe', 'restaurant', 'bar'],
    ['restaurant', 'cafe', 'restaurant'],
    ['restaurant', 'cafe', 'bar'],
  ],
  'Cultural Day': [
    ['museum', 'activity', 'cafe'],
    ['museum', 'museum', 'activity'],
    ['activity', 'museum', 'cafe'],
  ],
  'Low-Key Vibes': [
    ['cafe', 'park'],
    ['activity', 'cafe'],
    ['cafe', 'activity', 'park'],
  ],
  'Sports Day': [
    ['bar', 'restaurant'],
    ['activity', 'bar'],
    ['restaurant', 'bar', 'bar'],
  ],
  'Self Care Day': [
    ['activity', 'cafe'],
    ['activity', 'park'],
    ['cafe', 'activity'],
  ],
  'Park Day': [
    ['park', 'cafe'],
    ['park', 'activity'],
    ['cafe', 'park', 'cafe'],
  ],
  'Dog Day': [
    ['park', 'cafe'],
    ['activity', 'park'],
    ['park', 'restaurant'],
  ],
};

const CATEGORY_DURATIONS: Record<PlaceCategory, number> = {
  restaurant: 90,
  bar: 60,
  cafe: 45,
  museum: 120,
  activity: 90,
  park: 60,
  shop: 45,
};

const PRICE_PER_LEVEL: Record<number, number> = { 1: 15, 2: 30, 3: 55, 4: 85 };

/** Parse "7:00 PM" or "11:30 AM" to total minutes since midnight */
export function parseTimeToMinutes(time: string): number {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 19 * 60;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + mins;
}

/** Format minutes-since-midnight back to "7:00 PM" */
export function minutesToTimeString(totalMins: number): string {
  const h24 = totalMins % (24 * 60);
  const h = Math.floor(h24 / 60);
  const m = h24 % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

/** Canonical key used to match "same place" across users */
function placeKey(name: string, neighborhood: string): string {
  return `${name.trim().toLowerCase()}|${neighborhood.trim().toLowerCase()}`;
}

/**
 * Score a single candidate place for a given target category and plan context.
 *
 * Signals (in descending weight):
 *   1. Group interest     — how many group members saved this place
 *   2. Saved-by count     — redundant with above but also caps the bonus
 *   3. Category fit       — guaranteed by caller guard, small constant bonus
 *   4. Neighborhood fit   — whether it's in the user's requested hoods
 *   5. Budget fit         — price level vs. selected budget range
 *   6. Route efficiency   — same-borough continuity (captured via hood match)
 *   7. Ratings & quality  — star rating above 3.0
 *   8. Availability conf. — source platform quality
 *   9. Novelty            — place the user hasn't visited yet (not in a done move)
 */
function scorePlace(
  place: Place,
  input: PlanInput,
  targetCategory: PlaceCategory,
  groupSaveCounts: Map<string, number>,
  totalGroupMembers: number,
  visitedPlaceKeys: Set<string>,
): number {
  if (place.category !== targetCategory) return 0;

  let score = 50;

  // ── 1 & 2. Group interest + saved-by count ──────────────────────────────────
  const key = placeKey(place.name, place.neighborhood);
  const savedByCount = groupSaveCounts.get(key) ?? 0;
  if (savedByCount > 0) {
    // +20 per member who saved it (capped at +60 so a single enthusiast
    // doesn't completely dominate)
    score += Math.min(savedByCount * 20, 60);
    // Proportional group-consensus bonus (fraction of members who want this)
    if (totalGroupMembers > 0) {
      score += Math.round((savedByCount / totalGroupMembers) * 15);
    }
  }

  // ── 3. Category fit ─────────────────────────────────────────────────────────
  score += 5; // already guaranteed by guard above; small constant

  // ── 4. Neighborhood match ────────────────────────────────────────────────────
  const hoods = (input.neighborhood ?? []).map(n => n.toLowerCase());
  const placeHood = place.neighborhood.toLowerCase();
  if (hoods.length === 0) {
    score += 10; // no filter — no penalty
  } else if (hoods.some(h => placeHood.includes(h) || h.includes(placeHood.split(' ')[0]))) {
    score += 30;
  }
  // Route efficiency is implicitly captured: staying in the same neighborhood
  // cluster avoids cross-borough rideshare and scores higher here.

  // ── 5. Budget fit ────────────────────────────────────────────────────────────
  const budgets: BudgetLevel[] = Array.isArray(input.budgetLevel)
    ? input.budgetLevel
    : [input.budgetLevel as unknown as BudgetLevel];
  if (budgets.length === 0) {
    score += 10;
  } else if (budgets.includes(place.priceLevel)) {
    score += 18; // exact match
  } else {
    const minB = Math.min(...budgets);
    const maxB = Math.max(...budgets);
    if (place.priceLevel >= minB && place.priceLevel <= maxB) {
      score += 8; // within range but not exact level
    } else {
      score -= 10; // outside budget — hard discourage
    }
  }

  // ── 7. Ratings & quality ─────────────────────────────────────────────────────
  score += ((place.rating ?? 4.0) - 3.0) * 5;

  // ── 8. Availability confidence (source platform) ──────────────────────────────
  const sourceBonus: Record<string, number> = {
    beli: 8, yelp: 5, google_maps: 3, manual: 1, ai_suggested: 2,
  };
  score += sourceBonus[place.source] ?? 0;

  // ── 9. Novelty — places the user hasn't visited yet ─────────────────────────
  // "Visited" means the place appeared in a move the user marked as done.
  // Unvisited places get a discovery bonus; already-done spots don't.
  if (visitedPlaceKeys && !visitedPlaceKeys.has(placeKey(place.name, place.neighborhood))) {
    score += 6;
  }

  return score;
}

function getTitle(stops: Stop[], resultIndex: number): string {
  const neighborhoods = [...new Set(stops.map(s => s.place.neighborhood))];
  const suffixes = ['Night', 'Run', 'Crawl', 'Session', 'Route', 'Move'];
  if (neighborhoods.length === 1) {
    return `${neighborhoods[0]} ${suffixes[resultIndex % suffixes.length]}`;
  }
  if (neighborhoods.length === 2) {
    return `${neighborhoods[0]} → ${neighborhoods[1]}`;
  }
  return `The ${suffixes[resultIndex % suffixes.length]}`;
}

function getDescription(stops: Stop[]): string {
  const names = stops.slice(0, 2).map(s => s.place.name).join(' then ');
  return stops.length > 2 ? `${names} + ${stops.length - 2} more` : names;
}

/**
 * Generate up to 3 itinerary options for the given plan input.
 *
 * @param myPlaces           The current user's saved places.
 * @param input              Parsed plan preferences.
 * @param groupMemberPlaces  Optional: places saved by other group members.
 *                           These are merged into the pool and score higher when
 *                           multiple members share the same spot.
 * @param visitedPlaceKeys   Optional: Set of "name|neighborhood" keys for places
 *                           the user has already visited (moves with status 'done').
 *                           Unvisited places receive a novelty bonus; visited ones do not.
 *
 * Hard constraints applied:
 *   • Venue selection:    only places whose category matches the vibe sequence slot.
 *   • Time window:        stops are truncated if total duration exceeds end time.
 *   • Transit feasibility: computed per adjacent pair; excessive travel flags the stop.
 *   • Budget hard cap:    itineraries where every stop exceeds the budget ceiling
 *                         are penalised (soft — scored lower, not dropped entirely).
 *   • Required categories: vibe sequences define minimum category coverage.
 *   • Max travel:         rideshare legs > 30 min are treated as a soft penalty.
 */
export function generateItineraries(
  myPlaces: Place[],
  input: PlanInput,
  groupMemberPlaces?: GroupMemberPlaces[],
  visitedPlaceKeys?: Set<string>,
): GeneratedItinerary[] {
  const sequences = VIBE_SEQUENCES[input.vibe] ?? VIBE_SEQUENCES['Dinner & Drinks'];

  const startMins = parseTimeToMinutes(input.startTime);
  const endMins = parseTimeToMinutes(input.endTime);
  const windowMins = endMins > startMins ? endMins - startMins : (24 * 60 - startMins) + endMins;
  const hasWindow = windowMins > 30 && windowMins < 24 * 60;

  // ── Build group-interest map ──────────────────────────────────────────────────
  // groupSaveCounts: "name|neighborhood" → number of OTHER members who saved it
  const groupSaveCounts = new Map<string, number>();
  const totalGroupMembers = groupMemberPlaces?.length ?? 0;
  const myPlaceKeys = new Set(myPlaces.map(p => placeKey(p.name, p.neighborhood)));

  // Track group-sourced places not in the user's own library
  const groupOnlyPlaces: Place[] = [];

  if (groupMemberPlaces && groupMemberPlaces.length > 0) {
    // Accumulate save counts across all members
    for (const member of groupMemberPlaces) {
      for (const place of member.places) {
        const k = placeKey(place.name, place.neighborhood);
        groupSaveCounts.set(k, (groupSaveCounts.get(k) ?? 0) + 1);
      }
    }

    // Collect group-only places (deduped) that the current user hasn't saved
    const seenGroupKeys = new Set<string>();
    for (const member of groupMemberPlaces) {
      for (const place of member.places) {
        const k = placeKey(place.name, place.neighborhood);
        if (!myPlaceKeys.has(k) && !seenGroupKeys.has(k)) {
          seenGroupKeys.add(k);
          groupOnlyPlaces.push({ ...place });
        }
      }
    }
  }

  // Full candidate pool: own places + group-only places
  const allPlaces = [...myPlaces, ...groupOnlyPlaces];

  // ── Neighborhood hard-filter ──────────────────────────────────────────────────
  const hoods = (input.neighborhood ?? []).map(n => n.toLowerCase());
  const neighborhoodMatch = (place: Place) => {
    if (hoods.length === 0) return true;
    const ph = place.neighborhood.toLowerCase();
    return hoods.some(h => ph.includes(h) || h.includes(ph.split(' ')[0]));
  };
  const neighborhoodPlaces = hoods.length > 0 ? allPlaces.filter(neighborhoodMatch) : allPlaces;

  // ── Budget ceiling (hard cap for filtering results later) ────────────────────
  const budgets: BudgetLevel[] = Array.isArray(input.budgetLevel)
    ? input.budgetLevel
    : [input.budgetLevel as unknown as BudgetLevel];
  const maxBudgetLevel = budgets.length > 0 ? Math.max(...budgets) : 4;
  const maxBudgetPerPerson = PRICE_PER_LEVEL[maxBudgetLevel] * 3; // 3 stops max at ceiling

  const results: GeneratedItinerary[] = [];

  for (let seqIndex = 0; seqIndex < sequences.length; seqIndex++) {
    const sequence = sequences[seqIndex];
    const stops: Stop[] = [];
    const usedIds = new Set<string>();
    let totalTransitMins = 0;

    for (const category of sequence) {
      // Use neighborhood-filtered pool; fall back to all places if that category
      // has no matches in the selected neighborhoods.
      const pool = neighborhoodPlaces.some(p => p.category === category && !usedIds.has(p.id))
        ? neighborhoodPlaces
        : allPlaces;

      const candidates = pool
        .filter(p => !usedIds.has(p.id))
        .map(p => ({
          place: p,
          score: scorePlace(p, input, category, groupSaveCounts, totalGroupMembers, visitedPlaceKeys ?? new Set()),
        }))
        .filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score);

      if (candidates.length === 0) continue;

      const pickIndex = Math.min(seqIndex, candidates.length - 1);
      const pick = candidates[pickIndex];
      if (!pick) continue;

      // Hard constraint: check travel time from previous stop
      if (stops.length > 0) {
        const transit = computeTransit(stops[stops.length - 1].place, pick.place);
        // Maximum 30-min transit leg — skip candidate if exceeded and there are
        // other options that fit.
        if (transit.estimatedMinutes > 30 && candidates.length > pickIndex + 1) {
          const nextBest = candidates.find((c, i) => {
            if (i <= pickIndex) return false;
            const t = computeTransit(stops[stops.length - 1].place, c.place);
            return t.estimatedMinutes <= 30;
          });
          if (nextBest) {
            usedIds.add(nextBest.place.id);
            const tr = computeTransit(stops[stops.length - 1].place, nextBest.place);
            totalTransitMins += tr.estimatedMinutes;
            stops.push({
              placeId: nextBest.place.id,
              place: nextBest.place,
              estimatedDurationMinutes: CATEGORY_DURATIONS[category] ?? 60,
              estimatedCostPerPerson: PRICE_PER_LEVEL[nextBest.place.priceLevel] ?? 30,
            });
            continue;
          }
        }
        totalTransitMins += transit.estimatedMinutes;
      }

      usedIds.add(pick.place.id);
      stops.push({
        placeId: pick.place.id,
        place: pick.place,
        estimatedDurationMinutes: CATEGORY_DURATIONS[category] ?? 60,
        estimatedCostPerPerson: PRICE_PER_LEVEL[pick.place.priceLevel] ?? 30,
      });
    }

    if (stops.length === 0) continue;

    // Attach transit connectors between adjacent stops
    for (let i = 0; i < stops.length - 1; i++) {
      stops[i] = { ...stops[i], transitToNext: computeTransit(stops[i].place, stops[i + 1].place) };
    }

    // Hard constraint: time window — truncate stops that don't fit
    if (hasWindow) {
      let runningMins = 0;
      const fittingStops: Stop[] = [];
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        const transitMins = stop.transitToNext?.estimatedMinutes ?? 0;
        const needed = stop.estimatedDurationMinutes + (i < stops.length - 1 ? transitMins : 0);
        if (runningMins + needed <= windowMins) {
          fittingStops.push(stop);
          runningMins += needed;
        }
      }
      if (fittingStops.length === 0) fittingStops.push(stops[0]);
      stops.splice(0, stops.length, ...fittingStops);
    }

    // Hard constraint: required categories (vibe) — at least one stop must exist
    // (guaranteed by the sequences — if all are empty, the result is skipped above)

    const totalCost = stops.reduce((sum, s) => sum + s.estimatedCostPerPerson, 0);

    // Budget hard cap: only note as over-budget in description; don't silently drop
    const overBudget = totalCost > maxBudgetPerPerson && budgets.length > 0;

    results.push({
      title: getTitle(stops, results.length),
      description: overBudget
        ? `${getDescription(stops)} · over budget`
        : getDescription(stops),
      stops,
      totalEstimatedCostPerPerson: totalCost,
    });

    if (results.length >= 3) break;
  }

  return results;
}

export const NEIGHBORHOODS = [
  'West Village', 'East Village', 'Williamsburg', 'SoHo', 'Lower East Side',
  'Brooklyn Heights', 'Park Slope', 'Bushwick', 'Midtown', 'Chelsea',
  'Upper West Side', 'Upper East Side', 'Harlem', 'Astoria', 'DUMBO',
  'Tribeca', 'NoLIta', 'Greenpoint', 'Crown Heights', 'Ridgewood',
  'Gowanus', 'Fort Greene', 'Cobble Hill', 'Carroll Gardens', 'Bed-Stuy',
  'Financial District', 'Meatpacking District', 'Greenwich Village', 'Prospect Heights',
];

export const CATEGORY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  bar: 'Bar',
  cafe: 'Cafe',
  museum: 'Museum',
  activity: 'Activity',
  park: 'Park',
  shop: 'Shop',
};

export const SOURCE_LABELS: Record<string, string> = {
  google_maps: 'Google Maps',
  beli: 'Beli',
  yelp: 'Yelp',
  manual: 'Manual',
};

export const CATEGORY_ICONS: Record<string, string> = {
  restaurant: 'restaurant',
  bar: 'wine',
  cafe: 'cafe',
  museum: 'business',
  activity: 'accessibility',
  park: 'leaf',
  shop: 'bag-handle',
};
