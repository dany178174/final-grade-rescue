import type { KeyboardEventHandler, Ref } from 'react'
import { sanitizePercentInput } from '../lib/grade'

type PercentInputProps = {
  id: string
  label: string
  hint: string
  placeholder: string
  value: string
  error?: string
  enterKeyHint: 'next' | 'done'
  onChange: (value: string) => void
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>
  ref?: Ref<HTMLInputElement>
}

export function PercentInput({
  id,
  label,
  hint,
  placeholder,
  value,
  error,
  enterKeyHint,
  onChange,
  onKeyDown,
  ref,
}: PercentInputProps) {
  const descriptionId = `${id}-description`
  const invalid = Boolean(error)

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-white/85">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          name={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint={enterKeyHint}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(sanitizePercentInput(e.target.value))}
          onKeyDown={onKeyDown}
          aria-invalid={invalid || undefined}
          aria-describedby={descriptionId}
          className={[
            'h-14 w-full rounded-2xl border bg-white/[0.06] pr-11 pl-4 text-lg font-medium text-white tabular-nums',
            'placeholder:font-normal placeholder:text-white/30 transition outline-none',
            'focus:bg-white/[0.09] focus:ring-4',
            invalid
              ? 'border-red-400/70 focus:border-red-400 focus:ring-red-500/20'
              : 'border-white/15 hover:border-white/25 focus:border-fuchsia-300/60 focus:ring-fuchsia-500/20',
          ].join(' ')}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-lg text-white/40"
        >
          %
        </span>
      </div>
      <p id={descriptionId} className={`mt-1.5 text-xs ${invalid ? 'text-red-300' : 'text-white/50'}`}>
        {error ?? hint}
      </p>
    </div>
  )
}
