const SPREADSHEET_FORMULA_PREFIX = /^[\t\r ]*[=+\-@]/;

export function escapeCsvCell(value: string | number | null | undefined) {
  let text = String(value ?? "");

  // Spreadsheet applications can execute formulas even when a CSV field is
  // quoted. Prefix untrusted formula-like values so they are treated as text.
  if (SPREADSHEET_FORMULA_PREFIX.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

export function createCsv(
  headers: readonly (string | number)[],
  rows: readonly (readonly (string | number | null | undefined)[])[]
) {
  return [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ].join("\r\n");
}
