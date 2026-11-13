import type { ReactNode } from 'react'
import { TIER_STYLES } from '../../lib/tierStyles'
import {
  averageWith,
  formatAverage,
  formatVi,
  roundAverage,
  VN_TIER_MESSAGES,
  type VnMode,
  type VnOutcome,
} from '../../lib/vnGrade'

type Ready = Extract<VnOutcome, { status: 'ready' }>

function numberSize(label: string): string {
  if (label.length <= 5) return 'text-6xl sm:text-7xl'
  return 'text-5xl sm:text-6xl'
}

export function VnResult({ outcome, mode }: { outcome: VnOutcome; mode: VnMode }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="flex flex-1 flex-col">
      {outcome.status === 'incomplete' && <Empty hasErrors={outcome.hasErrors} mode={mode} />}
      {outcome.status === 'ready' && <ReadyResult outcome={outcome} />}
      {outcome.status === 'complete' && <CompleteResult outcome={outcome} />}
    </div>
  )
}

function Empty({ hasErrors, mode }: { hasErrors: boolean; mode: VnMode }) {
  return (
    <div className="flex min-h-60 flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
      <p aria-hidden className="text-6xl font-bold tracking-tight text-white/15">
        –
      </p>
      <p className="mt-4 max-w-72 text-sm text-pretty text-white/55">
        {hasErrors
          ? 'Sửa ô đang báo đỏ để xem kết quả.'
          : mode === 'hk'
            ? 'Nhập mục tiêu và những điểm bạn đã có. Bài nào chưa kiểm tra thì để trống.'
            : 'Nhập ĐTB học kì I và mục tiêu cả năm.'}
      </p>
    </div>
  )
}

function ReadyResult({ outcome }: { outcome: Ready }) {
  const shown = Math.max(0, outcome.score)
  const label = formatVi(shown)
  const styles = TIER_STYLES[outcome.tier]
  const single = outcome.remaining.length === 1

  return (
    <div className="flex min-h-60 flex-1 flex-col justify-center rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
      <p className="text-base text-white/70">
        <span className="block">{single ? 'Bạn cần đạt' : 'Bạn cần trung bình'}</span>{' '}
        <span
          className={`my-1 block font-bold tracking-tight tabular-nums transition-colors duration-300 [text-shadow:0_0_40px_color-mix(in_oklab,currentColor_45%,transparent)] ${numberSize(label)} ${styles.text}`}
        >
          {label}
        </span>{' '}
        <span className="block">
          {single ? `điểm ở ${outcome.remaining[0].short}.` : `điểm ở ${outcome.remaining.length} bài còn lại:`}
        </span>
      </p>

      {!single && (
        <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
          {outcome.remaining.map((item) => (
            <li key={item.key} className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-xs text-white/75">
              {item.label}
              {item.weight > 1 && <span className="text-white/45"> · hệ số {item.weight}</span>}
            </li>
          ))}
        </ul>
      )}

      <div aria-hidden className="mt-5">
        <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
          <div className="absolute inset-y-0 left-0 w-[80%] bg-emerald-400/15" />
          <div className="absolute inset-y-0 left-[80%] w-[15%] bg-yellow-300/15" />
          <div className="absolute inset-y-0 left-[95%] w-[5%] bg-orange-400/20" />
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-500 ease-out ${styles.fill}`}
            style={{ width: `${Math.min(shown, 10) * 10}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-white/40 tabular-nums">
          <span>0</span>
          <span>10</span>
        </div>
      </div>

      <p className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium text-pretty ${styles.message}`}>
        {VN_TIER_MESSAGES[outcome.tier]}
      </p>

      <WhyVn outcome={outcome} label={label} />
    </div>
  )
}

function CompleteResult({ outcome }: { outcome: Extract<VnOutcome, { status: 'complete' }> }) {
  const styles = TIER_STYLES[outcome.reached ? 'easy' : 'cram']
  const gap = roundAverage(outcome.target - outcome.average)
  return (
    <div className="flex min-h-60 flex-1 flex-col justify-center rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
      <p className="text-base text-white/70">
        <span className="block">Điểm trung bình môn học kì</span>{' '}
        <span
          className={`my-1 block text-6xl font-bold tracking-tight tabular-nums [text-shadow:0_0_40px_color-mix(in_oklab,currentColor_45%,transparent)] sm:text-7xl ${styles.text}`}
        >
          {formatAverage(outcome.average)}
        </span>
      </p>
      <p className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium text-pretty ${styles.message}`}>
        {outcome.reached
          ? `Chúc mừng! Bạn đã đạt mục tiêu ${formatAverage(outcome.target)}. 🎉`
          : `Thiếu ${formatVi(gap)} điểm so với mục tiêu ${formatAverage(outcome.target)}. Đừng nản, kì sau còn cơ hội!`}
      </p>
      <p className="mt-3 text-xs text-white/45">Bạn đã nhập đủ tất cả các bài, nên đây là điểm trung bình cuối cùng.</p>
    </div>
  )
}

function Step({ index, title, math }: { index: number; title: ReactNode; math: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white/80">
        {index}
      </span>
      <span className="min-w-0">
        <span className="block text-white/75">{title}</span>
        <span className="mt-1 block font-medium text-white tabular-nums">{math}</span>
      </span>
    </li>
  )
}

function WhyVn({ outcome, label }: { outcome: Ready; label: string }) {
  const { target, knownSum, totalWeight, remainingWeight, known, remaining, score, tier } = outcome
  const isYear = remaining.some((r) => r.key === 'hk2')
  const needed = target * totalWeight
  const missing = needed - knownSum
  const n = totalWeight - 5
  const breakdown = known.length
    ? known
        .map((i) => (i.state.status === 'valid' ? (i.weight === 1 ? formatVi(i.state.value) : `${i.weight} × ${formatVi(i.state.value)}`) : ''))
        .join(' + ')
    : 'chưa có bài nào'
  const atTarget = averageWith(outcome, target)
  const atMax = averageWith(outcome, 10)
  const atZero = averageWith(outcome, 0)

  let insight: ReactNode
  if (tier === 'secured') {
    insight = `Kể cả được 0 điểm ở các bài còn lại, điểm trung bình vẫn là ${formatAverage(atZero)}, vẫn đạt mục tiêu. Nhưng đừng bỏ bài kiểm tra nào nhé.`
  } else if (tier === 'impossible') {
    insight = (
      <>
        Cao hơn 10 điểm nên không thể đạt. Nếu được 10 điểm ở mọi bài còn lại, điểm trung bình cao nhất là{' '}
        <strong className="text-white">{formatAverage(atMax)}</strong>.
      </>
    )
  } else if (score > target) {
    insight = (
      <>
        <strong className="text-white">Vì sao cao hơn mục tiêu {formatVi(target)}?</strong> Điểm bạn đã có đang thấp
        hơn mục tiêu, nên các bài còn lại phải cao hơn để kéo trung bình lên. Nếu chỉ được đúng {formatVi(target)}, điểm
        trung bình sẽ là <strong className="text-white">{formatAverage(atTarget)}</strong>.
      </>
    )
  } else if (score < target) {
    insight = (
      <>
        <strong className="text-white">Vì sao thấp hơn mục tiêu?</strong> Điểm bạn đã có cao hơn mục tiêu nên tạo ra
        "vùng đệm". Nếu được đúng {formatVi(target)}, điểm trung bình sẽ là{' '}
        <strong className="text-white">{formatAverage(atTarget)}</strong>.
      </>
    )
  } else {
    insight = 'Điểm bạn đã có đúng bằng mục tiêu, nên chỉ cần giữ phong độ ở các bài còn lại.'
  }

  return (
    <details className="group mt-3 text-left">
      <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-white/60 transition hover:text-white focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        Vì sao lại là {label} điểm?
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 transition group-open:rotate-180"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm">
        <ol className="space-y-3">
          <Step
            index={1}
            title={
              isYear
                ? 'Theo Thông tư 22: ĐTB cả năm = (HK I + 2 × HK II) ÷ 3.'
                : 'Theo Thông tư 22: ĐTB học kì = (tổng điểm thường xuyên + 2 × giữa kì + 3 × cuối kì) ÷ (số bài thường xuyên + 5).'
            }
            math={isYear ? 'Tổng hệ số: 1 + 2 = 3' : `Môn của bạn có ${n} bài thường xuyên: ${n} + 5 = ${totalWeight}`}
          />
          <Step
            index={2}
            title={`Để đạt ${formatVi(target)}, tổng điểm (đã nhân hệ số) cần là:`}
            math={`${formatVi(target)} × ${totalWeight} = ${formatVi(needed)}`}
          />
          <Step
            index={3}
            title="Điểm bạn đã có (đã nhân hệ số):"
            math={known.length ? `${breakdown} = ${formatVi(knownSum)}` : breakdown}
          />
          {missing > 0 ? (
            <Step
              index={4}
              title={`Còn thiếu ${formatVi(missing)}, chia cho tổng hệ số các bài còn lại (${remainingWeight}):`}
              math={`${formatVi(missing)} ÷ ${remainingWeight} = ${formatVi(score)} điểm`}
            />
          ) : (
            <Step
              index={4}
              title="Điểm đã có đã đủ, thậm chí dư so với mức cần:"
              math={`${formatVi(knownSum)} ≥ ${formatVi(needed)}`}
            />
          )}
        </ol>
        <p className="mt-4 border-t border-white/10 pt-3 text-pretty text-white/70">
          <span aria-hidden>💡 </span>
          {insight}
        </p>
        {tier !== 'secured' && tier !== 'impossible' && (
          <p className="mt-2 text-xs text-pretty text-white/45">
            ĐTB môn được làm tròn đến 1 chữ số thập phân, nên ĐTB từ {formatVi(target - 0.05)} trở lên sẽ thành{' '}
            {formatVi(target)}. Con số ở trên đã tính an toàn, chưa trừ phần làm tròn này.
          </p>
        )}
      </div>
    </details>
  )
}
