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
  cuisine?: string;        // e.g. "Italian", "Japanese", "Mexican" — restaurants/cafes/bars
  tags?: string[];         // searchable descriptors: "rooftop", "outdoor", "late night", etc.
  website?: string;
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
  groupId?: string;
  groupName?: string;
}

export interface UserPreferences {
  music: string[];
  events: string[];
  food: string[];
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
  groupId?: string;
  groupName?: string;
  preferences?: UserPreferences;
}

export interface GroupMemberPlaces {
  userId: string;
  displayName: string;
  places: Place[];
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

// ── Receipt splitting ─────────────────────────────────────────────────────────

export interface ReceiptItem {
  index: number;
  name: string;
  price: number;
  quantity: number;
  claimedBy: { userId: string; displayName: string }[];
}

export interface ReceiptSummaryEntry {
  userId: string;
  displayName: string;
  subtotal: number;
  isUploader: boolean;
}

export interface Receipt {
  id: string;
  shareId: string;
  groupId: string;
  uploadedBy: { id: string; displayName: string };
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  summary: ReceiptSummaryEntry[];
  createdAt: string;
}
