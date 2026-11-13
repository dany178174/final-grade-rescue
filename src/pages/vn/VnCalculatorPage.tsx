import type { Dispatch, SetStateAction } from 'react'
import { ArrowRightIcon, LifebuoyIcon, ResetIcon } from '../../components/icons'
import { ScoreInput } from '../../components/vn/ScoreInput'
import { VnResult } from '../../components/vn/VnResult'
import { hrefFor } from '../../lib/router'
import { primaryButton, secondaryButton, selectableCard } from '../../lib/ui'
import {
  EMPTY_VN_INPUTS,
  evaluateVn,
  MAX_TX,
  TARGET_PRESETS,
  vnParams,
  type VnInputs,
  type VnMode,
} from '../../lib/vnGrade'

type Props = { inputs: VnInputs; setInputs: Dispatch<SetStateAction<VnInputs>> }

const errorOf = (state: { status: string; error?: string }) => (state.status === 'invalid' ? state.error : undefined)

export function VnCalculatorPage({ inputs, setInputs }: Props) {
  const { items, targetState, outcome } = evaluateVn(inputs)
  const set = (patch: Partial<VnInputs>) => setInputs((prev) => ({ ...prev, ...patch }))
  const setTx = (index: number, value: string) =>
    setInputs((prev) => ({ ...prev, tx: prev.tx.map((v, i) => (i === index ? value : v)) }))

  const itemState = (key: string) => items.find((i) => i.key === key)?.state ?? { status: 'empty' as const }
  const isEmpty =
    !inputs.target && !inputs.gk && !inputs.ck && !inputs.hk1 && inputs.tx.every((v) => v === '')
  const planReady = outcome.status === 'ready'

  return (
    <main className="glass-card relative w-full max-w-md overflow-hidden p-6 sm:p-8 lg:max-w-4xl lg:p-10">
      <div
        aria-hidden
        className="card-sheen pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white/[0.08] to-transparent"
      />

      <header className="relative mb-7 flex flex-col items-center text-center lg:mb-9">
        <a
          href="#/"
          lang="en"
          className="mb-5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          🇺🇸 US grading (English) →
        </a>
        <div className="mb-4 grid size-12 place-items-center rounded-2xl border border-accent-300/25 bg-accent-500/15 shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--color-accent-500)_80%,transparent)]">
          <LifebuoyIcon className="size-6 text-accent-200" />
        </div>
        <h1 className="text-[1.65rem] leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
          Máy tính{' '}
          <span className="bg-linear-to-r from-accent-300 via-accent-200 to-accent-100 bg-clip-text text-transparent">
            Cứu Điểm
          </span>
        </h1>
        <p className="mt-2 text-sm text-pretty text-white/60 sm:text-base">
          Biết ngay bài kiểm tra tới cần bao nhiêu điểm. Tính theo Thông tư 22, thang điểm 10.
        </p>
      </header>

      <div className="relative lg:grid lg:grid-cols-2 lg:gap-8">
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()} noValidate>
          <div role="tablist" aria-label="Cách tính" className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-black/25 p-1">
            {(
              [
                { id: 'hk', label: 'Học kì' },
                { id: 'nam', label: 'Cả năm' },
              ] as { id: VnMode; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={inputs.mode === tab.id}
                onClick={() => set({ mode: tab.id })}
                className={`rounded-xl py-2.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-accent-400/50 focus-visible:outline-none ${
                  inputs.mode === tab.id ? 'bg-white/[0.12] text-white' : 'text-white/55 hover:text-white/85'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {inputs.mode === 'hk' ? (
            <>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-white/85">Số bài kiểm tra thường xuyên trong kì</legend>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map((count) => (
                    <button
                      key={count}
                      type="button"
                      aria-pressed={inputs.n === count}
                      onClick={() => set({ n: count })}
                      className={`${selectableCard(inputs.n === count)} flex h-11 items-center justify-center text-sm font-semibold`}
                    >
                      {count} bài
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-white/50">
                  Môn 1 tiết/tuần: 2 bài · 2 tiết/tuần: 3 bài · từ 3 tiết/tuần: 4 bài
                </p>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-white/85">
                  Điểm thường xuyên <span className="font-normal text-white/50">(miệng, 15 phút…)</span>
                </legend>
                <div className={`grid gap-2 ${inputs.n === 4 ? 'grid-cols-4' : inputs.n === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {Array.from({ length: Math.min(inputs.n, MAX_TX) }, (_, i) => (
                    <ScoreInput
                      key={i}
                      id={`tx${i + 1}`}
                      label={`Lần ${i + 1}`}
                      compact
                      placeholder="–"
                      value={inputs.tx[i]}
                      error={errorOf(itemState(`tx${i + 1}`))}
                      onChange={(v) => setTx(i, v)}
                    />
                  ))}
                </div>
              </fieldset>

              <div className="grid grid-cols-2 gap-3">
                <ScoreInput
                  id="gk"
                  label="Giữa kì (hệ số 2)"
                  value={inputs.gk}
                  error={errorOf(itemState('gk'))}
                  onChange={(v) => set({ gk: v })}
                />
                <ScoreInput
                  id="ck"
                  label="Cuối kì (hệ số 3)"
                  hint="Đề của trường hoặc của Sở"
                  value={inputs.ck}
                  error={errorOf(itemState('ck'))}
                  onChange={(v) => set({ ck: v })}
                />
              </div>
            </>
          ) : (
            <ScoreInput
              id="hk1"
              label="Điểm trung bình môn học kì I"
              hint="Xem trong sổ liên lạc điện tử hoặc học bạ."
              placeholder="VD: 7,2"
              value={inputs.hk1}
              error={errorOf(itemState('hk1'))}
              onChange={(v) => set({ hk1: v })}
            />
          )}

          <div>
            <ScoreInput
              id="muc"
              label={inputs.mode === 'hk' ? 'Mục tiêu điểm trung bình môn học kì' : 'Mục tiêu điểm trung bình môn cả năm'}
              placeholder="VD: 8"
              value={inputs.target}
              error={errorOf(targetState)}
              onChange={(v) => set({ target: v })}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TARGET_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  aria-pressed={inputs.target === preset.value}
                  onClick={() => set({ target: preset.value })}
                  className={`${selectableCard(inputs.target === preset.value)} px-2.5 py-1.5 text-xs font-medium`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="mt-6 flex flex-col lg:mt-0">
          <VnResult outcome={outcome} mode={inputs.mode} />

          {planReady ? (
            <a href={hrefFor('/vn/ke-hoach', vnParams(inputs))} className={`${primaryButton} mt-4 w-full`}>
              Lập kế hoạch ôn tập
              <ArrowRightIcon className="size-4" />
            </a>
          ) : (
            <button type="button" disabled className={`${primaryButton} mt-4 w-full`}>
              Lập kế hoạch ôn tập
              <ArrowRightIcon className="size-4" />
            </button>
          )}

          <a
            href={
              outcome.status === 'ready'
                ? hrefFor('/vn/lich-on', {
                    them: String(Math.max(0, outcome.score)),
                    loai: outcome.remaining.some((r) => r.key === 'ck' || r.key === 'hk2')
                      ? 'ck'
                      : outcome.remaining.some((r) => r.key === 'gk')
                        ? 'gk'
                        : 'tx',
                  })
                : '#/vn/lich-on'
            }
            className={`${secondaryButton} mt-3 w-full`}
          >
            🗓️ {outcome.status === 'ready' ? 'Thêm vào lịch ôn nhiều môn' : 'Lịch ôn nhiều môn'}
          </a>

          <button
            type="button"
            onClick={() => setInputs({ ...EMPTY_VN_INPUTS, mode: inputs.mode, n: inputs.n })}
            disabled={isEmpty}
            className={`${secondaryButton} mt-3 w-full`}
          >
            <ResetIcon className="size-4" />
            Làm lại
          </button>

          {items.length > 0 && inputs.mode === 'hk' && (
            <p className="mt-4 text-center text-xs text-pretty text-white/40">
              Giáo dục thể chất, Âm nhạc, Mĩ thuật, Hoạt động trải nghiệm được đánh giá bằng nhận xét (Đạt/Chưa đạt) nên
              không cần tính điểm.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
