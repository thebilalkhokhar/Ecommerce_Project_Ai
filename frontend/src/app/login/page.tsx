"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { completeLoginAndRedirect } from "@/lib/postLoginRedirect";
import { useAuthStore } from "@/store/authStore";
import { FacebookLoginButton } from "@/components/FacebookLoginButton";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

const inputClass =
  "w-full rounded-xl border border-primary/15 bg-surface px-3 py-2.5 text-sm text-textMain shadow-sm transition placeholder:text-textMain/45 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

const hasGoogleOAuth =
  typeof process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID === "string" &&
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.length > 0;

const hasFacebookOAuth =
  typeof process.env.NEXT_PUBLIC_FACEBOOK_APP_ID === "string" &&
  process.env.NEXT_PUBLIC_FACEBOOK_APP_ID.length > 0;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [facebookSubmitting, setFacebookSubmitting] = useState(false);
  const [error, setError] = useState("");

  const checkoutHint = searchParams.get("reason") === "checkout";
  const rawNext = searchParams.get("next");
  const nextPath =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/products";

  async function handleGoogleCredential(credential: string) {
    setError("");
    setGoogleSubmitting(true);
    try {
      const { data } = await api.post<TokenResponse>("/auth/google-login", {
        credential,
      });
      login(data.access_token);
      toast.success("Signed in with Google.");
      await completeLoginAndRedirect(router, { customerFallback: nextPath });
    } catch (err: unknown) {
      let msg = "Google sign-in failed.";
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === "string") {
          msg = detail;
        }
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setGoogleSubmitting(false);
    }
  }

  async function handleFacebookAccessToken(accessToken: string) {
    setError("");
    setFacebookSubmitting(true);
    try {
      const { data } = await api.post<TokenResponse>("/auth/facebook-login", {
        access_token: accessToken,
      });
      login(data.access_token);
      toast.success("Signed in with Facebook.");
      await completeLoginAndRedirect(router, { customerFallback: nextPath });
    } catch (err: unknown) {
      let msg = "Facebook sign-in failed.";
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === "string") {
          msg = detail;
        }
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setFacebookSubmitting(false);
    }
  }

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
      await completeLoginAndRedirect(router, { customerFallback: nextPath });
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
    <main className="mx-auto flex min-h-0 w-full min-w-0 max-w-7xl flex-1 flex-col justify-center bg-background px-4 py-12 md:py-16">
      <div className="mx-auto w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-surface p-8 shadow-sm md:p-9">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Account
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-textMain md:text-3xl">
            Sign in
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-textMain/70">
            Use the email and password you registered with.
          </p>

          {checkoutHint && (
            <p
              className="mt-5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-textMain/85"
              role="status"
            >
              Please sign in to complete your checkout.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <p
                className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800"
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
                className={inputClass}
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
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || googleSubmitting || facebookSubmitting}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold tracking-wide text-white shadow-md transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {(hasGoogleOAuth || hasFacebookOAuth) && (
            <>
              <div className="relative my-6">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden
                >
                  <div className="w-full border-t border-primary/10" />
                </div>
                <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wider">
                  <span className="bg-surface px-3 text-textMain/55">Or</span>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3">
                {hasGoogleOAuth && (
                  <div
                    className={
                      googleSubmitting || facebookSubmitting
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  >
                    <GoogleLoginButton
                      disabled={
                        submitting || googleSubmitting || facebookSubmitting
                      }
                      text="continue_with"
                      onCredential={(credential) => {
                        void handleGoogleCredential(credential);
                      }}
                      onError={() => {
                        toast.error("Google sign-in was cancelled or failed.");
                      }}
                    />
                  </div>
                )}

                {hasFacebookOAuth && (
                  <FacebookLoginButton
                    disabled={
                      googleSubmitting ||
                      facebookSubmitting ||
                      submitting
                    }
                    onAccessToken={(token) => {
                      void handleFacebookAccessToken(token);
                    }}
                    onError={() =>
                      toast.error("Facebook sign-in was cancelled or failed.")
                    }
                  />
                )}
              </div>
            </>
          )}

          <p className="mt-8 text-center text-sm text-textMain/70">
          No account?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            Create one
          </Link>
        </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-0 w-full min-w-0 max-w-7xl flex-1 flex-col items-center justify-center bg-background px-4 py-12 md:py-16">
          <Loader2
            className="h-8 w-8 animate-spin text-primary/70"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="mt-4 text-sm text-textMain/60">Loading…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
