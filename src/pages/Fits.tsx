import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { OutfitWithItems } from "@/lib/types";
import { getSignedImageUrls } from "@/lib/image";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { Plus, Bookmark } from "lucide-react";

export default function FitsPage() {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<OutfitWithItems[]>([]);
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOutfits = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from("outfits")
        .select(`
          id, user_id, title, occasion, season, notes, created_at, updated_at,
          outfit_items (
            id, outfit_id, wardrobe_item_id, position,
            wardrobe_item:wardrobe_item_id ( id, user_id, image_path, category, subcategory, main_colour, secondary_colours, pattern, brand, tags, notes, archived, created_at, updated_at )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      setOutfits(data as unknown as OutfitWithItems[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your fits.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchOutfits(); }, [fetchOutfits]);

  useEffect(() => {
    const paths: string[] = [];
    for (const outfit of outfits) {
      for (const item of outfit.outfit_items) {
        if (item.wardrobe_item && !item.wardrobe_item.archived) {
          paths.push(item.wardrobe_item.image_path);
        }
      }
    }
    if (paths.length === 0) { setImageUrls(new Map()); return; }
    let cancelled = false;
    getSignedImageUrls(paths).then((map) => { if (!cancelled) setImageUrls(map); });
    return () => { cancelled = true; };
  }, [outfits]);

  return (
    <div className="md:ml-20 min-h-screen flex flex-col">
      <PageHeader
        title="Fits"
        subtitle={outfits.length > 0 ? `${outfits.length} saved fit${outfits.length !== 1 ? "s" : ""}` : undefined}
        action={
          <Link to="/fits/new">
            <Button size="sm" className="shrink-0">
              <Plus size={16} strokeWidth={1.5} className="mr-1" />New
            </Button>
          </Link>
        }
      />

      <div className="flex-1">
        {loading ? (
          <SkeletonGrid count={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchOutfits} />
        ) : outfits.length === 0 ? (
          <EmptyState
            title="No saved fits yet."
            description="Combine pieces from your wardrobe into outfits you love."
            action={
              <Link to="/fits/new">
                <Button><Plus size={16} strokeWidth={1.5} className="mr-1.5" />Create a fit</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 px-6 pb-8 md:grid-cols-2 md:px-12 md:gap-5">
            {outfits.map((outfit) => (
              <OutfitCard key={outfit.id} outfit={outfit} imageUrls={imageUrls} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OutfitCard({ outfit, imageUrls }: { outfit: OutfitWithItems; imageUrls: Map<string, string> }) {
  const activeItems = outfit.outfit_items
    .filter((i) => i.wardrobe_item && !i.wardrobe_item.archived)
    .sort((a, b) => a.position - b.position);

  const previewItems = activeItems.slice(0, 4);

  return (
    <Link to={`/fits/${outfit.id}`} className="group block">
      <div className="rounded-2xl border border-bone-200 bg-bone-100 overflow-hidden transition-all duration-200 hover:border-ochre-300 hover:shadow-sm">
        {previewItems.length > 0 ? (
          <div className={`grid ${previewItems.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-0.5 aspect-[4/3]`}>
            {previewItems.map((item) => (
              <div key={item.id} className="relative overflow-hidden bg-bone-200">
                {imageUrls.get(item.wardrobe_item.image_path) ? (
                  <img
                    src={imageUrls.get(item.wardrobe_item.image_path)!}
                    alt={item.wardrobe_item.brand || item.wardrobe_item.category || "Piece"}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full animate-pulse" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="aspect-[4/3] flex items-center justify-center bg-bone-200">
            <Bookmark size={32} strokeWidth={1} className="text-bone-300" />
          </div>
        )}
        <div className="p-4">
          <p className="font-display text-base tracking-tight">{outfit.title}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {outfit.occasion && (
              <span className="text-xs text-ink-500">{outfit.occasion}</span>
            )}
            {outfit.occasion && outfit.season && (
              <span className="text-xs text-ink-300">&middot;</span>
            )}
            {outfit.season && (
              <span className="text-xs text-ink-500">{outfit.season}</span>
            )}
            <span className="text-xs text-ink-300 ml-auto">
              {activeItems.length} piece{activeItems.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
