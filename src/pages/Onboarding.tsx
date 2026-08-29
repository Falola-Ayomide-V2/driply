import { useState, useCallback, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

type StepId = "name" | "location" | "lifestyle" | "style" | "colours" | "notes";

interface StepConfig {
  id: StepId;
  label: string;
  title: string;
  subtitle: string;
  required: boolean;
}

const STEPS: StepConfig[] = [
  { id: "name", label: "Name", title: "What should we call you?", subtitle: "This is how Driply will greet you.", required: true },
  { id: "location", label: "Location", title: "Where are you based?", subtitle: "For weather-aware recommendations later.", required: false },
  { id: "lifestyle", label: "Lifestyle", title: "What do you usually dress for?", subtitle: "Select all that apply.", required: false },
  { id: "style", label: "Style", title: "What's your style?", subtitle: "Pick whatever feels right. You can choose more than one.", required: false },
  { id: "colours", label: "Colours", title: "What colours do you like wearing?", subtitle: "Tap the ones that feel like you.", required: false },
  { id: "notes", label: "Notes", title: "Anything else Driply should know?", subtitle: "Optional — skip if you'd rather dive in.", required: false },
];

const LIFESTYLE_OPTIONS = [
  "School / University", "Work", "Everyday / Casual", "Going out",
  "Parties / Events", "Dates", "Sports / Active", "Other",
];

const STYLE_OPTIONS = [
  "Casual", "Streetwear", "Minimal", "Smart Casual", "Formal",
  "Sporty", "Vintage", "Y2K", "Trendy", "Experimental", "Still figuring it out",
];

const COLOUR_OPTIONS = [
  { name: "Black", hex: "#15130F" },
  { name: "White", hex: "#F6F2E9" },
  { name: "Grey", hex: "#9C9484" },
  { name: "Navy", hex: "#1E2A3A" },
  { name: "Brown", hex: "#5A3E2B" },
  { name: "Beige", hex: "#D4C4A8" },
  { name: "Olive", hex: "#5A6B3A" },
  { name: "Burgundy", hex: "#6B1F2E" },
  { name: "Red", hex: "#B33A3A" },
  { name: "Orange", hex: "#D97A2A" },
  { name: "Yellow", hex: "#D9B361" },
  { name: "Green", hex: "#3A7B4A" },
  { name: "Teal", hex: "#2A7B7B" },
  { name: "Blue", hex: "#3A5A8A" },
  { name: "Purple", hex: "#6B3A7B" },
  { name: "Pink", hex: "#D49AA8" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [lifestyle, setLifestyle] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [colours, setColours] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const toggle = useCallback((list: string[], setter: (v: string[]) => void, value: string) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }, []);

  function handleNext() {
    setError(null);
    if (step.required && step.id === "name" && !displayName.trim()) {
      setError("Please enter a name so we know what to call you.");
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  }

  function handleBack() {
    setError(null);
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  async function handleFinish() {
    setError(null);
    setSaving(true);

    const userId = user?.id;
    if (!userId) {
      setError("Your session has expired. Please sign in again.");
      setSaving(false);
      return;
    }

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          location: location.trim() || null,
          onboarding_completed: true,
        })
        .eq("user_id", userId);

      if (profileError) throw profileError;

      const { error: prefError } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: userId,
          lifestyle,
          preferred_styles: styles,
          favourite_colours: colours,
          style_notes: notes.trim() || null,
        });

      if (prefError) throw prefError;

      await refreshProfile();
      navigate("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save your preferences. Please try again.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function handlePrimary(e: FormEvent) {
    e.preventDefault();
    if (isLastStep) {
      handleFinish();
    } else {
      handleNext();
    }
  }

  if (saving) {
    return (
      <div className="min-h-screen bg-bone-50 flex flex-col items-center justify-center px-6">
        <div className="w-8 h-8 border-2 border-bone-300 border-t-ochre-500 rounded-full animate-spin mb-4" />
        <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">Saving</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bone-50 flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-12 md:px-12 md:pt-16 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium tracking-wide text-ink-400">
            {String(stepIndex + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
          </span>
          {!step.required && (
            <button
              onClick={() => (isLastStep ? handleFinish() : handleNext())}
              className="text-xs font-medium tracking-wide text-ink-400 hover:text-ink-700 transition-colors"
            >
              Skip
            </button>
          )}
        </div>
        <div className="h-0.5 w-full bg-bone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-ochre-500 transition-all duration-300 ease-out"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 md:px-12 flex flex-col">
        <div className="max-w-sm w-full mx-auto flex-1 flex flex-col">
          <h1 className="text-2xl md:text-3xl font-display tracking-tight text-balance mt-6">
            {step.title}
          </h1>
          <p className="text-sm text-ink-500 mt-2 leading-relaxed">{step.subtitle}</p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handlePrimary} className="flex-1 flex flex-col mt-8" id="onboarding-form">
            {step.id === "name" && (
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                autoFocus
                autoComplete="name"
              />
            )}

            {step.id === "location" && (
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
                autoFocus
                autoComplete="country-name"
              />
            )}

            {step.id === "lifestyle" && (
              <div className="flex flex-wrap gap-2.5">
                {LIFESTYLE_OPTIONS.map((opt) => (
                  <ChipButton
                    key={opt}
                    label={opt}
                    selected={lifestyle.includes(opt)}
                    onClick={() => toggle(lifestyle, setLifestyle, opt)}
                  />
                ))}
              </div>
            )}

            {step.id === "style" && (
              <div className="flex flex-wrap gap-2.5">
                {STYLE_OPTIONS.map((opt) => (
                  <ChipButton
                    key={opt}
                    label={opt}
                    selected={styles.includes(opt)}
                    onClick={() => toggle(styles, setStyles, opt)}
                  />
                ))}
              </div>
            )}

            {step.id === "colours" && (
              <div className="grid grid-cols-4 gap-3">
                {COLOUR_OPTIONS.map((c) => {
                  const selected = colours.includes(c.name);
                  const isLight = ["White", "Beige", "Yellow"].includes(c.name);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => toggle(colours, setColours, c.name)}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                          selected ? "ring-2 ring-ochre-500 ring-offset-2 ring-offset-bone-50 scale-105" : "ring-1 ring-bone-300"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {selected && (
                          <Check
                            size={18}
                            strokeWidth={2.5}
                            className={isLight ? "text-ink-700" : "text-bone-50"}
                          />
                        )}
                      </div>
                      <span className={`text-[10px] ${selected ? "text-ochre-500 font-medium" : "text-ink-400"}`}>
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {step.id === "notes" && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Things I like, things I avoid, how I normally dress..."
                rows={5}
                className="w-full rounded-lg border border-bone-300 bg-bone-50 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors duration-200 focus:border-ochre-400 focus:outline-none focus:ring-1 focus:ring-ochre-400 resize-none"
              />
            )}
          </form>
        </div>
      </div>

      {/* Navigation buttons — sticky at bottom for mobile reachability */}
      <div className="sticky bottom-0 bg-bone-50/90 backdrop-blur-lg border-t border-bone-200 px-6 py-4 pb-safe md:px-12">
        <div className="max-w-sm w-full mx-auto flex items-center gap-3">
          {stepIndex > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleBack}
              className="shrink-0"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </Button>
          )}
          <Button
            type="submit"
            form="onboarding-form"
            size="md"
            disabled={saving}
            className="flex-1"
          >
            {isLastStep ? "Finish" : "Continue"}
            <ChevronRight size={18} strokeWidth={1.5} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChipButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-full text-sm font-medium tracking-wide transition-all duration-200 ${
        selected
          ? "bg-ink-900 text-bone-50 border border-ink-900"
          : "bg-transparent text-ink-700 border border-bone-300 hover:border-ink-400"
      }`}
    >
      {label}
    </button>
  );
}
