# AliExpress Product Finder

A practical command-line tool to search for products on AliExpress by keyword or title **for a specific ship-to country**.

## Features

- Accepts any keyword / product title
- Localizes results for a chosen country (US, DE, PK, GB, BR, etc.)
- Builds the correct modern AliExpress search URL
- Attempts automatic extraction of:
  - Product title
  - Price & currency (when available in HTML)
  - Product URL
  - Feature image URL
  - Product ID
- Always prints the ready-to-open search URL (very useful when automatic extraction is limited by JavaScript)
- Exports results to a clean, formatted **Excel (.xlsx)** file
- Optional: open the search page in your default browser
- No paid API key required for basic use

## Requirements

- Python 3.8+
- `requests`, `beautifulsoup4`, `pandas`, `openpyxl`

Install with:

```bash
pip install requests beautifulsoup4 pandas openpyxl
```

## Quick Start

```bash
# Basic search (United States)
python aliexpress_product_finder.py --keyword "wireless earbuds" --country US

# Germany, 2 pages, custom Excel name
python aliexpress_product_finder.py -k "phone case iphone 15" -c DE --pages 2 -o germany_results.xlsx

# Pakistan + open browser automatically
python aliexpress_product_finder.py -k "led strip lights" -c PK --open-browser

# List supported country codes
python aliexpress_product_finder.py --list-countries
```

## Important Notes About Data Extraction

AliExpress loads product cards with JavaScript. A simple HTTP request often receives only the page skeleton. Therefore:

1. The tool **always** prints the correct localized search URL.
2. It tries its best to extract products from the HTML it receives.
3. When extraction returns few or zero products (common), simply open the printed URL in a normal browser — you will see the full results.
4. You can also copy the URL into free online scrapers, browser extensions, or paid services (Apify, Piloterr, omkar.cloud, etc.) for structured data.

This design makes the tool reliable even when automatic scraping is blocked.

## Excel Output

The generated `.xlsx` file contains:

- Keyword, country, timestamp, total products
- Columns: No., Title, Price, Currency, Product URL, Image URL, Product ID, Page
- A second sheet with the search URL for reference

## Supported Country Codes (most reliable)

US, GB/UK, DE, FR, ES, IT, NL, BE, PT, PL, CA, MX, BR, AR, CL, AU, NZ, JP, KR, SG, MY, TH, VN, PH, ID, IN, PK, BD, AE, SA, IL, TR, RU, UA, EG, ZA …

Use `--list-countries` for the full built-in list.

## Extending the Tool

If you later obtain an API key from a service such as:

- omkar.cloud (has free tier)
- Apify AliExpress actors
- Piloterr
- RapidAPI AliExpress wrappers

you can easily add a second method that calls the paid API for higher success rates and richer data (sold count, exact localized price, etc.). The current structure is ready for that extension.

## Disclaimer

This tool is for personal product research and educational purposes.  
Respect AliExpress Terms of Service. Do not use it for aggressive bulk scraping or commercial data resale without proper authorization.
