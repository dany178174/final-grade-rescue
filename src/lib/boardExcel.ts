// Reads and writes the class planning sheet ("Kế hoạch HK…", one student per
// file): subjects down column E, then Miệng | 15' ×5 | Chuyên đề (hệ số 1),
// 45' ×3 (hệ số 2), HS3, and a TBHK formula. Yellow cells are final scores,
// green (or pink) cells are target scores ("phấn đấu").

import { emptyCell, MAX_HS1, MAX_HS2, newBoardRow, rowStats, SHEET_NAMES, subjectIdFromName, type Board, type BoardRow, type Cell, type Goal } from './vnBoard'
import { getVnSubject } from '../data/vn/subjects'
import { buildSheetXlsx, columnName, fillKind, readXlsxSheet, splitRef, type CellStyle, type SheetCell } from './xlsx'

const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9']/g, '')

// ---------------------------------------------------------------- import

export type ImportResult = { board: Board; subjects: number; warnings: string[] }

type Role = 'oral' | 'tx' | 'cd' | 'hs2' | 'hs3'

export async function importBoardFromXlsx(buffer: ArrayBuffer, current: Board): Promise<ImportResult> {
  const sheet = await readXlsxSheet(buffer)
  const text = (ref: string) => {
    const v = sheet.cells.get(ref)?.value
    return v === null || v === undefined ? '' : String(v).trim()
  }
  const at = (col: number, row: number) => `${columnName(col)}${row}`

  // Header row: the one that contains "Miệng" / "15'".
  let headerRow = -1
  for (let r = 1; r <= Math.min(sheet.maxRow, 30) && headerRow < 0; r++) {
    for (let c = 0; c <= sheet.maxCol; c++) {
      const t = fold(text(at(c, r)))
      if (t === 'mieng' || t === "15'") {
        headerRow = r
        break
      }
    }
  }
  if (headerRow < 0) throw new Error('Không tìm thấy dòng tiêu đề có cột "Miệng" hoặc "15\'".')

  const roles = new Map<number, Role>()
  for (let c = 0; c <= sheet.maxCol; c++) {
    const t = fold(text(at(c, headerRow)))
    const above = fold(text(at(c, headerRow - 1)))
    const weight = Number(sheet.cells.get(at(c, headerRow + 1))?.value)
    if (t === 'mieng') roles.set(c, 'oral')
    else if (t.startsWith('chuyende') || t === 'cd') roles.set(c, 'cd')
    else if (t === "15'" || t === '15') roles.set(c, 'tx')
    else if (t === "45'" || t === '45' || t.startsWith('giuaki')) roles.set(c, 'hs2')
    else if (above === 'hs3' || t === 'hs3' || t.startsWith('cuoiki')) roles.set(c, 'hs3')
    else if (above !== 'tbhk' && t !== 'tbhk' && weight === 3) roles.set(c, 'hs3')
  }
  const scoreCols = [...roles.keys()]
  if (!scoreCols.length) throw new Error('Không tìm thấy các cột điểm.')
  const firstScoreCol = Math.min(...scoreCols)

  // The subject column is the one left of the scores with the most subject names.
  const dataStart = headerRow + (Number.isFinite(Number(sheet.cells.get(at(firstScoreCol, headerRow + 1))?.value)) ? 2 : 1)
  let subjectCol = -1
  let best = 0
  for (let c = 0; c < firstScoreCol; c++) {
    let hits = 0
    for (let r = dataStart; r < dataStart + 20; r++) if (subjectIdFromName(text(at(c, r)))) hits++
    if (hits > best) {
      best = hits
      subjectCol = c
    }
  }
  if (subjectCol < 0) throw new Error('Không tìm thấy cột tên môn học.')

  const findColumn = (label: string) => {
    for (let r = 1; r < dataStart; r++) for (let c = 0; c < firstScoreCol; c++) if (fold(text(at(c, r))).startsWith(label)) return c
    return -1
  }
  const firstValueBelow = (col: number) => {
    if (col < 0) return ''
    for (let r = headerRow - 2; r < dataStart + 20; r++) {
      const v = text(at(col, r))
      if (v && !['hovaten', 'mahs', 'khoi', 'lop', 'sttlop'].includes(fold(v))) return v
    }
    return ''
  }

  const warnings: string[] = []
  const rows: BoardRow[] = []
  let grade = current.grade
  for (let r = dataStart, blanks = 0; r < dataStart + 30 && blanks < 2; r++) {
    const name = text(at(subjectCol, r))
    if (!name) {
      blanks++
      continue
    }
    blanks = 0
    if (fold(name).startsWith('ghichu')) break
    const id = subjectIdFromName(name)
    const khoi = Number(text(at(subjectCol - 1, r)))
    if (khoi >= 6 && khoi <= 12) grade = khoi

    const slot = (col: number): Cell | null => {
      const cell = sheet.cells.get(at(col, r))
      const kind = fillKind(cell?.fill ?? null)
      const raw = cell?.value
      const v = typeof raw === 'number' ? String(Math.round(raw * 100) / 100) : (raw ?? '').toString().replace(',', '.').trim()
      const hasValue = v !== '' && Number.isFinite(Number(v))
      if (!hasValue && (kind === null || kind === 'other')) return null
      return { v: hasValue ? v : '', plan: kind === 'green' || kind === 'pink' }
    }
    const cols = (role: Role) => [...roles.entries()].filter(([, x]) => x === role).map(([c]) => c).sort((a, b) => a - b)
    const oral = cols('oral').map(slot)[0] ?? null
    const tx = cols('tx').map(slot).filter((c): c is Cell => c !== null)
    const cdCell = cols('cd').map(slot)[0] ?? null
    const hs2 = cols('hs2').map(slot).filter((c): c is Cell => c !== null)
    const hs3 = cols('hs3').map(slot)[0] ?? null

    rows.push(
      newBoardRow(id ?? 'khac', {
        khac: id ? '' : name,
        hs1: [oral ?? emptyCell(), ...tx].slice(0, MAX_HS1),
        cd: cdCell && cdCell.v ? cdCell : null,
        hs2: (hs2.length ? hs2 : [emptyCell()]).slice(0, MAX_HS2),
        hs3: hs3 ?? emptyCell(true),
      }),
    )
  }
  if (!rows.length) throw new Error('Không tìm thấy môn học nào trong file.')
  if (!grade) grade = rows.some((r) => ['su', 'ly', 'hoa', 'sinh', 'qpan', 'dia', 'ktpl'].includes(r.mon)) ? 10 : 6

  // Goal: the cell to the right of "Mục tiêu".
  let goal: Goal = current.goal
  for (const [ref, cell] of sheet.cells) {
    if (!fold(String(cell.value ?? '')).startsWith('muctieu')) continue
    const { col, row } = splitRef(ref)
    for (let c = col + 1; c <= col + 12; c++) {
      const v = fold(text(at(c, row)))
      if (!v) continue
      if (v.includes('xs') || v.includes('xuatsac')) goal = 'hsxs'
      else if (v.includes('hsg') || v.includes('gioi')) goal = 'hsg'
      break
    }
  }

  const term = Array.from(sheet.cells.values()).some((c) => /hocky2|hocki2|hk2|hkii/.test(fold(String(c.value ?? '')))) ? 'hk2' : current.term
  const unknown = rows.filter((r) => r.mon === 'khac').map((r) => r.khac)
  if (unknown.length) warnings.push(`Không nhận ra môn: ${unknown.join(', ')} (đã thêm dưới dạng "Môn khác").`)

  return {
    board: {
      ...current,
      grade,
      term,
      goal,
      rows,
      name: firstValueBelow(findColumn('hovaten')) || current.name,
      code: firstValueBelow(findColumn('mahs')) || current.code,
    },
    subjects: rows.length,
    warnings,
  }
}

// ---------------------------------------------------------------- export

const YELLOW = 'FFFF00'
const GREEN = 'E2EFDA'
const GREY = 'BFBFBF'
const LIGHT_GREY = 'D9D9D9'

const tbhkFormula = (r: number) =>
  `IF(COUNTA(F${r}:P${r})=0,"",ROUND(SUMPRODUCT(F${r}:P${r},F$4:P$4)/(` +
  'FGHIJKLMNOP'
    .split('')
    .map((c) => `COUNT(${c}${r})*${c}$4`)
    .join('+') +
  '),1))'

export function schoolYear(now = new Date()): string {
  const start = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  return `${start} -${start + 1}`
}

/** The board as the class planning sheet, ready to hand in. */
export function exportBoardXlsx(board: Board): Blob {
  const cells: Record<string, SheetCell> = {}
  const header = (fill: string, extra: CellStyle = {}): CellStyle => ({ fill, bold: true, border: 'thin', align: 'center', wrap: true, ...extra })
  const put = (ref: string, v: string | number | undefined, style: CellStyle, f?: string) => {
    cells[ref] = { v, f, style }
  }

  // Header block (rows 1–4), as in the template.
  ;['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3', 'E1', 'E2', 'E3'].forEach((ref) => put(ref, undefined, header(GREY)))
  put('A1', 'STT lớp', header(GREY))
  put('B1', 'Mã HS', header(GREY))
  put('C1', 'Họ và tên', header(GREY))
  put('D1', 'Khối', header(GREY))
  put('E1', 'Lớp', header(GREY))
  'FGHIJKLMNOPQ'.split('').forEach((c) => put(`${c}1`, undefined, header('FF0000', { color: 'FFFFFF', align: 'left' })))
  put('F1', `Năm học ${schoolYear()}/Học kỳ ${board.term === 'hk2' ? 2 : 1}`, header('FF0000', { color: 'FFFFFF', align: 'left', wrap: false }))
  'FGHIJKL'.split('').forEach((c) => put(`${c}2`, undefined, header(LIGHT_GREY)))
  put('F2', 'HS1', header(LIGHT_GREY))
  ;['M2', 'N2', 'O2'].forEach((ref) => put(ref, undefined, header('00B0F0')))
  put('M2', 'HS2', header('00B0F0'))
  put('P2', 'HS3', header('C00000', { color: 'FFFFFF' }))
  put('P3', undefined, header('C00000'))
  put('Q2', 'TBHK', header('C00000', { color: 'FFFFFF' }))
  put('Q3', undefined, header('C00000'))
  ;['F3', 'G3', 'H3', 'I3', 'J3', 'K3'].forEach((ref, i) => put(ref, i === 0 ? 'Miệng' : "15'", header(LIGHT_GREY)))
  put('L3', 'Chuyên đề', header(GREY))
  ;['M3', 'N3', 'O3'].forEach((ref) => put(ref, "45'", header('00B0F0')))
  ;'FGHIJKL'.split('').forEach((c) => put(`${c}4`, 1, { border: 'thin', align: 'center' }))
  ;['M4', 'N4', 'O4'].forEach((ref) => put(ref, 2, { border: 'thin', align: 'center' }))
  put('P4', 3, { border: 'thin', align: 'center' })
  put('Q4', undefined, header(LIGHT_GREY))
  ;['A4', 'B4', 'D4', 'E4'].forEach((ref) => put(ref, undefined, { border: 'thin' }))

  const first = 5
  const last = first + board.rows.length - 1
  put('C4', board.name?.trim() || undefined, { border: 'thin', align: 'center', wrap: true, size: 12, bold: true })
  if (board.code?.trim()) put('B4', board.code.trim(), { border: 'thin', align: 'center' })

  const scoreStyle = (cell: Cell | null): CellStyle => ({ border: 'thin', align: 'center', fill: cell ? (cell.plan ? GREEN : YELLOW) : undefined })
  const scoreValue = (cell: Cell | null) => {
    if (!cell || cell.v === '') return undefined
    const n = Number(cell.v)
    return Number.isFinite(n) ? n : undefined
  }

  board.rows.forEach((row, i) => {
    const r = first + i
    const name = row.mon === 'khac' ? row.khac.trim() || 'Môn khác' : (SHEET_NAMES[row.mon] ?? getVnSubject(row.mon)?.name ?? row.mon)
    put(`A${r}`, undefined, { border: 'thin' })
    put(`B${r}`, undefined, { border: 'thin' })
    put(`C${r}`, undefined, { border: 'thin' })
    put(`D${r}`, board.grade || undefined, { border: 'thin', align: 'center' })
    put(`E${r}`, name, { border: 'thin', align: 'center' })
    const hs1 = [...row.hs1]
    const slots: (Cell | null)[] = [
      hs1[0] ?? null,
      ...Array.from({ length: 5 }, (_, k) => hs1[k + 1] ?? null),
      row.cd,
      ...Array.from({ length: 3 }, (_, k) => row.hs2[k] ?? null),
      row.hs3,
    ]
    slots.forEach((cell, k) => {
      const ref = `${columnName(5 + k)}${r}`
      put(ref, scoreValue(cell), scoreStyle(cell))
    })
    const avg = rowStats(row, 'hk1').termAvg
    put(`Q${r}`, avg ?? '', { border: 'thin', align: 'center', bold: true, fill: LIGHT_GREY }, tbhkFormula(r))
  })

  // Notes and goal, as in the template.
  const notes = last + 2
  const note = (r: number, label: string, text: string, fill?: string) => {
    put(`E${r}`, label, { bold: true, size: 14, border: 'thin', align: 'center', fill })
    put(`F${r}`, undefined, { border: 'thin', fill })
    put(`G${r}`, text, { size: 14, border: 'thin', align: 'center', fill })
    'HIJKL'.split('').forEach((c) => put(`${c}${r}`, undefined, { border: 'thin', fill }))
  }
  note(notes, 'Ghi chú', 'HS học môn Chuyên đề nào thì phải điền thêm 1 điểm chuyên đề')
  note(notes + 1, 'Cột vàng', 'điểm đã CHỐT', YELLOW)
  note(notes + 2, 'Cột Xanh', 'điểm phấn đấu (MỖI HS ĐIỀN CỘT CĐ Ở 3 MÔN)', GREEN)
  note(notes + 3, 'Mục tiêu (ghi rõ HSG/HSXS)', board.goal === 'hsxs' ? 'HSXS' : 'HSG')
  cells[`G${notes + 3}`].style = { ...cells[`G${notes + 3}`].style, bold: true }

  ;['R', 'S'].forEach((c) => [1, 2, 3, 4].forEach((r) => put(`${c}${r}`, undefined, header(GREY))))
  const merges = ['A1:A3', 'B1:B3', 'C1:C3', 'D1:D3', 'E1:E3', 'F2:L2', 'M2:O2', 'P2:P3', 'Q2:Q3', 'R1:R4', 'S1:S4', `C4:C${last}`]
  for (let r = notes; r <= notes + 3; r++) merges.push(`E${r}:F${r}`, `G${r}:L${r}`)

  return buildSheetXlsx({
    name: 'Sheet1',
    cells,
    merges,
    widths: { A: 7, B: 9, C: 24, D: 6, E: 11, F: 9, G: 7, H: 7, I: 7, J: 7, K: 7, L: 10, M: 7, N: 7, O: 7, P: 7, Q: 8 },
    heights: { 1: 20, 3: 17, [notes]: 20, [notes + 1]: 20, [notes + 2]: 20, [notes + 3]: 20 },
  })
}

export function exportFileName(board: Board): string {
  const slug = (board.name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `Ke-hoach-HK${board.term === 'hk2' ? 2 : 1}${slug ? `-${slug}` : ''}.xlsx`
}

