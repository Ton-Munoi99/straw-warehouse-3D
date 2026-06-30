// Tiny dependency-free CSV export. Adds a UTF-8 BOM so Excel renders Thai
// correctly, and quotes any field containing a comma, quote, or newline.

export type CsvCell = string | number | null | undefined

export function toCSV(rows: CsvCell[][]): string {
  const esc = (v: CsvCell) => {
    const s = v == null ? '' : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return rows.map((r) => r.map(esc).join(',')).join('\r\n')
}

export function downloadCSV(filename: string, rows: CsvCell[][]) {
  const csv = String.fromCharCode(0xfeff) + toCSV(rows) // BOM → Excel reads UTF-8 (Thai) correctly
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
