"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import axios from "axios";
import { Loader2, ImageIcon } from "lucide-react";
import api from "@/lib/axios";

type Category = {
  id: number;
  name: string;
  description?: string | null;
};

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  stock_quantity: number;
  image_url: string | null;
  category: Category | null;
};

function formatMoney(amount: string | number): string {
  const n =
    typeof amount === "number" ? amount : Number.parseFloat(String(amount));
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock_quantity, setStockQuantity] = useState("0");
  const [category_id, setCategoryId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    setListLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get<Product[]>("/products", { params: { limit: 500 } }),
        api.get<Category[]>("/categories"),
      ]);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
    } catch {
      toast.error("Could not load catalog data.");
      setProducts([]);
      setCategories([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    const priceNum = Number.parseFloat(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast.error("Enter a valid price.");
      return;
    }
    const stockNum = Number.parseInt(stock_quantity, 10);
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      toast.error("Enter a valid stock quantity.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() === "" ? null : description.trim(),
        price: priceNum,
        stock_quantity: stockNum,
      };
      if (category_id !== "") {
        const cid = Number.parseInt(category_id, 10);
        if (Number.isFinite(cid)) {
          payload.category_id = cid;
        }
      }

      const { data: newProduct } = await api.post<Product>("/products", payload);
      const id = newProduct?.id;
      if (id == null) {
        throw new Error("Invalid product response");
      }

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        await api.post(`/products/${id}/image`, formData, {
          transformRequest: [
            (data, headers) => {
              if (data instanceof FormData) {
                delete (headers as Record<string, unknown>)["Content-Type"];
              }
              return data;
            },
          ],
        });
      }

      toast.success("Product created successfully.");
      setName("");
      setDescription("");
      setPrice("");
      setStockQuantity("0");
      setCategoryId("");
      setImageFile(null);
      const fileInput = document.getElementById(
        "product-image",
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";

      await loadData();
    } catch (err) {
      let msg = "Could not create product.";
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
          Products
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Add products and optional cover images.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          Add product
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 md:grid-cols-2"
        >
          <div className="space-y-4 md:col-span-2 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            <div className="md:col-span-2">
              <label
                htmlFor="p-name"
                className="mb-1.5 block text-xs font-medium text-zinc-500"
              >
                Name
              </label>
              <input
                id="p-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="p-desc"
                className="mb-1.5 block text-xs font-medium text-zinc-500"
              >
                Description <span className="text-zinc-600">(optional)</span>
              </label>
              <textarea
                id="p-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
            <div>
              <label
                htmlFor="p-price"
                className="mb-1.5 block text-xs font-medium text-zinc-500"
              >
                Price (PKR)
              </label>
              <input
                id="p-price"
                type="number"
                required
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
            <div>
              <label
                htmlFor="p-stock"
                className="mb-1.5 block text-xs font-medium text-zinc-500"
              >
                Stock quantity
              </label>
              <input
                id="p-stock"
                type="number"
                required
                min={0}
                step={1}
                value={stock_quantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
            <div>
              <label
                htmlFor="p-category"
                className="mb-1.5 block text-xs font-medium text-zinc-500"
              >
                Category
              </label>
              <select
                id="p-category"
                value={category_id}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="product-image"
                className="mb-1.5 block text-xs font-medium text-zinc-500"
              >
                Image <span className="text-zinc-600">(optional)</span>
              </label>
              <input
                id="product-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setImageFile(f ?? null);
                }}
                className="w-full text-sm text-zinc-400 file:mr-3 file:rounded-md file:border file:border-zinc-700 file:bg-zinc-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-zinc-200"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-50 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[180px] sm:px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Create product"
              )}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          Catalog
        </h2>
        {listLoading ? (
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 px-6 py-10">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            <span className="text-sm text-zinc-500">Loading products…</span>
          </div>
        ) : products.length === 0 ? (
          <p className="rounded-lg border border-zinc-800 border-dashed bg-zinc-900/20 px-6 py-10 text-center text-sm text-zinc-500">
            No products yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Image
                  </th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Name
                  </th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Price
                  </th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Stock
                  </th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {products.map((p) => {
                  const hasImg =
                    typeof p.image_url === "string" && p.image_url.length > 0;
                  return (
                    <tr key={p.id} className="bg-zinc-950/50">
                      <td className="px-3 py-2">
                        <div className="relative h-12 w-12 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
                          {hasImg ? (
                            <Image
                              src={p.image_url!}
                              alt={p.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon
                                className="h-5 w-5 text-zinc-600"
                                strokeWidth={1.25}
                                aria-hidden
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="max-w-[200px] px-3 py-2 font-medium text-zinc-100">
                        {p.name}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-zinc-300">
                        {formatMoney(p.price)}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-zinc-400">
                        {p.stock_quantity}
                      </td>
                      <td className="px-3 py-2 text-zinc-400">
                        {p.category?.name ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
