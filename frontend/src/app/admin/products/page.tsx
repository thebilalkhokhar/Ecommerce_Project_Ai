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

const inputClass =
  "w-full rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-sm text-textMain shadow-sm transition focus:border-primary/30 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-textMain/55";

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
    <div className="space-y-10 pb-4">
      <header className="rounded-2xl border border-primary/10 bg-surface px-5 py-6 shadow-sm md:px-7 md:py-8">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          Catalog
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-textMain md:text-3xl">
          Products
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-textMain/70">
          Create and maintain catalog items, upload images, and manage variants.
          Changes apply to the storefront immediately.
        </p>
      </header>

      <section ref={formSectionRef} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-textMain/50">
            {isEditing ? "Edit product" : "Add product"}
          </h2>
          {isEditing ? (
            <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              Editing #{editingProduct.id}
            </span>
          ) : null}
        </div>
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-2xl border border-primary/10 bg-surface p-6 shadow-sm md:grid-cols-2 md:p-8"
        >
          <div className="space-y-4 md:col-span-2 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            <div className="md:col-span-2">
              <label htmlFor="p-name" className={labelClass}>
                Name
              </label>
              <input
                id="p-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="p-desc" className={labelClass}>
                Description <span className="font-normal normal-case text-textMain/45">(optional)</span>
              </label>
              <textarea
                id="p-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputClass} resize-y`}
              />
            </div>
            <div>
              <label htmlFor="p-price" className={labelClass}>
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
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="p-stock" className={labelClass}>
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
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="p-category" className={labelClass}>
                Category
              </label>
              <select
                id="p-category"
                value={category_id}
                onChange={(e) => setCategoryId(e.target.value)}
                className={inputClass}
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
              <label htmlFor="product-image" className={labelClass}>
                Image <span className="font-normal normal-case text-textMain/45">(optional)</span>
              </label>
              <input
                id="product-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setImageFile(f ?? null);
                }}
                className="w-full text-sm text-textMain/70 file:mr-3 file:cursor-pointer file:rounded-xl file:border file:border-primary/20 file:bg-primary/5 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-textMain file:transition-colors hover:file:border-primary/35 hover:file:bg-primary/10"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-textMain/50">
                Variants (optional)
              </h3>
              <button
                type="button"
                onClick={() =>
                  setVariants((prev) => [
                    ...prev,
                    { name: "", price_adjustment: 0, stock_quantity: 0 },
                  ])
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-textMain transition hover:border-primary/30 hover:bg-primary/10 active:scale-[0.98]"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Add variant
              </button>
            </div>
            <div className="space-y-3 rounded-2xl border border-primary/10 bg-background/60 p-4 md:p-5">
              {variants.length === 0 ? (
                <p className="text-xs leading-relaxed text-textMain/55">
                  No variants. Add rows for options like size or color; stock and
                  price adjustment apply per variant at checkout.
                </p>
              ) : (
                variants.map((row, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 rounded-xl border border-primary/10 bg-surface p-3 sm:flex-row sm:flex-wrap sm:items-end"
                  >
                    <div className="min-w-0 flex-1 sm:min-w-[140px]">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-textMain/50">
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
                        className={inputClass}
                      />
                    </div>
                    <div className="w-full sm:w-28">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-textMain/50">
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
                        className={inputClass}
                      />
                    </div>
                    <div className="w-full sm:w-24">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-textMain/50">
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
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setVariants((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 text-textMain/60 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95"
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100 sm:w-auto sm:min-w-[180px] sm:px-8"
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
                className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 text-sm font-semibold text-textMain transition hover:border-primary/30 hover:bg-primary/10 active:scale-[0.98]"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-textMain/50">
            All products
          </h2>
          <p className="text-xs text-textMain/50">
            {listLoading ? "…" : `${products.length} in catalog`}
          </p>
        </div>
        {listLoading ? (
          <div className="flex items-center gap-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-6 py-12">
            <Loader2 className="h-6 w-6 shrink-0 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium text-textMain">Loading catalog…</p>
              <p className="mt-0.5 text-xs text-textMain/55">
                Fetching products and categories
              </p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-14 text-center text-sm font-medium text-textMain/70">
            No products yet. Use the form above to create your first item.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-primary/10 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-primary/10 bg-primary/5">
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                      Image
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                      Name
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                      Price
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                      Stock
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                      Category
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textMain/55">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10 bg-surface">
                  {products.map((p) => {
                    const hasImg =
                      typeof p.image_url === "string" && p.image_url.length > 0;
                    return (
                      <tr
                        key={p.id}
                        className="transition-colors hover:bg-primary/4"
                      >
                        <td className="px-4 py-3">
                          <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-primary/10 bg-background">
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
                                  className="h-5 w-5 text-textMain/40"
                                  strokeWidth={1.25}
                                  aria-hidden
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="max-w-[200px] px-4 py-3 font-semibold text-textMain">
                          {p.name}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-textMain/80">
                          {formatMoney(p.price)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-textMain/70">
                          {p.stock_quantity}
                        </td>
                        <td className="px-4 py-3 text-textMain/65">
                          {p.category?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(p)}
                              className="rounded-xl p-2 text-textMain/65 transition hover:bg-primary/10 hover:text-primary"
                              aria-label={`Edit ${p.name}`}
                            >
                              <Pencil className="h-4 w-4" strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(p.id)}
                              className="rounded-xl p-2 text-textMain/65 transition hover:bg-red-50 hover:text-red-600"
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
          </div>
        )}
      </section>
    </div>
  );
}
