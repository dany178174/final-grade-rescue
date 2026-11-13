export const primaryButton =
  'inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent-500 px-5 text-sm font-semibold text-on-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_10px_28px_-12px_color-mix(in_oklab,var(--color-accent-500)_85%,transparent)] transition hover:bg-accent-400 focus-visible:ring-4 focus-visible:ring-accent-400/35 focus-visible:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-white/35 disabled:shadow-none disabled:hover:bg-white/[0.06]'

export const secondaryButton =
  'inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-white/85 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white focus-visible:ring-4 focus-visible:ring-accent-400/25 focus-visible:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-white/[0.04]'

export const smallButton =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white focus-visible:ring-4 focus-visible:ring-accent-400/25 focus-visible:outline-none active:scale-[0.98]'

export const selectableCard = (selected: boolean) =>
  [
    'rounded-xl border text-left transition focus-visible:ring-4 focus-visible:ring-accent-400/25 focus-visible:outline-none active:scale-[0.99]',
    selected
      ? 'border-accent-400/70 bg-accent-500/[0.14] shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-accent-400)_30%,transparent),0_8px_24px_-12px_color-mix(in_oklab,var(--color-accent-500)_60%,transparent)]'
      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]',
  ].join(' ')

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older browsers and some in-app webviews block the async clipboard API.
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  }
}
