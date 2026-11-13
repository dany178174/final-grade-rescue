import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CopyButton } from '../components/CopyButton'
import { EN_DECK_LABELS, VI_DECK_LABELS } from '../components/flashcards/deckLabels'
import { StudyDeck } from '../components/flashcards/StudyDeck'
import { ArrowLeftIcon, ExternalLinkIcon } from '../components/icons'
import { SearchLink } from '../components/plan/ResourceCard'
import { AI_TOOLS } from '../data/prompts'
import { getSubject } from '../data/subjects'
import { getVnSubject } from '../data/vn/subjects'
import {
  CARD_COUNTS,
  EXAMPLE_DECK,
  EXAMPLE_DECK_VI,
  fileNameFor,
  flashcardPrompt,
  flashcardPromptVi,
  parseCards,
  QUIZLET_CREATE_URL,
  quizletSearch,
  toAnkiFile,
  toQuizletText,
} from '../lib/flashcards'
import { hrefFor } from '../lib/router'
import { copyText, primaryButton, secondaryButton, selectableCard, smallButton } from '../lib/ui'
import { VN_CALC_KEYS, VN_PLAN_KEYS } from '../lib/vnGrade'

export type Lang = 'en' | 'vi'

const PLAN_KEYS = ['c', 'd', 'w', 's', 'o', 't', 'l', 'days'] as const

const COPY = {
  en: {
    eyebrow: '🃏 Flashcard Maker',
    title: 'Turn any topic into a Quizlet set',
    intro:
      'AI writes the cards, you study them right here, then send them to Quizlet or Anki with one paste. Takes about 2 minutes.',
    step1: 'Get your cards from AI',
    step1Sub: 'Tell us the topic, copy the prompt, paste it into any AI chat.',
    topic: 'Topic',
    topicPlaceholder: 'e.g. the French Revolution',
    howMany: 'How many cards?',
    cards: (n: number) => `${n} cards`,
    yourPrompt: 'Your prompt',
    copyPrompt: 'Copy prompt',
    copied: 'Copied!',
    pasteInto: 'Paste into:',
    borrow: 'Or borrow a set other students already made:',
    on: 'on',
    step2: 'Paste the cards here',
    step2Sub: "Copy the AI's whole answer and paste it below. Or type your own: one card per line, term | definition.",
    textLabel: 'Flashcards, one per line',
    textPlaceholder:
      "Mitochondria | The organelle that makes most of the cell's ATP\nATP | The molecule cells use to store and move energy",
    ready: (n: number) => `✓ ${n} card${n === 1 ? '' : 's'} ready`,
    none: 'No cards yet',
    skipped: (n: number) => `· ${n} line${n === 1 ? '' : 's'} skipped (no “|” between term and definition)`,
    example: 'Try an example',
    clear: 'Clear',
    step3: 'Study them now',
    step3Sub: 'Flip each card, then be honest: got it, or still learning?',
    step4: 'Send them to Quizlet or Anki',
    step4Sub: 'Keep studying on your phone with spaced repetition.',
    quizletSteps: [
      'Tap “Copy for Quizlet”.',
      <>
        On Quizlet, create a new flashcard set and choose <span className="text-white">Import</span>.
      </>,
      'Paste. Keep “Tab” and “New line” selected, then import.',
    ] as ReactNode[],
    copyQuizlet: 'Copy for Quizlet',
    openQuizlet: 'Open Quizlet',
    ankiSteps: [
      'Download the file.',
      <>
        In Anki, choose <span className="text-white">File → Import</span> and pick the file.
      </>,
      'Check the deck name, then import.',
    ] as ReactNode[],
    downloadAnki: '⬇ Download for Anki',
    warning: 'Always skim AI-made cards against your notes. AI can get a detail wrong, and a wrong flashcard is worse than none.',
  },
  vi: {
    eyebrow: '🃏 Tạo thẻ ghi nhớ',
    title: 'Biến chủ đề bất kì thành bộ thẻ Quizlet',
    intro:
      'AI soạn thẻ, bạn học ngay tại đây, rồi đưa sang Quizlet hoặc Anki chỉ bằng một lần dán. Mất khoảng 2 phút.',
    step1: 'Nhờ AI soạn thẻ',
    step1Sub: 'Nhập chủ đề, sao chép câu lệnh rồi dán vào ứng dụng AI bất kì.',
    topic: 'Chủ đề',
    topicPlaceholder: 'VD: Cách mạng tháng Tám',
    howMany: 'Bao nhiêu thẻ?',
    cards: (n: number) => `${n} thẻ`,
    yourPrompt: 'Câu lệnh của bạn',
    copyPrompt: 'Sao chép',
    copied: 'Đã chép!',
    pasteInto: 'Dán vào:',
    borrow: 'Hoặc dùng bộ thẻ người khác đã làm sẵn:',
    on: 'trên',
    step2: 'Dán thẻ vào đây',
    step2Sub: 'Sao chép toàn bộ câu trả lời của AI rồi dán bên dưới. Hoặc tự gõ: mỗi dòng một thẻ, thuật ngữ | định nghĩa.',
    textLabel: 'Thẻ ghi nhớ, mỗi dòng một thẻ',
    textPlaceholder:
      'Ti thể | Bào quan tạo ra phần lớn ATP cho tế bào\nATP | Phân tử dự trữ và cung cấp năng lượng cho tế bào',
    ready: (n: number) => `✓ Đã có ${n} thẻ`,
    none: 'Chưa có thẻ nào',
    skipped: (n: number) => `· Bỏ qua ${n} dòng (thiếu dấu “|” giữa thuật ngữ và định nghĩa)`,
    example: 'Thử ví dụ',
    clear: 'Xóa',
    step3: 'Học ngay',
    step3Sub: 'Lật từng thẻ, rồi thật lòng: đã thuộc hay chưa?',
    step4: 'Đưa sang Quizlet hoặc Anki',
    step4Sub: 'Tiếp tục ôn trên điện thoại với lịch lặp lại ngắt quãng.',
    quizletSteps: [
      'Bấm “Sao chép cho Quizlet”.',
      <>
        Trên Quizlet, tạo học phần mới và chọn <span className="text-white">Nhập (Import)</span>.
      </>,
      'Dán vào. Giữ lựa chọn “Tab” và “Dòng mới”, rồi bấm Nhập.',
    ] as ReactNode[],
    copyQuizlet: 'Sao chép cho Quizlet',
    openQuizlet: 'Mở Quizlet',
    ankiSteps: [
      'Tải tệp xuống.',
      <>
        Trong Anki, chọn <span className="text-white">Tệp → Nhập</span> và chọn tệp vừa tải.
      </>,
      'Kiểm tra tên bộ thẻ rồi bấm Nhập.',
    ] as ReactNode[],
    downloadAnki: '⬇ Tải tệp cho Anki',
    warning: 'Luôn đối chiếu thẻ do AI soạn với SGK và vở ghi. AI có thể sai chi tiết, mà một thẻ sai còn tệ hơn không có thẻ.',
  },
}

type Saved = { topic: string; text: string }

const storageKey = (lang: Lang) => (lang === 'vi' ? 'fgr-flashcards-vi' : 'fgr-flashcards')

function loadSaved(lang: Lang): Saved | null {
  try {
    const raw = localStorage.getItem(storageKey(lang))
    return raw ? (JSON.parse(raw) as Saved) : null
  } catch {
    return null
  }
}

function save(lang: Lang, value: Saved) {
  try {
    localStorage.setItem(storageKey(lang), JSON.stringify(value))
  } catch {
    // Private mode or blocked storage: the deck just won't survive a reload.
  }
}

function StepCard({ step, title, sub, children }: { step: number; title: string; sub: string; children: ReactNode }) {
  return (
    <section className="glass-card p-5 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 text-sm font-bold">
          {step}
        </span>
        <div>
          <h2 className="text-lg leading-snug font-semibold tracking-tight sm:text-xl">{title}</h2>
          <p className="mt-0.5 text-sm text-pretty text-white/55">{sub}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

const pick = (params: URLSearchParams, keys: readonly string[]) =>
  Object.fromEntries(keys.map((k) => [k, params.get(k) ?? undefined]))

/** Where the page came from (to link back) and what subject/topic to prefill, per language. */
function context(params: URLSearchParams, lang: Lang) {
  if (lang === 'vi') {
    const subject = getVnSubject(params.get('mon'))
    const grade = params.get('lop')
    const name = subject?.id === 'khac' ? (params.get('khac') ?? '') : (subject?.name ?? '')
    const fromPlan = ['lop', 'mon', 'cach', 'ngay'].every((k) => params.get(k))
    const fromTimetable = params.get('tu') === 'lich-on'
    return {
      subjectName: name && grade ? `${name} lớp ${grade}` : name,
      topic: params.get('cd') ?? '',
      topicPlaceholder: subject?.topicExample,
      backLabel: fromTimetable ? 'Lịch ôn nhiều môn' : fromPlan ? 'Kế hoạch ôn' : 'Máy tính điểm',
      backHref: fromTimetable
        ? '#/vn/lich-on'
        : fromPlan
          ? hrefFor('/vn/ke-hoach', pick(params, [...VN_CALC_KEYS, ...VN_PLAN_KEYS]))
          : hrefFor('/vn', pick(params, VN_CALC_KEYS)),
    }
  }
  const subject = getSubject(params.get('s'))
  const fromPlan = PLAN_KEYS.every((k) => k === 'o' || k === 't' || params.get(k))
  return {
    subjectName: subject?.id === 'other' ? (params.get('o') ?? '') : (subject?.promptName ?? ''),
    topic: params.get('t') ?? '',
    topicPlaceholder: subject?.topicExample,
    backLabel: fromPlan ? 'Study plan' : 'Calculator',
    backHref: fromPlan
      ? hrefFor('/plan', pick(params, PLAN_KEYS))
      : hrefFor('/', pick(params, ['c', 'd', 'w'])),
  }
}

export default function FlashcardsPage({ params, lang = 'en' }: { params: URLSearchParams; lang?: Lang }) {
  const t = COPY[lang]
  const ctx = context(params, lang)
  const initialTopic = ctx.topic.slice(0, 60)

  const [topic, setTopic] = useState(initialTopic)
  const [count, setCount] = useState<number>(20)
  const [text, setText] = useState(() => {
    const saved = loadSaved(lang)
    return saved && saved.topic === initialTopic ? saved.text : ''
  })
  const [quizletCopied, setQuizletCopied] = useState(false)

  useEffect(() => {
    save(lang, { topic, text })
  }, [lang, topic, text])

  useEffect(() => {
    if (!quizletCopied) return
    const timer = setTimeout(() => setQuizletCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [quizletCopied])

  const promptArgs = { topic: topic.trim(), subject: ctx.subjectName, count }
  const prompt = lang === 'vi' ? flashcardPromptVi(promptArgs) : flashcardPrompt(promptArgs)
  const { cards, skipped } = useMemo(() => parseCards(text), [text])
  const deckKey = useMemo(() => cards.map((c) => c.term + '\u0000' + c.definition).join('\u0001'), [cards])

  const downloadAnki = () => {
    const blob = new Blob([toAnkiFile(cards)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileNameFor(topic)
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="w-full max-w-3xl">
      <nav className="mb-4">
        <a href={ctx.backHref} className={smallButton}>
          <ArrowLeftIcon className="size-3.5" />
          {ctx.backLabel}
        </a>
      </nav>

      <header className="glass-card relative mb-4 overflow-hidden p-6 sm:mb-5 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white/[0.08] to-transparent"
        />
        <div className="relative">
          <p className="text-xs font-semibold tracking-[0.14em] text-fuchsia-200/80 uppercase">{t.eyebrow}</p>
          <h1 className="mt-2 text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">{t.title}</h1>
          <p className="mt-2 text-sm text-pretty text-white/65 sm:text-base">{t.intro}</p>
        </div>
      </header>

      <div className="space-y-4 sm:space-y-5">
        <StepCard step={1} title={t.step1} sub={t.step1Sub}>
          <label htmlFor="fc-topic" className="mb-2 block text-sm font-medium text-white/85">
            {t.topic}
          </label>
          <input
            id="fc-topic"
            type="text"
            value={topic}
            maxLength={60}
            autoComplete="off"
            placeholder={ctx.topicPlaceholder ?? t.topicPlaceholder}
            onChange={(e) => setTopic(e.target.value)}
            className="h-12 w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-base text-white transition outline-none placeholder:text-white/30 hover:border-white/25 focus:border-fuchsia-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-fuchsia-500/20"
          />

          <p className="mt-4 mb-2 text-sm font-medium text-white/85">{t.howMany}</p>
          <div className="grid grid-cols-3 gap-2">
            {CARD_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={count === n}
                onClick={() => setCount(n)}
                className={`${selectableCard(count === n)} flex h-11 items-center justify-center text-sm font-semibold`}
              >
                {t.cards(n)}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold tracking-wide text-white/50 uppercase">{t.yourPrompt}</p>
              <CopyButton text={prompt} label={t.copyPrompt} copiedLabel={t.copied} />
            </div>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-white/80">{prompt}</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-white/55">{t.pasteInto}</span>
            {AI_TOOLS.map((tool) => (
              <a key={tool.name} href={tool.url} target="_blank" rel="noopener noreferrer" className={smallButton}>
                {tool.name}
                <ExternalLinkIcon className="size-3.5 text-white/50" />
              </a>
            ))}
          </div>

          {topic.trim() && (
            <div className="mt-5">
              <p className="mb-2 text-sm text-white/55">{t.borrow}</p>
              <SearchLink href={quizletSearch(topic.trim())} query={topic.trim()} where="Quizlet" prefix={t.on} />
            </div>
          )}
        </StepCard>

        <StepCard step={2} title={t.step2} sub={t.step2Sub}>
          <label htmlFor="fc-text" className="sr-only">
            {t.textLabel}
          </label>
          <textarea
            id="fc-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            spellCheck={false}
            placeholder={t.textPlaceholder}
            className="w-full resize-y rounded-2xl border border-white/15 bg-white/[0.06] p-4 font-mono text-sm leading-relaxed text-white transition outline-none placeholder:text-white/30 hover:border-white/25 focus:border-fuchsia-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-fuchsia-500/20"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm" aria-live="polite">
              {cards.length > 0 ? (
                <span className="font-medium text-emerald-300">{t.ready(cards.length)}</span>
              ) : (
                <span className="text-white/50">{t.none}</span>
              )}
              {skipped > 0 && <span className="ml-2 text-amber-200/80">{t.skipped(skipped)}</span>}
            </p>
            <div className="flex gap-2">
              {!text && (
                <button
                  type="button"
                  onClick={() => setText(lang === 'vi' ? EXAMPLE_DECK_VI : EXAMPLE_DECK)}
                  className={smallButton}
                >
                  {t.example}
                </button>
              )}
              {text && (
                <button type="button" onClick={() => setText('')} className={smallButton}>
                  {t.clear}
                </button>
              )}
            </div>
          </div>
        </StepCard>

        {cards.length > 0 && (
          <>
            <StepCard step={3} title={t.step3} sub={t.step3Sub}>
              <StudyDeck key={deckKey} cards={cards} labels={lang === 'vi' ? VI_DECK_LABELS : EN_DECK_LABELS} />
            </StepCard>

            <StepCard step={4} title={t.step4} sub={t.step4Sub}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-semibold">Quizlet</p>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-white/70 marker:text-white/40">
                    {t.quizletSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => setQuizletCopied(await copyText(toQuizletText(cards)))}
                      className={`${primaryButton} h-10 px-4`}
                    >
                      {quizletCopied ? `✓ ${t.copied}` : t.copyQuizlet}
                    </button>
                    <a href={QUIZLET_CREATE_URL} target="_blank" rel="noopener noreferrer" className={`${secondaryButton} h-10 px-4`}>
                      {t.openQuizlet}
                      <ExternalLinkIcon className="size-3.5 text-white/50" />
                    </a>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-semibold">Anki</p>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-white/70 marker:text-white/40">
                    {t.ankiSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={downloadAnki} className={`${secondaryButton} h-10 px-4`}>
                      {t.downloadAnki}
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-white/45">{t.warning}</p>
            </StepCard>
          </>
        )}
      </div>
    </main>
  )
}
