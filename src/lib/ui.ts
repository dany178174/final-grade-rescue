export const primaryButton =
  'inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 px-5 text-sm font-semibold text-white shadow-lg shadow-purple-950/50 transition hover:brightness-110 focus-visible:ring-4 focus-visible:ring-fuchsia-500/30 focus-visible:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100'

export const secondaryButton =
  'inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-5 text-sm font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/[0.1] focus-visible:ring-4 focus-visible:ring-fuchsia-500/25 focus-visible:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/15 disabled:hover:bg-white/[0.06]'

export const smallButton =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/[0.1] focus-visible:ring-4 focus-visible:ring-fuchsia-500/25 focus-visible:outline-none active:scale-[0.98]'

export const selectableCard = (selected: boolean) =>
  [
    'rounded-2xl border text-left transition focus-visible:ring-4 focus-visible:ring-fuchsia-500/25 focus-visible:outline-none active:scale-[0.99]',
    selected
      ? 'border-fuchsia-300/60 bg-white/[0.12] shadow-[0_0_0_1px_rgb(240_171_252/0.25),0_8px_30px_-8px_rgb(192_38_211/0.45)]'
      : 'border-white/12 bg-white/[0.05] hover:border-white/25 hover:bg-white/[0.08]',
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
