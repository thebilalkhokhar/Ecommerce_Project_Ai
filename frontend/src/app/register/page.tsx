"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import api from "@/lib/axios";
import { completeLoginAndRedirect } from "@/lib/postLoginRedirect";
import { useAuthStore } from "@/store/authStore";
import { FacebookLoginButton } from "@/components/FacebookLoginButton";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

const inputClass =
  "w-full rounded-xl border border-primary/15 bg-surface px-3 py-2.5 text-sm text-textMain shadow-sm transition placeholder:text-textMain/45 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10";

const PK_PHONE_PLACEHOLDER = "03134432915 or +923134432915";

const hasGoogleOAuth =
  typeof process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID === "string" &&
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.length > 0;

const hasFacebookOAuth =
  typeof process.env.NEXT_PUBLIC_FACEBOOK_APP_ID === "string" &&
  process.env.NEXT_PUBLIC_FACEBOOK_APP_ID.length > 0;

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [facebookSubmitting, setFacebookSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      full_name: String(fd.get("full_name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
      phone_number: String(fd.get("phone_number") ?? "").trim(),
      address_line_1: String(fd.get("address_line_1") ?? "").trim(),
      address_line_2: null as string | null,
      city: String(fd.get("city") ?? "").trim(),
      state: String(fd.get("state") ?? "").trim(),
      postal_code: String(fd.get("postal_code") ?? "").trim(),
    };

    try {
      await api.post("/auth/register", payload);
      toast.success("Account created. Sign in with your email.");
      router.push("/login");
    } catch (err: unknown) {
      let msg = "Registration failed. Check your details.";

      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === "string") {
          msg = detail;
        } else if (Array.isArray(detail)) {
          msg = detail
            .map((d) =>
              typeof d === "object" && d && "msg" in d
                ? String((d as { msg: string }).msg)
                : JSON.stringify(d),
            )
            .join(" ");
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

  async function handleGoogleCredential(credential: string) {
    setError("");
    setGoogleSubmitting(true);
    try {
      const { data } = await api.post<TokenResponse>("/auth/google-login", {
        credential,
      });
      login(data.access_token);
      toast.success("Signed in with Google.");
      await completeLoginAndRedirect(router, { customerFallback: "/products" });
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
      await completeLoginAndRedirect(router, { customerFallback: "/products" });
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

  return (
    <main className="mx-auto flex min-h-0 w-full min-w-0 max-w-7xl flex-1 flex-col justify-center bg-background px-4 py-12 md:py-16">
      <div className="mx-auto w-full max-w-xl">
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-surface p-8 shadow-sm md:p-9">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Join
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-textMain md:text-3xl">
            Create account
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-textMain/70">
            Pakistani mobile format required (see hint below).
          </p>

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
              <label htmlFor="full_name" className="sr-only">
                Full name
              </label>
              <input
                id="full_name"
                name="full_name"
                required
                autoComplete="name"
                placeholder="Full name"
                className={inputClass}
              />
            </div>

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
                autoComplete="new-password"
                placeholder="Password"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="phone_number" className="sr-only">
                Phone number
              </label>
              <input
                id="phone_number"
                name="phone_number"
                required
                autoComplete="tel"
                placeholder={PK_PHONE_PLACEHOLDER}
                className={inputClass}
              />
              <p className="mt-2 text-xs leading-relaxed text-textMain/70">
                Use a Pakistani mobile:{" "}
                <span className="text-textMain/85">
                  +92…, 03…, optional hyphens (e.g. 0313-4432915)
                </span>
              </p>
            </div>

            <div>
              <label htmlFor="address_line_1" className="sr-only">
                Address line 1
              </label>
              <input
                id="address_line_1"
                name="address_line_1"
                required
                autoComplete="street-address"
                placeholder="Address line 1"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="sr-only">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  required
                  autoComplete="address-level2"
                  placeholder="City"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="state" className="sr-only">
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  required
                  autoComplete="address-level1"
                  placeholder="State"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="postal_code" className="sr-only">
                Postal code
              </label>
              <input
                id="postal_code"
                name="postal_code"
                required
                autoComplete="postal-code"
                placeholder="Postal code"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || googleSubmitting || facebookSubmitting}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold tracking-wide text-white shadow-md transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Register"}
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
                      text="signup_with"
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
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
