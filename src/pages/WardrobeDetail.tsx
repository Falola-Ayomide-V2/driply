import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { WardrobeItem } from "@/lib/types";
import { getSignedImageUrl, deleteWardrobeImage } from "@/lib/image";
import { CATEGORIES, SUBCATEGORIES, PATTERNS, COLOURS } from "@/lib/wardrobe-constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Sheet from "@/components/ui/Sheet";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import { ChevronLeft, Pencil, Archive, ArchiveRestore, Trash2, Check, X } from "lucide-react";

export default function WardrobeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<WardrobeItem | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchItem = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (queryError) throw queryError;
      if (!data) { setError("Item not found."); setLoading(false); return; }
      setItem(data as WardrobeItem);
      const url = await getSignedImageUrl((data as WardrobeItem).image_path);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this item.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchItem(); }, [fetchItem]);

  async function handleArchive() {
    if (!item) return;
    setArchiving(true);
    try {
      const { error: updateError } = await supabase
        .from("wardrobe_items")
        .update({ archived: !item.archived })
        .eq("id", item.id);
      if (updateError) throw updateError;
      setItem({ ...item, archived: !item.archived });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not archive this item.");
    } finally {
      setArchiving(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    setDeleting(true);
    try {
      const { error: dbError } = await supabase
        .from("wardrobe_items")
        .delete()
        .eq("id", item.id);
      if (dbError) throw dbError;

      try {
        await deleteWardrobeImage(item.image_path);
      } catch (storageErr) {
        console.error("Image cleanup failed:", storageErr);
      }

      navigate("/wardrobe");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this item.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="md:ml-20 min-h-screen flex items-center justify-center">
        <LoadingState label="Loading item" />
      </div>
    );
  }

  if (error && !item) {
    return (
      <div className="md:ml-20 min-h-screen flex flex-col">
        <BackHeader onBack={() => navigate("/wardrobe")} />
        <ErrorState message={error} onRetry={fetchItem} />
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="md:ml-20 min-h-screen flex flex-col">
      <BackHeader onBack={() => navigate("/wardrobe")} />

      {error && <div className="mx-6 md:mx-12 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="flex-1 px-6 md:px-12 pb-32">
        <div className="max-w-sm w-full mx-auto flex flex-col gap-6">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden bg-bone-200">
            {imageUrl ? (
              <img src={imageUrl} alt={item.brand || item.category || "Wardrobe item"} className="w-full aspect-[3/4] object-cover" />
            ) : (
              <div className="w-full aspect-[3/4] animate-pulse" />
            )}
            {item.archived && (
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-ink-900/60 backdrop-blur-sm text-bone-50 text-xs font-medium flex items-center gap-1.5">
                <Archive size={12} strokeWidth={1.5} /> Archived
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4">
            {item.brand && <p className="font-display text-lg tracking-tight">{item.brand}</p>}
            <DetailRow label="Category" value={item.category} />
            <DetailRow label="Subcategory" value={item.subcategory} />
            <DetailRow label="Main colour" value={item.main_colour} />
            {item.secondary_colours.length > 0 && <DetailRow label="Secondary colours" value={item.secondary_colours.join(", ")} />}
            <DetailRow label="Pattern" value={item.pattern} />
            {item.tags.length > 0 && <DetailRow label="Tags" value={item.tags.join(", ")} />}
            {item.notes && <DetailRow label="Notes" value={item.notes} />}
            <DetailRow label="Added" value={new Date(item.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} />
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-bone-50/90 backdrop-blur-lg border-t border-bone-200 px-6 py-4 pb-safe md:px-12 z-40">
        <div className="max-w-sm w-full mx-auto flex items-center gap-2.5">
          <Button variant="ghost" size="md" onClick={() => setEditOpen(true)} className="flex-1">
            <Pencil size={16} strokeWidth={1.5} className="mr-1.5" />Edit
          </Button>
          <Button variant="ghost" size="md" onClick={handleArchive} disabled={archiving} className="flex-1">
            {item.archived ? <><ArchiveRestore size={16} strokeWidth={1.5} className="mr-1.5" />Unarchive</> : <><Archive size={16} strokeWidth={1.5} className="mr-1.5" />Archive</>}
          </Button>
          <button onClick={() => setDeleteOpen(true)} disabled={deleting} className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Edit sheet */}
      <EditSheet open={editOpen} onClose={() => setEditOpen(false)} item={item} onSaved={(updated) => { setItem(updated); setEditOpen(false); }} />

      {/* Delete confirmation */}
      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete this piece?">
        <div className="flex flex-col gap-5">
          <p className="text-sm text-ink-600 leading-relaxed">This will permanently remove this piece and its image from your wardrobe. This cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="ghost" size="md" onClick={() => setDeleteOpen(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" size="md" onClick={handleDelete} disabled={deleting} className="flex-1 !bg-red-500 !text-bone-50 hover:!bg-red-600">
              {deleting ? "Deleting..." : <>Delete</>}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function BackHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="px-6 pt-12 pb-4 md:px-12 md:pt-16 flex items-center gap-3">
      <button onClick={onBack} className="text-ink-500 hover:text-ink-700 transition-colors">
        <ChevronLeft size={22} strokeWidth={1.5} />
      </button>
      <h1 className="text-2xl font-display tracking-tight">Piece</h1>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-bone-200">
      <span className="text-xs font-medium tracking-wide text-ink-400 uppercase pt-0.5">{label}</span>
      <span className="text-sm text-ink-800 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function EditSheet({ open, onClose, item, onSaved }: { open: boolean; onClose: () => void; item: WardrobeItem; onSaved: (item: WardrobeItem) => void }) {
  const [category, setCategory] = useState(item.category || "");
  const [subcategory, setSubcategory] = useState(item.subcategory || "");
  const [mainColour, setMainColour] = useState(item.main_colour || "");
  const [secondaryColours, setSecondaryColours] = useState<string[]>(item.secondary_colours);
  const [pattern, setPattern] = useState(item.pattern || "");
  const [brand, setBrand] = useState(item.brand || "");
  const [tagsInput, setTagsInput] = useState(item.tags.join(", "));
  const [notes, setNotes] = useState(item.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSecondary = useCallback((colour: string) => {
    setSecondaryColours((prev) => prev.includes(colour) ? prev.filter((c) => c !== colour) : [...prev, colour]);
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const tags = tagsInput.split(",").map((t: string) => t.trim()).filter(Boolean);
    try {
      const { data, error: updateError } = await supabase
        .from("wardrobe_items")
        .update({
          category: category || null,
          subcategory: subcategory || null,
          main_colour: mainColour || null,
          secondary_colours: secondaryColours,
          pattern: pattern || null,
          brand: brand || null,
          tags,
          notes: notes || null,
        })
        .eq("id", item.id)
        .select("*")
        .maybeSingle();
      if (updateError) throw updateError;
      if (data) onSaved(data as WardrobeItem);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit piece">
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        <ChipGroup label="Category" options={[...CATEGORIES]} selected={category} onSelect={(v) => { setCategory(v); setSubcategory(""); }} />
        {category && SUBCATEGORIES[category]?.length > 0 && (
          <ChipGroup label="Subcategory" options={SUBCATEGORIES[category]} selected={subcategory} onSelect={setSubcategory} />
        )}
        <ChipGroup label="Main colour" options={COLOURS} selected={mainColour} onSelect={(v) => setMainColour(mainColour === v ? "" : v)} />

        <div>
          <p className="text-xs font-medium tracking-wide text-ink-600 mb-2">Secondary colours</p>
          <div className="flex flex-wrap gap-2">
            {COLOURS.filter((c) => c !== mainColour).map((c) => (
              <button key={c} type="button" onClick={() => toggleSecondary(c)}
                className={`px-3 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${secondaryColours.includes(c) ? "bg-ink-900 text-bone-50" : "bg-bone-100 text-ink-600 hover:bg-bone-200"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <ChipGroup label="Pattern" options={[...PATTERNS]} selected={pattern} onSelect={(v) => setPattern(pattern === v ? "" : v)} />
        <Input id="edit-brand" label="Brand" type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand" />
        <Input id="edit-tags" label="Tags (comma-separated)" type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="summer, favourite" />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-notes" className="text-xs font-medium tracking-wide text-ink-600">Notes</label>
          <textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            className="w-full rounded-lg border border-bone-300 bg-bone-50 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-ochre-400 focus:outline-none focus:ring-1 focus:ring-ochre-400 resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" size="md" type="button" onClick={onClose} className="flex-1">
            <X size={16} strokeWidth={1.5} className="mr-1" />Cancel
          </Button>
          <Button type="submit" size="md" disabled={saving} className="flex-1">
            {saving ? "Saving..." : <><Check size={16} strokeWidth={1.5} className="mr-1" />Save</>}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}

function ChipGroup({ label, options, selected, onSelect }: { label: string; options: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-ink-600 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => onSelect(opt)}
            className={`px-3 py-2 rounded-full text-xs font-medium tracking-wide transition-all ${selected === opt ? "bg-ink-900 text-bone-50" : "bg-bone-100 text-ink-600 hover:bg-bone-200"}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
