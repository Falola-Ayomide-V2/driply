import { useState, useRef, useCallback, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { uploadWardrobeImage } from "@/lib/image";
import { CATEGORIES, SUBCATEGORIES, PATTERNS, COLOURS } from "@/lib/wardrobe-constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { ChevronLeft, Camera, ImagePlus, X, Check } from "lucide-react";

export default function WardrobeAddPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [category, setCategory] = useState<string>("");
  const [subcategory, setSubcategory] = useState<string>("");
  const [mainColour, setMainColour] = useState<string>("");
  const [secondaryColours, setSecondaryColours] = useState<string[]>([]);
  const [pattern, setPattern] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  const toggleSecondary = useCallback((colour: string) => {
    setSecondaryColours((prev) => prev.includes(colour) ? prev.filter((c) => c !== colour) : [...prev, colour]);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!imageFile || !user) { setError("Please select an image first."); return; }
    setUploading(true);
    setError(null);
    try {
      setUploadProgress(10);
      const imagePath = await uploadWardrobeImage(user.id, imageFile, (pct) => setUploadProgress(pct));
      setUploadProgress(80);

      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      const { error: insertError } = await supabase.from("wardrobe_items").insert({
        user_id: user.id,
        image_path: imagePath,
        category: category || null,
        subcategory: subcategory || null,
        main_colour: mainColour || null,
        secondary_colours: secondaryColours,
        pattern: pattern || null,
        brand: brand || null,
        tags,
        notes: notes || null,
      });
      if (insertError) throw insertError;

      setUploadProgress(100);
      setSuccess(true);
      setTimeout(() => navigate("/wardrobe"), 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save your item. Please try again.";
      setError(message);
    } finally {
      setUploading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bone-50 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-ochre-500 flex items-center justify-center mb-4">
          <Check size={28} strokeWidth={2} className="text-bone-50" />
        </div>
        <p className="font-display text-xl tracking-tight">Added to your wardrobe</p>
      </div>
    );
  }

  return (
    <div className="md:ml-20 min-h-screen bg-bone-50 flex flex-col">
      <div className="px-6 pt-12 pb-4 md:px-12 md:pt-16 flex items-center gap-3">
        <button onClick={() => navigate("/wardrobe")} className="text-ink-500 hover:text-ink-700 transition-colors">
          <ChevronLeft size={22} strokeWidth={1.5} />
        </button>
        <h1 className="text-2xl font-display tracking-tight">Add piece</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-6 md:px-12 pb-32">
        <div className="max-w-sm w-full mx-auto flex flex-col gap-6">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          {!imagePreview ? (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 aspect-[3/4] rounded-2xl border-2 border-dashed border-bone-300 bg-bone-100 text-ink-400 hover:border-ochre-400 hover:text-ochre-500 transition-colors"
              >
                <Camera size={32} strokeWidth={1.5} />
                <span className="text-sm font-medium">Take a photo</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 text-sm text-ink-600 hover:text-ink-800 transition-colors"
              >
                <ImagePlus size={18} strokeWidth={1.5} />
                Choose from library
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
            </div>
          ) : (
            <>
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full aspect-[3/4] object-cover rounded-2xl" />
                <button type="button" onClick={removeImage} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-ink-900/60 backdrop-blur-sm flex items-center justify-center text-bone-50">
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              {uploading && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-ink-500">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1 w-full bg-bone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-ochre-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-5 pt-2">
                <ChipGroup label="Category" options={[...CATEGORIES]} selected={category} onSelect={(v) => { setCategory(v); setSubcategory(""); }} />

                {category && SUBCATEGORIES[category]?.length > 0 && (
                  <ChipGroup label="Subcategory" options={SUBCATEGORIES[category]} selected={subcategory} onSelect={setSubcategory} />
                )}

                <ChipGroup label="Main colour" options={COLOURS} selected={mainColour} onSelect={(v) => setMainColour(mainColour === v ? "" : v)} />

                <div>
                  <p className="text-xs font-medium tracking-wide text-ink-600 mb-2">Secondary colours <span className="text-ink-400">(optional)</span></p>
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

                <Input id="brand" label="Brand (optional)" type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Nike, Zara" />
                <Input id="tags" label="Tags (optional, comma-separated)" type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="summer, favourite, weekend" />

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="notes" className="text-xs font-medium tracking-wide text-ink-600">Notes (optional)</label>
                  <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything about this piece..." rows={3}
                    className="w-full rounded-lg border border-bone-300 bg-bone-50 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-ochre-400 focus:outline-none focus:ring-1 focus:ring-ochre-400 resize-none" />
                </div>
              </div>
            </>
          )}
        </div>
      </form>

      {imagePreview && (
        <div className="fixed bottom-0 left-0 right-0 bg-bone-50/90 backdrop-blur-lg border-t border-bone-200 px-6 py-4 pb-safe md:px-12 z-40">
          <div className="max-w-sm w-full mx-auto">
            <Button type="submit" size="md" disabled={uploading} onClick={handleSubmit} className="w-full">
              {uploading ? "Saving..." : "Save piece"}
            </Button>
          </div>
        </div>
      )}
    </div>
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
