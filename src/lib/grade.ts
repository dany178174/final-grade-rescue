export type FieldKey = 'current' | 'desired' | 'weight'

export type GradeInputs = Record<FieldKey, string>

export const EMPTY_INPUTS: GradeInputs = { current: '', desired: '', weight: '' }

export type FieldState =
  | { status: 'empty' }
  | { status: 'invalid'; error: string }
  | { status: 'valid'; value: number }

export type TierId = 'secured' | 'easy' | 'focus' | 'cram' | 'impossible'

export type Outcome =
  | { status: 'incomplete'; hasErrors: boolean }
  | { status: 'ready'; score: number; tier: TierId; current: number; desired: number; weight: number }

export const TIER_MESSAGES: Record<TierId, string> = {
  secured: "You've already secured this grade! Just don't skip the exam.",
  easy: 'You got this! Easy win.',
  focus: "Time to lock in and study. It's totally doable.",
  cram: 'Cramming time! Every point counts.',
  impossible: 'Mathematically impossible. Time to negotiate for extra credit!',
}

/**
 * Keeps only what can form a 0-100 percentage while typing: digits and one
 * decimal point (commas from some mobile keyboards become points), at most
 * 3 integer digits and 2 decimals.
 */
export function sanitizePercentInput(raw: string): string {
  const cleaned = raw.replace(/,/g, '.').replace(/[^\d.]/g, '')
  const dot = cleaned.indexOf('.')
  if (dot === -1) return cleaned.slice(0, 3)
  const whole = cleaned.slice(0, dot).slice(0, 3)
  const fraction = cleaned.slice(dot + 1).replace(/\./g, '').slice(0, 2)
  return `${whole}.${fraction}`
}

export function parsePercent(raw: string, { mustBePositive = false } = {}): FieldState {
  const value = Number(raw)
  // A lone "." is someone mid-way through typing ".5", not an error.
  if (raw.trim() === '' || Number.isNaN(value)) return { status: 'empty' }
  if (value < 0 || value > 100) return { status: 'invalid', error: 'Enter a number from 0 to 100.' }
  if (mustBePositive && value === 0) return { status: 'invalid', error: 'The final has to be worth more than 0%.' }
  return { status: 'valid', value }
}

export function requiredFinalScore(current: number, desired: number, weight: number): number {
  const w = weight / 100
  return (desired - current * (1 - w)) / w
}

export function tierFor(score: number): TierId {
  if (score <= 0) return 'secured'
  if (score <= 80) return 'easy'
  if (score <= 95) return 'focus'
  if (score <= 100) return 'cram'
  return 'impossible'
}

export function evaluateGrades(inputs: GradeInputs): { fields: Record<FieldKey, FieldState>; outcome: Outcome } {
  const fields = {
    current: parsePercent(inputs.current),
    desired: parsePercent(inputs.desired),
    weight: parsePercent(inputs.weight, { mustBePositive: true }),
  }
  const { current, desired, weight } = fields

  if (current.status !== 'valid' || desired.status !== 'valid' || weight.status !== 'valid') {
    const hasErrors = Object.values(fields).some((f) => f.status === 'invalid')
    return { fields, outcome: { status: 'incomplete', hasErrors } }
  }

  // Round to 2 decimals so floating-point noise (e.g. 80.00000000000001)
  // can't push a score across a tier boundary, and so the tier always
  // matches the number on screen.
  const raw = requiredFinalScore(current.value, desired.value, weight.value)
  const score = Math.round(raw * 100) / 100
  return {
    fields,
    outcome: {
      status: 'ready',
      score,
      tier: tierFor(score),
      current: current.value,
      desired: desired.value,
      weight: weight.value,
    },
  }
}

const percentFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export function formatPercent(value: number): string {
  return percentFormat.format(value)
}

/** "a" or "an" based on how the number is read aloud: an 8, an 11, an 18, an 80-something. */
export function articleFor(value: number): 'a' | 'an' {
  const whole = Math.floor(Math.abs(value)).toString()
  const leadingGroup = whole.slice(0, whole.length % 3 || 3)
  return leadingGroup.startsWith('8') || leadingGroup === '11' || leadingGroup === '18' ? 'an' : 'a'
}

/** The overall course grade you end up with for a given final exam score. */
export function courseGradeWith(current: number, weight: number, finalScore: number): number {
  const w = weight / 100
  return current * (1 - w) + finalScore * w
}

export function gradeParams(inputs: GradeInputs): Record<'c' | 'd' | 'w', string> {
  return { c: inputs.current, d: inputs.desired, w: inputs.weight }
}

export function inputsFromParams(params: URLSearchParams): GradeInputs {
  return {
    current: sanitizePercentInput(params.get('c') ?? ''),
    desired: sanitizePercentInput(params.get('d') ?? ''),
    weight: sanitizePercentInput(params.get('w') ?? ''),
  }
}
