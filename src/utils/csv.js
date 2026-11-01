// تصدير CSV يعمل داخل المتصفح فقط (بدون خادم). BOM في البداية يجعل Excel يقرأ العربية صح.
const BOM = String.fromCharCode(0xfeff)
const EOL = String.fromCharCode(13, 10)

function escapeCell(value) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /["\n\r,]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text
}

export function buildCsv(headers, rows) {
  const table = [[...headers], ...(rows ?? [])].map((cells) =>
    cells.map(escapeCell).join(',')
  )
  return BOM + table.join(EOL)
}

export function downloadTextFile(filename, text, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  // يُحرَّر الرابط بعد أن يلتقطه المتصفح مباشرة
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return filename
}
