import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { login, saveToken, signUp } from "../lib/api";

export function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || (mode === "signup" && !fullName)) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      const result =
        mode === "signup"
          ? await signUp(email, password, fullName)
          : await login(email, password);

      saveToken(result.token);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-emerald-900/10 bg-white/90 p-8 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold text-stone-900">
          Account Access
        </h1>
        <p className="mb-6 text-stone-600">
          Create an account or login to generate your plan.
        </p>

        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${mode === "signup" ? "bg-emerald-900 text-[#fffaf0]" : "bg-amber-50 text-stone-700"}`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${mode === "login" ? "bg-emerald-900 text-[#fffaf0]" : "bg-amber-50 text-stone-700"}`}
          >
            Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Full Name
              </label>
              <input
                className="w-full rounded-lg border border-emerald-900/20 bg-white px-3 py-2"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ada Lovelace"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Email
            </label>
            <input
              className="w-full rounded-lg border border-emerald-900/20 bg-white px-3 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Password
            </label>
            <input
              className="w-full rounded-lg border border-emerald-900/20 bg-white px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full rounded-lg bg-emerald-900 px-4 py-3 font-semibold text-[#fffaf0] hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {loading
              ? "Please wait..."
              : mode === "signup"
                ? "Create Account"
                : "Login"}
          </button>
        </form>

        <p className="mt-6 text-sm text-stone-600">
          Back to{" "}
          <Link to="/" className="font-semibold text-emerald-900 underline">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}
