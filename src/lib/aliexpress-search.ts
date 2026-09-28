import { createServerFn } from "@tanstack/react-start";
import {
  COUNTRY_BY_CODE,
  SORT_QUERY,
  type SortMode,
} from "./countries";

export type Product = {
  productId: string;
  title: string;
  price: number | null;
  priceLabel: string | null;
  currency: string | null;
  imageUrl: string | null;
  productUrl: string;
  sold: string | null;
  rating: number | null;
};

export type SearchResult = {
  products: Product[];
  searchUrl: string;
  keyword: string;
  country: string;
  page: number;
  warning: string | null;
};

type RawItem = {
  productId?: string;
  title?: { displayTitle?: string };
  image?: { imgUrl?: string };
  prices?: {
    currencySymbol?: string;
    salePrice?: {
      minPrice?: number;
      formattedPrice?: string;
      currencyCode?: string;
    };
    originalPrice?: {
      minPrice?: number;
      formattedPrice?: string;
      currencyCode?: string;
    };
  };
  trade?: { tradeDesc?: string };
  evaluation?: { starRating?: number };
};

function slugify(keyword: string): string {
  const slug = keyword
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || encodeURIComponent(keyword);
}

export function buildSearchUrl(
  keyword: string,
  page: number,
  sort: SortMode,
): string {
  const slug = slugify(keyword);
  const params = new URLSearchParams();
  params.set("SearchText", keyword);
  if (page > 1) params.set("page", String(page));
  const sortType = SORT_QUERY[sort];
  if (sortType) params.set("SortType", sortType);
  return `https://www.aliexpress.com/w/wholesale-${slug}.html?${params.toString()}`;
}

function extractItemList(html: string): RawItem[] {
  const marker = 'itemList":{"content":';
  const start = html.indexOf(marker);
  if (start < 0) return [];
  const i = start + marker.length;
  if (html[i] !== "[") return [];
  let depth = 0;
  for (let p = i; p < html.length; p++) {
    const c = html[p];
    if (c === "[") depth += 1;
    else if (c === "]") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(i, p + 1)) as RawItem[];
        } catch {
          return [];
        }
      }
    }
  }
  return [];
}

function absUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http")) return url;
  return `https:${url}`;
}

function mapProduct(item: RawItem): Product | null {
  const productId = item.productId;
  const title = item.title?.displayTitle?.trim();
  if (!productId || !title) return null;
  const sale = item.prices?.salePrice;
  const original = item.prices?.originalPrice;
  const price = sale?.minPrice ?? original?.minPrice ?? null;
  const priceLabel = sale?.formattedPrice ?? original?.formattedPrice ?? null;
  const currency =
    sale?.currencyCode ?? original?.currencyCode ?? item.prices?.currencySymbol ?? null;
  return {
    productId,
    title,
    price: typeof price === "number" ? price : null,
    priceLabel,
    currency,
    imageUrl: absUrl(item.image?.imgUrl),
    productUrl: `https://www.aliexpress.com/item/${productId}.html`,
    sold: item.trade?.tradeDesc ?? null,
    rating: typeof item.evaluation?.starRating === "number" ? item.evaluation.starRating : null,
  };
}

type SearchInput = {
  keyword: string;
  country: string;
  page?: number;
  sort?: SortMode;
};

function parseInput(input: unknown): Required<SearchInput> {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid search");
  }
  const d = input as Record<string, unknown>;
  const keyword = String(d.keyword ?? "").trim();
  if (keyword.length < 2) throw new Error("Enter a keyword of at least 2 characters.");
  if (keyword.length > 180) throw new Error("Keyword is too long.");
  let country = String(d.country ?? "US").toUpperCase();
  if (country === "UK") country = "GB";
  if (!COUNTRY_BY_CODE[country]) throw new Error("Unsupported country.");
  const page = Math.max(1, Math.min(10, Number(d.page ?? 1) || 1));
  const sort = (["best", "orders", "price_asc", "price_desc"] as SortMode[]).includes(
    d.sort as SortMode,
  )
    ? (d.sort as SortMode)
    : "best";
  return { keyword, country, page, sort };
}

export const searchAliExpress = createServerFn({ method: "POST" })
  .validator(parseInput)
  .handler(async ({ data }): Promise<SearchResult> => {
    const { keyword, country, page, sort } = data;
    const meta = COUNTRY_BY_CODE[country];
    const searchUrl = buildSearchUrl(keyword, page, sort);
    const cookie = `aep_usuc_f=site=${meta.site}&c_tp=${meta.currency}&region=${country}&b_locale=en_US; intl_locale=en_US`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 22000);
    let html = "";
    try {
      const res = await fetch(searchUrl, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          Cookie: cookie,
          Referer: "https://www.aliexpress.com/",
        },
      });
      html = await res.text();
      if (!res.ok) {
        return {
          products: [],
          searchUrl,
          keyword,
          country,
          page,
          warning: `AliExpress returned ${res.status}. Open the search page directly.`,
        };
      }
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      return {
        products: [],
        searchUrl,
        keyword,
        country,
        page,
        warning: aborted
          ? "The request timed out. Try again, or open the AliExpress search URL."
          : "Could not reach AliExpress from this server. Open the search URL instead.",
      };
    } finally {
      clearTimeout(timer);
    }

    const raw = extractItemList(html);
    const products: Product[] = [];
    const seen = new Set<string>();
    for (const item of raw) {
      const mapped = mapProduct(item);
      if (!mapped || seen.has(mapped.productId)) continue;
      seen.add(mapped.productId);
      products.push(mapped);
    }

    let warning: string | null = null;
    if (products.length === 0) {
      const blocked =
        /captcha|punish|access denied|robot/i.test(html) && !html.includes("itemList");
      warning = blocked
        ? "AliExpress blocked automated access. Open the search URL in a browser."
        : "No products were extracted. AliExpress may have returned a JavaScript-only page.";
    }

    return { products, searchUrl, keyword, country, page, warning };
  });
