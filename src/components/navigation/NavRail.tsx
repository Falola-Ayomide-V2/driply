import { NavLink } from "react-router-dom";
import { Sparkles, Shirt, Images, Bookmark, Calendar, User } from "lucide-react";

const items = [
  { to: "/", label: "Stylist", icon: Sparkles },
  { to: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { to: "/inspiration", label: "Inspo", icon: Images },
  { to: "/fits", label: "Fits", icon: Bookmark },
  { to: "/calendar", label: "Calendar", icon: Calendar },
];

export default function NavRail() {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 flex-col items-center py-8 border-r border-bone-200 bg-bone-100 z-40">
      <NavLink
        to="/"
        className="font-display text-2xl tracking-tight text-ink-900 mb-12"
      >
        D
      </NavLink>
      <nav className="flex flex-col gap-2 flex-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `group relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                isActive ? "bg-ochre-500 text-bone-50" : "text-ink-500 hover:bg-bone-200"
              }`
            }
            title={label}
          >
            <Icon size={20} strokeWidth={1.5} />
          </NavLink>
        ))}
      </nav>
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
            isActive ? "bg-ochre-500 text-bone-50" : "text-ink-500 hover:bg-bone-200"
          }`
        }
        title="Profile"
      >
        <User size={20} strokeWidth={1.5} />
      </NavLink>
    </aside>
  );
}
