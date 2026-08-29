import { Routes, Route } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import AuthPage from "@/pages/Auth";
import HomePage from "@/pages/Home";
import WardrobePage from "@/pages/Wardrobe";
import InspirationPage from "@/pages/Inspiration";
import FitsPage from "@/pages/Fits";
import CalendarPage from "@/pages/Calendar";
import ProfilePage from "@/pages/Profile";
import StylistResultPage from "@/pages/StylistResult";
import WardrobeAddPage from "@/pages/WardrobeAdd";
import WardrobeDetailPage from "@/pages/WardrobeDetail";
import FitDetailPage from "@/pages/FitDetail";
import NotFoundPage from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/wardrobe" element={<WardrobePage />} />
        <Route path="/wardrobe/add" element={<WardrobeAddPage />} />
        <Route path="/wardrobe/:id" element={<WardrobeDetailPage />} />
        <Route path="/inspiration" element={<InspirationPage />} />
        <Route path="/fits" element={<FitsPage />} />
        <Route path="/fits/:id" element={<FitDetailPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/stylist/result" element={<StylistResultPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
