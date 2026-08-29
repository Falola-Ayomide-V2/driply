import { useParams } from "react-router-dom";
import PagePlaceholder from "@/components/ui/PagePlaceholder";

export default function FitDetailPage() {
  const { id } = useParams();
  return (
    <PagePlaceholder
      title="Fit Details"
      subtitle={`Viewing fit ${id}`}
      emptyTitle="Fit not found"
      emptyDesc="Saved outfit details will be available here once the fits feature is built."
    />
  );
}
