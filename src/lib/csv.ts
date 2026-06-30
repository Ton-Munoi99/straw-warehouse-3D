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

// Real .xlsx via SheetJS, loaded on demand (dynamic import) so the ~xlsx
// bundle never weighs down the initial page load. Each entry in `sheets`
// becomes a worksheet; column widths auto-fit to content.
export async function downloadXLSX(filename: string, sheets: { name: string; rows: CsvCell[][] }[]) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  for (const s of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(s.rows as unknown[][])
    const widths: { wch: number }[] = []
    for (const row of s.rows) {
      row.forEach((cell, i) => {
        const len = cell == null ? 0 : String(cell).length
        widths[i] = { wch: Math.min(Math.max(widths[i]?.wch ?? 8, len + 2), 60) }
      })
    }
    ws['!cols'] = widths
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31))
  }
  XLSX.writeFile(wb, filename)
}
