import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SectionCard } from '../../components/SectionCard'
import { ArrowLeftIcon, ResetIcon, SparklesIcon } from '../../components/icons'
import { BoardSheet, type SheetNeed } from '../../components/vn/BoardSheet'
import { getVnSubject, levelOf, subjectsFor, VN_GRADES } from '../../data/vn/subjects'
import { TIER_STYLES } from '../../lib/tierStyles'
import { primaryButton, secondaryButton, selectableCard, smallButton } from '../../lib/ui'
import { exportBoardXlsx, exportFileName, importBoardFromXlsx, schoolYear } from '../../lib/boardExcel'
import {
  emptyCell,
  exampleRows,
  fillPlan,
  goalPlan,
  MAX_HS1,
  MAX_HS2,
  newBoardRow,
  normalizeRow,
  overview,
  RANK_LABELS,
  rowStats,
  SHEET_NAMES,
  templateRows,
  type Board,
  type BoardRow,
  type Cell,
  type Goal,
  type RowStats,
  type Term,
} from '../../lib/vnBoard'
import { formatAverage, formatVi, parseScore, sanitizeScoreInput, vnTierFor } from '../../lib/vnGrade'

const STORAGE_KEY = 'fgr-vn-board'
const VIEW_KEY = 'fgr-vn-board-view'

type View = 'sheet' | 'cards'

/** Opening the page shows the class sheet ready to fill, like a fresh copy of the Excel file. */
const freshBoard = (grade = 10): Board => ({
  grade,
  term: 'hk1',
  goal: 'hsg',
  commentsOk: true,
  conductOk: true,
  rows: templateRows(grade),
})

function loadBoard(): Board {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Board
      if (Array.isArray(parsed.rows)) {
        const base = freshBoard(parsed.grade || 10)
        return { ...base, ...parsed, grade: base.grade, rows: parsed.rows.length ? parsed.rows.map(normalizeRow) : base.rows }
      }
    }
  } catch {
    // Fall through to the template.
  }
  return freshBoard()
}

function loadView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'cards' ? 'cards' : 'sheet'
  } catch {
    return 'sheet'
  }
}

const GOALS: { id: Goal; label: string; sub: string }[] = [
  { id: 'hsg', label: '🥇 Học sinh Giỏi', sub: 'Học tập Tốt, rèn luyện Tốt' },
  { id: 'hsxs', label: '🏆 Học sinh Xuất sắc', sub: 'Giỏi + 6 môn từ 9,0' },
]

const TERMS: { id: Term; label: string }[] = [
  { id: 'hk1', label: 'Học kì I' },
  { id: 'hk2', label: 'Học kì II + cả năm' },
]

function Card({ title, sub, children, className = '' }: { title: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <SectionCard title={title} sub={sub} className={className}>
      {children}
    </SectionCard>
  )
}

function Check({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span
        aria-hidden
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
          ok ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/15 text-red-300'
        }`}
      >
        {ok ? '✓' : '✗'}
      </span>
      <span>
        <span className="text-white/85">{label}</span>
        <span className="sr-only">{ok ? ': đạt' : ': chưa đạt'}</span>
        {detail && <span className="ml-1.5 text-white/50 tabular-nums">{detail}</span>}
      </span>
    </li>
  )
}

/** Segmented control used for the view switch and the term. */
function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (id: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex gap-1 rounded-xl border border-white/[0.08] bg-ink-900/70 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`h-8 rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-accent-400/60 focus-visible:outline-none ${
            value === o.id ? 'bg-white/[0.1] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]' : 'text-white/55 hover:text-white/85'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** One score cell: the number plus a tap target that switches between final and planned. */
function ScoreCell({ cell, label, caption, onChange }: { cell: Cell; label: string; caption: string; onChange: (cell: Cell) => void }) {
  const state = parseScore(cell.v)
  const filled = state.status === 'valid'
  const border =
    state.status === 'invalid'
      ? 'border-red-400/70'
      : cell.plan
        ? `border-dashed border-emerald-300/70 ${filled ? 'bg-emerald-400/[0.1]' : 'bg-emerald-400/[0.04]'}`
        : `border-amber-300/70 ${filled ? 'bg-amber-300/[0.1]' : 'bg-amber-300/[0.03]'}`
  return (
    <div className="flex w-14 flex-col items-center gap-1">
      <span className="text-[10px] font-medium text-white/45">{caption}</span>
      <input
        type="text"
        inputMode="decimal"
        aria-label={label}
        value={cell.v.replace('.', ',')}
        placeholder="–"
        onChange={(e) => onChange({ ...cell, v: sanitizeScoreInput(e.target.value) })}
        className={`h-11 w-14 rounded-xl border bg-white/[0.06] text-center text-base font-medium text-white tabular-nums outline-none placeholder:text-white/25 focus:ring-4 focus:ring-accent-500/20 ${border}`}
      />
      <button
        type="button"
        onClick={() => onChange({ ...cell, plan: !cell.plan })}
        aria-label={`${label}: ${cell.plan ? 'điểm phấn đấu' : 'điểm đã chốt'}. Chạm để đổi.`}
        className={`h-5 rounded-full px-1.5 text-[10px] font-semibold whitespace-nowrap ${
          cell.plan ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-300/15 text-amber-200'
        } ${filled ? '' : 'opacity-60'}`}
      >
        {cell.plan ? 'Phấn đấu' : 'Chốt'}
      </button>
    </div>
  )
}

function CellGroup({
  title,
  cells,
  max,
  min,
  caption,
  newCell = () => emptyCell(),
  onChange,
}: {
  title: string
  cells: Cell[]
  max: number
  min: number
  caption: (index: number) => string
  newCell?: () => Cell
  onChange: (cells: Cell[]) => void
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-white/60">{title}</p>
      <div className="flex flex-wrap items-start gap-1.5">
        {cells.map((cell, i) => (
          <ScoreCell
            key={i}
            cell={cell}
            caption={caption(i)}
            label={`${title}, ${caption(i)}, ô ${i + 1}`}
            onChange={(next) => onChange(cells.map((c, j) => (j === i ? next : c)))}
          />
        ))}
        <div className="flex gap-1 self-center">
          {cells.length < max && (
            <button type="button" onClick={() => onChange([...cells, newCell()])} aria-label={`Thêm ô ${title}`} className={`${smallButton} h-11 w-9 px-0`}>
              ＋
            </button>
          )}
          {cells.length > min && (
            <button type="button" onClick={() => onChange(cells.slice(0, -1))} aria-label={`Bớt ô ${title}`} className={`${smallButton} h-11 w-9 px-0`}>
              −
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function needText(need: number, target: number): { text: string; tone: string } {
  if (need === -Infinity || need <= 0) return { text: `Đã chắc đạt ${formatAverage(target)} ✓`, tone: TIER_STYLES.secured.text }
  if (need === Infinity) return { text: `Không thể đạt ${formatAverage(target)} (điểm đã chốt hết)`, tone: TIER_STYLES.impossible.text }
  const tier = vnTierFor(need)
  if (need > 10) return { text: `Cần ${formatVi(need)}: không thể đạt ${formatAverage(target)}`, tone: TIER_STYLES[tier].text }
  return { text: `Cần TB ${formatVi(need)} ở các bài chưa chốt để đạt ${formatAverage(target)}`, tone: TIER_STYLES[tier].text }
}

/** The same advice, short enough for one cell of the sheet. */
function needCell(need: number, target: number): SheetNeed {
  const goal = formatAverage(target)
  if (need === -Infinity || need <= 0) return { value: '✓', sub: `chắc đạt ${goal}`, tone: TIER_STYLES.secured.text }
  if (need === Infinity) return { value: '✗', sub: `không đạt ${goal}`, tone: TIER_STYLES.impossible.text }
  const tone = TIER_STYLES[vnTierFor(need)].text
  if (need > 10) return { value: formatVi(need), sub: `quá 10, khó đạt ${goal}`, tone }
  return { value: formatVi(need), sub: `để đạt ${goal}`, tone }
}

/** Subject averages as one-hue bars, with the 6,5 / 8,0 / 9,0 thresholds marked. */
function AverageChart({ items }: { items: { id: string; name: string; avg: number }[] }) {
  const sorted = [...items].sort((a, b) => b.avg - a.avg)
  // 8,0 and 9,0 sit close together, so their labels hang off opposite sides of the line.
  const lines = [
    { at: 6.5, label: '6,5', align: '-translate-x-1/2' },
    { at: 8, label: '8,0', align: '-translate-x-full pr-1' },
    { at: 9, label: '9,0', align: 'pl-1' },
  ]
  return (
    <figure>
      <div className="relative">
        <div className="mb-1 grid grid-cols-[5.5rem_1fr_2.5rem] gap-3 text-[10px] text-white/45" aria-hidden>
          <span />
          <span className="relative h-3">
            {lines.map((l) => (
              <span key={l.at} className={`absolute tabular-nums ${l.align}`} style={{ left: `${l.at * 10}%` }}>
                {l.label}
              </span>
            ))}
          </span>
          <span />
        </div>
        <ul className="space-y-2">
          {sorted.map((item) => (
            <li key={item.id} className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3 text-sm" title={`${item.name}: ${formatAverage(item.avg)}`}>
              <span className="truncate text-white/75">{item.name}</span>
              <span className="relative h-2.5 rounded-full bg-white/10">
                <span className="absolute inset-y-0 left-0 rounded-full bg-accent-300" style={{ width: `${item.avg * 10}%` }} />
                {lines.map((l) => (
                  <span key={l.at} aria-hidden className="absolute -inset-y-1 w-px bg-white/35" style={{ left: `${l.at * 10}%` }} />
                ))}
              </span>
              <span className="text-right font-semibold text-white tabular-nums">{formatAverage(item.avg)}</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="sr-only">Điểm trung bình các môn, xếp từ cao xuống thấp.</figcaption>
    </figure>
  )
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

type Notice = { kind: 'ok' | 'error'; text: string; at: 'sheet' | 'file' }

function NoticeBox({ notice }: { notice: Notice }) {
  return (
    <p
      role="status"
      className={`rounded-xl border px-3.5 py-2.5 text-sm text-pretty ${
        notice.kind === 'ok' ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100' : 'border-amber-300/30 bg-amber-300/10 text-amber-100'
      }`}
    >
      {notice.text}
    </p>
  )
}

const textInput =
  'h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-base text-white outline-none placeholder:text-white/30 hover:border-white/20 focus:border-accent-300/60 focus:ring-4 focus:ring-accent-500/20'

export default function VnBoardPage() {
  const [board, setBoard] = useState<Board>(loadBoard)
  const [view, setView] = useState<View>(loadView)
  const [notice, setNotice] = useState<Notice | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
    } catch {
      // Storage blocked: the board just won't be remembered.
    }
  }, [board])

  const chooseView = (next: View) => {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      // Not remembered; harmless.
    }
  }

  const set = (patch: Partial<Board>) => setBoard((prev) => ({ ...prev, ...patch }))
  const setRow = (id: string, patch: Partial<BoardRow>) =>
    setBoard((prev) => ({ ...prev, rows: prev.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
  const removeRow = (id: string) => setBoard((prev) => ({ ...prev, rows: prev.rows.filter((r) => r.id !== id) }))

  const chooseGrade = (grade: number) =>
    setBoard((prev) => {
      // A board with no scores yet is swapped for that grade's template; otherwise keep the scores.
      const untouched = prev.rows.every((r) => !rowStats(r, 'hk1').hasScores)
      const level = levelOf(grade)
      const kept = untouched ? [] : prev.rows.filter((r) => getVnSubject(r.mon)?.levels.includes(level))
      return { ...prev, grade, rows: kept.length ? kept : templateRows(grade) }
    })

  const nameOf = (row: BoardRow) => {
    const subject = getVnSubject(row.mon)
    return subject?.id === 'khac' ? row.khac.trim() || 'Môn khác' : (subject?.name ?? 'Môn học')
  }

  const withStats = board.rows.map((row) => ({ row, id: row.id, stats: rowStats(row, board.term) }))
  const counted = withStats.filter((r) => r.stats.avg !== null && !r.stats.invalid) as {
    row: BoardRow
    id: string
    stats: RowStats & { avg: number }
  }[]
  const ov = overview(counted.map((r) => r.stats.avg), board.commentsOk, board.conductOk)
  const plan = goalPlan(withStats.filter((r) => r.stats.hasScores || r.stats.openWeight > 0), board.goal)
  const planById = Object.fromEntries(plan.rows.map((p) => [p.id, p]))
  const available = subjectsFor(board.grade).filter((s) => !board.rows.some((r) => r.mon === s.id) || s.id === 'khac')
  const isYear = board.term === 'hk2'
  const goalLabel = board.goal === 'hsxs' ? 'Học sinh Xuất sắc' : 'Học sinh Giỏi'
  const cdCount = board.rows.filter((r) => r.cd).length
  const sheetTitle = `Năm học ${schoolYear().replace(/\s*-\s*/, '-')}/Học kỳ ${isYear ? 2 : 1}`

  const openFile = async (file: File) => {
    try {
      const result = await importBoardFromXlsx(await file.arrayBuffer(), board)
      setBoard(result.board)
      setNotice({
        kind: 'ok',
        at: 'file',
        text: [`Đã đọc ${result.subjects} môn từ “${file.name}” vào bảng ở trên.`, ...result.warnings].join(' '),
      })
    } catch (error) {
      setNotice({
        kind: 'error',
        at: 'file',
        text: `Không đọc được file. ${error instanceof Error ? error.message : ''} Hãy dùng file .xlsx theo mẫu kế hoạch của lớp.`,
      })
    }
  }

  const autoFill = () => {
    let filled = 0
    const unreachable: string[] = []
    const rows = board.rows.map((row) => {
      const target = planById[row.id]?.target
      if (target === undefined) return row
      const result = fillPlan(row, target, board.term)
      filled += result.filled
      if (!result.reachable && result.filled) unreachable.push(nameOf(row))
      return result.row
    })
    const missingFinal = board.rows.some((row) => [...row.hs1, ...row.hs2, row.hs3].some((c) => !c.plan && c.v === ''))
    setBoard({ ...board, rows })
    setNotice(
      filled
        ? {
            kind: unreachable.length ? 'error' : 'ok',
            at: 'sheet',
            text:
              `Đã điền ${filled} ô xanh để đạt ${goalLabel}.` +
              (unreachable.length ? ` Môn ${unreachable.join(', ')} cần trên 10 điểm, đã điền tối đa 10.` : ' Bạn có thể sửa lại từng ô.') +
              (missingFinal ? ' Mẹo: nhập đủ điểm đã chốt (ô vàng) trước, web sẽ điền sát với sức học của bạn hơn.' : ''),
          }
        : {
            kind: 'error',
            at: 'sheet',
            text: 'Không còn ô xanh nào để trống. Dùng “Tô xanh” cho ô cần điền, hoặc “Xóa ô” để web điền lại.',
          },
    )
  }

  const titleBadge =
    ov.title === 'xuat-sac'
      ? { text: '🏆 Học sinh Xuất sắc', cls: 'border-amber-300/40 bg-amber-300/15 text-amber-200' }
      : ov.title === 'gioi'
        ? { text: '🥇 Học sinh Giỏi', cls: 'border-emerald-300/40 bg-emerald-400/15 text-emerald-200' }
        : { text: 'Chưa đạt danh hiệu', cls: 'border-white/10 bg-white/[0.04] text-white/70' }

  return (
    <main className="w-full max-w-4xl">
      <nav className="mb-4">
        <a href="#/vn" className={smallButton}>
          <ArrowLeftIcon className="size-3.5" />
          Máy tính điểm
        </a>
      </nav>

      <header className="mb-6 px-1 sm:mb-8">
        <div>
          <p className="inline-flex items-center rounded-full border border-accent-300/20 bg-accent-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-[0.1em] text-accent-200 uppercase">Bảng điểm tổng quát</p>
          <h1 className="mt-3 text-[1.75rem] leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Bảng kế hoạch của lớp, ngay trên web
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-pretty text-white/60 sm:text-base">
            Giống hệt file Excel kế hoạch học kì: gõ điểm vào ô vàng (đã chốt) và ô xanh (phấn đấu), TBHK tự tính. Web còn
            xếp loại học tập và chỉ ra môn nào cần bao nhiêu điểm để đạt Học sinh Giỏi hay Học sinh Xuất sắc (theo Thông tư
            22). Không cần mở Excel.
          </p>
        </div>
      </header>

      <div className="space-y-4 sm:space-y-5">
        <section aria-labelledby="sheet-title" className="glass-card p-4 sm:p-7">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="sheet-title" className="text-lg font-semibold tracking-tight sm:text-xl">
                  Kế hoạch {isYear ? 'học kì II' : 'học kì I'}
                </h2>
                <p className="mt-0.5 text-sm text-pretty text-white/50">Điểm và họ tên chỉ lưu trên máy của bạn.</p>
              </div>
              <Segmented
                label="Kiểu hiển thị"
                value={view}
                onChange={chooseView}
                options={[
                  { id: 'sheet', label: 'Dạng bảng' },
                  { id: 'cards', label: 'Dạng thẻ' },
                ]}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[10rem_auto_1fr]">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-white/55">Lớp</span>
                <span className="relative block">
                  <select
                    value={board.grade}
                    onChange={(e) => chooseGrade(Number(e.target.value))}
                    className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] pr-8 pl-3.5 text-base font-semibold text-white outline-none hover:border-white/20 focus:border-accent-300/60 focus:ring-4 focus:ring-accent-500/20"
                  >
                    {VN_GRADES.map(({ grade, level }) => (
                      <option key={grade} value={grade}>
                        Lớp {grade} · {level === 'thcs' ? 'THCS' : 'THPT'}
                      </option>
                    ))}
                  </select>
                  <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs text-white/60">
                    ▾
                  </span>
                </span>
              </label>
              <div>
                <span className="mb-1.5 block text-xs font-medium text-white/55">Đang tính</span>
                <div className="flex h-11 items-center">
                  <Segmented label="Học kì" value={board.term} onChange={(term) => set({ term })} options={TERMS} />
                </div>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-white/55">Họ và tên</span>
                <input value={board.name ?? ''} maxLength={60} onChange={(e) => set({ name: e.target.value })} placeholder="VD: Nguyễn Văn A" className={textInput} />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4">
              <button type="button" onClick={autoFill} disabled={!board.rows.length} className={`${primaryButton} h-11`}>
                <SparklesIcon className="size-4" />
                Tự điền ô xanh theo mục tiêu {board.goal === 'hsxs' ? 'HSXS' : 'HSG'}
              </button>
              <span className="hidden flex-1 sm:block" />
              <button type="button" onClick={() => setBoard({ ...board, grade: 10, term: 'hk1', rows: exampleRows() })} className={`${smallButton} h-11 px-4 text-sm`}>
                Xem bảng mẫu
              </button>
              <button
                type="button"
                onClick={() => {
                  setBoard({ ...board, rows: templateRows(board.grade) })
                  setNotice(null)
                }}
                className={`${smallButton} h-11 px-4 text-sm`}
              >
                <ResetIcon className="size-4" />
                Xóa hết điểm
              </button>
            </div>
            {notice?.at === 'sheet' && (
              <div className="mt-3">
                <NoticeBox notice={notice} />
              </div>
            )}

            <div className="mt-5">
              {view === 'sheet' ? (
                <BoardSheet
                  title={sheetTitle}
                  isYear={isYear}
                  goal={board.goal}
                  onGoal={(goal) => set({ goal })}
                  onRow={setRow}
                  onRemove={removeRow}
                  rows={withStats.map(({ row, stats }) => {
                    const p = planById[row.id]
                    return {
                      row,
                      stats,
                      name: row.mon === 'khac' ? nameOf(row) : (SHEET_NAMES[row.mon] ?? nameOf(row)),
                      fullName: nameOf(row),
                      need: p ? needCell(p.need, p.target) : undefined,
                    }
                  })}
                />
              ) : (
                <>
                  <p className={`mb-3 text-xs ${cdCount === 3 ? 'text-emerald-300' : 'text-amber-200/85'}`}>
                    Chuyên đề: {cdCount}/3 môn{' '}
                    {cdCount === 3 ? '✓' : '(mỗi học sinh điền cột chuyên đề ở 3 môn, bấm “＋ CĐ” ở môn bạn học chuyên đề)'}
                  </p>
                  <div className="mb-4 flex flex-wrap gap-3 text-xs text-white/60">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-3 rounded border border-amber-300/70 bg-amber-300/20" /> Đã chốt
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-3 rounded border border-dashed border-emerald-300/70 bg-emerald-400/20" /> Phấn đấu
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-3 rounded border border-white/25" /> Chưa có điểm
                    </span>
                  </div>
                  <ul className="grid gap-3 lg:grid-cols-2">
                    {withStats.map(({ row, stats }) => {
                      const p = planById[row.id]
                      const need = p ? needText(p.need, p.target) : null
                      return (
                        <li key={row.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">
                                {getVnSubject(row.mon)?.emoji} {nameOf(row)}
                              </p>
                              {row.mon === 'khac' && (
                                <input
                                  value={row.khac}
                                  maxLength={40}
                                  onChange={(e) => setRow(row.id, { khac: e.target.value })}
                                  placeholder="Tên môn"
                                  className="mt-1 h-9 w-40 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-sm text-white outline-none"
                                />
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-[11px] tracking-wide text-white/50 uppercase">{isYear ? 'HK II / Cả năm' : 'TBHK'}</p>
                              <p className="text-2xl font-bold tabular-nums">
                                {stats.termAvg === null ? '–' : formatAverage(stats.termAvg)}
                                {isYear && stats.yearAvg !== null && <span className="text-base font-semibold text-accent-200"> / {formatAverage(stats.yearAvg)}</span>}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 space-y-3">
                            <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
                              <CellGroup
                                title="Hệ số 1 (miệng, 15 phút)"
                                cells={row.hs1}
                                max={MAX_HS1}
                                min={1}
                                caption={(i) => (i === 0 ? 'Miệng' : "15'")}
                                onChange={(hs1) => setRow(row.id, { hs1 })}
                              />
                              <div>
                                <p className="mb-1.5 text-xs font-medium text-white/60">Chuyên đề</p>
                                {row.cd ? (
                                  <div className="flex items-start gap-1">
                                    <ScoreCell cell={row.cd} caption="CĐ" label={`Chuyên đề môn ${nameOf(row)}`} onChange={(cd) => setRow(row.id, { cd })} />
                                    <button
                                      type="button"
                                      onClick={() => setRow(row.id, { cd: null })}
                                      aria-label={`Bỏ chuyên đề môn ${nameOf(row)}`}
                                      className={`${smallButton} mt-[1.125rem] h-11 w-9 px-0`}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <button type="button" onClick={() => setRow(row.id, { cd: emptyCell(true) })} className={`${smallButton} mt-[1.125rem] h-11`}>
                                    ＋ CĐ
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-3">
                              <CellGroup
                                title="Hệ số 2 (45 phút)"
                                cells={row.hs2}
                                max={MAX_HS2}
                                min={1}
                                caption={() => "45'"}
                                onChange={(hs2) => setRow(row.id, { hs2 })}
                              />
                              <CellGroup title="Hệ số 3" cells={[row.hs3]} max={1} min={1} caption={() => 'Cuối kì'} onChange={([hs3]) => setRow(row.id, { hs3 })} />
                              {isYear && (
                                <div>
                                  <p className="mb-1.5 text-xs font-medium text-white/60">ĐTB học kì I</p>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    aria-label={`ĐTB học kì I môn ${nameOf(row)}`}
                                    value={row.hk1.replace('.', ',')}
                                    placeholder="–"
                                    onChange={(e) => setRow(row.id, { hk1: sanitizeScoreInput(e.target.value) })}
                                    className="h-11 w-16 rounded-xl border border-sky-300/50 bg-sky-400/[0.08] text-center text-base font-medium text-white tabular-nums outline-none focus:ring-4 focus:ring-accent-500/20"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {stats.invalid && <p className="mt-2 text-xs text-red-300">Có ô ngoài khoảng 0–10.</p>}
                          {need && !stats.invalid && <p className={`mt-3 text-sm font-medium ${need.tone}`}>{need.text}</p>}
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            className="mt-3 text-xs text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
                          >
                            Bỏ môn này
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}
            </div>

            {available.length > 0 && (
              <label className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/70">
                Thêm môn:
                <select
                  value=""
                  onChange={(e) => e.target.value && set({ rows: [...board.rows, newBoardRow(e.target.value)] })}
                  className={`${secondaryButton} h-10 appearance-none pr-4`}
                >
                  <option value="">Chọn môn…</option>
                  {available.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.emoji} {s.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </section>

        <Card
          title={isYear ? 'Tổng quan cả năm' : 'Tổng quan học kì I'}
          sub={
            isYear
              ? 'ĐTB cả năm = (HK I + 2 × HK II) ÷ 3. Nhập ĐTB HK I ở cột “TB HK I” trong bảng.'
              : 'Danh hiệu được xét theo cả năm. Đây là dự báo nếu cả năm giữ được kết quả như học kì này.'
          }
        >
          <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={board.goal === g.id}
                onClick={() => set({ goal: g.id })}
                className={`${selectableCard(board.goal === g.id)} px-3.5 py-2.5 text-left`}
              >
                <span className="block text-sm font-semibold">{g.label}</span>
                <span className="block text-[11px] text-white/50">{g.sub}</span>
              </button>
            ))}
          </div>
          {ov.counted === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-sm text-white/55">
              Nhập điểm vào bảng ở trên, hoặc bấm “Xem bảng mẫu”.
            </p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
              <div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-medium tracking-wide text-white/50 uppercase">Kết quả học tập dự kiến</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight">{ov.rank ? RANK_LABELS[ov.rank] : '–'}</p>
                  <p className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${titleBadge.cls}`}>{titleBadge.text}</p>
                  {ov.counted < 6 && <p className="mt-3 text-xs text-amber-200/80">Cần ít nhất 6 môn có điểm để xếp loại.</p>}
                </div>
                <p className="mt-4 mb-2 text-sm font-semibold text-white/85">Điều kiện {goalLabel}</p>
                <ul className="space-y-2">
                  <Check ok={ov.counted > 0 && ov.below65.length === 0} label="Tất cả các môn từ 6,5 trở lên" detail={ov.below65.length ? `(${ov.below65.length} môn dưới 6,5)` : undefined} />
                  <Check ok={ov.n8 >= 6} label="Ít nhất 6 môn từ 8,0 trở lên" detail={`(${ov.n8}/6)`} />
                  {board.goal === 'hsxs' && <Check ok={ov.n9 >= 6} label="Ít nhất 6 môn từ 9,0 trở lên" detail={`(${ov.n9}/6)`} />}
                  <Check ok={board.commentsOk} label="Các môn nhận xét đều Đạt" />
                  <Check ok={board.conductOk} label="Rèn luyện mức Tốt" />
                </ul>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold text-white/85">ĐTB {isYear ? 'cả năm' : 'học kì'} từng môn</p>
                <AverageChart items={counted.map((r) => ({ id: r.id, name: nameOf(r.row), avg: r.stats.avg }))} />
              </div>
            </div>
          )}
          <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm text-white/80">
            <label className="flex items-start gap-2.5">
              <input type="checkbox" checked={board.conductOk} onChange={(e) => set({ conductOk: e.target.checked })} className="mt-0.5 size-4 accent-accent-400" />
              Kết quả rèn luyện (hạnh kiểm) dự kiến mức Tốt
            </label>
            <label className="flex items-start gap-2.5">
              <input type="checkbox" checked={board.commentsOk} onChange={(e) => set({ commentsOk: e.target.checked })} className="mt-0.5 size-4 accent-accent-400" />
              Các môn đánh giá bằng nhận xét (GDTC, Nghệ thuật, HĐTN, GD địa phương) đều Đạt
            </label>
          </div>
        </Card>

        {plan.rows.length > 0 && (
          <Card
            title={`Đường tới ${goalLabel}`}
            sub={`Web chọn 6 môn dễ đạt ${board.goal === 'hsxs' ? '9,0' : '8,0'} nhất; các môn còn lại chỉ cần từ 6,5. “Cần TB” là điểm trung bình cần đạt ở các ô xanh và ô còn trống.`}
          >
            {!plan.feasible && (
              <p className="mb-3 rounded-xl border border-red-400/25 bg-red-400/[0.08] px-3.5 py-2.5 text-sm text-red-200">
                {plan.rows.length < 6
                  ? 'Cần ít nhất 6 môn có điểm số để xét danh hiệu.'
                  : `Với các điểm đã chốt, ${goalLabel} học kì này rất khó đạt. Hãy xem mục tiêu thấp hơn hoặc tập trung vào học kì sau.`}
              </p>
            )}
            <ul className="grid gap-2 sm:grid-cols-2">
              {plan.rows.map((p) => {
                const row = board.rows.find((r) => r.id === p.id)!
                const need = needText(p.need, p.target)
                return (
                  <li key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">
                        {getVnSubject(row.mon)?.emoji} {nameOf(row)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.top ? 'bg-accent-400/15 text-accent-200' : 'bg-white/[0.08] text-white/60'}`}>
                        Mục tiêu ≥ {formatAverage(p.target)}
                      </span>
                    </div>
                    <p className={`mt-1.5 text-sm font-medium ${need.tone}`}>{need.text}</p>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}

        <Card title="Cần nộp file Excel cho lớp?" sub="Không bắt buộc. Tải bảng ở trên thành file đúng mẫu (có công thức TBHK), hoặc mở file cũ để đọc điểm vào bảng.">
          <div className="grid gap-2.5 sm:grid-cols-[1fr_1fr_12rem]">
            <button
              type="button"
              onClick={() => downloadBlob(exportBoardXlsx(board), exportFileName(board))}
              disabled={!board.rows.length}
              className={`${secondaryButton} h-auto flex-col gap-0.5 border-emerald-300/40 py-3`}
            >
              <span className="text-base">Tải file Excel</span>
              <span className="text-[11px] font-normal text-white/55">Đúng mẫu kế hoạch của lớp</span>
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className={`${secondaryButton} h-auto flex-col gap-0.5 py-3`}>
              <span className="text-base">Mở file Excel</span>
              <span className="text-[11px] font-normal text-white/55">Đọc điểm và màu vàng/xanh</span>
            </button>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/65">Mã HS (ghi vào file)</span>
              <input value={board.code ?? ''} maxLength={20} onChange={(e) => set({ code: e.target.value })} className={textInput} />
            </label>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void openFile(file)
              e.target.value = ''
            }}
          />
          {notice?.at === 'file' && (
            <div className="mt-3">
              <NoticeBox notice={notice} />
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}
