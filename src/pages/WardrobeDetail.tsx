import { useParams } from "react-router-dom";
import PagePlaceholder from "@/components/ui/PagePlaceholder";

export default function WardrobeDetailPage() {
  const { id } = useParams();
  return (
    <PagePlaceholder
      title="Item Details"
      subtitle={`Viewing item ${id}`}
      emptyTitle="Item not found"
      emptyDesc="Wardrobe item details will be available here once the wardrobe feature is built."
    />
  );
}
