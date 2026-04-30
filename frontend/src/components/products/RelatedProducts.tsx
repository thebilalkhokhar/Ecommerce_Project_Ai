"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { ProductCard } from "@/components/ProductCard";

type RelatedProductApi = {
  id: number;
  name: string;
  price: string | number;
  stock_quantity: number;
  image_url?: string | null;
};

type RelatedProductsProps = {
  productId: number;
};

export function RelatedProducts({ productId }: RelatedProductsProps) {
  const [products, setProducts] = useState<RelatedProductApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const { data } = await api.get<RelatedProductApi[]>(
          `/products/${productId}/related`,
        );
        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (isLoading || products.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg bg-zinc-950">
      <h2 className="mb-6 text-2xl font-bold text-zinc-50">
        You May Also Like
      </h2>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {products.map((p) => {
          const priceNum =
            typeof p.price === "number"
              ? p.price
              : Number.parseFloat(String(p.price));
          return (
            <ProductCard
              key={p.id}
              product={{
                id: p.id,
                name: p.name,
                price: Number.isFinite(priceNum) ? priceNum : 0,
                stock_quantity: p.stock_quantity,
                image_url: p.image_url,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
