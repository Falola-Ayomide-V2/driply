interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-8">
      <div className="w-16 h-16 rounded-full border border-bone-300 flex items-center justify-center mb-6">
        <div className="w-2 h-2 rounded-full bg-ochre-400" />
      </div>
      <h3 className="text-lg font-display tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-ink-500 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
