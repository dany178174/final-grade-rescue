import { useEffect } from 'react'
import { ArrowLeftIcon } from '../../components/icons'
import { VnPlanResult } from '../../components/vn/VnPlanResult'
import { VnDaysStep, VnStyleStep, VnSubjectStep } from '../../components/vn/VnWizard'
import { isLearningStyle } from '../../data/plan'
import { getVnDay, VN_TIER_PLANS } from '../../data/vn/plan'
import { getVnSubject, levelOf } from '../../data/vn/subjects'
import { hrefFor, navigate } from '../../lib/router'
import { TIER_STYLES } from '../../lib/tierStyles'
import { primaryButton, smallButton } from '../../lib/ui'
import {
  evaluateVn,
  formatVi,
  upcomingExam,
  VN_PLAN_KEYS,
  vnInputsFromParams,
  vnParams,
  type VnOutcome,
} from '../../lib/vnGrade'

type Answers = Partial<Record<(typeof VN_PLAN_KEYS)[number], string>>
type Step = 'subject' | 'style' | 'days' | 'plan'

function readAnswers(params: URLSearchParams): Answers {
  const answers: Answers = {}
  for (const key of VN_PLAN_KEYS) {
    const value = params.get(key)?.trim().slice(0, 60)
    if (value) answers[key] = value
  }
  return answers
}

function goalSentence(outcome: Extract<VnOutcome, { status: 'ready' }>): string {
  if (outcome.tier === 'secured') return 'Điểm của mình đã đủ đạt mục tiêu, nhưng mình vẫn muốn làm bài thật tốt.'
  if (outcome.tier === 'impossible') return 'Mục tiêu ban đầu không còn đạt được, nên mình muốn đạt điểm cao nhất có thể.'
  const score = formatVi(outcome.score)
  return outcome.remaining.length === 1
    ? `Mình cần được ít nhất ${score} điểm.`
    : `Mình cần trung bình ít nhất ${score} điểm ở các bài còn lại.`
}

export default function VnPlanPage({ params }: { params: URLSearchParams }) {
  const inputs = vnInputsFromParams(params)
  const { outcome } = evaluateVn(inputs)
  const answers = readAnswers(params)

  const grade = Number(answers.lop)
  const gradeValid = grade >= 6 && grade <= 12
  const subject = getVnSubject(answers.mon ?? null)
  const subjectDone =
    gradeValid && Boolean(subject?.levels.includes(levelOf(grade))) && (subject?.id !== 'khac' || Boolean(answers.khac))
  const rawStyle = answers.cach ?? null
  const style = isLearningStyle(rawStyle) ? rawStyle : undefined
  const day = getVnDay(answers.ngay ?? null)

  const requested = params.get('buoc')
  let step: Step = 'plan'
  if (!subjectDone || requested === 'subject') step = 'subject'
  else if (!style || requested === 'style') step = 'style'
  else if (!day || requested === 'days') step = 'days'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  const go = (next: Answers, nextStep?: Step) =>
    navigate(hrefFor('/vn/ke-hoach', { ...vnParams(inputs), ...next, buoc: nextStep }))
  const calculatorHref = hrefFor('/vn', vnParams(inputs))

  if (outcome.status !== 'ready') {
    return (
      <main className="glass-card w-full max-w-md p-8 text-center">
        <p aria-hidden className="text-4xl">
          🧮
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Tính điểm trước đã</h1>
        <p className="mt-2 text-sm text-white/60">
          Kế hoạch ôn được xây dựa trên số điểm bạn cần đạt. Hãy nhập điểm vào máy tính để bắt đầu.
        </p>
        <a href="#/vn" className={`${primaryButton} mt-6 w-full`}>
          Mở máy tính điểm
        </a>
      </main>
    )
  }

  const tierStyle = TIER_STYLES[outcome.tier]
  const stepNumber = step === 'subject' ? 1 : step === 'style' ? 2 : step === 'days' ? 3 : 4
  const exam = upcomingExam(outcome.remaining)

  return (
    <main className="w-full max-w-3xl">
      <nav className="mb-4 flex items-center justify-between gap-3">
        <a href={calculatorHref} className={smallButton}>
          <ArrowLeftIcon className="size-3.5" />
          Máy tính điểm
        </a>
        {step !== 'plan' && (
          <div className="flex items-center gap-1.5" aria-label={`Bước ${stepNumber}/3`}>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`h-1.5 w-8 rounded-full transition ${
                  n <= stepNumber ? 'bg-accent-400' : 'bg-white/15'
                }`}
              />
            ))}
          </div>
        )}
      </nav>

      {step === 'plan' && subject && style && day ? (
        <VnPlanResult
          outcome={outcome}
          subject={subject}
          subjectName={subject.id === 'khac' ? answers.khac! : subject.name}
          grade={grade}
          topic={answers.cd}
          style={style}
          daysId={day.id}
          daysLabel={day.label}
          exam={exam}
          promptContext={{
            subject: `${subject.id === 'khac' ? answers.khac : subject.name} lớp ${grade}`,
            topic: answers.cd ?? '[phần bạn thấy khó nhất]',
            exam: exam.name,
            goal: goalSentence(outcome),
            when: day.promptWhen,
            hours: VN_TIER_PLANS[outcome.tier].hoursForPrompt,
            upperSecondary: grade >= 10,
          }}
          flashcardsHref={hrefFor('/vn/the-ghi-nho', { ...vnParams(inputs), ...answers })}
          onEdit={() => go(answers, 'subject')}
        />
      ) : (
        <section className="glass-card relative overflow-hidden p-6 sm:p-8">
          <div
            aria-hidden
            className="card-sheen pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white/[0.08] to-transparent"
          />
          <div className="relative">
            <p className={`mb-6 inline-flex flex-wrap items-center gap-x-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${tierStyle.badge}`}>
              <span aria-hidden>{VN_TIER_PLANS[outcome.tier].emoji}</span>
              Bạn cần <span className="font-bold tabular-nums">{formatVi(Math.max(0, outcome.score))} điểm</span> ở {exam.short}
            </p>

            {step === 'subject' && (
              <VnSubjectStep
                key="subject"
                initial={{ lop: answers.lop, mon: answers.mon, khac: answers.khac, cd: answers.cd }}
                onContinue={(a) => go({ ...answers, ...a, khac: a.khac, cd: a.cd }, 'style')}
              />
            )}
            {step === 'style' && (
              <VnStyleStep
                key="style"
                selected={answers.cach ?? null}
                onSelect={(cach) => go({ ...answers, cach }, 'days')}
                onBack={() => go(answers, 'subject')}
              />
            )}
            {step === 'days' && (
              <VnDaysStep
                key="days"
                selected={answers.ngay ?? null}
                onSelect={(ngay) => go({ ...answers, ngay })}
                onBack={() => go(answers, 'style')}
              />
            )}
          </div>
        </section>
      )}

      {step === 'plan' && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <a href={calculatorHref} className={`${smallButton} h-12 flex-1 rounded-2xl text-sm`}>
            <ArrowLeftIcon className="size-4" />
            Về máy tính điểm
          </a>
          <button type="button" onClick={() => go({}, 'subject')} className={`${smallButton} h-12 flex-1 rounded-2xl text-sm`}>
            Lập kế hoạch môn khác
          </button>
        </div>
      )}
    </main>
  )
}
