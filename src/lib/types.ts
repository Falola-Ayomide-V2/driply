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
  image_path: string;
  category: string | null;
  subcategory: string | null;
  main_colour: string | null;
  secondary_colours: string[];
  pattern: string | null;
  brand: string | null;
  tags: string[];
  notes: string | null;
  ai_attributes: Record<string, unknown> | null;
  ai_status: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Outfit {
  id: string;
  user_id: string;
  title: string;
  occasion: string | null;
  season: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutfitItem {
  id: string;
  outfit_id: string;
  wardrobe_item_id: string;
  position: number;
}

export interface OutfitWithItems extends Outfit {
  outfit_items: (OutfitItem & { wardrobe_item: WardrobeItem })[];
}

export interface CalendarEntry {
  id: string;
  user_id: string;
  outfit_id: string;
  scheduled_date: string;
  note: string | null;
  created_at: string;
}

export interface CalendarEntryWithOutfit extends CalendarEntry {
  outfit: Pick<Outfit, "id" | "title">;
}
