interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message = "Something went wrong", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-8">
      <div className="w-16 h-16 rounded-full border border-red-200 bg-red-50 flex items-center justify-center mb-6">
        <span className="text-red-400 text-xl">!</span>
      </div>
      <h3 className="text-lg font-display tracking-tight text-red-600">{message}</h3>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 text-xs font-medium tracking-wide text-ink-500 underline underline-offset-4 hover:text-ink-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
