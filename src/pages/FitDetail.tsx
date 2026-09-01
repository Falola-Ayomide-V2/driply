import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { WardrobeItem, OutfitWithItems } from "@/lib/types";
import { getSignedImageUrls } from "@/lib/image";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Sheet from "@/components/ui/Sheet";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { ChevronLeft, X, Trash2, Check, Search } from "lucide-react";

const OCCASIONS = ["Everyday", "Work", "Casual", "Going out", "Formal", "Date", "Travel", "Workout", "Other"];
const SEASONS = ["Spring", "Summer", "Autumn", "Winter", "All seasons"];

export default function FitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = id === "new";

  const [title, setTitle] = useState("");
  const [occasion, setOccasion] = useState<string>("");
  const [season, setSeason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [allWardrobeItems, setAllWardrobeItems] = useState<WardrobeItem[]>([]);
  const [wardrobeImageUrls, setWardrobeImageUrls] = useState<Map<string, string>>(new Map());
  const [pickerSearch, setPickerSearch] = useState("");

  const fetchOutfit = useCallback(async () => {
    if (isNew || !id) { setLoading(false); return; }
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
        .eq("id", id)
        .maybeSingle();
      if (queryError) throw queryError;
      if (!data) { setError("Fit not found."); setLoading(false); return; }
      const outfit = data as unknown as OutfitWithItems;
      setTitle(outfit.title);
      setOccasion(outfit.occasion || "");
      setSeason(outfit.season || "");
      setNotes(outfit.notes || "");
      setSelectedItems(
        outfit.outfit_items
          .sort((a, b) => a.position - b.position)
          .map((oi) => oi.wardrobe_item)
          .filter(Boolean)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this fit.");
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => { fetchOutfit(); }, [fetchOutfit]);

  useEffect(() => {
    if (selectedItems.length === 0) return;
    let cancelled = false;
    const paths = selectedItems.map((i) => i.image_path);
    getSignedImageUrls(paths).then((map) => { if (!cancelled) setWardrobeImageUrls(map); });
    return () => { cancelled = true; };
  }, [selectedItems]);

  const fetchWardrobeForPicker = useCallback(async () => {
    if (!user) return;
    const { data, error: queryError } = await supabase
      .from("wardrobe_items")
      .select("id, user_id, image_path, category, subcategory, main_colour, secondary_colours, pattern, brand, tags, notes, archived, created_at, updated_at")
      .eq("user_id", user.id)
      .eq("archived", false)
      .order("created_at", { ascending: false });
    if (queryError) return;
    setAllWardrobeItems(data as WardrobeItem[]);
  }, [user]);

  function openPicker() {
    fetchWardrobeForPicker();
    setPickerSearch("");
    setPickerOpen(true);
  }

  function addPiece(item: WardrobeItem) {
    if (selectedItems.some((i) => i.id === item.id)) return;
    setSelectedItems((prev) => [...prev, item]);
  }

  function removePiece(itemId: string) {
    setSelectedItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  function movePiece(itemId: string, direction: "up" | "down") {
    setSelectedItems((prev) => {
      const idx = prev.findIndex((i) => i.id === itemId);
      if (idx === -1) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) { setError("Give your fit a name."); return; }
    setSaving(true);
    setError(null);
    try {
      const outfitData = {
        user_id: user.id,
        title: title.trim(),
        occasion: occasion || null,
        season: season || null,
        notes: notes.trim() || null,
      };

      if (isNew) {
        const { data: newOutfit, error: insertError } = await supabase
          .from("outfits")
          .insert(outfitData)
          .select("id")
          .maybeSingle();
        if (insertError) throw insertError;
        if (!newOutfit) throw new Error("Could not create fit.");
        await syncOutfitItems(newOutfit.id, selectedItems);
        navigate("/fits");
      } else {
        const { error: updateError } = await supabase
          .from("outfits")
          .update(outfitData)
          .eq("id", id!);
        if (updateError) throw updateError;
        await syncOutfitItems(id!, selectedItems);
        navigate("/fits");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your fit.");
    } finally {
      setSaving(false);
    }
  }

  async function syncOutfitItems(outfitId: string, items: WardrobeItem[]) {
    const { error: deleteError } = await supabase
      .from("outfit_items")
      .delete()
      .eq("outfit_id", outfitId);
    if (deleteError) throw deleteError;
    if (items.length === 0) return;
    const rows = items.map((item, index) => ({
      outfit_id: outfitId,
      wardrobe_item_id: item.id,
      position: index,
    }));
    const { error: insertError } = await supabase.from("outfit_items").insert(rows);
    if (insertError) throw insertError;
  }

  async function handleDelete() {
    if (!id || isNew) return;
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase.from("outfits").delete().eq("id", id);
      if (deleteError) throw deleteError;
      navigate("/fits");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this fit.");
      setDeleting(false);
    }
  }

  const filteredPickerItems = (() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return allWardrobeItems;
    return allWardrobeItems.filter((i) =>
      [i.brand, i.category, i.subcategory, i.main_colour, ...i.tags]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  })();

  if (loading) {
    return (
      <div className="md:ml-20 min-h-screen flex items-center justify-center">
        <LoadingState label="Loading fit" />
      </div>
    );
  }

  if (error && !isNew && selectedItems.length === 0 && !title) {
    return (
      <div className="md:ml-20 min-h-screen flex flex-col">
        <BackHeader onBack={() => navigate("/fits")} title="Fit" />
        <ErrorState message={error} onRetry={fetchOutfit} />
      </div>
    );
  }

  return (
    <div className="md:ml-20 min-h-screen flex flex-col">
      <BackHeader onBack={() => navigate("/fits")} title={isNew ? "New fit" : "Edit fit"} />

      {error && <div className="mx-6 md:mx-12 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSave} className="flex-1 px-6 md:px-12 pb-32">
        <div className="max-w-sm w-full mx-auto flex flex-col gap-6">
          <Input
            id="title"
            label="Name"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Saturday brunch fit"
            autoFocus={isNew}
          />

          <div>
            <p className="text-xs font-medium tracking-wide text-ink-600 mb-2">Occasion</p>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((opt) => (
                <button key={opt} type="button" onClick={() => setOccasion(occasion === opt ? "" : opt)}
                  className={`px-3 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${occasion === opt ? "bg-ink-900 text-bone-50" : "bg-bone-100 text-ink-600 hover:bg-bone-200"}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium tracking-wide text-ink-600 mb-2">Season</p>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map((opt) => (
                <button key={opt} type="button" onClick={() => setSeason(season === opt ? "" : opt)}
                  className={`px-3 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${season === opt ? "bg-ink-900 text-bone-50" : "bg-bone-100 text-ink-600 hover:bg-bone-200"}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium tracking-wide text-ink-600">Pieces</p>
              <button type="button" onClick={openPicker} className="text-xs text-ochre-500 font-medium hover:text-ochre-600 transition-colors">
                + Add piece
              </button>
            </div>
            {selectedItems.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-bone-300 bg-bone-100 p-8 text-center">
                <p className="text-sm text-ink-400">No pieces added yet.</p>
                <button type="button" onClick={openPicker} className="mt-3 text-sm text-ochre-500 font-medium hover:text-ochre-600 transition-colors">
                  Browse your wardrobe
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {selectedItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-bone-200 bg-bone-100 p-2.5">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-bone-200 shrink-0">
                      {wardrobeImageUrls.get(item.image_path) ? (
                        <img src={wardrobeImageUrls.get(item.image_path)!} alt={item.brand || item.category || "Piece"} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.brand || item.category || "Piece"}</p>
                      <p className="text-xs text-ink-400 truncate">{item.category}{item.subcategory ? ` \u00b7 ${item.subcategory}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => movePiece(item.id, "up")} disabled={idx === 0}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:bg-bone-200 disabled:opacity-30 transition-colors">
                        <ChevronUpIcon />
                      </button>
                      <button type="button" onClick={() => movePiece(item.id, "down")} disabled={idx === selectedItems.length - 1}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:bg-bone-200 disabled:opacity-30 transition-colors">
                        <ChevronDownIcon />
                      </button>
                      <button type="button" onClick={() => removePiece(item.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors">
                        <X size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-xs font-medium tracking-wide text-ink-600">Notes (optional)</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything about this fit..." rows={3}
              className="w-full rounded-lg border border-bone-300 bg-bone-50 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-ochre-400 focus:outline-none focus:ring-1 focus:ring-ochre-400 resize-none" />
          </div>
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 bg-bone-50/90 backdrop-blur-lg border-t border-bone-200 px-6 py-4 pb-safe md:px-12 z-40">
        <div className="max-w-sm w-full mx-auto flex items-center gap-2.5">
          {!isNew && (
            <button type="button" onClick={() => setDeleteOpen(true)} disabled={deleting}
              className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={18} strokeWidth={1.5} />
            </button>
          )}
          <Button type="submit" size="md" disabled={saving} onClick={handleSave} className="flex-1">
            {saving ? "Saving..." : isNew ? "Save fit" : "Save changes"}
          </Button>
        </div>
      </div>

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add pieces">
        <PiecePicker
          items={filteredPickerItems}
          search={pickerSearch}
          onSearch={setPickerSearch}
          selectedIds={selectedItems.map((i) => i.id)}
          onAdd={addPiece}
          onDone={() => setPickerOpen(false)}
        />
      </Sheet>

      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete this fit?">
        <div className="flex flex-col gap-5">
          <p className="text-sm text-ink-600 leading-relaxed">This will permanently remove this outfit. This cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="ghost" size="md" onClick={() => setDeleteOpen(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" size="md" onClick={handleDelete} disabled={deleting} className="flex-1 !bg-red-500 !text-bone-50 hover:!bg-red-600">
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function PiecePicker({
  items, search, onSearch, selectedIds, onAdd, onDone,
}: {
  items: WardrobeItem[];
  search: string;
  onSearch: (v: string) => void;
  selectedIds: string[];
  onAdd: (item: WardrobeItem) => void;
  onDone: () => void;
}) {
  const [localUrls, setLocalUrls] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (items.length === 0) { setLocalUrls(new Map()); return; }
    let cancelled = false;
    const paths = items.map((i) => i.image_path);
    getSignedImageUrls(paths).then((map) => { if (!cancelled) setLocalUrls(map); });
    return () => { cancelled = true; };
  }, [items]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search pieces..."
          className="w-full rounded-full border border-bone-300 bg-bone-50 pl-9 pr-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-ochre-400 focus:outline-none focus:ring-1 focus:ring-ochre-400"
        />
      </div>
      {items.length === 0 ? (
        <EmptyState title="No pieces found" description="Add pieces to your wardrobe first." />
      ) : (
        <div className="grid grid-cols-3 gap-2.5 max-h-[50vh] overflow-y-auto">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onAdd(item)}
                disabled={isSelected}
                className="relative aspect-[3/4] rounded-lg overflow-hidden bg-bone-200 group"
              >
                {localUrls.get(item.image_path) ? (
                  <img src={localUrls.get(item.image_path)!} alt={item.brand || item.category || "Piece"} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full animate-pulse" />
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-ink-900/40 flex items-center justify-center">
                    <Check size={18} strokeWidth={2.5} className="text-bone-50" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
      <Button size="md" onClick={onDone} className="w-full">Done</Button>
    </div>
  );
}

function BackHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="px-6 pt-12 pb-4 md:px-12 md:pt-16 flex items-center gap-3">
      <button onClick={onBack} className="text-ink-500 hover:text-ink-700 transition-colors">
        <ChevronLeft size={22} strokeWidth={1.5} />
      </button>
      <h1 className="text-2xl font-display tracking-tight">{title}</h1>
    </div>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
