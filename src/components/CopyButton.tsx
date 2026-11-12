import { useEffect, useState } from 'react'
import { copyText, smallButton } from '../lib/ui'
import { CheckIcon, CopyIcon } from './icons'

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      className={`${smallButton} ${copied ? 'border-emerald-400/40 text-emerald-300' : ''}`}
      onClick={async () => setCopied(await copyText(text))}
      aria-live="polite"
    >
      {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      {copied ? 'Copied!' : label}
    </button>
  )
}
