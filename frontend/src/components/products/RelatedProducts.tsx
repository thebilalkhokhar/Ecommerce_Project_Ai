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
    <div className="rounded-lg bg-surface">
      <h2 className="mb-6 text-2xl font-bold text-textMain">
        You May Also Like
      </h2>
      <ul className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => {
          const priceNum =
            typeof p.price === "number"
              ? p.price
              : Number.parseFloat(String(p.price));
          return (
            <li key={p.id} className="flex h-full min-h-0">
              <ProductCard
                product={{
                  id: p.id,
                  name: p.name,
                  price: Number.isFinite(priceNum) ? priceNum : 0,
                  stock_quantity: p.stock_quantity,
                  image_url: p.image_url,
                }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
