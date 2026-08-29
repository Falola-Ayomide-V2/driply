interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse rounded-lg bg-bone-200 ${className}`} />;
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 px-6 md:grid-cols-3 md:px-12">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-[3/4] w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
