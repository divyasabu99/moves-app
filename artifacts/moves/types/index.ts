export type PlaceCategory = 'restaurant' | 'bar' | 'cafe' | 'museum' | 'activity' | 'park' | 'shop';
export type PlaceSource = 'google_maps' | 'beli' | 'yelp' | 'manual' | 'ai_suggested';
export type BudgetLevel = 1 | 2 | 3 | 4;
export type MoveStatus = 'saved' | 'done';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  neighborhood: string;
  priceLevel: BudgetLevel;
  source: PlaceSource;
  vibes: string[];
  vibeDescription?: string;
  rating?: number;
  address?: string;
  notes?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
}

export type TransitMode = 'walk' | 'subway' | 'rideshare';

export interface Transit {
  mode: TransitMode;
  estimatedMinutes: number;
}

export interface Stop {
  placeId: string;
  place: Place;
  estimatedDurationMinutes: number;
  estimatedCostPerPerson: number;
  transitToNext?: Transit;
}

export interface Move {
  id: string;
  title: string;
  vibe: string;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  budgetLevel: BudgetLevel[];
  neighborhood: string[];
  stops: Stop[];
  totalEstimatedCostPerPerson: number;
  status: MoveStatus;
  createdAt: string;
}

export interface PlanInput {
  vibe: string;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  budgetLevel: BudgetLevel[];
  neighborhood: string[];
  savedOnly?: boolean;
}

export interface GeneratedItinerary {
  title: string;
  description: string;
  stops: Stop[];
  totalEstimatedCostPerPerson: number;
}

// ── Groups / Collaboration ────────────────────────────────────────────────────

export interface GroupMember {
  id: string;
  displayName: string;
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  moveCount: number;
}

export interface GroupDetail extends Omit<Group, 'memberCount' | 'moveCount'> {
  members: GroupMember[];
}

export interface SharedMove {
  id: string;
  move: Move;
  sharedBy: { id: string; displayName: string };
  sharedAt: string;
}
