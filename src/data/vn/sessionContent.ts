// What to do in one timetable session, with the exact resources for it.

import type { Mode, Phase } from '../../lib/vnSchedule'
import { youtubeSearch } from '../subjects'
import { buildVnPromptTemplates, type VnPromptContext } from './prompts'
import { googleSiteSearch } from './subjects'

export type SessionLink = { kind: 'link'; label: string; href: string } | { kind: 'copy'; label: string; text: string }

export const PHASE_LABELS: Record<Phase, { label: string; badge: string }> = {
  diagnose: { label: 'Kiểm tra đầu vào', badge: 'border-sky-300/30 bg-sky-400/10 text-sky-200' },
  learn: { label: 'Học mới', badge: 'border-violet-300/30 bg-violet-400/10 text-violet-200' },
  practice: { label: 'Luyện đề', badge: 'border-orange-300/30 bg-orange-400/10 text-orange-200' },
  review: { label: 'Ôn tập', badge: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200' },
  eve: { label: 'Ôn nhẹ trước giờ thi', badge: 'border-pink-300/30 bg-pink-400/10 text-pink-200' },
}

export const MODE_EMOJI: Record<Mode, string> = { video: '🎬', reading: '📚', ai: '🤖' }

const googleSearch = (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`

export type SessionArgs = {
  phase: Phase
  mode: Mode
  subjectName: string
  grade: number
  topic?: string
  examShort: string
  prompt: VnPromptContext
  flashcardsHref: string
}

export function sessionContent(args: SessionArgs): { task: string; links: SessionLink[] } {
  const { phase, mode, subjectName, grade, topic, examShort, prompt, flashcardsHref } = args
  const what = `${subjectName} lớp ${grade}`
  const focus = topic || 'phần bạn yếu nhất'
  const prompts = Object.fromEntries(buildVnPromptTemplates(prompt).map((p) => [p.id, p.text]))
  const flashcards: SessionLink = { kind: 'link', label: '🃏 Thẻ ghi nhớ', href: flashcardsHref }
  const oldTests: SessionLink = {
    kind: 'link',
    label: '📝 Đề cũ có đáp án',
    href: googleSearch(`đề kiểm tra ${examShort} ${what} có đáp án`),
  }

  switch (phase) {
    case 'diagnose':
      if (mode === 'video')
        return {
          task: `Xem một video tổng ôn ${examShort} để nắm chương trình gồm những gì, rồi đánh dấu những phần bạn còn yếu.`,
          links: [{ kind: 'link', label: '🎬 Video tổng ôn', href: youtubeSearch(`tổng ôn ${examShort} ${what}`) }],
        }
      if (mode === 'ai')
        return {
          task: 'Nhờ AI hỏi bạn 10 câu bao quát chương trình để tìm ra phần yếu nhất.',
          links: [{ kind: 'copy', label: '🤖 Chép câu lệnh', text: prompts.diagnose }],
        }
      return {
        task: `Làm nhanh một đề ${examShort} cũ mà không xem đáp án, để biết mình hổng phần nào.`,
        links: [oldTests],
      }

    case 'learn':
      if (mode === 'video')
        return {
          task: `Xem 2–3 video về ${focus}, dừng lại tự làm ví dụ trước khi xem lời giải, ghi lại ý chính.`,
          links: [
            { kind: 'link', label: '🎬 Video bài giảng', href: youtubeSearch(`${topic || 'bài giảng'} ${what}`) },
            { kind: 'link', label: '🎬 HOCMAI', href: youtubeSearch(`HOCMAI ${topic ?? ''} ${what}`.replace(/\s+/g, ' ')) },
          ],
        }
      if (mode === 'ai')
        return {
          task: `Nhờ AI giải thích ${focus} thật dễ hiểu, rồi trả lời câu hỏi kiểm tra của nó.`,
          links: [{ kind: 'copy', label: '🤖 Chép câu lệnh', text: prompts.explain }],
        }
      return {
        task: `Đọc lí thuyết ${focus} trong SGK. Đọc xong mỗi mục, gấp sách lại và tóm tắt bằng một câu.`,
        links: [
          { kind: 'link', label: '📚 Lí thuyết', href: googleSiteSearch(`${topic || 'lý thuyết'} ${what}`, 'loigiaihay.com') },
          { kind: 'link', label: '📖 SGK điện tử', href: 'https://hanhtrangso.nxbgd.vn/' },
        ],
      }

    case 'practice':
      if (mode === 'video')
        return {
          task: 'Bấm giờ làm một đề, sau đó xem video chữa đề để so cách giải và ghi lại lỗi sai.',
          links: [oldTests, { kind: 'link', label: '🎬 Video chữa đề', href: youtubeSearch(`chữa đề kiểm tra ${examShort} ${what}`) }],
        }
      if (mode === 'ai')
        return {
          task: 'Nhờ AI soạn một đề luyện theo dạng bài thường gặp. Làm xong gõ "chấm bài" để được chữa.',
          links: [{ kind: 'copy', label: '🤖 Chép câu lệnh', text: prompts.exam }],
        }
      return {
        task: 'Bấm giờ làm một đề hoặc 15–20 câu, tự chấm theo đáp án và ghi mọi câu sai vào sổ lỗi sai.',
        links: [oldTests, { kind: 'link', label: '📝 Hoc247', href: googleSiteSearch(`đề ${examShort} ${what}`, 'hoc247.net') }],
      }

    case 'review': {
      const extra: SessionLink =
        mode === 'video'
          ? { kind: 'link', label: '🎬 Video ôn tập', href: youtubeSearch(`ôn tập ${examShort} ${what}`) }
          : mode === 'ai'
            ? { kind: 'copy', label: '🤖 Chép câu lệnh', text: prompts.quiz }
            : { kind: 'link', label: '📚 Đề cương ôn tập', href: googleSiteSearch(`đề cương ôn tập ${examShort} ${what}`, 'vietjack.com') }
      return {
        task: 'Lật thẻ ghi nhớ, làm lại các câu trong sổ lỗi sai và tự kiểm tra bằng câu hỏi ngắn.',
        links: [flashcards, extra],
      }
    }

    case 'eve':
      return {
        task: 'Chỉ đọc lại trang tóm tắt và sổ lỗi sai trong 20–30 phút. Chuẩn bị đồ dùng, rồi đi ngủ sớm.',
        links: [flashcards],
      }
  }
}
