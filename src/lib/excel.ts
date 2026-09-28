import type { Product } from "./aliexpress-search";

const AMP = "\u0026";

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, `${AMP}amp;`)
    .replace(/</g, `${AMP}lt;`)
    .replace(/>/g, `${AMP}gt;`)
    .replace(/"/g, `${AMP}quot;`);
}

function cell(value: string | number): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(String(value ?? ""))}</Data></Cell>`;
}

export function downloadProductsExcel(
  products: Product[],
  keyword: string,
  country: string,
) {
  const headers = [
    "Title",
    "Price",
    "Currency",
    "Product URL",
    "Image URL",
    "Product ID",
    "Sold",
    "Rating",
    "Country",
  ];

  const rows = products.map((p) =>
    [
      p.title,
      p.priceLabel ?? p.price ?? "",
      p.currency ?? "",
      p.productUrl,
      p.imageUrl ?? "",
      p.productId,
      p.sold ?? "",
      p.rating ?? "",
      country,
    ]
      .map(cell)
      .join(""),
  );

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
