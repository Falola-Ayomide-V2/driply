import { Outlet } from "react-router-dom";
import BottomNav from "@/components/navigation/BottomNav";
import NavRail from "@/components/navigation/NavRail";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-bone-50">
      <div className="flex">
        <NavRail />
        <main className="flex-1 min-h-screen pb-24 md:pb-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
