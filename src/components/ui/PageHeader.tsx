interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="px-6 pt-12 pb-6 md:px-12 md:pt-16">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl tracking-tight text-balance">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-ink-500 leading-relaxed">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
