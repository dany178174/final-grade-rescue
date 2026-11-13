import type { ComponentType, SVGProps } from 'react'
import { CalculatorIcon, CalendarIcon, CardsIcon, LanguagesIcon, SheetIcon } from '../icons'

export type Lang = 'en' | 'vi'

export type NavItem = {
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  short: string
  sub: string
  match: (path: string) => boolean
}

export const NAV: Record<Lang, NavItem[]> = {
  vi: [
    { href: '#/vn', icon: CalculatorIcon, label: 'Tính điểm', short: 'Tính điểm', sub: 'Bài tới cần bao nhiêu', match: (p) => p === '/vn' || p === '/vn/ke-hoach' },
    { href: '#/vn/lich-on', icon: CalendarIcon, label: 'Lịch ôn nhiều môn', short: 'Lịch ôn', sub: 'Thời gian biểu theo giờ', match: (p) => p === '/vn/lich-on' },
    { href: '#/vn/bang-diem', icon: SheetIcon, label: 'Bảng điểm tổng quát', short: 'Bảng điểm', sub: 'Kế hoạch lớp, xét HSG/HSXS', match: (p) => p === '/vn/bang-diem' },
    { href: '#/vn/the-ghi-nho', icon: CardsIcon, label: 'Thẻ ghi nhớ & Quiz', short: 'Thẻ & Quiz', sub: 'Quizlet, Wayground', match: (p) => p === '/vn/the-ghi-nho' },
  ],
  en: [
    { href: '#/', icon: CalculatorIcon, label: 'Grade calculator', short: 'Calculator', sub: 'What you need on the final', match: (p) => p === '/' || p === '/plan' },
    { href: '#/flashcards', icon: CardsIcon, label: 'Flashcards & Quiz', short: 'Cards & Quiz', sub: 'Quizlet, Anki, Wayground', match: (p) => p === '/flashcards' },
    { href: '#/vn', icon: LanguagesIcon, label: 'Học sinh Việt Nam', short: 'Tiếng Việt', sub: 'Thang điểm 10', match: (p) => p.startsWith('/vn') },
  ],
}

export const COFFEE_URL = 'https://dungletien.gumroad.com/l/graderescue-coffee'
