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

export type Cell = { v: string; plan: boolean }
export type BoardRow = { id: string; mon: string; khac: string; hs1: Cell[]; hs2: Cell[]; hs3: Cell; hk1: string }
export type Term = 'hk1' | 'hk2'
export type Goal = 'hsg' | 'hsxs'

export type Board = {
  grade: number
  term: Term
  goal: Goal
  commentsOk: boolean
  conductOk: boolean
  rows: BoardRow[]
}

export const MAX_HS1 = 8
export const MAX_HS2 = 3

export const emptyCell = (): Cell => ({ v: '', plan: false })

export const newBoardRow = (mon = '', patch: Partial<BoardRow> = {}): BoardRow => ({
  id: Math.random().toString(36).slice(2, 8),
  mon,
  khac: '',
  hs1: [emptyCell(), emptyCell(), emptyCell()],
  hs2: [emptyCell()],
  hs3: emptyCell(),
  hk1: '',
  ...patch,
})

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
