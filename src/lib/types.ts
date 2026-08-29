// Database table types matching the Supabase schema.

export interface Profile {
  user_id: string;
  display_name: string | null;
  location: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreference {
  user_id: string;
  lifestyle: string[];
  preferred_styles: string[];
  favourite_colours: string[];
  style_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WardrobeItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  brand: string | null;
  color: string | null;
  image_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Outfit {
  id: string;
  user_id: string;
  title: string;
  occasion: string | null;
  season: string | null;
  image_url: string | null;
  created_at: string;
}

export interface OutfitItem {
  id: string;
  outfit_id: string;
  wardrobe_item_id: string;
  position: number;
}

export interface CalendarEntry {
  id: string;
  user_id: string;
  outfit_id: string;
  scheduled_date: string;
  note: string | null;
}
