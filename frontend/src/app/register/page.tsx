"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import api from "@/lib/axios";

const PK_PHONE_PLACEHOLDER = "03134432915 or +923134432915";

export default function RegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
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

  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
          Create account
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pakistani mobile format required (see hint below).
        </p>

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
            <label htmlFor="full_name" className="sr-only">
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              required
              autoComplete="name"
              placeholder="Full name"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none focus:ring-0"
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
              autoComplete="new-password"
              placeholder="Password"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none focus:ring-0"
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
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none focus:ring-0"
            />
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
              Use a Pakistani mobile:{" "}
              <span className="text-zinc-400">
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
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none focus:ring-0"
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
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none focus:ring-0"
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
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none focus:ring-0"
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
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none focus:ring-0"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md border border-zinc-700 bg-zinc-50 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-zinc-300 underline-offset-4 hover:text-zinc-50 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
