const BUY_ME_A_COFFEE_URL = 'https://dungletien.gumroad.com/l/graderescue-coffee'

export function Footer() {
  return (
    <footer className="mt-8 flex flex-col items-center gap-1.5 text-sm text-white/55 sm:flex-row sm:gap-3">
      <p>Built to save your GPA.</p>
      <span aria-hidden className="hidden text-white/25 sm:inline">
        •
      </span>
      <a
        href={BUY_ME_A_COFFEE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md font-medium text-white/75 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-pink-300/70 focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 focus-visible:outline-none"
      >
        Buy me a coffee ☕
      </a>
    </footer>
  )
}
