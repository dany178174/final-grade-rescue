// All-subject grade board for the Vietnamese section, modelled on the class
// spreadsheet students already use: per subject, any number of hệ số 1 scores
// (miệng, 15 phút, chuyên đề), hệ số 2 scores (45 phút / giữa kì) and one
// hệ số 3 score (cuối kì). Each score is either final ("đã chốt") or a planned
// target ("dự kiến"); an empty cell is a test that has no score yet.
//
// Kết quả học tập and danh hiệu follow Thông tư 22/2021/TT-BGDĐT:
//   Tốt  = mọi môn ≥ 6,5 và ít nhất 6 môn ≥ 8,0 (môn nhận xét đều Đạt)
//   Khá  = mọi môn ≥ 5,0 và ít nhất 6 môn ≥ 6,5 (môn nhận xét đều Đạt)
//   Đạt  = ít nhất 6 môn ≥ 5,0, không môn nào < 3,5 (tối đa 1 môn nhận xét Chưa đạt)
//   Học sinh Giỏi     = học tập Tốt + rèn luyện Tốt
//   Học sinh Xuất sắc = Học sinh Giỏi + ít nhất 6 môn ≥ 9,0

import { parseScore, roundAverage } from './vnGrade'

/** A score slot. `plan` marks a target ("phấn đấu", green in the class sheet); otherwise final ("chốt", yellow). */
export type Cell = { v: string; plan: boolean }
export type BoardRow = {
  id: string
  mon: string
  khac: string
  /** hs1[0] is the oral test (miệng), the rest are 15-minute tests. */
  hs1: Cell[]
  /** Chuyên đề score (hệ số 1), only for subjects the student takes a chuyên đề in. */
  cd: Cell | null
  hs2: Cell[]
  hs3: Cell
  hk1: string
}
export type Term = 'hk1' | 'hk2'
export type Goal = 'hsg' | 'hsxs'

export type Board = {
  grade: number
  term: Term
  goal: Goal
  commentsOk: boolean
  conductOk: boolean
  rows: BoardRow[]
  /** Only used to fill the exported class sheet; stays on this device. */
  name?: string
  code?: string
}

/** Miệng + five 15-minute columns, as in the class sheet. */
export const MAX_HS1 = 6
export const MAX_HS2 = 3

export const emptyCell = (plan = false): Cell => ({ v: '', plan })

/** Default slots follow the class sheet: miệng and cuối kì are targets, 15' and 45' are final. */
export const newBoardRow = (mon = '', patch: Partial<BoardRow> = {}): BoardRow => ({
  id: Math.random().toString(36).slice(2, 8),
  mon,
  khac: '',
  hs1: [emptyCell(true), emptyCell(), emptyCell(), ...(['toan', 'van', 'anh'].includes(mon) ? [emptyCell(true)] : [])],
  cd: null,
  hs2: [emptyCell()],
  hs3: emptyCell(true),
  hk1: '',
  ...patch,
})

/** Older saved boards have no chuyên đề slot. */
export function normalizeRow(row: BoardRow): BoardRow {
  return { ...row, cd: row.cd ?? null, hs1: row.hs1.slice(0, MAX_HS1), hs2: row.hs2.slice(0, MAX_HS2) }
}

/** Names as written in the class sheet. */
export const SHEET_NAMES: Record<string, string> = {
  toan: 'Toán',
  van: 'Văn',
  anh: 'Anh',
  sinh: 'Sinh',
  su: 'Sử',
  hoa: 'Hoá',
  ly: 'Lý',
  tinhoc: 'Tin',
  qpan: 'GDQP',
  dia: 'Địa',
  ktpl: 'KTPL',
  congnghe: 'Công nghệ',
  gdcd: 'GDCD',
  lsdl: 'LS&ĐL',
  khtn: 'KHTN',
}

const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9&]/g, '')

const NAME_ALIASES: [string, string[]][] = [
  ['toan', ['toan']],
  ['van', ['van', 'nguvan']],
  ['anh', ['anh', 'tienganh', 'ngoaingu', 'ngoaingu1']],
  ['sinh', ['sinh', 'sinhhoc']],
  ['su', ['su', 'lichsu']],
  ['hoa', ['hoa', 'hoahoc']],
  ['ly', ['ly', 'li', 'vatly', 'vatli']],
  ['tinhoc', ['tin', 'tinhoc']],
  ['qpan', ['gdqp', 'qp', 'gdqpan', 'quocphong', 'gdquocphongvaanninh']],
  ['dia', ['dia', 'diali', 'dialy']],
  ['ktpl', ['ktpl', 'gdktpl', 'gdkt&pl', 'giaoduckinhtevaphapluat']],
  ['congnghe', ['cn', 'congnghe']],
  ['gdcd', ['gdcd', 'giaoduccongdan']],
  ['lsdl', ['ls&dl', 'lsdl', 'lichsuvadiali', 'lichsuvadialy']],
  ['khtn', ['khtn', 'khoahoctunhien']],
]

/** Maps a subject name from a spreadsheet ("Hoá", "Ngữ văn", "GDQP"…) to a subject id. */
export function subjectIdFromName(name: string): string | null {
  const key = fold(name)
  if (!key) return null
  return NAME_ALIASES.find(([, aliases]) => aliases.includes(key))?.[0] ?? null
}

export const DEFAULT_SUBJECTS = {
  thpt: ['toan', 'van', 'anh', 'su', 'ly', 'hoa', 'sinh', 'tinhoc', 'qpan'],
  thcs: ['van', 'toan', 'anh', 'gdcd', 'lsdl', 'khtn', 'congnghe', 'tinhoc'],
}

const value = (cell: Cell) => {
  const parsed = parseScore(cell.v)
  return parsed.status === 'valid' ? parsed.value : null
}

export type RowStats = {
  invalid: boolean
  hasScores: boolean
  /** Like the spreadsheet: average of every filled cell, final or planned. */
  termAvg: number | null
  /** ĐTB cả năm when HK I is known (term = hk2). */
  yearAvg: number | null
  /** The average that counts for classification. */
  avg: number | null
  finalSum: number
  finalWeight: number
  openWeight: number
  totalWeight: number
  hk1: number | null
}

export function rowStats(row: BoardRow, term: Term): RowStats {
  const cells = [
    ...row.hs1.map((c) => ({ c, w: 1 })),
    ...(row.cd ? [{ c: row.cd, w: 1 }] : []),
    ...row.hs2.map((c) => ({ c, w: 2 })),
    { c: row.hs3, w: 3 },
  ]
  let invalid = false
  let filledSum = 0
  let filledWeight = 0
  let finalSum = 0
  let finalWeight = 0
  let openWeight = 0
  for (const { c, w } of cells) {
    if (parseScore(c.v).status === 'invalid') invalid = true
    const v = value(c)
    if (v === null) {
      openWeight += w
      continue
    }
    filledSum += v * w
    filledWeight += w
    if (c.plan) openWeight += w
    else {
      finalSum += v * w
      finalWeight += w
    }
  }
  const hk1State = parseScore(row.hk1)
  if (hk1State.status === 'invalid') invalid = true
  const hk1 = term === 'hk2' && hk1State.status === 'valid' ? hk1State.value : null
  const rawTerm = filledWeight ? filledSum / filledWeight : null
  const termAvg = rawTerm === null ? null : roundAverage(rawTerm)
  const yearAvg = hk1 !== null && termAvg !== null ? roundAverage((hk1 + 2 * termAvg) / 3) : null
  return {
    invalid,
    hasScores: filledWeight > 0,
    termAvg,
    yearAvg,
    avg: term === 'hk2' && hk1 !== null ? yearAvg : termAvg,
    finalSum,
    finalWeight,
    openWeight,
    totalWeight: finalWeight + openWeight,
    hk1,
  }
}

/**
 * The average score needed on every cell that isn't final yet (planned or
 * empty) for the subject's counted average to reach `target`.
 * -Infinity: already reached for sure. Infinity: no open cells and not reached.
 */
export function needOnOpen(stats: RowStats, target: number): number {
  const termTarget = stats.hk1 !== null ? (3 * target - stats.hk1) / 2 : target
  if (stats.openWeight === 0) {
    if (!stats.finalWeight) return Infinity
    return roundAverage(stats.finalSum / stats.finalWeight) >= termTarget ? -Infinity : Infinity
  }
  const x = (termTarget * stats.totalWeight - stats.finalSum) / stats.openWeight
  return Math.round(x * 100) / 100
}

/** Rounds a target score up to a quarter point, the finest step teachers usually grade in. */
const ceilQuarter = (x: number) => Math.ceil(x * 4 - 1e-9) / 4

/**
 * Fills every empty target cell ("phấn đấu") of a subject with one score high
 * enough for the sheet's TBHK (or the year average in HK II) to reach `target`,
 * and never lower than the target itself or the subject's current average.
 */
export function fillPlan(row: BoardRow, target: number, term: Term): { row: BoardRow; filled: number; reachable: boolean } {
  const slots = [...row.hs1, ...(row.cd ? [row.cd] : []), ...row.hs2, row.hs3]
  const weights = [...row.hs1.map(() => 1), ...(row.cd ? [1] : []), ...row.hs2.map(() => 2), 3]
  let sum = 0
  let weight = 0
  let finalSum = 0
  let finalWeight = 0
  let openWeight = 0
  slots.forEach((cell, i) => {
    const v = value(cell)
    if (v !== null) {
      sum += v * weights[i]
      weight += weights[i]
      if (!cell.plan) {
        finalSum += v * weights[i]
        finalWeight += weights[i]
      }
    } else if (cell.plan) openWeight += weights[i]
  })
  if (!openWeight) return { row, filled: 0, reachable: true }

  const hk1 = parseScore(row.hk1)
  const termTarget = term === 'hk2' && hk1.status === 'valid' ? (3 * target - hk1.value) / 2 : target
  const needed = (termTarget * (weight + openWeight) - sum) / openWeight
  // Never aim below the current average, so a target cell can't pull the TBHK down.
  const level = weight ? sum / weight : finalWeight ? finalSum / finalWeight : 0
  const score = Math.min(10, ceilQuarter(Math.max(needed, termTarget, level)))
  const text = String(score)
  const fill = (cell: Cell): Cell => (cell.plan && value(cell) === null ? { ...cell, v: text } : cell)
  return {
    row: { ...row, hs1: row.hs1.map(fill), cd: row.cd ? fill(row.cd) : null, hs2: row.hs2.map(fill), hs3: fill(row.hs3) },
    filled: slots.filter((c) => c.plan && value(c) === null).length,
    reachable: needed <= 10,
  }
}

export type Rank = 'tot' | 'kha' | 'dat' | 'chua-dat'

export const RANK_LABELS: Record<Rank, string> = {
  tot: 'Tốt',
  kha: 'Khá',
  dat: 'Đạt',
  'chua-dat': 'Chưa đạt',
}

export type Overview = {
  counted: number
  rank: Rank | null
  title: 'xuat-sac' | 'gioi' | null
  n9: number
  n8: number
  n65: number
  below65: number[]
  min: number | null
}

export function overview(avgs: number[], commentsOk: boolean, conductOk: boolean): Overview {
  const counted = avgs.length
  const n9 = avgs.filter((a) => a >= 9).length
  const n8 = avgs.filter((a) => a >= 8).length
  const n65 = avgs.filter((a) => a >= 6.5).length
  const n5 = avgs.filter((a) => a >= 5).length
  const min = counted ? Math.min(...avgs) : null
  const below65 = avgs.map((a, i) => (a < 6.5 ? i : -1)).filter((i) => i >= 0)

  let rank: Rank | null = null
  if (counted >= 6 && min !== null) {
    if (commentsOk && min >= 6.5 && n8 >= 6) rank = 'tot'
    else if (commentsOk && min >= 5 && n65 >= 6) rank = 'kha'
    else if (n5 >= 6 && min >= 3.5) rank = 'dat'
    else rank = 'chua-dat'
  }
  const title = rank === 'tot' && conductOk ? (n9 >= 6 ? 'xuat-sac' : 'gioi') : null
  return { counted, rank, title, n9, n8, n65, below65, min }
}

export type PlanRow = { id: string; target: number; need: number; top: boolean }

/**
 * Picks the 6 subjects where the goal threshold (8,0 for Giỏi, 9,0 for Xuất sắc)
 * is easiest to reach; every other subject only needs 6,5.
 */
export function goalPlan(rows: { id: string; stats: RowStats }[], goal: Goal): { rows: PlanRow[]; feasible: boolean } {
  const top = goal === 'hsxs' ? 9 : 8
  const ranked = rows
    .map((r) => ({ id: r.id, stats: r.stats, needTop: needOnOpen(r.stats, top) }))
    .sort((a, b) => (a.needTop === b.needTop ? 0 : a.needTop < b.needTop ? -1 : 1))
  const topIds = new Set(ranked.slice(0, 6).map((r) => r.id))
  const plan = ranked.map((r) => {
    const isTop = topIds.has(r.id)
    const target = isTop ? top : 6.5
    return { id: r.id, target, need: isTop ? r.needTop : needOnOpen(r.stats, 6.5), top: isTop }
  })
  const feasible = rows.length >= 6 && plan.every((p) => p.need <= 10)
  return { rows: plan, feasible }
}

// Example board from a real class spreadsheet (HK I): yellow cells final, green/pink planned.
const c = (v: string, plan = false): Cell => ({ v, plan })
export function exampleRows(): BoardRow[] {
  return [
    newBoardRow('toan', { hs1: [c('9', true), c('9'), c('9'), c('9', true)], hs2: [c('9')], hs3: c('9', true) }),
    newBoardRow('van', { hs1: [c('10', true), c('8'), c('10'), c('9', true)], hs2: [c('8')], hs3: c('8', true) }),
    newBoardRow('anh', { hs1: [c('10', true), c('8'), c('9'), c('10', true)], hs2: [c('7.5')], hs3: c('9', true) }),
    newBoardRow('sinh', { hs1: [c('10', true), c('9'), c('9', true)], hs2: [c('9.3')], hs3: c('9', true) }),
    newBoardRow('su', { hs1: [c('9', true), c('10'), c('8', true)], hs2: [c('9')], hs3: c('9', true) }),
    newBoardRow('hoa', { hs1: [c('9', true), c('8'), c('9', true)], hs2: [c('6.3')], hs3: c('8.5', true) }),
    newBoardRow('ly', { hs1: [c('9', true), c('8'), c('9', true)], hs2: [c('10')], hs3: c('9.3', true) }),
    newBoardRow('tinhoc', { hs1: [c('9', true), c('10'), c('10')], hs2: [c('9.3')], hs3: c('9.2', true) }),
    newBoardRow('qpan', { hs1: [c('10'), c('9', true)], hs2: [c('9')], hs3: c('9', true) }),
  ]
}
