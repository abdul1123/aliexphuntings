import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  ExternalLink,
  Loader2,
  Search,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTRIES, SORT_OPTIONS, type SortMode } from "@/lib/countries";
import {
  searchAliExpress,
  type Product,
  type SearchResult,
} from "@/lib/aliexpress-search";
import { downloadProductsExcel } from "@/lib/excel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [keyword, setKeyword] = useState("wireless earbuds");
  const [country, setCountry] = useState("US");
  const [sort, setSort] = useState<SortMode>("best");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, true>>({});

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const q = keyword.trim();
    if (q.length < 2) {
      setError("Enter a keyword of at least 2 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchAliExpress({
        data: { keyword: q, country, page: 1, sort },
      });
      setResult(data);
      setFailedImages({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  const countryName = useMemo(
    () => COUNTRIES.find((c) => c.code === country)?.name ?? country,
    [country],
  );

  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <header className="flex flex-col gap-3">
          <p className="text-xs font-medium tracking-[0.18em] text-fg-subtle uppercase">
            Product sourcing
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-[-0.03em] text-fg sm:text-5xl">
            Scout
          </h1>
          <p className="max-w-xl text-base text-fg-muted">
            Search AliExpress by keyword for a specific ship-to country. Prices
            and listings follow that destination. Export the grid to Excel.
          </p>
        </header>

        <form
          onSubmit={runSearch}
          className="rounded-xl border border-border bg-surface p-4 sm:p-5"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
            <label className="flex flex-col gap-1.5 sm:col-span-5">
              <span className="text-xs font-medium text-fg-muted">Keyword</span>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. phone case, led strip"
                autoComplete="off"
                name="keyword"
              />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-3">
              <span className="text-xs font-medium text-fg-muted">Ship to</span>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-fg-muted">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Search />
                )}
                Search
              </Button>
            </div>
          </div>
        </form>

        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? <SkeletonGrid /> : null}

        {!loading && result ? (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl tracking-tight">
                  {result.products.length} results for “{result.keyword}”
                </h2>
                <p className="text-sm text-fg-muted">
                  Destination {countryName}. Prices shown as AliExpress reports
                  them for this country.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={result.products.length === 0}
                  onClick={() =>
                    downloadProductsExcel(
                      result.products,
                      result.keyword,
                      result.country,
                    )
                  }
                >
                  <Download />
                  Excel
                </Button>
                <Button variant="ghost" asChild>
                  <a
                    href={result.searchUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink />
                    Open AliExpress
                  </a>
                </Button>
              </div>
            </div>

            {result.warning ? (
              <p className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-fg-muted">
                {result.warning}
              </p>
            ) : null}

            {result.products.length === 0 && !result.warning ? (
              <p className="text-sm text-fg-muted">No products found.</p>
            ) : null}

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.products.map((p) => (
                <li key={p.productId}>
                  <ProductCard
                    product={p}
                    imageFailed={Boolean(failedImages[p.productId])}
                    onImageError={() =>
                      setFailedImages((prev) => ({ ...prev, [p.productId]: true }))
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!loading && !result ? (
          <p className="text-sm text-fg-subtle">
            Enter a keyword and country, then search to load live listings.
          </p>
        ) : null}
      </div>
    </main>
  );
}

function ProductCard({
  product,
  imageFailed,
  onImageError,
}: {
  product: Product;
  imageFailed: boolean;
  onImageError: () => void;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="relative aspect-square bg-surface-2">
        {product.imageUrl && !imageFailed ? (
          <img
            src={product.imageUrl}
            alt=""
            className="size-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={onImageError}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-fg-subtle">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-fg">
          {product.title}
        </h3>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-mono text-base tabular-nums text-fg">
              {product.priceLabel ?? "Price on listing"}
            </p>
            <p className="text-xs text-fg-subtle">
              {product.sold ?? "Sales unknown"}
              {product.rating != null ? (
                <span className="ml-2 inline-flex items-center gap-0.5">
                  <Star className="size-3" />
                  {product.rating.toFixed(1)}
                </span>
              ) : null}
            </p>
          </div>
          <a
            href={product.productUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "inline-flex h-9 items-center gap-1 rounded-md px-3 text-xs font-medium",
              "bg-accent text-accent-fg hover:opacity-90",
            )}
          >
            View
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </article>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="overflow-hidden rounded-lg border border-border bg-surface"
        >
          <div className="aspect-square animate-pulse bg-surface-2" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-5/6 animate-pulse rounded-sm bg-surface-2" />
            <div className="h-4 w-2/5 animate-pulse rounded-sm bg-surface-2" />
          </div>
        </li>
      ))}
    </ul>
  );
}
