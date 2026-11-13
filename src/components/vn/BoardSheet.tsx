// The class planning sheet ("Kế hoạch HK…") rebuilt on the page: same columns,
// same yellow (final) / green (target) cells, same notes, typed into directly.

import { useState, type ReactNode } from 'react'
import { formatAverage, parseScore, sanitizeScoreInput } from '../../lib/vnGrade'
import { emptyCell, MAX_HS1, MAX_HS2, type BoardRow, type Cell, type Goal, type RowStats } from '../../lib/vnBoard'
import type { SheetStyle } from '../../lib/appearance'
import { useAppearance } from '../appearance/AppearanceContext'
import { EraserIcon, PencilIcon } from '../icons'

type Mode = 'type' | 'final' | 'plan' | 'erase'

export type SheetNeed = { value: string; sub: string; tone: string }

export type SheetRow = {
  row: BoardRow
  /** Short name as written in the class sheet ("Toán", "GDQP"…). */
  name: string
  fullName: string
  stats: RowStats
  need?: SheetNeed
}

type Props = {
  title: string
  rows: SheetRow[]
  goal: Goal
  isYear: boolean
  onRow: (id: string, patch: Partial<BoardRow>) => void
  onRemove: (id: string) => void
  onGoal: (goal: Goal) => void
}

// Column layout of the sheet: Miệng, 15' ×5, Chuyên đề, 45' ×3, HS3.
type Slot = { group: 'hs1' | 'cd' | 'hs2' | 'hs3'; index: number; caption: string; head: string }
const COLUMNS: Slot[] = [
  { group: 'hs1', index: 0, caption: 'Miệng', head: 'Miệng' },
  ...[1, 2, 3, 4, 5].map((index) => ({ group: 'hs1' as const, index, caption: `15 phút lần ${index}`, head: "15'" })),
  { group: 'cd', index: 0, caption: 'Chuyên đề', head: 'CĐ' },
  ...[0, 1, 2].map((index) => ({ group: 'hs2' as const, index, caption: `45 phút lần ${index + 1}`, head: "45'" })),
  { group: 'hs3', index: 0, caption: 'HS3 (cuối kì)', head: 'Cuối kì' },
]

// Yellow = final, green = target, as in the class sheet. "Hiện đại" tones the
// colours down for the dark page; "Giống Excel" keeps the sheet's own fills.
const CHIP = 'h-9 w-full rounded-lg border text-center text-[15px] font-semibold tabular-nums transition'
const OPEN = 'border-dashed border-white/[0.12] bg-transparent text-white/35'
const INVALID = 'border-red-400/80 bg-red-400/15 text-red-100'

type Look = {
  final: string
  finalEmpty: string
  plan: string
  planEmpty: string
  caption: string
  head: Record<'subject' | 'hs1' | 'hs2' | 'hs3' | 'tb' | 'year' | 'total' | 'need', string>
  col: (index: number) => string
  tbCell: string
  totalCell: string
}

const darkHead = 'bg-ink-800 text-white/85'
const LOOKS: Record<SheetStyle, Look> = {
  modern: {
    final: 'border-amber-300/45 bg-amber-300/[0.15] text-amber-50',
    finalEmpty: 'border-amber-300/40 bg-amber-300/[0.08] text-amber-50',
    plan: 'border-dashed border-emerald-300/60 bg-emerald-400/[0.13] text-emerald-50',
    planEmpty: 'border-dashed border-emerald-300/50 bg-emerald-400/[0.07] text-emerald-50',
    caption: 'text-white/90',
    head: {
      subject: 'bg-ink-800 text-white/45',
      hs1: `${darkHead} shadow-[inset_0_2px_0_var(--color-slate-400)]`,
      hs2: `${darkHead} shadow-[inset_0_2px_0_var(--color-sky-400)]`,
      hs3: `${darkHead} shadow-[inset_0_2px_0_var(--color-rose-400)]`,
      tb: 'bg-accent-500/[0.1] text-accent-100 shadow-[inset_0_2px_0_var(--color-accent-400)]',
      year: `${darkHead} shadow-[inset_0_2px_0_var(--color-cyan-300)]`,
      total: `${darkHead} shadow-[inset_0_2px_0_var(--color-accent-400)]`,
      need: darkHead,
    },
    col: () => 'bg-ink-800 text-white/45',
    tbCell: 'bg-accent-500/[0.07] text-white',
    totalCell: 'bg-accent-500/[0.07] text-accent-100',
  },
  excel: {
    final: 'border-[#c9b800] bg-[#fff04d] text-[#1f1a00]',
    finalEmpty: 'border-[#c9b800] bg-[#fff04d]/80 text-[#1f1a00]',
    plan: 'border-[#8fbf7a] bg-[#cfe8c0] text-[#10260b]',
    planEmpty: 'border-[#8fbf7a] bg-[#cfe8c0]/80 text-[#10260b]',
    caption: 'text-white',
    head: {
      subject: 'bg-[#bfbfbf] text-[#333]',
      hs1: 'bg-[#bfbfbf] text-[#111]',
      hs2: 'bg-[#00b0f0] text-[#04202b]',
      hs3: 'bg-[#c00000] text-[#fff]',
      tb: 'bg-[#c00000] text-[#fff]',
      year: 'bg-[#7dd3fc] text-[#04202b]',
      total: 'bg-[#e879f9] text-[#2a0730]',
      need: darkHead,
    },
    col: (i) => (i < 6 ? 'bg-[#d9d9d9] text-[#222]' : i === 6 ? 'bg-[#a6a6a6] text-[#111]' : i < 10 ? 'bg-[#00b0f0] text-[#04202b]' : 'bg-[#c00000] text-[#fff]'),
    tbCell: 'bg-[#d9d9d9] text-[#111]',
    totalCell: 'bg-[#fae8ff] text-[#3b0a45]',
  },
}

function chipClass(cell: Cell | null, look: Look): string {
  if (!cell) return OPEN
  if (parseScore(cell.v).status === 'invalid') return INVALID
  const empty = cell.v === ''
  if (cell.plan) return empty ? look.planEmpty : look.plan
  return empty ? look.finalEmpty : look.final
}

function getCell(row: BoardRow, slot: Slot): Cell | null {
  if (slot.group === 'hs1') return row.hs1[slot.index] ?? null
  if (slot.group === 'cd') return row.cd
  if (slot.group === 'hs2') return row.hs2[slot.index] ?? null
  return row.hs3
}

/** The next empty column of a group can be started; later ones wait their turn. */
function canAdd(row: BoardRow, slot: Slot): boolean {
  if (slot.group === 'hs1') return slot.index === row.hs1.length && row.hs1.length < MAX_HS1
  if (slot.group === 'hs2') return slot.index === row.hs2.length && row.hs2.length < MAX_HS2
  if (slot.group === 'cd') return row.cd === null
  return false
}

function withCell(row: BoardRow, slot: Slot, cell: Cell | null): Partial<BoardRow> {
  if (slot.group === 'cd') return { cd: cell }
  if (slot.group === 'hs3') return { hs3: cell ?? emptyCell(true) }
  const list = [...row[slot.group]]
  if (cell === null) list.splice(slot.index, 1)
  else list[slot.index] = cell
  return { [slot.group]: list }
}

/** Erasing the last column of a group drops it, like deleting the column in the sheet. */
function canDrop(row: BoardRow, slot: Slot): boolean {
  if (slot.group === 'hs1') return slot.index === row.hs1.length - 1 && row.hs1.length > 1
  if (slot.group === 'hs2') return slot.index === row.hs2.length - 1 && row.hs2.length > 1
  return slot.group === 'cd'
}

/** A group starts a new block of columns: a faint divider on its left edge. */
const groupStart = (i: number) => i === 7 || i === 10

const Swatch = ({ cls }: { cls: string }) => <span aria-hidden className={`inline-block size-3.5 rounded border ${cls}`} />

const tools = (look: Look): { id: Mode; label: string; icon: ReactNode }[] => [
  { id: 'type', label: 'Nhập điểm', icon: <PencilIcon className="size-3.5" /> },
  { id: 'final', label: 'Tô vàng · đã chốt', icon: <Swatch cls={look.final} /> },
  { id: 'plan', label: 'Tô xanh · phấn đấu', icon: <Swatch cls={look.plan} /> },
  { id: 'erase', label: 'Xóa ô', icon: <EraserIcon className="size-3.5" /> },
]

const HINTS: Record<Mode, string> = {
  type: 'Gõ điểm thẳng vào ô, VD 8,5. Ô viền đứt có dấu + là cột còn trống: gõ vào để thêm bài.',
  final: 'Chạm vào ô để tô vàng: điểm đã có, không đổi nữa.',
  plan: 'Chạm vào ô để tô xanh: điểm bạn đặt mục tiêu sẽ đạt.',
  erase: 'Chạm vào ô để xóa điểm. Ô cuối của một nhóm (và ô chuyên đề) sẽ bị bỏ hẳn.',
}

export function BoardSheet({ title, rows, goal, isYear, onRow, onRemove, onGoal }: Props) {
  const [mode, setMode] = useState<Mode>('type')
  const { appearance, update } = useAppearance()
  const look = LOOKS[appearance.sheet]
  const cdCount = rows.filter((r) => r.row.cd).length

  const paint = (row: BoardRow, slot: Slot) => {
    const cell = getCell(row, slot)
    if (mode === 'erase') {
      if (cell) onRow(row.id, withCell(row, slot, canDrop(row, slot) ? null : { ...cell, v: '' }))
      return
    }
    const plan = mode === 'plan'
    if (cell) onRow(row.id, withCell(row, slot, { ...cell, plan }))
    else if (canAdd(row, slot)) onRow(row.id, withCell(row, slot, emptyCell(plan)))
  }

  const type = (row: BoardRow, slot: Slot, raw: string) => {
    const cell = getCell(row, slot) ?? emptyCell(slot.group === 'cd')
    onRow(row.id, withCell(row, slot, { ...cell, v: sanitizeScoreInput(raw) }))
  }

  const groupHead = 'border-b border-white/[0.06] px-2 pt-2.5 pb-1.5 text-xs font-semibold whitespace-nowrap'
  const colHead = 'border-b border-white/[0.08] px-1 pt-1 pb-2 text-center text-[11px] font-medium'
  const divider = 'border-l border-white/[0.08]'
  const cellBase = 'border-b border-white/[0.05] px-[3px] py-[3px]'

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="toolbar" aria-label="Công cụ bảng" className="inline-flex flex-wrap gap-1 rounded-xl border border-white/[0.08] bg-ink-900/70 p-1">
          {tools(look).map((tool) => (
            <button
              key={tool.id}
              type="button"
              aria-pressed={mode === tool.id}
              onClick={() => setMode(tool.id)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-accent-400/60 focus-visible:outline-none ${
                mode === tool.id ? 'bg-white/[0.1] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]' : 'text-white/55 hover:text-white/85'
              }`}
            >
              {tool.icon}
              {tool.label}
            </button>
          ))}
        </div>
        <p className="min-w-0 flex-1 basis-60 text-xs text-pretty text-white/50">{HINTS[mode]}</p>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-white/[0.06] px-4 py-3">
          <p className={`text-sm font-semibold ${look.caption}`}>{title}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/55" aria-label="Chú thích màu ô">
              <li className="inline-flex items-center gap-1.5">
                <Swatch cls={look.final} /> Đã chốt
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Swatch cls={look.plan} /> Phấn đấu
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Swatch cls={OPEN} /> Còn trống
              </li>
            </ul>
            <div role="group" aria-label="Kiểu bảng" className="inline-flex gap-0.5 rounded-lg border border-white/[0.08] bg-ink-950/60 p-0.5">
              {(
                [
                  { id: 'modern', label: 'Hiện đại' },
                  { id: 'excel', label: 'Giống Excel' },
                ] as { id: SheetStyle; label: string }[]
              ).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={appearance.sheet === o.id}
                  onClick={() => update({ sheet: o.id })}
                  className={`h-7 rounded-md px-2.5 text-[11px] font-semibold transition ${
                    appearance.sheet === o.id ? 'bg-white/[0.12] text-white' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full border-separate border-spacing-0 text-sm ${isYear ? 'min-w-[54rem]' : 'min-w-[47rem]'}`}>
            <thead>
              <tr>
                <th rowSpan={2} scope="col" className={`${groupHead} ${look.head.subject} sticky left-0 z-10 w-24 border-b-white/[0.08] text-left align-bottom`}>
                  <span className="block pb-0.5 pl-1 text-[11px] font-medium">Môn</span>
                </th>
                <th colSpan={7} className={`${groupHead} ${look.head.hs1} text-left`}>
                  Hệ số 1 <span className="font-normal opacity-55">· miệng, 15 phút, chuyên đề</span>
                </th>
                <th colSpan={3} className={`${groupHead} ${look.head.hs2} ${divider} text-left`}>
                  Hệ số 2 <span className="font-normal opacity-55">· 45 phút</span>
                </th>
                <th className={`${groupHead} ${look.head.hs3} ${divider} text-center`}>Hệ số 3</th>
                <th rowSpan={2} className={`${groupHead} ${look.head.tb} ${divider} text-center align-middle`}>
                  TBHK
                </th>
                {isYear && (
                  <>
                    <th rowSpan={2} className={`${groupHead} ${look.head.year} ${divider} text-center align-middle`}>
                      TB HK I
                    </th>
                    <th rowSpan={2} className={`${groupHead} ${look.head.total} text-center align-middle`}>
                      Cả năm
                    </th>
                  </>
                )}
                <th rowSpan={2} className={`${groupHead} ${look.head.need} ${divider} text-center align-middle`}>
                  Cần TB
                  <span className="block text-[10px] font-normal text-white/40">ở ô chưa chốt</span>
                </th>
              </tr>
              <tr>
                {COLUMNS.map((slot, i) => (
                  <th key={i} scope="col" className={`${colHead} ${look.col(i)} ${groupStart(i) ? divider : ''}`}>
                    {slot.head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ row, name, fullName, stats, need }) => (
                <tr key={row.id} className="group/row">
                  <th
                    scope="row"
                    className={`${cellBase} sticky left-0 z-10 bg-ink-900 pr-0.5 pl-3 text-left text-[13px] font-semibold whitespace-nowrap transition group-hover/row:bg-ink-800`}
                  >
                    <span className="flex items-center justify-between gap-1">
                      {row.mon === 'khac' ? (
                        <input
                          value={row.khac}
                          maxLength={40}
                          onChange={(e) => onRow(row.id, { khac: e.target.value })}
                          placeholder="Tên môn"
                          aria-label="Tên môn khác"
                          className="h-8 w-[4.25rem] rounded-md border border-white/10 bg-white/[0.04] px-1.5 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-accent-300/60"
                        />
                      ) : (
                        <span title={fullName}>{name}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemove(row.id)}
                        aria-label={`Bỏ môn ${fullName}`}
                        title="Bỏ môn này"
                        className="grid size-6 shrink-0 place-items-center rounded-md text-[11px] text-white/20 transition hover:bg-white/10 hover:text-white/80 focus-visible:text-white/80"
                      >
                        ✕
                      </button>
                    </span>
                  </th>
                  {COLUMNS.map((slot, i) => {
                    const cell = getCell(row, slot)
                    const addable = !cell && canAdd(row, slot)
                    const invalid = cell !== null && parseScore(cell.v).status === 'invalid'
                    const label = `${fullName}, ${slot.caption}`
                    const state = cell ? (cell.plan ? 'ô xanh, phấn đấu' : 'ô vàng, đã chốt') : 'cột trống'
                    return (
                      <td key={i} className={`${cellBase} min-w-11 transition group-hover/row:bg-white/[0.015] ${groupStart(i) ? divider : ''}`}>
                        {cell || addable ? (
                          mode === 'type' ? (
                            <input
                              type="text"
                              inputMode="decimal"
                              aria-label={`${label} (${state})`}
                              aria-invalid={invalid || undefined}
                              value={(cell?.v ?? '').replace('.', ',')}
                              placeholder={addable ? '+' : ''}
                              onChange={(e) => type(row, slot, e.target.value)}
                              className={`${CHIP} ${chipClass(cell, look)} outline-none placeholder:text-white/30 hover:border-white/30 focus:border-accent-300 focus:ring-2 focus:ring-accent-400/40`}
                            />
                          ) : (
                            <button
                              type="button"
                              aria-label={`${label}: ${state}`}
                              onClick={() => paint(row, slot)}
                              className={`${CHIP} ${chipClass(cell, look)} hover:ring-2 hover:ring-accent-400/70 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none`}
                            >
                              {cell ? cell.v.replace('.', ',') : '+'}
                            </button>
                          )
                        ) : null}
                      </td>
                    )
                  })}
                  <td className={`${cellBase} ${divider} ${look.tbCell} min-w-14 text-center text-base font-bold tabular-nums`}>
                    {stats.termAvg === null ? <span className="opacity-30">–</span> : formatAverage(stats.termAvg)}
                  </td>
                  {isYear && (
                    <>
                      <td className={`${cellBase} ${divider} min-w-14`}>
                        <input
                          type="text"
                          inputMode="decimal"
                          aria-label={`ĐTB học kì I môn ${fullName}`}
                          value={row.hk1.replace('.', ',')}
                          placeholder="–"
                          onChange={(e) => onRow(row.id, { hk1: sanitizeScoreInput(e.target.value) })}
                          className={`${CHIP} border-cyan-300/35 bg-cyan-400/[0.08] text-cyan-50 outline-none placeholder:text-white/25 focus:border-accent-300 focus:ring-2 focus:ring-accent-400/40`}
                        />
                      </td>
                      <td className={`${cellBase} ${look.totalCell} min-w-14 text-center text-base font-bold tabular-nums`}>
                        {stats.yearAvg === null ? <span className="opacity-30">–</span> : formatAverage(stats.yearAvg)}
                      </td>
                    </>
                  )}
                  <td className={`${cellBase} ${divider} min-w-24 px-2 text-center leading-tight`}>
                    {stats.invalid ? (
                      <span className="text-[11px] font-semibold text-red-300">Có ô ngoài 0–10</span>
                    ) : (
                      need && (
                        <>
                          <span className={`block text-[15px] font-bold tabular-nums ${need.tone}`}>{need.value}</span>
                          <span className="block text-[10px] text-white/45">{need.sub}</span>
                        </>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-white/45 uppercase">Ghi chú</p>
          <p className="mt-1.5 text-sm text-pretty text-white/75">HS học môn Chuyên đề nào thì phải điền thêm 1 điểm chuyên đề.</p>
          <div className="mt-2.5 flex items-center gap-2 text-xs">
            <span aria-hidden className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`h-1.5 w-5 rounded-full ${i < cdCount ? 'bg-emerald-300' : 'bg-white/15'}`} />
              ))}
            </span>
            <span className={`font-semibold ${cdCount === 3 ? 'text-emerald-300' : 'text-amber-200'}`}>
              Đang điền {cdCount}/3 môn{cdCount === 3 ? ' ✓' : ''}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-white/45 uppercase">Màu ô</p>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-white/75">
            <Swatch cls={look.final} /> Cột vàng: điểm đã CHỐT
          </p>
          <p className="mt-1 flex items-start gap-2 text-sm text-pretty text-white/75">
            <span className="mt-[3px]">
              <Swatch cls={look.plan} />
            </span>
            <span>Cột xanh: điểm phấn đấu (mỗi HS điền cột CĐ ở 3 môn)</span>
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-white/45 uppercase">Mục tiêu (ghi rõ HSG/HSXS)</p>
          <div role="group" aria-label="Mục tiêu" className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-white/[0.08] bg-ink-900/70 p-1">
            {(
              [
                { id: 'hsg', label: 'HSG' },
                { id: 'hsxs', label: 'HSXS' },
              ] as { id: Goal; label: string }[]
            ).map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={goal === g.id}
                onClick={() => onGoal(g.id)}
                className={`h-8 rounded-lg text-xs font-bold transition ${
                  goal === g.id ? 'bg-accent-500 text-on-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]' : 'text-white/55 hover:text-white/85'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-white/45">{goal === 'hsxs' ? 'Giỏi + ít nhất 6 môn từ 9,0' : 'Mọi môn từ 6,5, ít nhất 6 môn từ 8,0'}</p>
        </div>
      </div>
    </div>
  )
}
