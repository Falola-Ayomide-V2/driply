import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

interface PagePlaceholderProps {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDesc: string;
}

export default function PagePlaceholder({
  title,
  subtitle,
  emptyTitle,
  emptyDesc,
}: PagePlaceholderProps) {
  return (
    <div className="md:ml-20 min-h-screen flex flex-col">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="flex-1 flex items-center justify-center">
        <EmptyState title={emptyTitle} description={emptyDesc} />
      </div>
    </div>
  );
}
