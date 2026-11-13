// Small, dependency-free .xlsx support.
// Writing: one sheet with values, formulas, fills, fonts, borders, merges and
// column widths. Reading: cell values plus each cell's fill colour, which is
// how class spreadsheets mark scores as final (yellow) or planned (green).
// An .xlsx file is a zip of XML files; we write it uncompressed and read
// compressed entries with the browser's DecompressionStream.

const encoder = new TextEncoder()

// ---------------------------------------------------------------- zip

let crcTable: Uint32Array | null = null
function crc32(data: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crcTable[n] = c >>> 0
    }
  }
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function zip(files: { name: string; data: Uint8Array }[]): Uint8Array<ArrayBuffer> {
  const chunks: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  for (const file of files) {
    const name = encoder.encode(file.name)
    const crc = crc32(file.data)
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true) // version needed
    local.setUint16(6, 0x0800, true) // UTF-8 names
    local.setUint16(8, 0, true) // stored
    local.setUint16(12, 0x21, true) // date: 1980-01-01
    local.setUint32(14, crc, true)
    local.setUint32(18, file.data.length, true)
    local.setUint32(22, file.data.length, true)
    local.setUint16(26, name.length, true)
    chunks.push(new Uint8Array(local.buffer), name, file.data)

    const entry = new DataView(new ArrayBuffer(46))
    entry.setUint32(0, 0x02014b50, true)
    entry.setUint16(4, 20, true)
    entry.setUint16(6, 20, true)
    entry.setUint16(8, 0x0800, true)
    entry.setUint16(14, 0x21, true)
    entry.setUint32(16, crc, true)
    entry.setUint32(20, file.data.length, true)
    entry.setUint32(24, file.data.length, true)
    entry.setUint16(28, name.length, true)
    entry.setUint32(42, offset, true)
    central.push(new Uint8Array(entry.buffer), name)
    offset += 30 + name.length + file.data.length
  }
  const centralSize = central.reduce((sum, c) => sum + c.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true)
  end.setUint16(8, files.length, true)
  end.setUint16(10, files.length, true)
  end.setUint32(12, centralSize, true)
  end.setUint32(16, offset, true)
  const parts = [...chunks, ...central, new Uint8Array(end.buffer)]
  const out = new Uint8Array(new ArrayBuffer(parts.reduce((sum, p) => sum + p.length, 0)))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

async function unzip(buffer: ArrayBuffer, wanted: (name: string) => boolean): Promise<Map<string, string>> {
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)
  let eocd = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('Not a zip file')
  const count = view.getUint16(eocd + 10, true)
  let pointer = view.getUint32(eocd + 16, true)
  const decoder = new TextDecoder()
  const files = new Map<string, string>()
  for (let i = 0; i < count; i++) {
    if (view.getUint32(pointer, true) !== 0x02014b50) throw new Error('Bad zip directory')
    const method = view.getUint16(pointer + 10, true)
    const size = view.getUint32(pointer + 20, true)
    const nameLength = view.getUint16(pointer + 28, true)
    const extraLength = view.getUint16(pointer + 30, true)
    const commentLength = view.getUint16(pointer + 32, true)
    const localOffset = view.getUint32(pointer + 42, true)
    const name = decoder.decode(bytes.subarray(pointer + 46, pointer + 46 + nameLength))
    pointer += 46 + nameLength + extraLength + commentLength
    if (!wanted(name)) continue
    const start = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true)
    const data = bytes.slice(start, start + size)
    if (method === 0) files.set(name, decoder.decode(data))
    else if (method === 8) {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
      files.set(name, decoder.decode(await new Response(stream).arrayBuffer()))
    }
  }
  return files
}

// ---------------------------------------------------------------- writing

const escapeXml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // Characters XML 1.0 does not allow.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')

export function columnName(index: number): string {
  let name = ''
  let n = index + 1
  while (n > 0) {
    const rem = (n - 1) % 26
    name = String.fromCharCode(65 + rem) + name
    n = Math.floor((n - 1) / 26)
  }
  return name
}

export function splitRef(ref: string): { col: number; row: number } {
  const match = /^([A-Z]+)(\d+)$/.exec(ref)
  if (!match) throw new Error(`Bad cell reference ${ref}`)
  let col = 0
  for (const ch of match[1]) col = col * 26 + (ch.charCodeAt(0) - 64)
  return { col: col - 1, row: Number(match[2]) }
}

export type CellStyle = {
  /** RGB hex without '#', e.g. 'FFFF00'. */
  fill?: string
  bold?: boolean
  size?: number
  color?: string
  border?: 'thin' | 'medium'
  align?: 'center' | 'left'
  wrap?: boolean
}

export type SheetCell = { v?: string | number; f?: string; style?: CellStyle }

export type SheetSpec = {
  name: string
  cells: Record<string, SheetCell>
  merges?: string[]
  /** Column letter -> width in characters. */
  widths?: Record<string, number>
  heights?: Record<number, number>
}

export function buildSheetXlsx(spec: SheetSpec): Blob {
  const fonts = ['<font><sz val="11"/><name val="Calibri"/></font>']
  const fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>']
  const borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>']
  const xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>']
  const index = (list: string[], xml: string) => {
    const at = list.indexOf(xml)
    if (at >= 0) return at
    list.push(xml)
    return list.length - 1
  }
  const styleId = (style?: CellStyle) => {
    if (!style) return 0
    const font = index(
      fonts,
      `<font>${style.bold ? '<b/>' : ''}<sz val="${style.size ?? 11}"/>${style.color ? `<color rgb="FF${style.color}"/>` : ''}<name val="Calibri"/></font>`,
    )
    const fill = style.fill
      ? index(fills, `<fill><patternFill patternType="solid"><fgColor rgb="FF${style.fill}"/><bgColor indexed="64"/></patternFill></fill>`)
      : 0
    const side = (tag: string) => (style.border ? `<${tag} style="${style.border}"><color indexed="64"/></${tag}>` : `<${tag}/>`)
    const border = index(borders, `<border>${side('left')}${side('right')}${side('top')}${side('bottom')}<diagonal/></border>`)
    const alignment =
      style.align || style.wrap
        ? `<alignment${style.align ? ` horizontal="${style.align}"` : ''} vertical="center"${style.wrap ? ' wrapText="1"' : ''}/>`
        : ''
    return index(
      xfs,
      `<xf numFmtId="0" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">${alignment}</xf>`,
    )
  }

  const rows = new Map<number, { col: number; xml: string }[]>()
  for (const [ref, cell] of Object.entries(spec.cells)) {
    const { col, row } = splitRef(ref)
    const s = styleId(cell.style)
    const sAttr = s ? ` s="${s}"` : ''
    let xml: string
    if (cell.f !== undefined) {
      const cached = cell.v === undefined || cell.v === '' ? '' : String(cell.v)
      const type = typeof cell.v === 'number' ? '' : ' t="str"'
      xml = `<c r="${ref}"${sAttr}${type}><f>${escapeXml(cell.f)}</f><v>${escapeXml(cached)}</v></c>`
    } else if (typeof cell.v === 'number') {
      xml = `<c r="${ref}"${sAttr}><v>${cell.v}</v></c>`
    } else if (cell.v) {
      xml = `<c r="${ref}"${sAttr} t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell.v)}</t></is></c>`
    } else {
      xml = `<c r="${ref}"${sAttr}/>`
    }
    if (!rows.has(row)) rows.set(row, [])
    rows.get(row)!.push({ col, xml })
  }
  const allRows = new Set([...rows.keys(), ...Object.keys(spec.heights ?? {}).map(Number)])
  const sheetData = [...allRows]
    .sort((a, b) => a - b)
    .map((r) => {
      const height = spec.heights?.[r]
      const cells = (rows.get(r) ?? [])
        .sort((a, b) => a.col - b.col)
        .map((c) => c.xml)
        .join('')
      return `<row r="${r}"${height ? ` ht="${height}" customHeight="1"` : ''}>${cells}</row>`
    })
    .join('')
  const cols = Object.entries(spec.widths ?? {})
    .map(([letter, width]) => ({ at: splitRef(`${letter}1`).col + 1, width }))
    .sort((a, b) => a.at - b.at)
    .map((c) => `<col min="${c.at}" max="${c.at}" width="${c.width}" customWidth="1"/>`)
    .join('')
  const merges = spec.merges?.length
    ? `<mergeCells count="${spec.merges.length}">${spec.merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`
    : ''

  const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
  const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
  const pkg = 'http://schemas.openxmlformats.org/package/2006/relationships'
  const xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
  const files: Record<string, string> = {
    '[Content_Types].xml': `${xml}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    '_rels/.rels': `${xml}<Relationships xmlns="${pkg}"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `${xml}<workbook xmlns="${ns}" xmlns:r="${rel}"><sheets><sheet name="${escapeXml(spec.name)}" sheetId="1" r:id="rId1"/></sheets><calcPr calcId="0" fullCalcOnLoad="1"/></workbook>`,
    'xl/_rels/workbook.xml.rels': `${xml}<Relationships xmlns="${pkg}"><Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${rel}/styles" Target="styles.xml"/></Relationships>`,
    'xl/worksheets/sheet1.xml': `${xml}<worksheet xmlns="${ns}">${cols ? `<cols>${cols}</cols>` : ''}<sheetData>${sheetData}</sheetData>${merges}</worksheet>`,
  }
  files['xl/styles.xml'] =
    `${xml}<styleSheet xmlns="${ns}"><fonts count="${fonts.length}">${fonts.join('')}</fonts><fills count="${fills.length}">${fills.join('')}</fills><borders count="${borders.length}">${borders.join('')}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`
  const bytes = zip(Object.entries(files).map(([name, text]) => ({ name, data: encoder.encode(text) })))
  return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export type CellValue = string | number

/** A plain table (first row usually headers) as an .xlsx file. */
export function buildXlsx(rows: CellValue[][], sheetName = 'Sheet1'): Blob {
  const cells: Record<string, SheetCell> = {}
  rows.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v !== '') cells[`${columnName(c)}${r + 1}`] = { v }
    }),
  )
  return buildSheetXlsx({ name: sheetName, cells })
}

// ---------------------------------------------------------------- reading

export type ReadCell = { value: string | number | null; fill: string | null }
export type ReadSheet = { cells: Map<string, ReadCell>; merges: string[]; maxRow: number; maxCol: number }

// Common entries of Excel's legacy colour palette, enough for typical highlight colours.
const INDEXED: Record<number, string> = {
  2: 'FF0000', 3: '00FF00', 4: '0000FF', 5: 'FFFF00', 6: 'FF00FF', 7: '00FFFF',
  10: 'FF0000', 11: '00FF00', 12: '0000FF', 13: 'FFFF00', 14: 'FF00FF', 15: '00FFFF',
  22: 'C0C0C0', 26: 'FFFFCC', 27: 'CCFFFF', 29: 'FF8080', 34: 'CCFFFF', 35: 'CCFFCC',
  36: 'FFFF99', 40: 'FF99CC', 41: 'CC99FF', 42: 'FFCC99', 43: 'CCFFCC', 44: 'FFFF99',
  45: 'FF99CC', 47: 'FFCC99', 50: '99CC00', 51: 'FFCC00', 52: 'FF9900', 57: '339966',
}

function applyTint(hex: string, tint: number): string {
  return [0, 2, 4]
    .map((i) => parseInt(hex.slice(i, i + 2), 16))
    .map((c) => Math.round(tint < 0 ? c * (1 + tint) : c + (255 - c) * tint))
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

const parseXml = (text: string) => new DOMParser().parseFromString(text, 'application/xml')
const byTag = (node: Document | Element, tag: string) => Array.from(node.getElementsByTagNameNS('*', tag))

/** Reads the first worksheet of an .xlsx file, with resolved cell fill colours. */
export async function readXlsxSheet(buffer: ArrayBuffer): Promise<ReadSheet> {
  const files = await unzip(buffer, (name) => (name.startsWith('xl/') && name.endsWith('.xml')) || name.endsWith('.rels'))
  const workbook = parseXml(files.get('xl/workbook.xml') ?? '<workbook/>')
  const firstSheet = byTag(workbook, 'sheet')[0]
  const relId =
    firstSheet?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') ??
    firstSheet?.getAttribute('r:id')
  const rels = parseXml(files.get('xl/_rels/workbook.xml.rels') ?? '<Relationships/>')
  const target = byTag(rels, 'Relationship').find((r) => r.getAttribute('Id') === relId)?.getAttribute('Target') ?? 'worksheets/sheet1.xml'
  const sheetPath = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`
  const sheetXml = files.get(sheetPath)
  if (!sheetXml) throw new Error('Worksheet not found')

  const shared = byTag(parseXml(files.get('xl/sharedStrings.xml') ?? '<sst/>'), 'si').map((si) =>
    byTag(si, 't')
      .map((t) => t.textContent ?? '')
      .join(''),
  )

  const theme = parseXml(files.get('xl/theme/theme1.xml') ?? '<theme/>')
  const scheme = byTag(theme, 'clrScheme')[0]
  const schemeColors = scheme
    ? Array.from(scheme.children).map((el) => {
        const color = el.firstElementChild
        if (!color) return '000000'
        return (color.localName === 'srgbClr' ? color.getAttribute('val') : color.getAttribute('lastClr')) ?? '000000'
      })
    : []
  // Theme indices swap the first two pairs: 0 lt1, 1 dk1, 2 lt2, 3 dk2, then the accents.
  const themeColor = (i: number) => schemeColors[[1, 0, 3, 2][i] ?? i] ?? null

  const styles = parseXml(files.get('xl/styles.xml') ?? '<styleSheet/>')
  const fillsNode = byTag(styles, 'fills')[0]
  const fillColors = (fillsNode ? byTag(fillsNode, 'fill') : []).map((fill) => {
    const pattern = byTag(fill, 'patternFill')[0]
    if (!pattern || pattern.getAttribute('patternType') !== 'solid') return null
    const fg = byTag(pattern, 'fgColor')[0]
    if (!fg) return null
    const tint = Number(fg.getAttribute('tint') ?? 0)
    const rgb = fg.getAttribute('rgb')
    if (rgb) return applyTint(rgb.slice(-6).toUpperCase(), tint)
    const themeIndex = fg.getAttribute('theme')
    if (themeIndex !== null) {
      const base = themeColor(Number(themeIndex))
      return base ? applyTint(base.toUpperCase(), tint) : null
    }
    const indexed = fg.getAttribute('indexed')
    return indexed !== null ? (INDEXED[Number(indexed)] ?? null) : null
  })
  const xfsNode = byTag(styles, 'cellXfs')[0]
  const xfFill = (xfsNode ? byTag(xfsNode, 'xf') : []).map((xf) => fillColors[Number(xf.getAttribute('fillId') ?? 0)] ?? null)

  const sheet = parseXml(sheetXml)
  const cells = new Map<string, ReadCell>()
  let maxRow = 0
  let maxCol = 0
  for (const c of byTag(sheet, 'c')) {
    const ref = c.getAttribute('r')
    if (!ref) continue
    const type = c.getAttribute('t')
    const raw = byTag(c, 'v')[0]?.textContent ?? null
    let value: string | number | null = null
    if (type === 's' && raw !== null) value = shared[Number(raw)] ?? null
    else if (type === 'inlineStr') value = byTag(c, 't').map((t) => t.textContent ?? '').join('')
    else if (type === 'str' || type === 'e') value = raw
    else if (type === 'b') value = raw === '1' ? 'TRUE' : 'FALSE'
    else if (raw !== null && raw !== '') value = Number(raw)
    const fill = xfFill[Number(c.getAttribute('s') ?? 0)] ?? null
    cells.set(ref, { value, fill })
    const { col, row } = splitRef(ref)
    maxRow = Math.max(maxRow, row)
    maxCol = Math.max(maxCol, col)
  }
  const merges = byTag(sheet, 'mergeCell')
    .map((m) => m.getAttribute('ref') ?? '')
    .filter(Boolean)
  return { cells, merges, maxRow, maxCol }
}

/** Classifies a highlight colour the way class sheets use it. */
export function fillKind(hex: string | null): 'yellow' | 'green' | 'pink' | 'other' | null {
  if (!hex) return null
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))
  if (Math.max(r, g, b) - Math.min(r, g, b) < 20) return null // white, grey, black
  if (r > 190 && g > 190 && b < 160) return 'yellow'
  if (g >= r + 8 && g >= b + 8) return 'green'
  if (r >= g + 15 && r > 180 && b >= 100) return 'pink'
  return 'other'
}
