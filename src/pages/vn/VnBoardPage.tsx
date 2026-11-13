import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeftIcon } from '../../components/icons'
import { getVnSubject, levelOf, subjectsFor, VN_GRADES } from '../../data/vn/subjects'
import { TIER_STYLES } from '../../lib/tierStyles'
import { primaryButton, secondaryButton, selectableCard, smallButton } from '../../lib/ui'
import { exportBoardXlsx, exportFileName, importBoardFromXlsx } from '../../lib/boardExcel'
import {
  DEFAULT_SUBJECTS,
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
  type Board,
  type BoardRow,
  type Cell,
  type Goal,
  type RowStats,
  type Term,
} from '../../lib/vnBoard'
import { formatAverage, formatVi, parseScore, sanitizeScoreInput, vnTierFor } from '../../lib/vnGrade'

const STORAGE_KEY = 'fgr-vn-board'

const DEFAULT_BOARD: Board = { grade: 0, term: 'hk1', goal: 'hsg', commentsOk: true, conductOk: true, rows: [] }

function loadBoard(): Board {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Board
      if (Array.isArray(parsed.rows)) return { ...DEFAULT_BOARD, ...parsed, rows: parsed.rows.map(normalizeRow) }
    }
  } catch {
    // Fall through to an empty board.
  }
  return DEFAULT_BOARD
}

const GOALS: { id: Goal; label: string; sub: string }[] = [
  { id: 'hsg', label: '🥇 Học sinh Giỏi', sub: 'Học tập Tốt, rèn luyện Tốt' },
  { id: 'hsxs', label: '🏆 Học sinh Xuất sắc', sub: 'Giỏi + 6 môn từ 9,0' },
]

function Card({ title, sub, children, className = '' }: { title: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`glass-card p-5 sm:p-7 ${className}`}>
      <h2 className="text-lg leading-snug font-semibold tracking-tight sm:text-xl">{title}</h2>
      {sub && <p className="mt-0.5 text-sm text-pretty text-white/55">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
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
        className={`h-11 w-14 rounded-xl border bg-white/[0.06] text-center text-base font-medium text-white tabular-nums outline-none placeholder:text-white/25 focus:ring-4 focus:ring-fuchsia-500/20 ${border}`}
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
                <span className="absolute inset-y-0 left-0 rounded-full bg-fuchsia-300" style={{ width: `${item.avg * 10}%` }} />
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

type Notice = { kind: 'ok' | 'error'; text: string }

export default function VnBoardPage() {
  const [board, setBoard] = useState<Board>(loadBoard)
  const [notice, setNotice] = useState<Notice | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
    } catch {
      // Storage blocked: the board just won't be remembered.
    }
  }, [board])

  const set = (patch: Partial<Board>) => setBoard((prev) => ({ ...prev, ...patch }))
  const setRow = (id: string, patch: Partial<BoardRow>) =>
    setBoard((prev) => ({ ...prev, rows: prev.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }))

  const chooseGrade = (grade: number) =>
    setBoard((prev) => {
      const level = levelOf(grade)
      const rows = prev.rows.length
        ? prev.rows.filter((r) => getVnSubject(r.mon)?.levels.includes(level))
        : DEFAULT_SUBJECTS[level].map((mon) => newBoardRow(mon))
      return { ...prev, grade, rows: rows.length ? rows : DEFAULT_SUBJECTS[level].map((mon) => newBoardRow(mon)) }
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
  const available = board.grade ? subjectsFor(board.grade).filter((s) => !board.rows.some((r) => r.mon === s.id) || s.id === 'khac') : []
  const isYear = board.term === 'hk2'
  const goalLabel = board.goal === 'hsxs' ? 'Học sinh Xuất sắc' : 'Học sinh Giỏi'

  const cdCount = board.rows.filter((r) => r.cd).length

  const openFile = async (file: File) => {
    try {
      const result = await importBoardFromXlsx(await file.arrayBuffer(), board)
      setBoard(result.board)
      setNotice({
        kind: 'ok',
        text: [`Đã đọc ${result.subjects} môn từ “${file.name}”.`, ...result.warnings].join(' '),
      })
    } catch (error) {
      setNotice({
        kind: 'error',
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
            text:
              `Đã điền ${filled} ô phấn đấu để đạt ${goalLabel}.` +
              (unreachable.length ? ` Môn ${unreachable.join(', ')} cần trên 10 điểm, đã điền tối đa 10.` : ' Bạn có thể sửa lại từng ô.') +
              (missingFinal ? ' Mẹo: nhập đủ điểm đã chốt (ô vàng) trước, web sẽ điền sát với sức học của bạn hơn.' : ''),
          }
        : { kind: 'error', text: 'Không còn ô phấn đấu (xanh) nào để trống. Đổi ô sang “Phấn đấu” hoặc xóa điểm để web điền.' },
    )
  }

  const titleBadge =
    ov.title === 'xuat-sac'
      ? { text: '🏆 Học sinh Xuất sắc', cls: 'border-amber-300/40 bg-amber-300/15 text-amber-200' }
      : ov.title === 'gioi'
        ? { text: '🥇 Học sinh Giỏi', cls: 'border-emerald-300/40 bg-emerald-400/15 text-emerald-200' }
        : { text: 'Chưa đạt danh hiệu', cls: 'border-white/15 bg-white/[0.06] text-white/70' }

  return (
    <main className="w-full max-w-4xl">
      <nav className="mb-4">
        <a href="#/vn" className={smallButton}>
          <ArrowLeftIcon className="size-3.5" />
          Máy tính điểm
        </a>
      </nav>

      <header className="glass-card relative mb-4 overflow-hidden p-6 sm:mb-5 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white/[0.08] to-transparent" />
        <div className="relative">
          <p className="text-xs font-semibold tracking-[0.14em] text-fuchsia-200/80 uppercase">📊 Bảng điểm tổng quát</p>
          <h1 className="mt-2 text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
            Toàn cảnh điểm các môn và đường tới danh hiệu
          </h1>
          <p className="mt-2 text-sm text-pretty text-white/65 sm:text-base">
            Nhập điểm như bảng điểm của lớp. Web tính ĐTB từng môn, xếp loại học tập và chỉ ra môn nào cần bao nhiêu
            điểm để đạt Học sinh Giỏi hay Học sinh Xuất sắc (theo Thông tư 22).
          </p>
        </div>
      </header>

      <div className="space-y-4 sm:space-y-5">
        <section className="glass-card relative overflow-hidden border-emerald-300/30 p-5 sm:p-7">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-br from-emerald-400/[0.12] via-transparent to-sky-400/[0.1]" />
          <div className="relative">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
              <span aria-hidden>📗</span> Làm kế hoạch bằng file Excel của lớp
            </h2>
            <p className="mt-1 text-sm text-pretty text-white/65">
              Mở file kế hoạch (mẫu “Kế hoạch HK…”), để web tự điền các ô xanh phấn đấu cho đúng mục tiêu, rồi tải về file
              đúng mẫu để nộp. Điểm và họ tên chỉ nằm trên máy của bạn.
            </p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              <button type="button" onClick={() => fileRef.current?.click()} className={`${secondaryButton} h-auto flex-col gap-0.5 py-3`}>
                <span className="text-base">📂 Mở file Excel</span>
                <span className="text-[11px] font-normal text-white/55">Đọc điểm và màu vàng/xanh</span>
              </button>
              <button type="button" onClick={autoFill} disabled={!board.rows.length} className={`${primaryButton} h-auto flex-col gap-0.5 py-3`}>
                <span className="text-base">✨ Tự điền điểm phấn đấu</span>
                <span className="text-[11px] font-normal text-white/80">Theo mục tiêu {goalLabel}</span>
              </button>
              <button
                type="button"
                onClick={() => downloadBlob(exportBoardXlsx(board), exportFileName(board))}
                disabled={!board.rows.length}
                className={`${secondaryButton} h-auto flex-col gap-0.5 border-emerald-300/40 py-3`}
              >
                <span className="text-base">⬇ Tải file Excel</span>
                <span className="text-[11px] font-normal text-white/55">Đúng mẫu, có công thức TBHK</span>
              </button>
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
            <div className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr]">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-white/65">Họ và tên (ghi vào file)</span>
                <input
                  value={board.name ?? ''}
                  maxLength={60}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="VD: Nguyễn Văn A"
                  className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-base text-white outline-none placeholder:text-white/30 focus:border-fuchsia-300/60 focus:ring-4 focus:ring-fuchsia-500/20"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-white/65">Mã HS (không bắt buộc)</span>
                <input
                  value={board.code ?? ''}
                  maxLength={20}
                  onChange={(e) => set({ code: e.target.value })}
                  className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-base text-white outline-none focus:border-fuchsia-300/60 focus:ring-4 focus:ring-fuchsia-500/20"
                />
              </label>
            </div>
            {notice && (
              <p
                role="status"
                className={`mt-4 rounded-xl border px-3.5 py-2.5 text-sm text-pretty ${
                  notice.kind === 'ok' ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100' : 'border-amber-300/30 bg-amber-300/10 text-amber-100'
                }`}
              >
                {notice.text}
              </p>
            )}
          </div>
        </section>

        <Card title="Thiết lập">
          <p className="mb-2 text-sm font-medium text-white/85">Lớp</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {VN_GRADES.map(({ grade, level }) => (
              <button
                key={grade}
                type="button"
                aria-pressed={board.grade === grade}
                onClick={() => chooseGrade(grade)}
                className={`${selectableCard(board.grade === grade)} flex h-14 flex-col items-center justify-center`}
              >
                <span className="text-base font-semibold">Lớp {grade}</span>
                <span className="text-[10px] tracking-wide text-white/45 uppercase">{level === 'thcs' ? 'THCS' : 'THPT'}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-white/85">Đang tính</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'hk1', label: 'Học kì I' },
                    { id: 'hk2', label: 'Học kì II + cả năm' },
                  ] as { id: Term; label: string }[]
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={board.term === t.id}
                    onClick={() => set({ term: t.id })}
                    className={`${selectableCard(board.term === t.id)} flex h-11 items-center justify-center text-sm font-semibold`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-white/85">Mục tiêu</p>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    aria-pressed={board.goal === g.id}
                    onClick={() => set({ goal: g.id })}
                    className={`${selectableCard(board.goal === g.id)} px-3 py-2 text-left`}
                  >
                    <span className="block text-sm font-semibold">{g.label}</span>
                    <span className="block text-[11px] text-white/50">{g.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2 text-sm text-white/80">
            <label className="flex items-start gap-2.5">
              <input type="checkbox" checked={board.conductOk} onChange={(e) => set({ conductOk: e.target.checked })} className="mt-0.5 size-4 accent-fuchsia-400" />
              Kết quả rèn luyện (hạnh kiểm) dự kiến mức Tốt
            </label>
            <label className="flex items-start gap-2.5">
              <input type="checkbox" checked={board.commentsOk} onChange={(e) => set({ commentsOk: e.target.checked })} className="mt-0.5 size-4 accent-fuchsia-400" />
              Các môn đánh giá bằng nhận xét (GDTC, Nghệ thuật, HĐTN, GD địa phương) đều Đạt
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => setBoard({ ...board, grade: 10, term: 'hk1', rows: exampleRows() })} className={smallButton}>
              📋 Xem bảng mẫu
            </button>
            {board.rows.length > 0 && (
              <button
                type="button"
                onClick={() => setBoard({ ...board, rows: board.grade ? DEFAULT_SUBJECTS[levelOf(board.grade)].map((m) => newBoardRow(m)) : [] })}
                className={smallButton}
              >
                🧹 Xóa hết điểm
              </button>
            )}
          </div>
        </Card>

        <Card
          title={isYear ? 'Tổng quan cả năm' : 'Tổng quan học kì I'}
          sub={
            isYear
              ? 'ĐTB cả năm = (HK I + 2 × HK II) ÷ 3. Nhập ĐTB HK I ở từng môn bên dưới.'
              : 'Danh hiệu được xét theo cả năm. Đây là dự báo nếu cả năm giữ được kết quả như học kì này.'
          }
        >
          {ov.counted === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-sm text-white/55">
              Chọn lớp rồi nhập điểm các môn bên dưới, hoặc bấm “Xem bảng mẫu”.
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
        </Card>

        {plan.rows.length > 0 && (
          <Card
            title={`Đường tới ${goalLabel}`}
            sub={`Web chọn 6 môn dễ đạt ${board.goal === 'hsxs' ? '9,0' : '8,0'} nhất; các môn còn lại chỉ cần từ 6,5. “Cần TB” là điểm trung bình cần đạt ở các ô dự kiến và ô còn trống.`}
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
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.top ? 'bg-fuchsia-400/15 text-fuchsia-200' : 'bg-white/[0.08] text-white/60'}`}>
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

        <Card
          title="Điểm các môn"
          sub="Gõ điểm vào ô. Ô vàng là điểm đã chốt, ô xanh là điểm phấn đấu: chạm nhãn dưới ô để đổi. Ô vàng để trống là bài chưa có điểm."
        >
          {board.rows.length > 0 && (
            <p className={`mb-3 text-xs ${cdCount === 3 ? 'text-emerald-300' : 'text-amber-200/85'}`}>
              Chuyên đề: {cdCount}/3 môn {cdCount === 3 ? '✓' : '(mỗi học sinh điền cột chuyên đề ở 3 môn, bấm “＋ CĐ” ở môn bạn học chuyên đề)'}
            </p>
          )}
          {!board.grade ? (
            <p className="rounded-xl border border-amber-300/25 bg-amber-300/[0.07] px-3.5 py-2.5 text-sm text-amber-100/85">Chọn lớp ở phần Thiết lập trước nhé.</p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-3 text-xs text-white/60">
                <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded border border-amber-300/70 bg-amber-300/20" /> Đã chốt</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded border border-dashed border-emerald-300/70 bg-emerald-400/20" /> Dự kiến</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded border border-white/25" /> Chưa có điểm</span>
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
                              className="mt-1 h-9 w-40 rounded-lg border border-white/15 bg-white/[0.06] px-2.5 text-sm text-white outline-none"
                            />
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] tracking-wide text-white/50 uppercase">{isYear ? 'HK II / Cả năm' : 'TBHK'}</p>
                          <p className="text-2xl font-bold tabular-nums">
                            {stats.termAvg === null ? '–' : formatAverage(stats.termAvg)}
                            {isYear && stats.yearAvg !== null && <span className="text-base font-semibold text-fuchsia-200"> / {formatAverage(stats.yearAvg)}</span>}
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
                                className="h-11 w-16 rounded-xl border border-sky-300/50 bg-sky-400/[0.08] text-center text-base font-medium text-white tabular-nums outline-none focus:ring-4 focus:ring-fuchsia-500/20"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {stats.invalid && <p className="mt-2 text-xs text-red-300">Có ô ngoài khoảng 0–10.</p>}
                      {need && !stats.invalid && <p className={`mt-3 text-sm font-medium ${need.tone}`}>{need.text}</p>}
                      <button
                        type="button"
                        onClick={() => set({ rows: board.rows.filter((r) => r.id !== row.id) })}
                        className="mt-3 text-xs text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
                      >
                        Bỏ môn này
                      </button>
                    </li>
                  )
                })}
              </ul>
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
            </>
          )}
        </Card>
      </div>
    </main>
  )
}
