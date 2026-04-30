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
    <div>
      <header className="mb-8 border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Categories
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Create and browse store categories.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <section>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            New category
          </h2>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-6"
          >
            <div>
              <label
                htmlFor="cat-name"
                className="mb-1.5 block text-xs font-medium text-zinc-500"
              >
                Name
              </label>
              <input
                id="cat-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                placeholder="Category name"
              />
            </div>
            <div>
              <label
                htmlFor="cat-desc"
                className="mb-1.5 block text-xs font-medium text-zinc-500"
              >
                Description <span className="text-zinc-600">(optional)</span>
              </label>
              <textarea
                id="cat-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                placeholder="Short description"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-50 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[140px] sm:px-6"
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

        <section>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            All categories
          </h2>
          {isLoading ? (
            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 px-6 py-10">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
              <span className="text-sm text-zinc-500">Loading…</span>
            </div>
          ) : categories.length === 0 ? (
            <p className="rounded-lg border border-zinc-800 border-dashed bg-zinc-900/20 px-6 py-10 text-center text-sm text-zinc-500">
              No categories yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60">
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                      ID
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {categories.map((c) => (
                    <tr key={c.id} className="bg-zinc-950/50">
                      <td className="px-4 py-3 tabular-nums text-zinc-400">
                        {c.id}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-100">
                        {c.name}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-zinc-400">
                        {c.description?.trim() ? c.description : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
