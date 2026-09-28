import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { i as SORT_QUERY, n as COUNTRY_BY_CODE } from "./countries-C4vW3lwY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/aliexpress-search-BWumh7ob.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function slugify(keyword) {
	return keyword.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "") || encodeURIComponent(keyword);
}
function buildSearchUrl(keyword, page, sort) {
	const slug = slugify(keyword);
	const params = new URLSearchParams();
	params.set("SearchText", keyword);
	if (page > 1) params.set("page", String(page));
	const sortType = SORT_QUERY[sort];
	if (sortType) params.set("SortType", sortType);
	return `https://www.aliexpress.com/w/wholesale-${slug}.html?${params.toString()}`;
}
function extractItemList(html) {
	const start = html.indexOf("itemList\":{\"content\":");
	if (start < 0) return [];
	const i = start + 21;
	if (html[i] !== "[") return [];
	let depth = 0;
	for (let p = i; p < html.length; p++) {
		const c = html[p];
		if (c === "[") depth += 1;
		else if (c === "]") {
			depth -= 1;
			if (depth === 0) try {
				return JSON.parse(html.slice(i, p + 1));
			} catch {
				return [];
			}
		}
	}
	return [];
}
function absUrl(url) {
	if (!url) return null;
	if (url.startsWith("//")) return `https:${url}`;
	if (url.startsWith("http")) return url;
	return `https:${url}`;
}
function mapProduct(item) {
	const productId = item.productId;
	const title = item.title?.displayTitle?.trim();
	if (!productId || !title) return null;
	const sale = item.prices?.salePrice;
	const original = item.prices?.originalPrice;
	const price = sale?.minPrice ?? original?.minPrice ?? null;
	const priceLabel = sale?.formattedPrice ?? original?.formattedPrice ?? null;
	const currency = sale?.currencyCode ?? original?.currencyCode ?? item.prices?.currencySymbol ?? null;
	return {
		productId,
		title,
		price: typeof price === "number" ? price : null,
		priceLabel,
		currency,
		imageUrl: absUrl(item.image?.imgUrl),
		productUrl: `https://www.aliexpress.com/item/${productId}.html`,
		sold: item.trade?.tradeDesc ?? null,
		rating: typeof item.evaluation?.starRating === "number" ? item.evaluation.starRating : null
	};
}
function parseInput(input) {
	if (!input || typeof input !== "object") throw new Error("Invalid search");
	const d = input;
	const keyword = String(d.keyword ?? "").trim();
	if (keyword.length < 2) throw new Error("Enter a keyword of at least 2 characters.");
	if (keyword.length > 180) throw new Error("Keyword is too long.");
	let country = String(d.country ?? "US").toUpperCase();
	if (country === "UK") country = "GB";
	if (!COUNTRY_BY_CODE[country]) throw new Error("Unsupported country.");
	const page = Math.max(1, Math.min(10, Number(d.page ?? 1) || 1));
	const sort = [
		"best",
		"orders",
		"price_asc",
		"price_desc"
	].includes(d.sort) ? d.sort : "best";
	return {
		keyword,
		country,
		page,
		sort
	};
}
var searchAliExpress_createServerFn_handler = createServerRpc({
	id: "bedc6365c590b2cae6dfaec9f469bb67516ffd2886872ef9baf3a9fde6c07265",
	name: "searchAliExpress",
	filename: "src/lib/aliexpress-search.ts"
}, (opts) => searchAliExpress.__executeServer(opts));
var searchAliExpress = createServerFn({ method: "POST" }).validator(parseInput).handler(searchAliExpress_createServerFn_handler, async ({ data }) => {
	const { keyword, country, page, sort } = data;
	const meta = COUNTRY_BY_CODE[country];
	const searchUrl = buildSearchUrl(keyword, page, sort);
	const cookie = `aep_usuc_f=site=${meta.site}&c_tp=${meta.currency}&region=${country}&b_locale=en_US; intl_locale=en_US`;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 22e3);
	let html = "";
	try {
		const res = await fetch(searchUrl, {
			signal: controller.signal,
			redirect: "follow",
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.9",
				Cookie: cookie,
				Referer: "https://www.aliexpress.com/"
			}
		});
		html = await res.text();
		if (!res.ok) return {
			products: [],
			searchUrl,
			keyword,
			country,
			page,
			warning: `AliExpress returned ${res.status}. Open the search page directly.`
		};
	} catch (err) {
		return {
			products: [],
			searchUrl,
			keyword,
			country,
			page,
			warning: err instanceof Error && err.name === "AbortError" ? "The request timed out. Try again, or open the AliExpress search URL." : "Could not reach AliExpress from this server. Open the search URL instead."
		};
	} finally {
		clearTimeout(timer);
	}
	const raw = extractItemList(html);
	const products = [];
	const seen = /* @__PURE__ */ new Set();
	for (const item of raw) {
		const mapped = mapProduct(item);
		if (!mapped || seen.has(mapped.productId)) continue;
		seen.add(mapped.productId);
		products.push(mapped);
	}
	let warning = null;
	if (products.length === 0) warning = /captcha|punish|access denied|robot/i.test(html) && !html.includes("itemList") ? "AliExpress blocked automated access. Open the search URL in a browser." : "No products were extracted. AliExpress may have returned a JavaScript-only page.";
	return {
		products,
		searchUrl,
		keyword,
		country,
		page,
		warning
	};
});
//#endregion
export { searchAliExpress_createServerFn_handler };
