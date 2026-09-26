/**
 * Safe, robust browser-side CSV export utility for MATPULSE.
 * Uses real loaded data, escapes quotes, commas, and multiline text,
 * and includes UTF-8 BOM for Microsoft Excel / Google Sheets compatibility.
 */

export function exportToCsv({ filename, headers, rows }) {
  if (!rows || rows.length === 0) {
    return { success: false, reason: 'No records available to export.' };
  }

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    // If value contains quotes, commas, or newlines, escape quotes and wrap in quotes
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map((h) => escapeCell(h.label || h)).join(',');
  const rowLines = rows.map((row) => {
    return headers
      .map((h) => {
        const key = typeof h === 'object' ? h.key : h;
        const val = row[key];
        return escapeCell(val);
      })
      .join(',');
  });

  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, count: rows.length };
}

export function getDateStamp() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
