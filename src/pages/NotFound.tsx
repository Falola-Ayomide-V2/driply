import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bone-50 flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-display tracking-tight text-ochre-500">404</h1>
      <p className="mt-4 text-sm text-ink-500">This page doesn't exist yet.</p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center justify-center px-6 py-3 rounded-full bg-ink-900 text-bone-50 text-sm font-medium transition-colors hover:bg-ink-800"
      >
        Back to Driply
      </Link>
    </div>
  );
}
