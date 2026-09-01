import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { CalendarEntryWithOutfit } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Sheet from "@/components/ui/Sheet";
import { ChevronLeft, ChevronRight, Plus, X, Bookmark } from "lucide-react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface OutfitOption {
  id: string;
  title: string;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const startDay = (firstOfMonth.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startDay);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return days;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [entries, setEntries] = useState<CalendarEntryWithOutfit[]>([]);
  const [outfits, setOutfits] = useState<OutfitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [planSheetOpen, setPlanSheetOpen] = useState(false);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>("");
  const [planNote, setPlanNote] = useState("");
  const [saving, setSaving] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthGrid = getMonthGrid(year, month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entriesByDate = new Map<string, CalendarEntryWithOutfit[]>();
  for (const entry of entries) {
    const key = entry.scheduled_date;
    if (!entriesByDate.has(key)) entriesByDate.set(key, []);
    entriesByDate.get(key)!.push(entry);
  }

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const startOfMonth = toDateString(new Date(year, month, 1));
      const endOfMonth = toDateString(new Date(year, month + 1, 0));
      const { data, error: queryError } = await supabase
        .from("calendar_entries")
        .select(`
          id, user_id, outfit_id, scheduled_date, note, created_at,
          outfit:outfit_id ( id, title )
        `)
        .eq("user_id", user.id)
        .gte("scheduled_date", startOfMonth)
        .lte("scheduled_date", endOfMonth)
        .order("scheduled_date", { ascending: true });
      if (queryError) throw queryError;
      setEntries(data as unknown as CalendarEntryWithOutfit[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your calendar.");
    } finally {
      setLoading(false);
    }
  }, [user, year, month]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const fetchOutfits = useCallback(async () => {
    if (!user) return;
    const { data, error: queryError } = await supabase
      .from("outfits")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (queryError) return;
    setOutfits(data as OutfitOption[]);
  }, [user]);

  function handleDayClick(date: Date) {
    setSelectedDate(date);
    setSelectedOutfitId("");
    setPlanNote("");
    fetchOutfits();
    setPlanSheetOpen(true);
  }

  async function handlePlanSave() {
    if (!user || !selectedDate || !selectedOutfitId) return;
    setSaving(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from("calendar_entries").insert({
        user_id: user.id,
        outfit_id: selectedOutfitId,
        scheduled_date: toDateString(selectedDate),
        note: planNote.trim() || null,
      });
      if (insertError) throw insertError;
      setPlanSheetOpen(false);
      fetchEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your plan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEntry(entryId: string) {
    const { error: deleteError } = await supabase.from("calendar_entries").delete().eq("id", entryId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    fetchEntries();
  }

  const selectedDateEntries = selectedDate
    ? entriesByDate.get(toDateString(selectedDate)) || []
    : [];

  return (
    <div className="md:ml-20 min-h-screen flex flex-col">
      <PageHeader title="Calendar" subtitle="Plan what to wear, when." />

      {error && (
        <div className="mx-6 md:mx-12 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">
            <X size={14} strokeWidth={1.5} className="inline" />
          </button>
        </div>
      )}

      <div className="px-6 md:px-12 pb-8 flex-1 flex flex-col">
        <div className="max-w-md w-full mx-auto flex flex-col gap-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="w-10 h-10 rounded-full flex items-center justify-center text-ink-500 hover:bg-bone-200 transition-colors"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <p className="font-display text-lg tracking-tight">
              {MONTH_NAMES[month]} {year}
            </p>
            <button
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="w-10 h-10 rounded-full flex items-center justify-center text-ink-500 hover:bg-bone-200 transition-colors"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Today button */}
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="self-center text-xs text-ink-400 hover:text-ink-600 transition-colors mb-1"
          >
            Today
          </button>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-bone-300 border-t-ochre-500 rounded-full animate-spin" />
            </div>
          ) : outfits.length === 0 && entries.length === 0 ? (
            <EmptyState
              title="No outfits to schedule yet."
              description="Create some fits first, then plan them on your calendar."
              action={
                <Link to="/fits/new">
                  <Button><Plus size={16} strokeWidth={1.5} className="mr-1.5" />Create a fit</Button>
                </Link>
              }
            />
          ) : (
            <>
              {/* Weekday header */}
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="text-center text-[10px] font-medium tracking-wide text-ink-400 uppercase py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {monthGrid.map((date, i) => {
                  const dateStr = toDateString(date);
                  const isCurrentMonth = date.getMonth() === month;
                  const isToday = date.getTime() === today.getTime();
                  const dayEntries = entriesByDate.get(dateStr) || [];
                  const hasEntries = dayEntries.length > 0;

                  return (
                    <button
                      key={i}
                      onClick={() => handleDayClick(date)}
                      className={`relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
                        isCurrentMonth
                          ? hasEntries
                            ? "bg-ink-900 text-bone-50"
                            : "bg-bone-100 text-ink-700 hover:bg-bone-200"
                          : "text-ink-300 hover:bg-bone-100"
                      } ${isToday ? "ring-2 ring-ochre-500" : ""}`}
                    >
                      <span className={`text-sm ${isCurrentMonth ? "" : "opacity-50"}`}>
                        {date.getDate()}
                      </span>
                      {hasEntries && (
                        <div className="flex gap-0.5 mt-0.5">
                          {dayEntries.slice(0, 3).map((_, idx) => (
                            <div key={idx} className={`w-1 h-1 rounded-full ${isCurrentMonth ? "bg-ochre-400" : "bg-ink-400"}`} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Scheduled entries this month */}
              {entries.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-medium tracking-wide text-ink-400 uppercase mb-3">Scheduled this month</p>
                  <div className="flex flex-col gap-2.5">
                    {entries.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-bone-200 bg-bone-100 p-3">
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-ink-900 text-bone-50 shrink-0">
                          <span className="text-[10px] font-medium tracking-wide uppercase opacity-70">
                            {MONTH_NAMES[new Date(entry.scheduled_date + "T00:00").getMonth()].slice(0, 3)}
                          </span>
                          <span className="text-lg font-display leading-none">
                            {new Date(entry.scheduled_date + "T00:00").getDate()}
                          </span>
                        </div>
                        <Link to={`/fits/${entry.outfit.id}`} className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{entry.outfit.title}</p>
                          {entry.note && <p className="text-xs text-ink-400 truncate mt-0.5">{entry.note}</p>}
                        </Link>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <X size={14} strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Sheet open={planSheetOpen} onClose={() => setPlanSheetOpen(false)} title={selectedDate ? formatDateLong(selectedDate) : ""}>
        <div className="flex flex-col gap-5">
          {selectedDateEntries.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">Already planned</p>
              {selectedDateEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-bone-200 bg-bone-100 p-3">
                  <Link to={`/fits/${entry.outfit.id}`} className="flex-1 min-w-0 flex items-center gap-2">
                    <Bookmark size={14} strokeWidth={1.5} className="text-ochre-500 shrink-0" />
                    <span className="text-sm font-medium truncate">{entry.outfit.title}</span>
                  </Link>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {outfits.length > 0 ? (
            <>
              <div>
                <p className="text-xs font-medium tracking-wide text-ink-600 mb-2">Choose an outfit</p>
                <div className="flex flex-col gap-1.5 max-h-[40vh] overflow-y-auto">
                  {outfits.map((outfit) => (
                    <button
                      key={outfit.id}
                      type="button"
                      onClick={() => setSelectedOutfitId(outfit.id)}
                      className={`text-left px-4 py-3 rounded-lg text-sm transition-colors ${selectedOutfitId === outfit.id ? "bg-ochre-50 text-ochre-600 font-medium ring-1 ring-ochre-300" : "text-ink-700 hover:bg-bone-100"}`}
                    >
                      {outfit.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="planNote" className="text-xs font-medium tracking-wide text-ink-600">Note (optional)</label>
                <textarea id="planNote" value={planNote} onChange={(e) => setPlanNote(e.target.value)} placeholder="e.g. Dinner after..." rows={2}
                  className="w-full rounded-lg border border-bone-300 bg-bone-50 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-ochre-400 focus:outline-none focus:ring-1 focus:ring-ochre-400 resize-none" />
              </div>

              <Button size="md" onClick={handlePlanSave} disabled={!selectedOutfitId || saving} className="w-full">
                {saving ? "Saving..." : "Add to calendar"}
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-sm text-ink-500 text-center">You need to create a fit first.</p>
              <Link to="/fits/new" onClick={() => setPlanSheetOpen(false)}>
                <Button size="sm"><Plus size={14} strokeWidth={1.5} className="mr-1.5" />Create a fit</Button>
              </Link>
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
}

function formatDateLong(date: Date): string {
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
  const monthName = MONTH_NAMES[date.getMonth()];
  return `${weekday}, ${monthName} ${date.getDate()}`;
}
