import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

type ApiCategory = {
  id: number;
  name: string;
};

type ApiProduct = {
  id: number;
  name: string;
  price: string | number;
  stock_quantity: number;
  image_url?: string | null;
};

function normalizeProduct(p: ApiProduct): ProductCardData {
  const raw =
    typeof p.price === "number" ? p.price : Number.parseFloat(String(p.price));
  return {
    id: p.id,
    name: p.name,
    price: Number.isFinite(raw) ? raw : 0,
    stock_quantity: p.stock_quantity,
    image_url: p.image_url ?? null,
  };
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const categoryId = Number.parseInt(idParam, 10);
  if (!Number.isFinite(categoryId)) {
    notFound();
  }

  const [categoriesRes, productsRes] = await Promise.all([
    fetch(`${API_BASE}/api/v1/categories`, { next: { revalidate: 60 } }),
    fetch(
      `${API_BASE}/api/v1/products?category_id=${categoryId}&limit=200`,
      { next: { revalidate: 60 } },
    ),
  ]);

  let categoryName: string | null = null;
  if (categoriesRes.ok) {
    const cats = (await categoriesRes.json()) as ApiCategory[];
    if (Array.isArray(cats)) {
      categoryName = cats.find((c) => c.id === categoryId)?.name ?? null;
    }
  }

  if (categoryName === null && categoriesRes.ok) {
    notFound();
  }

  let products: ProductCardData[] = [];
  if (productsRes.ok) {
    const raw = (await productsRes.json()) as ApiProduct[];
    products = Array.isArray(raw) ? raw.map(normalizeProduct) : [];
  }

  if (categoryName === null) {
    categoryName = `Category #${categoryId}`;
  }

  return (
    <div className="mx-auto max-w-6xl flex-1 px-4 py-12 md:py-16">
      <nav className="mb-8 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">
          Home
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        <Link href="/categories" className="hover:text-zinc-300">
          Categories
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        <span className="text-zinc-400">{categoryName}</span>
      </nav>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 md:text-3xl">
        {categoryName}
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        {products.length} product{products.length === 1 ? "" : "s"} in this
        category.
      </p>

      {products.length === 0 ? (
        <p className="mt-12 rounded-xl border border-zinc-800 bg-zinc-950 py-14 text-center text-sm text-zinc-500">
          No products in this category yet.
        </p>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-12">
        <Link
          href="/categories"
          className="text-sm font-medium text-zinc-400 hover:text-zinc-200"
        >
          ← All categories
        </Link>
      </p>
    </div>
  );
}
