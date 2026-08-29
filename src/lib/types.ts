// Database table types for future phases.
// These are intentionally defined here so future migrations align with the
// frontend's type expectations. Tables are NOT created yet.

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UserPreference {
  id: string;
  user_id: string;
  style_tags: string[];
  color_palette: string[];
  budget_range: string | null;
  created_at: string;
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
