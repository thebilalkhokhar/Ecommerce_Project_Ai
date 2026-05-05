"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import axios from "axios";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { FacebookLoginButton } from "@/components/FacebookLoginButton";

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
      router.push(nextPath.startsWith("/") ? nextPath : "/products");
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
      router.push(nextPath.startsWith("/") ? nextPath : "/products");
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
            disabled={submitting || googleSubmitting || facebookSubmitting}
            className="w-full rounded-md border border-zinc-700 bg-zinc-50 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:opacity-50"
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
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-zinc-950 px-3 text-zinc-500">Or</span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3">
              {hasGoogleOAuth && (
                <div
                  className={`flex min-h-[44px] w-full justify-center [&>div]:w-full ${googleSubmitting || facebookSubmitting ? "pointer-events-none opacity-50" : ""}`}
                >
                  <GoogleLogin
                    onSuccess={(cred) => {
                      if (cred.credential) {
                        void handleGoogleCredential(cred.credential);
                      }
                    }}
                    onError={() => {
                      toast.error("Google sign-in was cancelled or failed.");
                    }}
                    theme="filled_black"
                    size="large"
                    width="320"
                    text="continue_with"
                    shape="rectangular"
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
