export type Lang = 'en' | 'vi'

export type NavItem = { href: string; emoji: string; label: string; short: string; sub: string; match: (path: string) => boolean }

export const NAV: Record<Lang, NavItem[]> = {
  vi: [
    { href: '#/vn', emoji: '🧮', label: 'Tính điểm', short: 'Tính điểm', sub: 'Bài tới cần bao nhiêu', match: (p) => p === '/vn' || p === '/vn/ke-hoach' },
    { href: '#/vn/lich-on', emoji: '🗓️', label: 'Lịch ôn nhiều môn', short: 'Lịch ôn', sub: 'Thời gian biểu theo giờ', match: (p) => p === '/vn/lich-on' },
    { href: '#/vn/bang-diem', emoji: '📊', label: 'Bảng điểm tổng quát', short: 'Bảng điểm', sub: 'Xét HS Giỏi, Xuất sắc', match: (p) => p === '/vn/bang-diem' },
    { href: '#/vn/the-ghi-nho', emoji: '🃏', label: 'Thẻ ghi nhớ & Quiz', short: 'Thẻ & Quiz', sub: 'Quizlet, Wayground', match: (p) => p === '/vn/the-ghi-nho' },
  ],
  en: [
    { href: '#/', emoji: '🧮', label: 'Grade calculator', short: 'Calculator', sub: 'What you need on the final', match: (p) => p === '/' || p === '/plan' },
    { href: '#/flashcards', emoji: '🃏', label: 'Flashcards & Quiz', short: 'Cards & Quiz', sub: 'Quizlet, Anki, Wayground', match: (p) => p === '/flashcards' },
    { href: '#/vn', emoji: '🇻🇳', label: 'Học sinh Việt Nam', short: 'Tiếng Việt', sub: 'Thang điểm 10', match: (p) => p.startsWith('/vn') },
  ],
}

export const COFFEE_URL = 'https://dungletien.gumroad.com/l/graderescue-coffee'
