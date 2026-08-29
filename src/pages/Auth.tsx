import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";

type Mode = "signin" | "signup" | "reset-request" | "reset-complete";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isResetFlow = searchParams.get("mode") === "reset";
  const resetError = searchParams.get("error") === "true";
  const [mode, setMode] = useState<Mode>(isResetFlow ? "reset-complete" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(resetError ? "Your reset link is invalid or has expired." : null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setSuccess("Account created. You're now signed in.");
        navigate("/");
      } else if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate("/");
      } else if (mode === "reset-request") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });
        if (resetError) throw resetError;
        setSuccess("Check your email for a password reset link.");
      } else if (mode === "reset-complete") {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setSuccess("Password updated. Redirecting...");
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(friendlyError(message));
    } finally {
      setLoading(false);
    }
  }

  if (loading && mode === "signin") {
    return (
      <div className="min-h-screen bg-bone-50 flex items-center justify-center">
        <LoadingState label="Signing in" />
      </div>
    );
  }

  const isReset = mode === "reset-request" || mode === "reset-complete";

  return (
    <div className="min-h-screen bg-bone-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-display tracking-tight text-center mb-2">Driply</h1>
        <p className="text-center text-sm text-ink-500 mb-8">
          {mode === "signup" && "Create your account"}
          {mode === "signin" && "Welcome back"}
          {mode === "reset-request" && "Reset your password"}
          {mode === "reset-complete" && "Set a new password"}
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-lg border border-ochre-200 bg-ochre-50 px-4 py-3 text-sm text-ochre-600">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <Input
              id="displayName"
              label="Display name (optional)"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          )}

          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />

          {mode !== "reset-request" && (
            <Input
              id="password"
              label={mode === "reset-complete" ? "New password" : "Password"}
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          )}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Please wait..." : mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : mode === "reset-request" ? "Send reset link" : "Update password"}
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-center">
          {mode === "signin" && (
            <>
              <button
                onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
                className="text-sm text-ink-500 hover:text-ink-700 transition-colors"
              >
                Don't have an account? <span className="text-ochre-500">Sign up</span>
              </button>
              <button
                onClick={() => { setMode("reset-request"); setError(null); setSuccess(null); }}
                className="text-xs text-ink-400 hover:text-ink-600 transition-colors"
              >
                Forgot your password?
              </button>
            </>
          )}
          {mode === "signup" && (
            <button
              onClick={() => { setMode("signin"); setError(null); setSuccess(null); }}
              className="text-sm text-ink-500 hover:text-ink-700 transition-colors"
            >
              Already have an account? <span className="text-ochre-500">Sign in</span>
            </button>
          )}
          {isReset && (
            <button
              onClick={() => { setMode("signin"); setError(null); setSuccess(null); }}
              className="text-sm text-ink-500 hover:text-ink-700 transition-colors"
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function friendlyError(message: string): string {
  if (message.includes("Invalid login credentials")) return "Incorrect email or password.";
  if (message.includes("User already registered")) return "An account with this email already exists.";
  if (message.includes("Password should be at least")) return "Password must be at least 6 characters.";
  return message;
}
