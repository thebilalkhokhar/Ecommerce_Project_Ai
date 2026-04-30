"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const checkoutHint = searchParams.get("reason") === "checkout";
  const rawNext = searchParams.get("next");
  const nextPath =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/products";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    /** OAuth2PasswordRequestForm expects application/x-www-form-urlencoded (not multipart FormData). */
    const body = new URLSearchParams();
    body.set("username", email);
    body.set("password", password);

    try {
      const { data } = await api.post<TokenResponse>("/auth/login", body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      login(data.access_token);
      toast.success("Signed in successfully.");
      router.push(nextPath.startsWith("/") ? nextPath : "/products");
    } catch (err: unknown) {
      let msg = "Invalid email or password.";

      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === "string") {
          msg = detail;
        }
      } else {
        msg = "Network error. Is the API running?";
      }

      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Use the email and password you registered with.
        </p>

        {checkoutHint && (
          <p
            className="mt-4 rounded-md border border-amber-900/40 bg-amber-950/25 px-3 py-2 text-sm text-amber-100/90"
            role="status"
          >
            Please sign in to complete your checkout.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <p
              className="rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-200"
              role="alert"
            >
              {error}
            </p>
          )}

          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none focus:ring-0"
            />
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none focus:ring-0"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md border border-zinc-700 bg-zinc-50 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          No account?{" "}
          <Link
            href="/register"
            className="font-medium text-zinc-300 underline-offset-4 hover:text-zinc-50 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-16">
          <p className="text-center text-sm text-zinc-500">Loading…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
