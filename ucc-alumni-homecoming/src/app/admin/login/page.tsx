
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);

    try {
      await signIn("google", {
        callbackUrl: "/admin",
      });
    } catch (error) {
      console.error("Google login failed:", error);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8F1DF] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-[#064B36] p-4">
            <ShieldCheck className="h-10 w-10 text-[#D6A84B]" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D6A84B]">
            UCC Alumni Homecoming 2027
          </p>

          <h1 className="mt-3 font-serif text-3xl font-bold text-[#064B36]">
            Admin Portal
          </h1>

          <p className="mt-3 text-sm text-gray-600">
            Sign in using your authorized Google account
            to access the administration system.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg bg-[#064B36] px-5 py-3 font-semibold text-white transition hover:bg-[#083C2D] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>
            {loading ? "Connecting..." : "Continue with Google"}
          </span>
        </button>

        <p className="mt-6 text-center text-xs text-gray-500">
          Authorized administrators only.
        </p>
      </div>
    </main>
  );
}
