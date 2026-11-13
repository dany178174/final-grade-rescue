import { sanitizeScoreInput } from '../../lib/vnGrade'

type ScoreInputProps = {
  id: string
  label: string
  hint?: string
  error?: string
  value: string
  placeholder?: string
  compact?: boolean
  onChange: (value: string) => void
}

/** A 0–10 score field. Accepts "9,8" or "9.8"; an empty field means "not taken yet". */
export function ScoreInput({ id, label, hint, error, value, placeholder = 'Chưa có', compact, onChange }: ScoreInputProps) {
  const invalid = Boolean(error)
  const describedBy = hint || error ? `${id}-description` : undefined
  return (
    <div>
      <label
        htmlFor={id}
        className={compact ? 'mb-1.5 block text-xs font-medium text-white/65' : 'mb-2 block text-sm font-medium text-white/85'}
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value.replace('.', ',')}
        placeholder={placeholder}
        onChange={(e) => onChange(sanitizeScoreInput(e.target.value))}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={[
          'w-full rounded-2xl border bg-white/[0.06] font-medium text-white tabular-nums transition outline-none',
          'placeholder:font-normal placeholder:text-white/30 focus:bg-white/[0.09] focus:ring-4',
          compact ? 'h-12 px-3 text-center text-lg' : 'h-14 px-4 text-lg',
          invalid
            ? 'border-red-400/70 focus:border-red-400 focus:ring-red-500/20'
            : 'border-white/15 hover:border-white/25 focus:border-accent-300/60 focus:ring-accent-500/20',
        ].join(' ')}
      />
      {(hint || error) && (
        <p id={describedBy} className={`mt-1.5 text-xs ${invalid ? 'text-red-300' : 'text-white/50'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
