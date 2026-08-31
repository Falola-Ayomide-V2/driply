import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { WardrobeItem } from "@/lib/types";
import { getSignedImageUrls } from "@/lib/image";
import { CATEGORIES, COLOURS, PATTERNS, SORT_LABELS, type SortOption } from "@/lib/wardrobe-constants";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import Sheet from "@/components/ui/Sheet";
import { Plus, Search, SlidersHorizontal, Archive, X } from "lucide-react";

interface Filters {
  category: string | null;
  colour: string | null;
  pattern: string | null;
}

export default function WardrobePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({ category: null, colour: null, pattern: null });
  const [sort, setSort] = useState<SortOption>("recent");
  const [showArchived, setShowArchived] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from("wardrobe_items")
        .select("id, user_id, image_path, category, subcategory, main_colour, secondary_colours, pattern, brand, tags, notes, archived, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      setItems(data as WardrobeItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your wardrobe.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    const paths = items.map((i) => i.image_path);
    if (paths.length === 0) { setImageUrls(new Map()); return; }
    let cancelled = false;
    getSignedImageUrls(paths).then((map) => { if (!cancelled) setImageUrls(map); });
    return () => { cancelled = true; };
  }, [items]);

  const activeCount = items.filter((i) => !i.archived).length;

  const filtered = useMemo(() => {
    let result = items.filter((i) => i.archived === showArchived);
    if (filters.category) result = result.filter((i) => i.category === filters.category);
    if (filters.colour) result = result.filter((i) => i.main_colour === filters.colour || i.secondary_colours.includes(filters.colour!));
    if (filters.pattern) result = result.filter((i) => i.pattern === filters.pattern);
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((i) =>
        [i.brand, i.category, i.subcategory, i.main_colour, i.notes, ...i.tags, ...i.secondary_colours]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (sort === "oldest") result = [...result].sort((a, b) => a.created_at.localeCompare(b.created_at));
    else if (sort === "brand") result = [...result].sort((a, b) => (a.brand || "zzz").localeCompare(b.brand || "zzz"));
    return result;
  }, [items, showArchived, filters, search, sort]);

  const activeFilterCount = [filters.category, filters.colour, filters.pattern].filter(Boolean).length;

  function clearFilters() {
    setFilters({ category: null, colour: null, pattern: null });
    setSearch("");
  }

  return (
    <div className="md:ml-20 min-h-screen flex flex-col">
      <PageHeader
        title="Wardrobe"
        subtitle={items.length > 0 ? `${activeCount} piece${activeCount !== 1 ? "s" : ""}` : undefined}
        action={
          <Link to="/wardrobe/add">
            <Button size="sm" className="shrink-0"><Plus size={16} strokeWidth={1.5} className="mr-1" />Add</Button>
          </Link>
        }
      />

      {items.length > 0 && (
        <div className="px-6 md:px-12 pb-4 flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your wardrobe..."
              className="w-full rounded-full border border-bone-300 bg-bone-50 pl-9 pr-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-ochre-400 focus:outline-none focus:ring-1 focus:ring-ochre-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
                <X size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>
          <button
            onClick={() => setFilterSheetOpen(true)}
            className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-full border transition-colors ${activeFilterCount > 0 ? "border-ochre-500 bg-ochre-50 text-ochre-500" : "border-bone-300 text-ink-500 hover:border-ink-400"}`}
          >
            <SlidersHorizontal size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setSortSheetOpen(true)}
            className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full border border-bone-300 text-ink-500 hover:border-ink-400 transition-colors"
          >
            <span className="text-[10px] font-medium tracking-wide">Sort</span>
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div className="px-6 md:px-12 pb-4">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-colors ${showArchived ? "bg-ink-900 text-bone-50" : "bg-bone-100 text-ink-500"}`}
          >
            <Archive size={13} strokeWidth={1.5} />
            {showArchived ? "Archived" : "Active"}
          </button>
        </div>
      )}

      <div className="flex-1">
        {loading ? (
          <SkeletonGrid count={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchItems} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Your wardrobe starts here."
            description="Add the pieces you already own and Driply will build from there."
            action={<Link to="/wardrobe/add"><Button><Plus size={16} strokeWidth={1.5} className="mr-1.5" />Add your first piece</Button></Link>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No pieces found" description="Try adjusting your search or filters." action={<button onClick={clearFilters} className="text-sm text-ochre-500 underline underline-offset-4 hover:text-ochre-600">Clear filters</button>} />
        ) : (
          <div className="grid grid-cols-2 gap-3 px-6 pb-8 md:grid-cols-4 md:px-12 md:gap-4">
            {filtered.map((item) => (
              <Link key={item.id} to={`/wardrobe/${item.id}`} className="group block">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-bone-200">
                  {imageUrls.get(item.image_path) ? (
                    <img
                      src={imageUrls.get(item.image_path)!}
                      alt={item.brand || item.category || "Wardrobe item"}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full animate-pulse" />
                  )}
                  {item.archived && (
                    <div className="absolute inset-0 bg-ink-900/30 flex items-center justify-center">
                      <Archive size={20} strokeWidth={1.5} className="text-bone-50" />
                    </div>
                  )}
                </div>
                {(item.brand || item.category) && (
                  <p className="mt-2 text-xs text-ink-500 truncate">{item.brand || item.category}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Sheet open={filterSheetOpen} onClose={() => setFilterSheetOpen(false)} title="Filters">
        <div className="flex flex-col gap-6">
          <FilterSection label="Category" options={[...CATEGORIES]} selected={filters.category} onSelect={(v) => setFilters((f) => ({ ...f, category: f.category === v ? null : v }))} />
          <FilterSection label="Colour" options={COLOURS} selected={filters.colour} onSelect={(v) => setFilters((f) => ({ ...f, colour: f.colour === v ? null : v }))} />
          <FilterSection label="Pattern" options={[...PATTERNS]} selected={filters.pattern} onSelect={(v) => setFilters((f) => ({ ...f, pattern: f.pattern === v ? null : v }))} />
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-ink-500 underline underline-offset-4 hover:text-ink-700">Clear all filters</button>
          )}
        </div>
      </Sheet>

      <Sheet open={sortSheetOpen} onClose={() => setSortSheetOpen(false)} title="Sort by">
        <div className="flex flex-col gap-1">
          {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => { setSort(opt); setSortSheetOpen(false); }}
              className={`text-left px-4 py-3 rounded-lg text-sm transition-colors ${sort === opt ? "bg-ochre-50 text-ochre-600 font-medium" : "text-ink-700 hover:bg-bone-100"}`}
            >
              {SORT_LABELS[opt]}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function FilterSection({ label, options, selected, onSelect }: { label: string; options: string[]; selected: string | null; onSelect: (v: string) => void }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-ink-400 uppercase mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-3 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${selected === opt ? "bg-ink-900 text-bone-50" : "bg-bone-100 text-ink-600 hover:bg-bone-200"}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
