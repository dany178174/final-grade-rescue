import { useEffect, useRef, useState, type ReactNode } from 'react'
import { primaryButton } from '../lib/ui'

// Chrome/Edge/Samsung Internet fire this event when the site can be installed.
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

const COPY = {
  en: {
    button: '📲 Install app',
    title: 'Add to your Home Screen',
    steps: ['Open this page in Safari.', 'Tap the Share button (the square with an arrow).', 'Choose “Add to Home Screen”, then “Add”.'],
    done: 'Got it',
  },
  vi: {
    button: '📲 Cài app',
    title: 'Thêm vào màn hình chính',
    steps: ['Mở trang này bằng Safari.', 'Bấm nút Chia sẻ (hình vuông có mũi tên lên).', 'Chọn “Thêm vào MH chính”, rồi bấm “Thêm”.'],
    done: 'Đã hiểu',
  },
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  const ua = navigator.userAgent
  // iPadOS reports itself as a Mac, so also check for touch.
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

export function InstallButton({
  lang,
  className,
  separator,
}: {
  lang: 'en' | 'vi'
  className: string
  /** Rendered before the button, only when the button is shown. */
  separator?: ReactNode
}) {
  const t = COPY[lang]
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone)
  const [ios] = useState(isIos)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as InstallPromptEvent)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed || (!promptEvent && !ios)) return null

  const install = async () => {
    if (promptEvent) {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice
      if (choice.outcome === 'accepted') setInstalled(true)
      setPromptEvent(null)
    } else {
      dialogRef.current?.showModal()
    }
  }

  return (
    <>
      {separator}
      <button type="button" onClick={install} className={className}>
        {t.button}
      </button>
      {ios && (
        <dialog
          ref={dialogRef}
          aria-labelledby="install-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) dialogRef.current?.close()
          }}
          className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-white/15 bg-[#12142e]/95 p-6 text-left text-white shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] backdrop:bg-[#05061a]/70 backdrop:backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <img src="/apple-touch-icon.png" alt="" className="size-12 rounded-xl" />
            <h2 id="install-title" className="text-lg font-semibold">
              {t.title}
            </h2>
          </div>
          <ol className="mt-4 space-y-2.5 text-sm text-white/80">
            {t.steps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => dialogRef.current?.close()} className={`${primaryButton} mt-6 w-full`}>
            {t.done}
          </button>
        </dialog>
      )}
    </>
  )
}
