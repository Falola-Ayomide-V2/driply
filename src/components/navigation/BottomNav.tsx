import { NavLink } from "react-router-dom";
import { Sparkles, Shirt, Images, Bookmark, Calendar } from "lucide-react";

const items = [
  { to: "/", label: "Stylist", icon: Sparkles },
  { to: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { to: "/inspiration", label: "Inspo", icon: Images },
  { to: "/fits", label: "Fits", icon: Bookmark },
  { to: "/calendar", label: "Calendar", icon: Calendar },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-bone-200 bg-bone-50/90 backdrop-blur-lg md:hidden pb-safe">
      <div className="flex items-stretch justify-around px-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-3 px-3 text-[10px] font-medium tracking-wide transition-colors duration-200 ${
                isActive ? "text-ochre-500" : "text-ink-400"
              }`
            }
          >
            <Icon size={22} strokeWidth={1.5} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
