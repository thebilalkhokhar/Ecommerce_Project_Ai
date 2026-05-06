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
      <header className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-textMain">
          Categories
        </h1>
        <p className="mt-1 text-sm text-textMain/60">
          Create and browse store categories.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <section>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-textMain/60">
            New category
          </h2>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-6"
          >
            <div>
              <label
                htmlFor="cat-name"
                className="mb-1.5 block text-xs font-medium text-textMain/60"
              >
                Name
              </label>
              <input
                id="cat-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-textMain placeholder:text-textMain/50 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary/35"
                placeholder="Category name"
              />
            </div>
            <div>
              <label
                htmlFor="cat-desc"
                className="mb-1.5 block text-xs font-medium text-textMain/60"
              >
                Description <span className="text-textMain/50">(optional)</span>
              </label>
              <textarea
                id="cat-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-y rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-textMain placeholder:text-textMain/50 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary/35"
                placeholder="Short description"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[140px] sm:px-6"
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
          <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-textMain/60">
            All categories
          </h2>
          {isLoading ? (
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-6 py-10">
              <Loader2 className="h-5 w-5 animate-spin text-textMain/60" />
              <span className="text-sm text-textMain/60">Loading…</span>
            </div>
          ) : categories.length === 0 ? (
            <p className="rounded-lg border border-gray-200 border-dashed bg-gray-50 px-6 py-10 text-center text-sm text-textMain/60">
              No categories yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100">
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-textMain/60">
                      ID
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-textMain/60">
                      Name
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-textMain/60">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categories.map((c) => (
                    <tr key={c.id} className="bg-surface/95">
                      <td className="px-4 py-3 tabular-nums text-textMain/70">
                        {c.id}
                      </td>
                      <td className="px-4 py-3 font-medium text-textMain">
                        {c.name}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-textMain/70">
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
