import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { n as COUNTRY_BY_CODE, r as SORT_OPTIONS, t as COUNTRIES } from "./countries-C4vW3lwY.mjs";
import { a as ExternalLink, i as LoaderCircle, n as Star, o as Download, r as Search } from "../_libs/lucide-react.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DHGTbsFG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[opacity,transform,background-color,color,border-color] duration-(--motion-quick) ease-(--ease-out) disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:opacity-90",
			outline: "border border-border bg-transparent text-fg hover:bg-surface",
			ghost: "text-fg-muted hover:bg-surface hover:text-fg"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-xs",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("flex h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg shadow-none transition-[border-color,box-shadow] duration-(--motion-quick) placeholder:text-fg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className),
		...props
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
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
var searchAliExpress = createServerFn({ method: "POST" }).validator(parseInput).handler(createSsrRpc("bedc6365c590b2cae6dfaec9f469bb67516ffd2886872ef9baf3a9fde6c07265"));
var AMP = "&";
function xmlEscape(value) {
	return value.replace(/&/g, `${AMP}amp;`).replace(/</g, `${AMP}lt;`).replace(/>/g, `${AMP}gt;`).replace(/"/g, `${AMP}quot;`);
}
function cell(value) {
	if (typeof value === "number" && Number.isFinite(value)) return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
	return `<Cell><Data ss:Type="String">${xmlEscape(String(value ?? ""))}</Data></Cell>`;
}
function downloadProductsExcel(products, keyword, country) {
	const headers = [
		"Title",
		"Price",
		"Currency",
		"Product URL",
		"Image URL",
		"Product ID",
		"Sold",
		"Rating",
		"Country"
	];
	const rows = products.map((p) => [
		p.title,
		p.priceLabel ?? p.price ?? "",
		p.currency ?? "",
		p.productUrl,
		p.imageUrl ?? "",
		p.productId,
		p.sold ?? "",
		p.rating ?? "",
		country
	].map(cell).join(""));
	const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Products">
  <Table>
   <Row>${headers.map(cell).join("")}</Row>
   ${rows.map((r) => `<Row>${r}</Row>`).join("\n   ")}
  </Table>
 </Worksheet>
</Workbook>`;
	const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	const safe = keyword.replace(/[^\w\-]+/g, "_").slice(0, 40) || "search";
	a.href = url;
	a.download = `aliexpress_${safe}_${country}.xls`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
function Home() {
	const [keyword, setKeyword] = (0, import_react.useState)("wireless earbuds");
	const [country, setCountry] = (0, import_react.useState)("US");
	const [sort, setSort] = (0, import_react.useState)("best");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [result, setResult] = (0, import_react.useState)(null);
	const [failedImages, setFailedImages] = (0, import_react.useState)({});
	async function runSearch(e) {
		e?.preventDefault();
		const q = keyword.trim();
		if (q.length < 2) {
			setError("Enter a keyword of at least 2 characters.");
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const data = await searchAliExpress({ data: {
				keyword: q,
				country,
				page: 1,
				sort
			} });
			setResult(data);
			setFailedImages({});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Search failed.");
		} finally {
			setLoading(false);
		}
	}
	const countryName = (0, import_react.useMemo)(() => COUNTRIES.find((c) => c.code === country)?.name ?? country, [country]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-bg text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium tracking-[0.18em] text-fg-subtle uppercase",
							children: "Product sourcing"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-4xl leading-tight tracking-[-0.03em] text-fg sm:text-5xl",
							children: "Scout"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "max-w-xl text-base text-fg-muted",
							children: "Search AliExpress by keyword for a specific ship-to country. Prices and listings follow that destination. Export the grid to Excel."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
					onSubmit: runSearch,
					className: "rounded-xl border border-border bg-surface p-4 sm:p-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex flex-col gap-1.5 sm:col-span-5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium text-fg-muted",
									children: "Keyword"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: keyword,
									onChange: (e) => setKeyword(e.target.value),
									placeholder: "e.g. phone case, led strip",
									autoComplete: "off",
									name: "keyword"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex flex-col gap-1.5 sm:col-span-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium text-fg-muted",
									children: "Ship to"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									value: country,
									onChange: (e) => setCountry(e.target.value),
									className: "h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
									children: COUNTRIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
										value: c.code,
										children: [
											c.name,
											" (",
											c.currency,
											")"
										]
									}, c.code))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex flex-col gap-1.5 sm:col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium text-fg-muted",
									children: "Sort"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									value: sort,
									onChange: (e) => setSort(e.target.value),
									className: "h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
									children: SORT_OPTIONS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: o.value,
										children: o.label
									}, o.value))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "sm:col-span-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "submit",
									className: "w-full",
									disabled: loading,
									children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {}), "Search"]
								})
							})
						]
					})
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-danger",
					role: "alert",
					children: error
				}) : null,
				loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkeletonGrid, {}) : null,
				!loading && result ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col gap-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "font-display text-xl tracking-tight",
								children: [
									result.products.length,
									" results for “",
									result.keyword,
									"”"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-fg-muted",
								children: [
									"Destination ",
									countryName,
									". Prices shown as AliExpress reports them for this country."
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									variant: "outline",
									disabled: result.products.length === 0,
									onClick: () => downloadProductsExcel(result.products, result.keyword, result.country),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), "Excel"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: result.searchUrl,
										target: "_blank",
										rel: "noreferrer",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, {}), "Open AliExpress"]
									})
								})]
							})]
						}),
						result.warning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-fg-muted",
							children: result.warning
						}) : null,
						result.products.length === 0 && !result.warning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-fg-muted",
							children: "No products found."
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
							children: result.products.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, {
								product: p,
								imageFailed: Boolean(failedImages[p.productId]),
								onImageError: () => setFailedImages((prev) => ({
									...prev,
									[p.productId]: true
								}))
							}) }, p.productId))
						})
					]
				}) : null,
				!loading && !result ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-fg-subtle",
					children: "Enter a keyword and country, then search to load live listings."
				}) : null
			]
		})
	});
}
function ProductCard({ product, imageFailed, onImageError }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative aspect-square bg-surface-2",
			children: product.imageUrl && !imageFailed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: product.imageUrl,
				alt: "",
				className: "size-full object-cover",
				loading: "lazy",
				referrerPolicy: "no-referrer",
				onError: onImageError
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex size-full items-center justify-center text-xs text-fg-subtle",
				children: "No image"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-1 flex-col gap-3 p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "line-clamp-2 text-sm font-medium leading-snug text-fg",
				children: product.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-auto flex flex-wrap items-end justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-base tabular-nums text-fg",
					children: product.priceLabel ?? "Price on listing"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-fg-subtle",
					children: [product.sold ?? "Sales unknown", product.rating != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ml-2 inline-flex items-center gap-0.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3" }), product.rating.toFixed(1)]
					}) : null]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: product.productUrl,
					target: "_blank",
					rel: "noreferrer",
					className: cn("inline-flex h-9 items-center gap-1 rounded-md px-3 text-xs font-medium", "bg-accent text-accent-fg hover:opacity-90"),
					children: ["View", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3" })]
				})]
			})]
		})]
	});
}
function SkeletonGrid() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
		children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "overflow-hidden rounded-lg border border-border bg-surface",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "aspect-square animate-pulse bg-surface-2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 w-5/6 animate-pulse rounded-sm bg-surface-2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 w-2/5 animate-pulse rounded-sm bg-surface-2" })]
			})]
		}, i))
	});
}
//#endregion
export { Home as component };
