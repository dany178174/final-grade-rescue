// Vietnamese grading under Thông tư 22/2021/TT-BGDĐT (lower and upper secondary):
//   ĐTB môn học kì = (tổng điểm ĐGTX + 2 × điểm giữa kì + 3 × điểm cuối kì) ÷ (số bài ĐGTX + 5)
//   ĐTB môn cả năm = (ĐTB học kì I + 2 × ĐTB học kì II) ÷ 3
// Scores are on a 0–10 scale and averages are rounded to one decimal place.

import type { FieldState, TierId } from './grade'

export type VnMode = 'hk' | 'nam'

export type VnInputs = {
  mode: VnMode
  /** Number of regular assessments (ĐGTX) this semester: 2, 3 or 4. */
  n: number
  tx: string[]
  gk: string
  ck: string
  hk1: string
  target: string
}

export const MAX_TX = 4

export const EMPTY_VN_INPUTS: VnInputs = {
  mode: 'hk',
  n: 3,
  tx: ['', '', '', ''],
  gk: '',
  ck: '',
  hk1: '',
  target: '',
}

export const TARGET_PRESETS: { value: string; label: string }[] = [
  { value: '9', label: '9,0' },
  { value: '8', label: '8,0 · mức Tốt' },
  { value: '6.5', label: '6,5 · mức Khá' },
  { value: '5', label: '5,0 · mức Đạt' },
]

export const VN_TIER_MESSAGES: Record<TierId, string> = {
  secured: 'Bạn đã chắc chắn đạt mục tiêu! Chỉ cần đừng bỏ bài kiểm tra.',
  easy: 'Trong tầm tay! Ôn đều đặn là ổn.',
  focus: 'Đến lúc tập trung ôn thật sự. Hoàn toàn làm được!',
  cram: 'Cần gần như tuyệt đối. Từng 0,25 điểm đều quý!',
  impossible: 'Về mặt toán học là không thể đạt. Hãy đặt mục tiêu mới vừa sức hơn.',
}

/** Digits and one decimal separator (comma or point), up to 2 integer digits and 2 decimals. */
export function sanitizeScoreInput(raw: string): string {
  const cleaned = raw.replace(/,/g, '.').replace(/[^\d.]/g, '')
  const dot = cleaned.indexOf('.')
  if (dot === -1) return cleaned.slice(0, 2)
  const whole = cleaned.slice(0, dot).slice(0, 2)
  const fraction = cleaned.slice(dot + 1).replace(/\./g, '').slice(0, 2)
  return `${whole}.${fraction}`
}

export function parseScore(raw: string): FieldState {
  const value = Number(raw)
  if (raw.trim() === '' || Number.isNaN(value)) return { status: 'empty' }
  if (value < 0 || value > 10) return { status: 'invalid', error: 'Nhập điểm từ 0 đến 10.' }
  return { status: 'valid', value }
}

export type VnItem = { key: string; label: string; short: string; weight: number; state: FieldState }

export function vnItems(inputs: VnInputs): VnItem[] {
  if (inputs.mode === 'nam') {
    return [
      { key: 'hk1', label: 'ĐTB học kì I', short: 'học kì I', weight: 1, state: parseScore(inputs.hk1) },
      { key: 'hk2', label: 'ĐTB học kì II', short: 'học kì II', weight: 2, state: { status: 'empty' } },
    ]
  }
  const tx = Array.from({ length: inputs.n }, (_, i) => ({
    key: `tx${i + 1}`,
    label: `Thường xuyên ${i + 1}`,
    short: `bài thường xuyên ${i + 1}`,
    weight: 1,
    state: parseScore(inputs.tx[i] ?? ''),
  }))
  return [
    ...tx,
    { key: 'gk', label: 'Giữa kì', short: 'bài giữa kì', weight: 2, state: parseScore(inputs.gk) },
    { key: 'ck', label: 'Cuối kì', short: 'bài cuối kì', weight: 3, state: parseScore(inputs.ck) },
  ]
}

export type VnOutcome =
  | { status: 'incomplete'; hasErrors: boolean }
  | {
      status: 'ready'
      /** Average score needed on every remaining assessment. */
      score: number
      tier: TierId
      target: number
      knownSum: number
      totalWeight: number
      remainingWeight: number
      remaining: VnItem[]
      known: VnItem[]
    }
  | { status: 'complete'; average: number; target: number; reached: boolean; knownSum: number; totalWeight: number }

export function vnTierFor(score: number): TierId {
  if (score <= 0) return 'secured'
  if (score <= 8) return 'easy'
  if (score <= 9.5) return 'focus'
  if (score <= 10) return 'cram'
  return 'impossible'
}

/** Rounds like report cards do: one decimal place, half up. */
export function roundAverage(value: number): number {
  return Math.round(value * 10 + 1e-9) / 10
}

export function evaluateVn(inputs: VnInputs): { items: VnItem[]; targetState: FieldState; outcome: VnOutcome } {
  const items = vnItems(inputs)
  const targetState = parseScore(inputs.target)
  const hasErrors = targetState.status === 'invalid' || items.some((i) => i.state.status === 'invalid')
  const yearNeedsHk1 = inputs.mode === 'nam' && items[0].state.status !== 'valid'

  if (hasErrors || targetState.status !== 'valid' || yearNeedsHk1) {
    return { items, targetState, outcome: { status: 'incomplete', hasErrors } }
  }

  const target = targetState.value
  const known = items.filter((i) => i.state.status === 'valid')
  const remaining = items.filter((i) => i.state.status === 'empty')
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0)
  const knownSum = known.reduce((sum, i) => sum + (i.state.status === 'valid' ? i.state.value * i.weight : 0), 0)
  const remainingWeight = remaining.reduce((sum, i) => sum + i.weight, 0)

  if (remainingWeight === 0) {
    const average = roundAverage(knownSum / totalWeight)
    return {
      items,
      targetState,
      outcome: { status: 'complete', average, target, reached: average >= target, knownSum, totalWeight },
    }
  }

  const raw = (target * totalWeight - knownSum) / remainingWeight
  const score = Math.round(raw * 100) / 100
  return {
    items,
    targetState,
    outcome: {
      status: 'ready',
      score,
      tier: vnTierFor(score),
      target,
      knownSum,
      totalWeight,
      remainingWeight,
      remaining,
      known,
    },
  }
}

/** The semester/year average if every remaining assessment scores `score`. */
export function averageWith(outcome: { knownSum: number; totalWeight: number; remainingWeight: number }, score: number) {
  return roundAverage((outcome.knownSum + score * outcome.remainingWeight) / outcome.totalWeight)
}

const viFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })

export function formatVi(value: number): string {
  return viFormat.format(value)
}

const averageFormat = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Averages are written with one decimal on Vietnamese report cards: "8,0", "7,8". */
export function formatAverage(value: number): string {
  return averageFormat.format(value)
}

/** Names the next assessment, e.g. "bài kiểm tra cuối kì", for headings and AI prompts. */
export function upcomingExam(remaining: VnItem[]): { name: string; short: string } {
  const keys = remaining.map((r) => r.key)
  if (keys.includes('hk2')) return { name: 'học kì II', short: 'học kì 2' }
  if (keys.includes('ck')) return { name: 'bài kiểm tra cuối kì', short: 'cuối kì' }
  if (keys.includes('gk')) return { name: 'bài kiểm tra giữa kì', short: 'giữa kì' }
  return { name: 'các bài kiểm tra thường xuyên (miệng, 15 phút)', short: 'kiểm tra 15 phút' }
}

// URL encoding, so the calculator and plan pages can be shared and reloaded.

export const VN_CALC_KEYS = ['mode', 'n', 'tx', 'gk', 'ck', 'hk1', 'muc'] as const
/** lớp, môn, môn khác, chủ đề, cách học, số ngày còn lại */
export const VN_PLAN_KEYS = ['lop', 'mon', 'khac', 'cd', 'cach', 'ngay'] as const

export function vnParams(inputs: VnInputs): Record<string, string | undefined> {
  if (inputs.mode === 'nam') return { mode: 'nam', hk1: inputs.hk1, muc: inputs.target }
  return {
    mode: 'hk',
    n: String(inputs.n),
    tx: inputs.tx.slice(0, inputs.n).join('_').replace(/_+$/, '') || undefined,
    gk: inputs.gk,
    ck: inputs.ck,
    muc: inputs.target,
  }
}

export function vnInputsFromParams(params: URLSearchParams): VnInputs {
  const n = Number(params.get('n'))
  const tx = (params.get('tx') ?? '').split('_').map(sanitizeScoreInput)
  return {
    mode: params.get('mode') === 'nam' ? 'nam' : 'hk',
    n: n >= 2 && n <= MAX_TX ? n : EMPTY_VN_INPUTS.n,
    tx: Array.from({ length: MAX_TX }, (_, i) => tx[i] ?? ''),
    gk: sanitizeScoreInput(params.get('gk') ?? ''),
    ck: sanitizeScoreInput(params.get('ck') ?? ''),
    hk1: sanitizeScoreInput(params.get('hk1') ?? ''),
    target: sanitizeScoreInput(params.get('muc') ?? ''),
  }
}
