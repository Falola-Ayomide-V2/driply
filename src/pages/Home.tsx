import { Link } from "react-router-dom";
import PageHeader from "@/components/ui/PageHeader";
import { Sparkles, Shirt, Images, Bookmark, Calendar, ArrowRight } from "lucide-react";

const features = [
  { to: "/wardrobe", label: "Wardrobe", desc: "Curate your pieces", icon: Shirt },
  { to: "/inspiration", label: "Inspo", desc: "Save what moves you", icon: Images },
  { to: "/fits", label: "Fits", desc: "Outfits you love", icon: Bookmark },
  { to: "/calendar", label: "Calendar", desc: "Plan what to wear", icon: Calendar },
];

export default function HomePage() {
  return (
    <div className="md:ml-20">
      <PageHeader
        title="Driply"
        subtitle="Your personal wardrobe and styling companion."
      />
      <div className="px-6 md:px-12">
        <div className="rounded-3xl bg-ink-900 p-8 md:p-12 text-bone-50">
          <Sparkles size={28} strokeWidth={1.5} className="text-ochre-300 mb-6" />
          <h2 className="text-2xl md:text-3xl font-display tracking-tight text-balance">
            Stylist coming soon
          </h2>
          <p className="mt-3 text-sm text-bone-200 leading-relaxed max-w-md">
            An AI stylist will help you build outfits from your wardrobe, suggest new
            combinations, and refine your personal style.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          {features.map(({ to, label, desc, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col gap-3 rounded-2xl border border-bone-200 bg-bone-100 p-6 transition-all duration-200 hover:border-ochre-300 hover:bg-bone-50"
            >
              <Icon size={22} strokeWidth={1.5} className="text-ochre-500" />
              <div>
                <p className="font-display text-lg tracking-tight">{label}</p>
                <p className="text-xs text-ink-500 mt-0.5">{desc}</p>
              </div>
              <ArrowRight
                size={16}
                strokeWidth={1.5}
                className="text-ink-400 group-hover:text-ochre-500 group-hover:translate-x-1 transition-all"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
