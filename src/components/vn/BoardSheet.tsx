// The class planning sheet ("Kế hoạch HK…") rebuilt on the page: same columns,
// same yellow (final) / green (target) cells, same notes, typed into directly.

import { useState } from 'react'
import { formatAverage, parseScore, sanitizeScoreInput } from '../../lib/vnGrade'
import { emptyCell, MAX_HS1, MAX_HS2, type BoardRow, type Cell, type Goal, type RowStats } from '../../lib/vnBoard'

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
type Slot = { group: 'hs1' | 'cd' | 'hs2' | 'hs3'; index: number; caption: string }
const COLUMNS: Slot[] = [
  { group: 'hs1', index: 0, caption: 'Miệng' },
  ...[1, 2, 3, 4, 5].map((index) => ({ group: 'hs1' as const, index, caption: `15 phút lần ${index}` })),
  { group: 'cd', index: 0, caption: 'Chuyên đề' },
  ...[0, 1, 2].map((index) => ({ group: 'hs2' as const, index, caption: `45 phút lần ${index + 1}` })),
  { group: 'hs3', index: 0, caption: 'HS3 (cuối kì)' },
]

const FINAL_CELL = 'bg-[#fff04d] text-[#1f1a00]'
const PLAN_CELL = 'bg-[#cfe8c0] text-[#10260b]'

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

const TOOLS: { id: Mode; label: string; swatch?: string }[] = [
  { id: 'type', label: '✏️ Nhập điểm' },
  { id: 'final', label: 'Tô vàng · đã chốt', swatch: FINAL_CELL },
  { id: 'plan', label: 'Tô xanh · phấn đấu', swatch: PLAN_CELL },
  { id: 'erase', label: '🧽 Xóa ô' },
]

const HINTS: Record<Mode, string> = {
  type: 'Gõ điểm thẳng vào ô (VD 8,5). Ô có dấu + là cột còn trống: gõ vào để thêm bài. Muốn đổi màu ô thì chọn công cụ tô màu.',
  final: 'Chạm vào ô để tô vàng: điểm đã có, không đổi nữa.',
  plan: 'Chạm vào ô để tô xanh: điểm bạn đặt mục tiêu sẽ đạt.',
  erase: 'Chạm vào ô để xóa điểm. Ô cuối của một nhóm (và ô chuyên đề) sẽ bị bỏ hẳn.',
}

export function BoardSheet({ title, rows, goal, isYear, onRow, onRemove, onGoal }: Props) {
  const [mode, setMode] = useState<Mode>('type')
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

  const th = 'border-r border-b border-black/30 px-1 py-1.5 text-center text-[11px] font-bold text-[#111]'
  const weightCell = 'border-r border-b border-white/15 bg-white/[0.06] py-1 text-center text-[11px] text-white/60'

  return (
    <div>
      <div role="toolbar" aria-label="Công cụ bảng" className="mb-2 flex flex-wrap gap-1.5">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            aria-pressed={mode === tool.id}
            onClick={() => setMode(tool.id)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
              mode === tool.id ? 'border-fuchsia-300/60 bg-white/[0.14] text-white' : 'border-white/15 bg-white/[0.05] text-white/70 hover:bg-white/[0.1]'
            }`}
          >
            {tool.swatch && <span aria-hidden className={`size-3 rounded-sm border border-black/30 ${tool.swatch}`} />}
            {tool.label}
          </button>
        ))}
      </div>
      <p className="mb-3 text-xs text-pretty text-white/55">{HINTS[mode]}</p>

      <div className="overflow-x-auto pb-2">
        <table className={`w-full border-separate border-spacing-0 text-sm ${isYear ? 'min-w-[52rem]' : 'min-w-[46rem]'}`}>
          <thead>
            <tr>
              <th rowSpan={4} scope="col" className={`${th} sticky left-0 z-10 w-24 border-t border-l bg-[#bfbfbf]`}>
                Môn
              </th>
              <th colSpan={isYear ? 15 : 13} className={`${th} border-t bg-[#ff2d2d] text-left text-white`}>
                {title}
              </th>
            </tr>
            <tr>
              <th colSpan={7} className={`${th} bg-[#bfbfbf]`}>
                HS1
              </th>
              <th colSpan={3} className={`${th} bg-[#00b0f0]`}>
                HS2
              </th>
              <th rowSpan={2} className={`${th} bg-[#c00000] text-white`}>
                HS3
              </th>
              <th rowSpan={2} className={`${th} bg-[#c00000] text-white`}>
                TBHK
              </th>
              {isYear && (
                <>
                  <th rowSpan={2} className={`${th} bg-[#7dd3fc]`}>
                    TB HK I
                  </th>
                  <th rowSpan={2} className={`${th} bg-[#e879f9]`}>
                    Cả năm
                  </th>
                </>
              )}
              <th rowSpan={3} className={`${th} bg-[#2b2f55] text-white/90`}>
                Cần TB
                <span className="block text-[9px] font-medium text-white/60">ở ô chưa chốt</span>
              </th>
            </tr>
            <tr>
              {['Miệng', "15'", "15'", "15'", "15'", "15'"].map((label, i) => (
                <th key={i} className={`${th} bg-[#d9d9d9]`}>
                  {label}
                </th>
              ))}
              <th className={`${th} bg-[#a6a6a6]`}>Chuyên đề</th>
              {["45'", "45'", "45'"].map((label, i) => (
                <th key={i} className={`${th} bg-[#00b0f0]`}>
                  {label}
                </th>
              ))}
            </tr>
            <tr>
              {[1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3].map((w, i) => (
                <td key={i} className={weightCell}>
                  {w}
                </td>
              ))}
              <td className={weightCell} />
              {isYear && (
                <>
                  <td className={weightCell}>1</td>
                  <td className={weightCell} />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ row, name, fullName, stats, need }) => (
              <tr key={row.id}>
                <th scope="row" className="sticky left-0 z-10 border-r border-b border-l border-white/15 bg-[#1c1f45] py-1 pr-0.5 pl-2 text-left text-[13px] font-semibold whitespace-nowrap">
                  <span className="flex items-center justify-between gap-1">
                    {row.mon === 'khac' ? (
                      <input
                        value={row.khac}
                        maxLength={40}
                        onChange={(e) => onRow(row.id, { khac: e.target.value })}
                        placeholder="Tên môn"
                        aria-label="Tên môn khác"
                        className="h-7 w-[4.25rem] rounded-md border-r border-b border-white/15 bg-white/[0.06] px-1.5 text-[13px] text-white outline-none placeholder:text-white/35"
                      />
                    ) : (
                      <span title={fullName}>{name}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(row.id)}
                      aria-label={`Bỏ môn ${fullName}`}
                      title="Bỏ môn này"
                      className="grid size-6 shrink-0 place-items-center rounded-md text-xs text-white/30 hover:bg-white/10 hover:text-white/80 focus-visible:text-white/80"
                    >
                      ✕
                    </button>
                  </span>
                </th>
                {COLUMNS.map((slot, i) => {
                  const cell = getCell(row, slot)
                  const addable = !cell && canAdd(row, slot)
                  const color = cell ? (cell.plan ? PLAN_CELL : FINAL_CELL) : addable ? 'bg-white/[0.07] text-white' : 'bg-white/[0.015]'
                  const invalid = cell !== null && parseScore(cell.v).status === 'invalid'
                  const label = `${fullName}, ${slot.caption}`
                  const state = cell ? (cell.plan ? 'ô xanh, phấn đấu' : 'ô vàng, đã chốt') : 'cột trống'
                  return (
                    <td
                      key={i}
                      className={`h-10 min-w-11 border-r border-b border-black/25 p-0 text-center ${color} ${invalid ? 'outline-2 -outline-offset-2 outline-red-500 outline-solid' : ''}`}
                    >
                      {mode === 'type' ? (
                        (cell || addable) && (
                          <input
                            type="text"
                            inputMode="decimal"
                            aria-label={`${label} (${state})`}
                            aria-invalid={invalid || undefined}
                            value={(cell?.v ?? '').replace('.', ',')}
                            placeholder={addable ? '+' : ''}
                            onChange={(e) => type(row, slot, e.target.value)}
                            className="h-10 w-full bg-transparent text-center text-[15px] font-semibold tabular-nums outline-none placeholder:text-white/30 focus:bg-white/40 focus:ring-2 focus:ring-fuchsia-500 focus:ring-inset"
                          />
                        )
                      ) : (
                        <button
                          type="button"
                          aria-label={`${label}: ${state}`}
                          disabled={!cell && !addable}
                          onClick={() => paint(row, slot)}
                          className="h-10 w-full text-[15px] font-semibold tabular-nums enabled:hover:outline-2 enabled:hover:-outline-offset-2 enabled:hover:outline-fuchsia-500 enabled:hover:outline-solid disabled:cursor-not-allowed"
                        >
                          {cell ? cell.v.replace('.', ',') : addable ? <span className="text-white/30">+</span> : ''}
                        </button>
                      )}
                    </td>
                  )
                })}
                <td className="min-w-12 border-r border-b border-black/25 bg-[#d9d9d9] text-center text-[15px] font-bold text-[#111] tabular-nums">
                  {stats.termAvg === null ? '' : formatAverage(stats.termAvg)}
                </td>
                {isYear && (
                  <>
                    <td className="h-10 min-w-12 border-r border-b border-black/25 bg-[#e0f2fe] p-0 text-[#0c2a3d]">
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label={`ĐTB học kì I môn ${fullName}`}
                        value={row.hk1.replace('.', ',')}
                        onChange={(e) => onRow(row.id, { hk1: sanitizeScoreInput(e.target.value) })}
                        className="h-10 w-full bg-transparent text-center text-[15px] font-semibold tabular-nums outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-inset"
                      />
                    </td>
                    <td className="min-w-12 border-r border-b border-black/25 bg-[#fae8ff] text-center text-[15px] font-bold text-[#3b0a45] tabular-nums">
                      {stats.yearAvg === null ? '' : formatAverage(stats.yearAvg)}
                    </td>
                  </>
                )}
                <td className="min-w-20 border-r border-b border-white/15 bg-white/[0.04] px-1.5 text-center leading-tight">
                  {stats.invalid ? (
                    <span className="text-[11px] font-semibold text-red-300">Ô ngoài 0–10</span>
                  ) : (
                    need && (
                      <>
                        <span className={`block text-[15px] font-bold tabular-nums ${need.tone}`}>{need.value}</span>
                        <span className="block text-[10px] text-white/50">{need.sub}</span>
                      </>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="mt-4 grid gap-x-4 gap-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm sm:grid-cols-[11rem_1fr]">
        <dt className="font-semibold text-white/85">Ghi chú</dt>
        <dd className="text-white/70">HS học môn Chuyên đề nào thì phải điền thêm 1 điểm chuyên đề.</dd>
        <dt className="flex items-center gap-2 font-semibold text-white/85">
          <span aria-hidden className={`inline-block size-3.5 rounded-sm border border-black/30 ${FINAL_CELL}`} /> Cột vàng
        </dt>
        <dd className="text-white/70">Điểm đã CHỐT.</dd>
        <dt className="flex items-center gap-2 font-semibold text-white/85">
          <span aria-hidden className={`inline-block size-3.5 rounded-sm border border-black/30 ${PLAN_CELL}`} /> Cột xanh
        </dt>
        <dd className="text-white/70">
          Điểm phấn đấu (MỖI HS ĐIỀN CỘT CĐ Ở 3 MÔN).{' '}
          <span className={`font-semibold ${cdCount === 3 ? 'text-emerald-300' : 'text-amber-200'}`}>
            Bạn đang điền {cdCount}/3 môn{cdCount === 3 ? ' ✓' : ''}.
          </span>
        </dd>
        <dt className="font-semibold text-white/85">Mục tiêu (ghi rõ HSG/HSXS)</dt>
        <dd className="flex gap-1.5">
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
              className={`h-8 rounded-lg border px-3 text-xs font-bold ${
                goal === g.id ? 'border-fuchsia-300/60 bg-fuchsia-400/20 text-white' : 'border-white/15 bg-white/[0.05] text-white/60 hover:bg-white/[0.1]'
              }`}
            >
              {g.label}
            </button>
          ))}
        </dd>
      </dl>
    </div>
  )
}
