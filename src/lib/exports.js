// Income statement exports: Excel, PDF, Word, PowerPoint.
// Libraries are loaded only when the user taps Export (keeps the app fast).
import { statement, insights, projection } from './finance'
import { downloadBlob, fmtDate, money, safeName, today, round2 } from './utils'
import { productNames } from './constants'

const GREEN = '1B5E20'
const LIGHT = '4CAF50'
const BROWN = '795548'

export function buildReport(state, { farmId, projectId, range, periodLabel }) {
  const farm = state.farms.find((f) => f.id === farmId)
  const project = state.projects.find((p) => p.id === projectId)
  const opts = { farmId: farmId || undefined, projectId: projectId || undefined, range }
  const st = statement(state, opts)
  const ins = insights(state, opts)
  const proj = projection(state, { farmId: farmId || undefined, projectId: projectId || undefined })
  const scopeName = project ? `${project.name} (${farm?.name || ''})` : farm ? farm.name : 'All Farms Combined'
  const recs = ins.map((i) => `${i.title}. ${i.text}`)
  recs.push(`At the current rate, ${project ? 'this project' : farm ? farm.name.split(' - ')[0] : 'all farms'} ${proj.projected >= 0 ? 'is projected to make' : 'is projected to lose'} ${money(Math.abs(proj.projected), { decimals: 0 })} by ${proj.target} (average ${money(proj.avgMonthly, { decimals: 0 })} per month).`)
  // Per-project breakdown (for farm or all-farms statements)
  const projects = project ? [] : state.projects
    .filter((p) => !farmId || p.farmId === farmId)
    .map((p) => {
      const s = statement(state, { projectId: p.id, range })
      return { name: p.name, products: productNames(p.products), status: p.status, sales: s.totalSales, expenses: s.totalExpenses, net: s.net }
    })
    .filter((p) => p.sales || p.expenses)
  const farms = farmId ? [] : state.farms.map((f) => {
    const s = statement(state, { farmId: f.id, range })
    return { name: f.name, sales: s.totalSales, expenses: s.totalExpenses, net: s.net, investment: s.totalInvestment }
  })
  return { title: 'Income Statement', scopeName, farm, project, period: periodLabel, generated: fmtDate(today()), st, recs, projects, farms }
}

const fileBase = (r) => `Zozo_Income_Statement_${safeName(r.scopeName)}_${safeName(r.period)}`

async function logoDataUrl() {
  try {
    const res = await fetch('./icon-192.png')
    const blob = await res.blob()
    return await new Promise((ok) => {
      const fr = new FileReader()
      fr.onload = () => ok(fr.result)
      fr.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ---------------- EXCEL ----------------
export async function exportXlsx(r) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  const { st } = r
  const summary = [
    ['ZOZO FARM APP - Income Statement'],
    ['Your Farms, In Your Pocket'],
    [],
    ['Farm / Scope', r.scopeName],
    ['Period', r.period],
    ['Generated', r.generated],
    [],
    ['SUMMARY', 'Amount (ZMW)'],
    ['Total Sales (Income)', st.totalSales],
    ['Total Expenses', st.totalExpenses],
    ['Net Profit / Loss', st.net],
    ['Profit Margin %', round2(st.margin)],
    ['Capital Injected (not income)', st.totalInvestment],
    [],
    ['EXPENSES BY CATEGORY', 'Amount (ZMW)', 'Share %'],
    ...st.byCategory.map((c) => [c.category, c.amount, round2(c.share)]),
    ['Total Expenses', st.totalExpenses, 100],
    [],
    ['SALES BY ITEM', 'Quantity', 'Amount (ZMW)'],
    ...st.salesByItem.map((s) => [s.item, s.qty, s.amount]),
    [],
    ['MONTHLY', 'Income', 'Expenses', 'Profit'],
    ...st.monthly.map((m) => [m.month, m.income, m.expenses, m.profit]),
    [],
    ['RECOMMENDATIONS'],
    ...r.recs.map((x) => [x])
  ]
  const ws = XLSX.utils.aoa_to_sheet(summary)
  ws['!cols'] = [{ wch: 38 }, { wch: 18 }, { wch: 16 }, { wch: 14 }]
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]
  XLSX.utils.book_append_sheet(wb, ws, 'Statement')

  if (r.farms.length) {
    const w = XLSX.utils.aoa_to_sheet([['Farm', 'Sales', 'Expenses', 'Net Profit', 'Capital'], ...r.farms.map((f) => [f.name, f.sales, f.expenses, f.net, f.investment])])
    w['!cols'] = [{ wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, w, 'By Farm')
  }
  if (r.projects.length) {
    const w = XLSX.utils.aoa_to_sheet([['Project', 'Products', 'Status', 'Sales', 'Expenses', 'Net Profit'], ...r.projects.map((p) => [p.name, p.products, p.status, p.sales, p.expenses, p.net])])
    w['!cols'] = [{ wch: 32 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, w, 'By Project')
  }
  const sales = XLSX.utils.aoa_to_sheet([
    ['Date', 'Item', 'Quantity', 'Unit', 'Unit Price', 'Total', 'Buyer', 'Payment'],
    ...st.sales.slice().sort((a, b) => a.date.localeCompare(b.date)).map((s) => [fmtDate(s.date), s.item, s.qty, s.unit, s.unitPrice, s.total, s.buyer, s.method])
  ])
  sales['!cols'] = [{ wch: 12 }, { wch: 24 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 26 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, sales, 'Sales')
  const exps = XLSX.utils.aoa_to_sheet([
    ['Date', 'Category', 'Description', 'Amount', 'Paid By'],
    ...st.expenses.slice().sort((a, b) => a.date.localeCompare(b.date)).map((e) => [fmtDate(e.date), e.category, e.description, Number(e.amount), e.paidBy])
  ])
  exps['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 40 }, { wch: 14 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, exps, 'Expenses')
  const inv = XLSX.utils.aoa_to_sheet([['Date', 'Amount', 'Source', 'Note'], ...st.investments.map((i) => [fmtDate(i.date), Number(i.amount), i.source, i.note])])
  inv['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, inv, 'Capital')

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  downloadBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileBase(r) + '.xlsx')
}

// ---------------- PDF ----------------
export async function exportPdf(r) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const logo = await logoDataUrl()
  const { st } = r
  const K = (n) => money(n)

  // Header band
  doc.setFillColor(27, 94, 32)
  doc.rect(0, 0, W, 30, 'F')
  if (logo) doc.addImage(logo, 'PNG', 12, 6, 18, 18)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Zozo Farm App', 34, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Your Farms, In Your Pocket', 34, 20)
  doc.setFontSize(9)
  doc.text(`Generated ${r.generated}`, W - 12, 20, { align: 'right' })

  doc.setTextColor(33, 33, 33)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Income Statement', 12, 42)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Farm: ${r.scopeName}`, 12, 49)
  doc.text(`Period: ${r.period}`, 12, 55)

  // Summary boxes
  const boxes = [
    ['Total Sales', K(st.totalSales), [76, 175, 80]],
    ['Total Expenses', K(st.totalExpenses), [121, 85, 72]],
    [st.net >= 0 ? 'Net Profit' : 'Net Loss', K(st.net), st.net >= 0 ? [27, 94, 32] : [198, 40, 40]],
    ['Margin', st.margin.toFixed(1) + '%', [96, 125, 139]]
  ]
  const bw = (W - 24 - 9) / 4
  boxes.forEach(([label, val, c], i) => {
    const x = 12 + i * (bw + 3)
    doc.setFillColor(c[0], c[1], c[2])
    doc.roundedRect(x, 60, bw, 20, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text(label, x + 3, 66)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(val, x + 3, 75)
    doc.setFont('helvetica', 'normal')
  })
  doc.setTextColor(33, 33, 33)

  autoTable(doc, {
    startY: 86,
    head: [['Income Statement', 'Amount (ZMW)']],
    body: [
      ['Total Sales (Income)', K(st.totalSales)],
      ...st.byCategory.map((c) => [`   Less: ${c.category}`, K(-c.amount)]),
      ['Total Expenses', K(-st.totalExpenses)],
      [{ content: st.net >= 0 ? 'NET PROFIT' : 'NET LOSS', styles: { fontStyle: 'bold' } }, { content: K(st.net), styles: { fontStyle: 'bold' } }],
      ['Profit Margin', st.margin.toFixed(1) + '%'],
      ['Capital Injected (separate, not income)', K(st.totalInvestment)]
    ],
    headStyles: { fillColor: [27, 94, 32] },
    columnStyles: { 1: { halign: 'right' } },
    theme: 'striped',
    margin: { left: 12, right: 12 }
  })

  // Bar chart: Income vs Expenses per month
  let y = doc.lastAutoTable.finalY + 10
  const months = st.monthly.slice(-12)
  if (months.length) {
    if (y > 200) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Income vs Expenses', 12, y)
    doc.setFont('helvetica', 'normal')
    const ch = 55
    const top = y + 5
    const max = Math.max(1, ...months.map((m) => Math.max(m.income, m.expenses)))
    const gw = (W - 30) / months.length
    doc.setDrawColor(200)
    doc.line(18, top + ch, W - 12, top + ch)
    months.forEach((m, i) => {
      const x = 20 + i * gw
      const bw2 = Math.min(6, gw / 2 - 1)
      const hi = (m.income / max) * ch
      const he = (m.expenses / max) * ch
      doc.setFillColor(76, 175, 80)
      doc.rect(x, top + ch - hi, bw2, hi, 'F')
      doc.setFillColor(121, 85, 72)
      doc.rect(x + bw2 + 0.5, top + ch - he, bw2, he, 'F')
      doc.setFontSize(7)
      doc.text(m.month, x, top + ch + 4)
    })
    doc.setFontSize(8)
    doc.setFillColor(76, 175, 80); doc.rect(W - 60, y - 3, 3, 3, 'F'); doc.text('Income', W - 55, y)
    doc.setFillColor(121, 85, 72); doc.rect(W - 38, y - 3, 3, 3, 'F'); doc.text('Expenses', W - 33, y)
    y = top + ch + 10
  }

  if (r.farms.length || r.projects.length) {
    autoTable(doc, {
      startY: y,
      head: r.farms.length ? [['Farm', 'Sales', 'Expenses', 'Net']] : [['Project', 'Status', 'Sales', 'Expenses', 'Net']],
      body: r.farms.length ? r.farms.map((f) => [f.name, K(f.sales), K(f.expenses), K(f.net)]) : r.projects.map((p) => [p.name, p.status, K(p.sales), K(p.expenses), K(p.net)]),
      headStyles: { fillColor: [121, 85, 72] },
      theme: 'grid',
      styles: { fontSize: 9 },
      margin: { left: 12, right: 12 }
    })
    y = doc.lastAutoTable.finalY + 8
  }

  if (st.salesByItem.length) {
    autoTable(doc, {
      startY: y,
      head: [['Sales by Item', 'Quantity', 'Amount']],
      body: st.salesByItem.map((s) => [s.item, `${s.qty} ${s.unit || ''}`, K(s.amount)]),
      headStyles: { fillColor: [76, 175, 80] },
      theme: 'grid',
      styles: { fontSize: 9 },
      margin: { left: 12, right: 12 }
    })
    y = doc.lastAutoTable.finalY + 8
  }

  if (y > 240) { doc.addPage(); y = 20 }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Recommendations', 12, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  y += 6
  for (const rec of r.recs) {
    const lines = doc.splitTextToSize('• ' + rec, W - 24)
    if (y + lines.length * 5 > 285) { doc.addPage(); y = 20 }
    doc.text(lines, 12, y)
    y += lines.length * 5 + 2
  }

  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(130)
    doc.text(`Zozo Farm App - ${r.scopeName} - ${r.period}`, 12, 292)
    doc.text(`Page ${i} of ${pages}`, W - 12, 292, { align: 'right' })
  }
  doc.save(fileBase(r) + '.pdf')
}

// ---------------- WORD ----------------
export async function exportDocx(r) {
  const d = await import('docx')
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, ShadingType, ImageRun, BorderStyle } = d
  const { st } = r
  const logo = await logoDataUrl()
  const cell = (text, opts = {}) =>
    new TableCell({
      width: { size: opts.w || 50, type: WidthType.PERCENTAGE },
      shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill, color: 'auto' } : undefined,
      children: [new Paragraph({ alignment: opts.right ? AlignmentType.RIGHT : AlignmentType.LEFT, children: [new TextRun({ text: String(text), bold: !!opts.bold, color: opts.color, size: 21 })] })]
    })
  const table = (head, rows, widths) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, { bold: true, fill: GREEN, color: 'FFFFFF', w: widths?.[i], right: i > 0 })) }),
        ...rows.map((row, ri) => new TableRow({ children: row.map((c, i) => cell(c, { w: widths?.[i], right: i > 0, fill: ri % 2 ? 'F1F8E9' : undefined, bold: String(row[0]).startsWith('NET') })) }))
      ]
    })
  const H = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 }, children: [new TextRun({ text, color: GREEN, bold: true })] })
  const K = (n) => money(n)

  const children = []
  const headerRuns = []
  if (logo) {
    const bin = Uint8Array.from(atob(logo.split(',')[1]), (c) => c.charCodeAt(0))
    headerRuns.push(new ImageRun({ data: bin, transformation: { width: 56, height: 56 }, type: 'png' }))
    headerRuns.push(new TextRun({ text: '   ' }))
  }
  headerRuns.push(new TextRun({ text: 'Zozo Farm App', bold: true, size: 40, color: GREEN }))
  children.push(new Paragraph({ children: headerRuns }))
  children.push(new Paragraph({ children: [new TextRun({ text: 'Your Farms, In Your Pocket', italics: true, color: BROWN })], border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: LIGHT, space: 4 } } }))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240 }, children: [new TextRun({ text: 'Income Statement', bold: true })] }))
  children.push(new Paragraph({ children: [new TextRun({ text: 'Farm: ', bold: true }), new TextRun(r.scopeName)] }))
  children.push(new Paragraph({ children: [new TextRun({ text: 'Period: ', bold: true }), new TextRun(r.period)] }))
  children.push(new Paragraph({ children: [new TextRun({ text: 'Generated: ', bold: true }), new TextRun(r.generated)] }))

  children.push(H('Summary'))
  children.push(table(['Item', 'Amount (ZMW)'], [
    ['Total Sales (Income)', K(st.totalSales)],
    ...st.byCategory.map((c) => [`Less: ${c.category}`, K(-c.amount)]),
    ['Total Expenses', K(-st.totalExpenses)],
    [st.net >= 0 ? 'NET PROFIT' : 'NET LOSS', K(st.net)],
    ['Profit Margin', st.margin.toFixed(1) + '%'],
    ['Capital Injected (not income)', K(st.totalInvestment)]
  ], [65, 35]))

  if (st.byCategory.length) {
    children.push(H('Expenses by Category'))
    children.push(table(['Category', 'Amount', 'Share'], st.byCategory.map((c) => [c.category, K(c.amount), c.share.toFixed(1) + '%']), [50, 30, 20]))
  }
  if (st.salesByItem.length) {
    children.push(H('Sales by Item'))
    children.push(table(['Item', 'Quantity', 'Amount'], st.salesByItem.map((s) => [s.item, `${s.qty} ${s.unit || ''}`, K(s.amount)]), [50, 20, 30]))
  }
  if (r.farms.length) {
    children.push(H('By Farm'))
    children.push(table(['Farm', 'Sales', 'Expenses', 'Net'], r.farms.map((f) => [f.name, K(f.sales), K(f.expenses), K(f.net)]), [40, 20, 20, 20]))
  }
  if (r.projects.length) {
    children.push(H('By Project'))
    children.push(table(['Project', 'Sales', 'Expenses', 'Net'], r.projects.map((p) => [p.name, K(p.sales), K(p.expenses), K(p.net)]), [40, 20, 20, 20]))
  }
  children.push(H('Monthly Income vs Expenses'))
  children.push(table(['Month', 'Income', 'Expenses', 'Profit'], st.monthly.map((m) => [m.month, K(m.income), K(m.expenses), K(m.profit)]), [25, 25, 25, 25]))
  children.push(H('Recommendations'))
  r.recs.forEach((x) => children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(x)] })))
  children.push(new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: 'Prepared with Zozo Farm App. You can edit this document.', italics: true, color: '888888', size: 18 })] }))

  const doc = new Document({ creator: 'Zozo Farm App', title: 'Income Statement - ' + r.scopeName, styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } }, sections: [{ children }] })
  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, fileBase(r) + '.docx')
}

// ---------------- POWERPOINT ----------------
export async function exportPptx(r) {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 in
  const logo = await logoDataUrl()
  const { st } = r
  const K = (n) => money(n, { decimals: 0 })
  const header = (s, title) => {
    s.background = { color: 'FFFFFF' }
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.9, fill: { color: GREEN } })
    if (logo) s.addImage({ data: logo, x: 0.3, y: 0.12, w: 0.66, h: 0.66 })
    s.addText(title, { x: 1.1, y: 0.12, w: 9, h: 0.66, fontSize: 24, bold: true, color: 'FFFFFF', fontFace: 'Calibri' })
    s.addText(`${r.scopeName} | ${r.period}`, { x: 8.3, y: 0.12, w: 4.8, h: 0.66, fontSize: 11, color: 'E8F5E9', align: 'right' })
  }

  // 1. Title
  const s1 = pptx.addSlide()
  s1.background = { color: GREEN }
  if (logo) s1.addImage({ data: logo, x: 5.9, y: 0.9, w: 1.5, h: 1.5 })
  s1.addText('Zozo Farm App', { x: 0, y: 2.6, w: 13.33, h: 0.9, fontSize: 44, bold: true, color: 'FFFFFF', align: 'center' })
  s1.addText('Your Farms, In Your Pocket', { x: 0, y: 3.4, w: 13.33, h: 0.5, fontSize: 18, italic: true, color: 'C8E6C9', align: 'center' })
  s1.addText('Income Statement', { x: 0, y: 4.4, w: 13.33, h: 0.6, fontSize: 28, color: 'FFFFFF', align: 'center' })
  s1.addText(r.scopeName, { x: 0, y: 5.0, w: 13.33, h: 0.6, fontSize: 24, bold: true, color: 'FFFFFF', align: 'center' })
  s1.addText(`${r.period}  |  Generated ${r.generated}`, { x: 0, y: 5.7, w: 13.33, h: 0.4, fontSize: 14, color: 'C8E6C9', align: 'center' })

  // 2. Summary numbers
  const s2 = pptx.addSlide()
  header(s2, 'Summary')
  const cards = [
    ['Total Sales', K(st.totalSales), LIGHT],
    ['Total Expenses', K(st.totalExpenses), BROWN],
    [st.net >= 0 ? 'Net Profit' : 'Net Loss', K(st.net), st.net >= 0 ? GREEN : 'C62828'],
    ['Profit Margin', st.margin.toFixed(1) + '%', '546E7A']
  ]
  cards.forEach(([label, val, color], i) => {
    const x = 0.5 + i * 3.1
    s2.addShape(pptx.ShapeType.roundRect, { x, y: 1.5, w: 2.9, h: 1.9, fill: { color }, rectRadius: 0.15 })
    s2.addText(label, { x, y: 1.65, w: 2.9, h: 0.5, fontSize: 16, color: 'FFFFFF', align: 'center' })
    s2.addText(val, { x, y: 2.2, w: 2.9, h: 0.9, fontSize: 28, bold: true, color: 'FFFFFF', align: 'center' })
  })
  s2.addText(`Capital injected in this period: ${K(st.totalInvestment)} (kept separate - not counted as income)`, { x: 0.5, y: 3.8, w: 12.3, h: 0.5, fontSize: 16, color: '424242' })
  s2.addText(`Number of sales: ${st.sales.length}    Number of expenses: ${st.expenses.length}`, { x: 0.5, y: 4.3, w: 12.3, h: 0.5, fontSize: 14, color: '757575' })
  if (r.farms.length || r.projects.length) {
    const rows = (r.farms.length ? r.farms : r.projects).slice(0, 6)
    s2.addTable(
      [[{ text: r.farms.length ? 'Farm' : 'Project', options: { bold: true, color: 'FFFFFF', fill: { color: GREEN } } }, ...['Sales', 'Expenses', 'Net'].map((h) => ({ text: h, options: { bold: true, color: 'FFFFFF', fill: { color: GREEN }, align: 'right' } }))],
        ...rows.map((x) => [x.name, { text: K(x.sales), options: { align: 'right' } }, { text: K(x.expenses), options: { align: 'right' } }, { text: K(x.net), options: { align: 'right', bold: true } }])],
      { x: 0.5, y: 4.9, w: 12.3, fontSize: 12, border: { type: 'solid', color: 'DDDDDD', pt: 0.5 } }
    )
  }

  // 3. Income vs Expenses chart
  const s3 = pptx.addSlide()
  header(s3, 'Income vs Expenses')
  const labels = st.monthly.map((m) => m.month)
  if (labels.length) {
    s3.addChart(pptx.ChartType.bar, [
      { name: 'Income', labels, values: st.monthly.map((m) => m.income) },
      { name: 'Expenses', labels, values: st.monthly.map((m) => m.expenses) }
    ], { x: 0.5, y: 1.2, w: 12.3, h: 5.8, barGrouping: 'clustered', chartColors: [LIGHT, BROWN], showLegend: true, legendPos: 'b', valAxisLabelFormatCode: '#,##0', catAxisLabelFontSize: 11, valAxisLabelFontSize: 11, showValue: false })
  } else s3.addText('No transactions in this period.', { x: 0.5, y: 3, w: 12, h: 1, fontSize: 20, align: 'center' })

  // 4. Top expenses
  const s4 = pptx.addSlide()
  header(s4, 'Top Expenses')
  const top = st.byCategory.slice(0, 6)
  if (top.length) {
    s4.addChart(pptx.ChartType.pie, [{ name: 'Expenses', labels: top.map((c) => c.category), values: top.map((c) => c.amount) }], {
      x: 0.4, y: 1.2, w: 6, h: 5.8, showPercent: true, showLegend: true, legendPos: 'b', chartColors: top.map((c) => c.color.replace('#', '')), dataLabelColor: 'FFFFFF'
    })
    s4.addTable(
      [[{ text: 'Category', options: { bold: true, color: 'FFFFFF', fill: { color: BROWN } } }, { text: 'Amount', options: { bold: true, color: 'FFFFFF', fill: { color: BROWN }, align: 'right' } }, { text: 'Share', options: { bold: true, color: 'FFFFFF', fill: { color: BROWN }, align: 'right' } }],
        ...top.map((c) => [c.category, { text: K(c.amount), options: { align: 'right' } }, { text: c.share.toFixed(1) + '%', options: { align: 'right' } }])],
      { x: 6.8, y: 1.5, w: 6, fontSize: 14, border: { type: 'solid', color: 'DDDDDD', pt: 0.5 } }
    )
  } else s4.addText('No expenses in this period.', { x: 0.5, y: 3, w: 12, h: 1, fontSize: 20, align: 'center' })

  // 5. Recommendations
  const s5 = pptx.addSlide()
  header(s5, 'Recommendations')
  s5.addText(r.recs.slice(0, 6).map((t) => ({ text: t, options: { bullet: true, breakLine: true } })), { x: 0.6, y: 1.2, w: 12.1, h: 5.9, fontSize: 16, color: '333333', valign: 'top', paraSpaceAfter: 10 })

  await pptx.writeFile({ fileName: fileBase(r) + '.pptx' })
}

export const EXPORTERS = { xlsx: exportXlsx, pdf: exportPdf, docx: exportDocx, pptx: exportPptx }

// ---------------- FULL BACKUP ----------------
export async function exportAllData(state, images) {
  const data = { app: 'Zozo Farm App', exportedAt: new Date().toISOString(), state, images }
  downloadBlob(new Blob([JSON.stringify(data)], { type: 'application/json' }), `Zozo_Farm_Backup_${today()}.json`)
}
