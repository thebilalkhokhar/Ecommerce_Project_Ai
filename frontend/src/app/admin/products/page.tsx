"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import axios from "axios";
import { ImageIcon, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import api from "@/lib/axios";

type Category = {
  id: number;
  name: string;
  description?: string | null;
};

type ProductVariant = {
  id: number;
  product_id: number;
  name: string;
  price_adjustment: number;
  stock_quantity: number;
};

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  stock_quantity: number;
  image_url: string | null;
  category: Category | null;
  variants?: ProductVariant[];
};

type VariantFormRow = {
  name: string;
  price_adjustment: number;
  stock_quantity: number;
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
  const formSectionRef = useRef<HTMLElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock_quantity, setStockQuantity] = useState("0");
  const [category_id, setCategoryId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [variants, setVariants] = useState<VariantFormRow[]>([]);

  function resetForm() {
    setEditingProduct(null);
    setName("");
    setDescription("");
    setPrice("");
    setStockQuantity("0");
    setCategoryId("");
    setImageFile(null);
    setVariants([]);
    const fileInput = document.getElementById(
      "product-image",
    ) as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = "";
    }
  }

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

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description ?? "");
    const p =
      typeof product.price === "number"
        ? product.price
        : Number.parseFloat(String(product.price));
    setPrice(Number.isFinite(p) ? String(p) : "");
    setStockQuantity(String(product.stock_quantity));
    setCategoryId(
      product.category?.id != null ? String(product.category.id) : "",
    );
    setImageFile(null);
    setVariants(
      product.variants?.length
        ? product.variants.map((v) => ({
            name: v.name,
            price_adjustment:
              typeof v.price_adjustment === "number"
                ? v.price_adjustment
                : Number.parseFloat(String(v.price_adjustment)) || 0,
            stock_quantity: v.stock_quantity,
          }))
        : [],
    );
    const fileInput = document.getElementById(
      "product-image",
    ) as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = "";
    }
    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function handleDelete(productId: number) {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    try {
      await api.delete(`/products/${productId}`);
      toast.success("Product deleted");
      await loadData();
      if (editingProduct?.id === productId) {
        resetForm();
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error(
          "Cannot delete product: It is associated with existing orders.",
        );
        return;
      }
      let msg = "Could not delete product.";
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === "string") {
          msg = detail;
        }
      }
      toast.error(msg);
    }
  }

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

    const variantsPayload = variants
      .filter((v) => v.name.trim() !== "")
      .map((v) => ({
        name: v.name.trim(),
        price_adjustment: Number.isFinite(v.price_adjustment)
          ? v.price_adjustment
          : Number.parseFloat(String(v.price_adjustment)) || 0,
        stock_quantity: (() => {
          const n = Number.parseInt(String(v.stock_quantity), 10);
          return Number.isFinite(n) && n >= 0 ? n : 0;
        })(),
      }));

    const payload: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() === "" ? null : description.trim(),
      price: priceNum,
      stock_quantity: stockNum,
      category_id:
        category_id === ""
          ? null
          : Number.parseInt(category_id, 10),
      variants: variantsPayload,
    };

    setIsSubmitting(true);
    try {
      let productId: number;

      if (editingProduct) {
        const { data } = await api.put<Product>(
          `/products/${editingProduct.id}`,
          payload,
        );
        if (data?.id == null) {
          throw new Error("Invalid product response");
        }
        productId = data.id;
        toast.success("Product updated successfully.");
      } else {
        const { data: newProduct } = await api.post<Product>(
          "/products",
          payload,
        );
        if (newProduct?.id == null) {
          throw new Error("Invalid product response");
        }
        productId = newProduct.id;
        toast.success("Product created successfully.");
      }

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        await api.post(`/products/${productId}/image`, formData, {
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

      resetForm();
      await loadData();
    } catch (err) {
      let msg = editingProduct
        ? "Could not update product."
        : "Could not create product.";
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

  const isEditing = editingProduct != null;

  return (
    <div>
      <header className="mb-8 border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Products
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Add, edit, or remove catalog items and images.
        </p>
      </header>

      <section ref={formSectionRef} className="mb-12">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          {isEditing ? "Edit Product" : "Add New Product"}
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
                Product variants (optional)
              </h3>
              <button
                type="button"
                onClick={() =>
                  setVariants((prev) => [
                    ...prev,
                    { name: "", price_adjustment: 0, stock_quantity: 0 },
                  ])
                }
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Add variant
              </button>
            </div>
            <div className="space-y-3 rounded-md border border-zinc-800 bg-zinc-950/50 p-4">
              {variants.length === 0 ? (
                <p className="text-xs text-zinc-600">
                  No variants. Add rows for options like size or configuration; stock
                  and price adjustment apply per variant at checkout.
                </p>
              ) : (
                variants.map((row, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 rounded-md border border-zinc-800/80 bg-zinc-900/40 p-3 sm:flex-row sm:flex-wrap sm:items-end"
                  >
                    <div className="min-w-0 flex-1 sm:min-w-[140px]">
                      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                        Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Size: L"
                        value={row.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setVariants((prev) =>
                            prev.map((r, i) =>
                              i === index ? { ...r, name: v } : r,
                            ),
                          );
                        }}
                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                      />
                    </div>
                    <div className="w-full sm:w-28">
                      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                        Price ±
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={row.price_adjustment}
                        onChange={(e) => {
                          const n = Number.parseFloat(e.target.value);
                          setVariants((prev) =>
                            prev.map((r, i) =>
                              i === index
                                ? {
                                    ...r,
                                    price_adjustment: Number.isFinite(n)
                                      ? n
                                      : 0,
                                  }
                                : r,
                            ),
                          );
                        }}
                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                      />
                    </div>
                    <div className="w-full sm:w-24">
                      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                        Stock
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={row.stock_quantity}
                        onChange={(e) => {
                          const n = Number.parseInt(e.target.value, 10);
                          setVariants((prev) =>
                            prev.map((r, i) =>
                              i === index
                                ? {
                                    ...r,
                                    stock_quantity: Number.isFinite(n)
                                      ? Math.max(0, n)
                                      : 0,
                                  }
                                : r,
                            ),
                          );
                        }}
                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setVariants((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-800 text-zinc-500 transition hover:border-red-900/50 hover:bg-red-950/30 hover:text-red-400"
                      aria-label="Remove variant"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
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
              ) : isEditing ? (
                "Update Product"
              ) : (
                "Create product"
              )}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => resetForm()}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
              >
                Cancel
              </button>
            )}
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
            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
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
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Actions
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
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(p)}
                            className="rounded-md p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                            aria-label={`Edit ${p.name}`}
                          >
                            <Pencil className="h-4 w-4" strokeWidth={1.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(p.id)}
                            className="rounded-md p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-red-400"
                            aria-label={`Delete ${p.name}`}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                          </button>
                        </div>
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
