#!/usr/bin/env python3
"""
AliExpress Product Finder
=========================
Find products on AliExpress by keyword/title for a specific ship-to country.
Outputs product URL, price (when available), feature image, and Excel export.

Usage examples:
  python aliexpress_product_finder.py --keyword "wireless earbuds" --country US
  python aliexpress_product_finder.py -k "phone case iphone 15" -c DE --pages 2 --output results.xlsx
  python aliexpress_product_finder.py --keyword "led strip lights" --country PK --open-browser

Author: Generated for practical product research use.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import webbrowser
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from urllib.parse import quote_plus, urljoin

import pandas as pd
import requests
from bs4 import BeautifulSoup
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils.dataframe import dataframe_to_rows
from openpyxl.utils import get_column_letter

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/128.0.0.0 Safari/537.36"
)

# Common ship-to country codes that work well with AliExpress localization
SUPPORTED_COUNTRIES = {
    "US": "United States",
    "GB": "United Kingdom",
    "UK": "United Kingdom",
    "DE": "Germany",
    "FR": "France",
    "ES": "Spain",
    "IT": "Italy",
    "NL": "Netherlands",
    "BE": "Belgium",
    "PT": "Portugal",
    "PL": "Poland",
    "CA": "Canada",
    "MX": "Mexico",
    "BR": "Brazil",
    "AR": "Argentina",
    "CL": "Chile",
    "AU": "Australia",
    "NZ": "New Zealand",
    "JP": "Japan",
    "KR": "South Korea",
    "SG": "Singapore",
    "MY": "Malaysia",
    "TH": "Thailand",
    "VN": "Vietnam",
    "PH": "Philippines",
    "ID": "Indonesia",
    "IN": "India",
    "PK": "Pakistan",
    "BD": "Bangladesh",
    "AE": "United Arab Emirates",
    "SA": "Saudi Arabia",
    "IL": "Israel",
    "TR": "Turkey",
    "RU": "Russia",
    "UA": "Ukraine",
    "EG": "Egypt",
    "ZA": "South Africa",
}

# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class Product:
    title: str
    price: Optional[str]
    currency: Optional[str]
    product_url: str
    image_url: Optional[str]
    product_id: Optional[str]
    sold_count: Optional[str] = None
    rating: Optional[str] = None
    country: str = ""
    source_page: int = 1

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ---------------------------------------------------------------------------
# Core finder class
# ---------------------------------------------------------------------------

class AliExpressFinder:
    """Search AliExpress products for a given keyword and ship-to country."""

    def __init__(self, country: str = "US", timeout: int = 25):
        self.country = country.upper().strip()
        if self.country == "UK":
            self.country = "GB"
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": DEFAULT_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0",
        })

        # Set a simple cookie that often helps with localization
        self.session.cookies.set("aep_usuc_f", f"site=glo&c_tp={self.country}&region={self.country}&b_locale=en_US", domain=".aliexpress.com")

    def build_search_url(self, keyword: str, page: int = 1) -> str:
        """
        Build a localized AliExpress search URL.
        Uses the modern /w/wholesale- style which is the current canonical form.
        """
        # Clean keyword for URL slug
        slug = re.sub(r"[^\w\s-]", "", keyword.lower())
        slug = re.sub(r"[\s_]+", "-", slug).strip("-")
        if not slug:
            slug = quote_plus(keyword)

        base = f"https://www.aliexpress.com/w/wholesale-{slug}.html"

        params = []
        if page > 1:
            params.append(f"page={page}")

        # Add ship-to related hints (AliExpress often respects these via cookies + params)
        params.append(f"SearchText={quote_plus(keyword)}")

        if params:
            return base + "?" + "&".join(params)
        return base

    def search(self, keyword: str, max_pages: int = 1) -> List[Product]:
        """
        Search for products.
        Returns a list of Product objects (may be empty if blocked/JS-only page).
        Always prints the search URL so the user can open it manually.
        """
        products: List[Product] = []
        keyword = keyword.strip()
        if not keyword:
            print("Error: keyword cannot be empty.")
            return products

        print(f"\n{'='*60}")
        print(f"AliExpress Product Finder")
        print(f"{'='*60}")
        print(f"Keyword     : {keyword}")
        print(f"Country     : {self.country} ({SUPPORTED_COUNTRIES.get(self.country, 'Unknown')})")
        print(f"Pages       : {max_pages}")
        print(f"{'='*60}\n")

        for page in range(1, max_pages + 1):
            url = self.build_search_url(keyword, page)
            print(f"[Page {page}] Search URL:\n  {url}\n")

            try:
                resp = self.session.get(url, timeout=self.timeout, allow_redirects=True)
                print(f"  HTTP {resp.status_code} | Content length: {len(resp.text)} bytes")

                if resp.status_code != 200:
                    print(f"  Warning: non-200 status. Page may be blocked or require browser.")
                    continue

                page_products = self._parse_search_page(resp.text, page)
                if page_products:
                    print(f"  Extracted {len(page_products)} products from HTML.")
                    products.extend(page_products)
                else:
                    print("  No product cards found in HTML.")
                    print("  (This is common because AliExpress loads results via JavaScript.)")
                    print("  → Open the URL above in a real browser to see the products.")

                # Be polite
                if page < max_pages:
                    time.sleep(1.5)

            except requests.RequestException as e:
                print(f"  Network error: {e}")
                continue

        print(f"\nTotal products extracted: {len(products)}")
        if not products:
            print("\nTIP: Copy the search URL(s) printed above and open them in your browser.")
            print("     You can also paste the URL into a free scraper playground or Apify actor.")
        return products

    def _parse_search_page(self, html: str, page: int) -> List[Product]:
        """
        Extract products from AliExpress search page.
        Primary strategy: parse the large embedded JSON blob that contains
        productId, displayTitle, formattedPrice, imgUrl, etc.
        Fallback: classic HTML card parsing.
        """
        products: List[Product] = []
        seen_ids = set()

        # ---------- Strategy 1: Embedded JSON (most reliable) ----------
        # AliExpress embeds a large JSON structure inside a <script> tag.
        soup = BeautifulSoup(html, "html.parser")
        for script in soup.find_all("script"):
            content = script.string or ""
            if "productId" not in content or len(content) < 50000:
                continue

            # Extract parallel lists of fields
            product_ids = re.findall(r'"productId"\s*:\s*"(\d+)"', content)
            titles = re.findall(r'"displayTitle"\s*:\s*"([^"]{10,300})"', content)
            prices = re.findall(r'"formattedPrice"\s*:\s*"([^"]+)"', content)
            images = re.findall(r'"imgUrl"\s*:\s*"(//[^"]+)"', content)

            # Also try alternate price fields
            if not prices:
                prices = re.findall(r'"price"\s*:\s*"([^"]+)"', content)

            n = min(len(product_ids), len(titles))
            if n == 0:
                continue

            for i in range(n):
                pid = product_ids[i]
                if pid in seen_ids:
                    continue
                seen_ids.add(pid)

                title = titles[i].encode().decode("unicode_escape") if "\\u" in titles[i] else titles[i]
                price_raw = prices[i] if i < len(prices) else None
                img = images[i] if i < len(images) else None

                # Parse price & currency
                price = None
                currency = None
                if price_raw:
                    # Examples: "US $3.45", "$12.99", "€9.50", "PKR 1,299"
                    m = re.match(r"([A-Z]{0,3}\s*[€$£¥]|US\s*\$|EUR|USD|GBP|PKR|INR|R\$)?\s*([\d.,]+)", price_raw.strip())
                    if m:
                        currency = (m.group(1) or "").strip() or None
                        price = m.group(2).replace(",", "")
                    else:
                        price = price_raw

                if img and img.startswith("//"):
                    img = "https:" + img

                product_url = f"https://www.aliexpress.com/item/{pid}.html"

                products.append(Product(
                    title=title[:300],
                    price=price,
                    currency=currency,
                    product_url=product_url,
                    image_url=img,
                    product_id=pid,
                    country=self.country,
                    source_page=page,
                ))

            if products:
                break  # we found the main data blob

        # ---------- Strategy 2: Classic HTML links (fallback) ----------
        if not products:
            item_links = soup.select('a[href*="/item/"]')
            for link in item_links:
                href = link.get("href", "")
                if not href or "/item/" not in href:
                    continue

                if href.startswith("//"):
                    href = "https:" + href
                elif href.startswith("/"):
                    href = "https://www.aliexpress.com" + href

                m = re.search(r"/item/(\d+)\.html", href)
                if not m:
                    continue
                product_id = m.group(1)
                if product_id in seen_ids:
                    continue
                seen_ids.add(product_id)

                title = link.get("title") or link.get_text(strip=True) or ""
                if len(title) < 10:
                    parent = link.find_parent(["div", "article", "li"])
                    if parent:
                        title_el = parent.select_one("[class*='title'], h1, h2, h3")
                        if title_el:
                            title = title_el.get_text(strip=True)
                if len(title) < 10:
                    continue

                img = None
                img_tag = link.select_one("img")
                if img_tag:
                    img = img_tag.get("src") or img_tag.get("data-src")
                    if img and img.startswith("//"):
                        img = "https:" + img

                products.append(Product(
                    title=title[:300],
                    price=None,
                    currency=None,
                    product_url=href.split("?")[0],
                    image_url=img,
                    product_id=product_id,
                    country=self.country,
                    source_page=page,
                ))
                if len(products) >= 40:
                    break

        return products


# ---------------------------------------------------------------------------
# Excel export
# ---------------------------------------------------------------------------

def export_to_excel(products: List[Product], keyword: str, country: str, filepath: str) -> str:
    """Create a nicely formatted Excel file."""
    path = Path(filepath)
    if path.suffix.lower() != ".xlsx":
        path = path.with_suffix(".xlsx")

    wb = Workbook()
    ws = wb.active
    ws.title = "AliExpress Results"

    # Header style
    header_font = Font(bold=True, color="FFFFFF", size=11)
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    thin_border = Border(
        left=Side(style="thin"),
        right=Side(style="thin"),
        top=Side(style="thin"),
        bottom=Side(style="thin"),
    )
    center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    left = Alignment(horizontal="left", vertical="center", wrap_text=True)

    # Meta info
    ws["A1"] = "AliExpress Product Finder – Results"
    ws["A1"].font = Font(bold=True, size=14)
    ws.merge_cells("A1:G1")

    ws["A2"] = f"Keyword: {keyword}"
    ws["A3"] = f"Country: {country} ({SUPPORTED_COUNTRIES.get(country, 'N/A')})"
    ws["A4"] = f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    ws["A5"] = f"Total products: {len(products)}"

    # Column headers
    headers = [
        "No.", "Title", "Price", "Currency", "Product URL",
        "Image URL", "Product ID", "Page"
    ]
    start_row = 7
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=start_row, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center
        cell.border = thin_border

    # Data rows
    for i, p in enumerate(products, 1):
        row = start_row + i
        values = [
            i,
            p.title,
            p.price or "",
            p.currency or "",
            p.product_url,
            p.image_url or "",
            p.product_id or "",
            p.source_page,
        ]
        for col, val in enumerate(values, 1):
            cell = ws.cell(row=row, column=col, value=val)
            cell.border = thin_border
            cell.alignment = left if col in (2, 5, 6) else center

    # Column widths
    widths = [6, 55, 12, 10, 55, 45, 18, 8]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w

    # Freeze header
    ws.freeze_panes = "A8"

    # Second sheet: search URLs for reference
    ws2 = wb.create_sheet("Search URLs")
    ws2["A1"] = "Search URLs used"
    ws2["A1"].font = Font(bold=True, size=12)
    ws2["A3"] = "Open these URLs in a browser if the automatic extraction returned few results."
    ws2["A5"] = "Keyword"
    ws2["B5"] = keyword
    ws2["A6"] = "Country"
    ws2["B6"] = country

    wb.save(path)
    return str(path.resolve())


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Find products on AliExpress by keyword for a specific country.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python aliexpress_product_finder.py -k "wireless earbuds" -c US
  python aliexpress_product_finder.py --keyword "phone case" --country DE --pages 2 -o de_results.xlsx
  python aliexpress_product_finder.py -k "led lights" -c PK --open-browser

Supported country codes (most common):
  US GB DE FR ES IT NL BE PT PL CA MX BR AU JP KR SG MY TH VN IN PK AE SA IL TR ...
        """,
    )
    parser.add_argument("-k", "--keyword", required=False, help="Search keyword or product title")
    parser.add_argument("-c", "--country", default="US", help="Ship-to country code (default: US)")
    parser.add_argument("-p", "--pages", type=int, default=1, help="Number of search pages to try (default: 1)")
    parser.add_argument("-o", "--output", default=None, help="Excel output file path (default: auto-generated)")
    parser.add_argument("--open-browser", action="store_true", help="Open the first search URL in your default browser")
    parser.add_argument("--list-countries", action="store_true", help="List supported country codes and exit")

    args = parser.parse_args()

    if args.list_countries:
        print("Supported / commonly working country codes:\n")
        for code, name in sorted(SUPPORTED_COUNTRIES.items()):
            print(f"  {code:4}  {name}")
        return

    if not args.keyword:
        parser.error("--keyword / -k is required unless --list-countries is used")

    country = args.country.upper().strip()
    if country == "UK":
        country = "GB"

    if country not in SUPPORTED_COUNTRIES:
        print(f"Warning: '{country}' is not in the common list. Proceeding anyway...")
        print("Use --list-countries to see the recommended codes.\n")

    finder = AliExpressFinder(country=country)
    products = finder.search(args.keyword, max_pages=max(1, args.pages))

    # Always show the main search URL
    main_url = finder.build_search_url(args.keyword, 1)
    print(f"\nPrimary search URL for browser:\n{main_url}\n")

    if args.open_browser:
        print("Opening browser...")
        webbrowser.open(main_url)

    # Excel export
    if args.output:
        out_path = args.output
    else:
        safe_kw = re.sub(r"[^\w\-]+", "_", args.keyword.lower())[:40]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_path = f"aliexpress_{safe_kw}_{country}_{timestamp}.xlsx"

    if products or True:  # always create the file so the user has the search info
        saved = export_to_excel(products, args.keyword, country, out_path)
        print(f"Excel file saved → {saved}")
        if not products:
            print("(File contains metadata and search info; product rows are empty because extraction returned nothing.)")

    print("\nDone.")


if __name__ == "__main__":
    main()
