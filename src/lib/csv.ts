/** Escape one CSV cell (RFC 4180 style) and neutralise spreadsheet formula injection. */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text)) {
    text = `'${text}`;
  }
  if (/[",\n\r]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(rows: unknown[][]): string {
  // Leading BOM so Excel opens UTF-8 correctly.
  return '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
}
