const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export type ProductDetailApi = {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  stock_quantity: number;
  average_rating?: string | number;
  total_reviews?: number;
  image_url?: string | null;
  category?: { id: number; name: string } | null;
};

/** Server-side friendly fetch for the product PDP (no auth required). */
export async function fetchProductById(
  id: string,
): Promise<ProductDetailApi | null> {
  const res = await fetch(`${API_BASE}/api/v1/products/${id}`, {
    next: { revalidate: 60 },
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Product fetch failed: ${res.status}`);
  }
  return res.json() as Promise<ProductDetailApi>;
}
