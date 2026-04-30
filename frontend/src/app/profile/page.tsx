"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore, type AuthUser } from "@/store/authStore";

type ProfileForm = {
  full_name: string;
  phone_number: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
};

function isAuthUser(data: unknown): data is AuthUser {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  return (
    typeof o.id === "number" &&
    typeof o.email === "string" &&
    typeof o.full_name === "string"
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState<ProfileForm>({
    full_name: "",
    phone_number: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const { data } = await api.get<unknown>("/users/me");
        if (cancelled || !isAuthUser(data)) return;
        setForm({
          full_name: data.full_name,
          phone_number: data.phone_number,
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2 ?? "",
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
        });
        setUser(data);
      } catch (err) {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.push("/login?next=/profile");
          return;
        }
        toast.error("Could not load your profile.");
      } finally {
        if (!cancelled) {
          setPageLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [router, setUser]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        full_name: form.full_name,
        phone_number: form.phone_number,
        address_line_1: form.address_line_1,
        address_line_2: form.address_line_2.trim() === "" ? null : form.address_line_2,
        city: form.city,
        state: form.state,
        postal_code: form.postal_code,
      };
      const { data } = await api.patch<unknown>("/users/me", payload);
      if (isAuthUser(data)) {
        setUser(data);
        setForm({
          full_name: data.full_name,
          phone_number: data.phone_number,
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2 ?? "",
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
        });
      }
      toast.success("Profile saved.");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/login?next=/profile");
        return;
      }
      let msg = "Could not save profile.";
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === "string") {
          msg = detail;
        } else if (Array.isArray(detail)) {
          msg = detail.map((d) => d.msg ?? JSON.stringify(d)).join(" ");
        }
      }
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-4 py-24">
        <Loader2
          className="h-8 w-8 animate-spin text-zinc-500"
          strokeWidth={1.5}
          aria-hidden
        />
        <p className="mt-4 text-sm text-zinc-500">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl flex-1 px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 md:text-3xl">
        My Profile
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Update your contact details. Email cannot be changed here.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-10 space-y-6 rounded-xl border border-zinc-800 bg-zinc-950 p-6 md:p-8"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="full_name"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoComplete="name"
              value={form.full_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, full_name: e.target.value }))
              }
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="phone_number"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Phone number
            </label>
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              required
              autoComplete="tel"
              value={form.phone_number}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone_number: e.target.value }))
              }
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="address_line_1"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Address line 1
            </label>
            <input
              id="address_line_1"
              name="address_line_1"
              type="text"
              required
              autoComplete="address-line1"
              value={form.address_line_1}
              onChange={(e) =>
                setForm((f) => ({ ...f, address_line_1: e.target.value }))
              }
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="address_line_2"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Address line 2 <span className="font-normal normal-case text-zinc-600">(optional)</span>
            </label>
            <input
              id="address_line_2"
              name="address_line_2"
              type="text"
              autoComplete="address-line2"
              value={form.address_line_2}
              onChange={(e) =>
                setForm((f) => ({ ...f, address_line_2: e.target.value }))
              }
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <div>
            <label
              htmlFor="city"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              autoComplete="address-level2"
              value={form.city}
              onChange={(e) =>
                setForm((f) => ({ ...f, city: e.target.value }))
              }
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <div>
            <label
              htmlFor="state"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              State / Province
            </label>
            <input
              id="state"
              name="state"
              type="text"
              required
              autoComplete="address-level1"
              value={form.state}
              onChange={(e) =>
                setForm((f) => ({ ...f, state: e.target.value }))
              }
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="postal_code"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500"
            >
              Postal code
            </label>
            <input
              id="postal_code"
              name="postal_code"
              type="text"
              required
              autoComplete="postal-code"
              value={form.postal_code}
              onChange={(e) =>
                setForm((f) => ({ ...f, postal_code: e.target.value }))
              }
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-50 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[160px] sm:px-8"
          >
            {isLoading ? (
              <>
                <Loader2
                  className="h-4 w-4 animate-spin"
                  strokeWidth={2}
                  aria-hidden
                />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
