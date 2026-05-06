"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";

type Category = {
  id: number;
  name: string;
  description: string | null;
};

const inputClass =
  "w-full rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-sm text-textMain shadow-sm transition placeholder:text-textMain/45 focus:border-primary/30 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-textMain/55";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<Category[]>("/categories");
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Could not load categories.");
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/categories", {
        name: name.trim(),
        description: description.trim() === "" ? null : description.trim(),
      });
      toast.success("Category created.");
      setName("");
      setDescription("");
      await loadCategories();
    } catch (err) {
      let msg = "Could not create category.";
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === "string") {
          msg = detail;
        }
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-10 pb-4">
      <header className="rounded-2xl border border-primary/10 bg-surface px-5 py-6 shadow-sm md:px-7 md:py-8">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          Taxonomy
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-textMain md:text-3xl">
          Categories
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-textMain/70">
          Create groups for your catalog. Products can be linked to a category
          from the product editor.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-textMain/50">
            New category
          </h2>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-primary/10 bg-surface p-6 shadow-sm md:p-7"
          >
            <div>
              <label htmlFor="cat-name" className={labelClass}>
                Name
              </label>
              <input
                id="cat-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Category name"
              />
            </div>
            <div>
              <label htmlFor="cat-desc" className={labelClass}>
                Description{" "}
                <span className="font-normal normal-case text-textMain/45">
                  (optional)
                </span>
              </label>
              <textarea
                id="cat-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputClass} resize-y`}
                placeholder="Short description"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100 sm:w-auto sm:min-w-[160px] sm:px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Create category"
              )}
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-textMain/50">
              All categories
            </h2>
            {!isLoading ? (
              <p className="text-xs font-medium text-textMain/50">
                {categories.length}{" "}
                {categories.length === 1 ? "category" : "categories"}
              </p>
            ) : null}
          </div>
          {isLoading ? (
            <div
              className="flex items-center gap-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-6 py-12"
              aria-live="polite"
              aria-busy="true"
            >
              <Loader2
                className="h-6 w-6 shrink-0 animate-spin text-primary"
                strokeWidth={2}
                aria-hidden
              />
              <div>
                <p className="text-sm font-medium text-textMain">Loading…</p>
                <p className="mt-0.5 text-xs text-textMain/55">
                  Fetching category list
                </p>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-14 text-center text-sm font-medium text-textMain/70">
              No categories yet. Create one using the form on the left.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-primary/10 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-primary/10 bg-primary/5">
                      <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                        ID
                      </th>
                      <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                        Name
                      </th>
                      <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10 bg-surface">
                    {categories.map((c) => (
                      <tr
                        key={c.id}
                        className="transition-colors hover:bg-primary/4"
                      >
                        <td className="px-4 py-3.5 tabular-nums text-textMain/75">
                          {c.id}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-textMain">
                          {c.name}
                        </td>
                        <td className="max-w-xs px-4 py-3.5 text-textMain/70">
                          {c.description?.trim() ? c.description : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
