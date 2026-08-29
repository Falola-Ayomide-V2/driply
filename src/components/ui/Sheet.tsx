import { useEffect } from "react";
import { X } from "lucide-react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full md:max-w-lg bg-bone-50 rounded-t-3xl md:rounded-3xl shadow-xl pb-safe">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="w-10 h-1 rounded-full bg-bone-300 mx-auto md:hidden absolute left-1/2 top-3 -translate-x-1/2" />
          {title && <h2 className="text-lg font-display tracking-tight">{title}</h2>}
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 transition-colors"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className="px-6 pb-6 pt-2">{children}</div>
      </div>
    </div>
  );
}
