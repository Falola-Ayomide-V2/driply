import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoadingState from "@/components/ui/LoadingState";

export default function ProtectedRoute() {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bone-50 flex items-center justify-center">
        <LoadingState label="Driply" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // If user hasn't completed onboarding and isn't already on /onboarding, redirect there
  if (profile && !profile.onboarding_completed && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // If user has completed onboarding and tries to visit /onboarding, send them to the app
  if (profile?.onboarding_completed && location.pathname === "/onboarding") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
