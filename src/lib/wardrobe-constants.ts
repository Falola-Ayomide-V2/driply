export const CATEGORIES = [
  "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Bags", "Accessories", "Other",
] as const;

export const SUBCATEGORIES: Record<string, string[]> = {
  Tops: ["T-shirt", "Shirt", "Blouse", "Sweater", "Hoodie", "Tank top", "Polo"],
  Bottoms: ["Jeans", "Trousers", "Shorts", "Skirt", "Joggers", "Leggings"],
  Dresses: ["Mini", "Midi", "Maxi", "Slip", "Shirt dress"],
  Outerwear: ["Jacket", "Coat", "Blazer", "Cardigan", "Vest", "Parka"],
  Shoes: ["Sneakers", "Boots", "Heels", "Sandals", "Flats", "Loafers"],
  Bags: ["Backpack", "Handbag", "Tote", "Crossbody", "Clutch"],
  Accessories: ["Hat", "Belt", "Scarf", "Jewellery", "Sunglasses", "Watch", "Tie"],
  Other: [],
};

export const PATTERNS = [
  "Solid", "Striped", "Checked", "Printed", "Graphic", "Floral", "Other",
] as const;

export const COLOURS = [
  "Black", "White", "Grey", "Navy", "Brown", "Beige", "Olive", "Burgundy",
  "Red", "Orange", "Yellow", "Green", "Teal", "Blue", "Purple", "Pink", "Metallic",
];

export type SortOption = "recent" | "oldest" | "brand";

export const SORT_LABELS: Record<SortOption, string> = {
  recent: "Recently added",
  oldest: "Oldest added",
  brand: "Brand A–Z",
};
