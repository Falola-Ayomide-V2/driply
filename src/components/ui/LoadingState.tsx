export default function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="w-8 h-8 border-2 border-bone-300 border-t-ochre-500 rounded-full animate-spin" />
      <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">{label}</p>
    </div>
  );
}
