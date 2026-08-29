import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { LogOut, Mail, MapPin } from "lucide-react";

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="md:ml-20 min-h-screen flex flex-col">
      <PageHeader title="Profile" subtitle="Your account and preferences." />
      <div className="flex-1 px-6 md:px-12 pb-12">
        <div className="max-w-md flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-ochre-200 flex items-center justify-center font-display text-2xl text-ink-700">
              {(profile?.display_name || user?.email || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-display text-lg tracking-tight">
                {profile?.display_name || "New member"}
              </p>
              <p className="text-sm text-ink-500">{user?.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 py-4 border-t border-bone-200">
            <div className="flex items-center gap-3 text-sm text-ink-700">
              <Mail size={16} strokeWidth={1.5} className="text-ink-400" />
              <span>{user?.email}</span>
            </div>
            {profile?.location && (
              <div className="flex items-center gap-3 text-sm text-ink-700">
                <MapPin size={16} strokeWidth={1.5} className="text-ink-400" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">
              Onboarding
            </p>
            <p className="text-sm text-ink-600">
              {profile?.onboarding_completed ? "Completed" : "Not yet started"}
            </p>
          </div>

          <div className="pt-4 border-t border-bone-200">
            <Button variant="ghost" size="md" onClick={() => signOut()} className="text-red-500 hover:bg-red-50">
              <LogOut size={16} strokeWidth={1.5} className="mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
