export type PlaceCategory = 'restaurant' | 'bar' | 'cafe' | 'museum' | 'activity' | 'park' | 'shop';
export type PlaceSource = 'google_maps' | 'beli' | 'yelp' | 'manual';
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
  rating?: number;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface Stop {
  placeId: string;
  place: Place;
  estimatedDurationMinutes: number;
  estimatedCostPerPerson: number;
}

export interface Move {
  id: string;
  title: string;
  vibe: string;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  budgetLevel: BudgetLevel;
  neighborhood: string;
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
  budgetLevel: BudgetLevel;
  neighborhood: string;
}

export interface GeneratedItinerary {
  title: string;
  description: string;
  stops: Stop[];
  totalEstimatedCostPerPerson: number;
}
