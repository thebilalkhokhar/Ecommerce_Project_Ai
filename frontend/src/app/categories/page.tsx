import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

type ApiCategory = {
  id: number;
  name: string;
  description?: string | null;
};

async function loadCategories() {
  const res = await fetch(`${API_BASE}/api/v1/categories`, {
    next: { revalidate: 60 },
  }).catch(() => null);
  if (!res?.ok) return [];
  const data = (await res.json()) as ApiCategory[];
  return Array.isArray(data) ? data : [];
}

export default async function CategoriesPage() {
  const categories = await loadCategories();

  return (
    <div className="mx-auto max-w-6xl flex-1 px-4 py-14 md:py-20">
      <h1 className="text-3xl font-bold tracking-tight text-textMain md:text-4xl">
        Categories
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-textMain/70">
        Explore the catalog by category — each collection is curated for calm,
        considered shopping.
      </p>

      {categories.length === 0 ? (
        <p className="mt-12 rounded-xl border border-gray-200 bg-surface py-16 text-center text-sm text-textMain/60">
          No categories yet. Check back soon.
        </p>
      ) : (
        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/products?category_id=${c.id}`}
                className="group flex min-h-[140px] flex-col justify-between rounded-2xl border border-gray-200 bg-gray-50 p-8 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50/70"
              >
                <span className="text-lg font-semibold tracking-tight text-textMain group-hover:text-textMain">
                  {c.name}
                </span>
                {c.description ? (
                  <span className="mt-3 line-clamp-2 text-sm leading-relaxed text-textMain/60">
                    {c.description}
                  </span>
                ) : (
                  <span className="mt-3 text-sm text-textMain/60">
                    View products in this category
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
