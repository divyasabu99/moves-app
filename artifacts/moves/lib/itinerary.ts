import { Place, PlaceCategory, GeneratedItinerary, PlanInput, Stop, BudgetLevel } from '@/types';

export const VIBES = [
  'Dinner & Drinks',
  'Date Night',
  'Museum Day',
  'Brunch Run',
  'Night Out',
  'Foodie Crawl',
  'Cultural Day',
  'Low-Key Vibes',
] as const;

export type Vibe = (typeof VIBES)[number];

const VIBE_SEQUENCES: Record<string, PlaceCategory[][]> = {
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

function scorePlace(place: Place, input: PlanInput, targetCategory: PlaceCategory): number {
  if (place.category !== targetCategory) return 0;
  let score = 50;

  // Neighborhood match — any of the selected neighborhoods qualifies
  const hoods = (input.neighborhood ?? []).map(n => n.toLowerCase());
  const placeHood = place.neighborhood.toLowerCase();
  if (hoods.length === 0) {
    score += 10; // no filter applied, small bonus for not penalising
  } else if (hoods.some(h => placeHood.includes(h) || h.includes(placeHood.split(' ')[0]))) {
    score += 30;
  }

  // Budget fit — any of the selected budget levels qualifies
  const budgets: BudgetLevel[] = Array.isArray(input.budgetLevel) ? input.budgetLevel : [input.budgetLevel as unknown as BudgetLevel];
  if (budgets.length === 0) {
    score += 10; // no filter, small bonus
  } else if (budgets.includes(place.priceLevel)) {
    score += 18;
  } else {
    const minB = Math.min(...budgets);
    const maxB = Math.max(...budgets);
    if (place.priceLevel >= minB && place.priceLevel <= maxB) {
      score += 8; // within range but not exact
    } else {
      score -= 10;
    }
  }

  // Rating bonus
  score += ((place.rating ?? 4.0) - 3.0) * 5;

  // Source quality
  const sourceBonus: Record<string, number> = { beli: 8, yelp: 5, google_maps: 3, manual: 1 };
  score += sourceBonus[place.source] ?? 0;

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

export function generateItineraries(places: Place[], input: PlanInput): GeneratedItinerary[] {
  const sequences = VIBE_SEQUENCES[input.vibe] ?? VIBE_SEQUENCES['Dinner & Drinks'];

  const startMins = parseTimeToMinutes(input.startTime);
  const endMins = parseTimeToMinutes(input.endTime);
  const windowMins = endMins > startMins ? endMins - startMins : (24 * 60 - startMins) + endMins;
  const hasWindow = windowMins > 30 && windowMins < 24 * 60;

  const results: GeneratedItinerary[] = [];

  for (let seqIndex = 0; seqIndex < sequences.length; seqIndex++) {
    const sequence = sequences[seqIndex];
    const stops: Stop[] = [];
    const usedIds = new Set<string>();

    for (const category of sequence) {
      const candidates = places
        .filter(p => !usedIds.has(p.id))
        .map(p => ({ place: p, score: scorePlace(p, input, category) }))
        .filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score);

      if (candidates.length === 0) continue;

      const pickIndex = Math.min(seqIndex, candidates.length - 1);
      const pick = candidates[pickIndex];
      if (pick) {
        usedIds.add(pick.place.id);
        stops.push({
          placeId: pick.place.id,
          place: pick.place,
          estimatedDurationMinutes: CATEGORY_DURATIONS[category] ?? 60,
          estimatedCostPerPerson: PRICE_PER_LEVEL[pick.place.priceLevel] ?? 30,
        });
      }
    }

    if (stops.length === 0) continue;

    if (hasWindow) {
      let runningMins = 0;
      const fittingStops: Stop[] = [];
      for (const stop of stops) {
        if (runningMins + stop.estimatedDurationMinutes <= windowMins) {
          fittingStops.push(stop);
          runningMins += stop.estimatedDurationMinutes;
        }
      }
      if (fittingStops.length === 0) fittingStops.push(stops[0]);
      stops.splice(0, stops.length, ...fittingStops);
    }

    const totalCost = stops.reduce((sum, s) => sum + s.estimatedCostPerPerson, 0);
    results.push({
      title: getTitle(stops, results.length),
      description: getDescription(stops),
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
