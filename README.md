# Final Grade Rescue Calculator

Find out what you need on your final exam to reach the grade you want. The result updates as you type.

Then build a personal study plan: pick your subject, how you learn best (videos, an AI tutor, or reading) and how long until the exam. The plan includes a strategy matched to the score you need, a day-by-day schedule, "what-if" grade scenarios, curated free resources, and ready-to-copy AI prompts plus a short lesson on writing good prompts.

Built with Vite, React, TypeScript, and Tailwind CSS v4.

## Getting started

```bash
npm install
npm run dev
```

| Script            | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start the dev server with hot reload  |
| `npm run build`   | Type-check and build to `dist/`       |
| `npm run preview` | Serve the production build locally    |
| `npm run lint`    | Lint with oxlint                      |

## How it works

```
Required = (Desired − Current × (1 − Weight / 100)) / (Weight / 100)
```

| Required score | Color  | Message                                                          |
| -------------- | ------ | ---------------------------------------------------------------- |
| ≤ 0            | Green  | You've already secured this grade! Just don't skip the exam.     |
| 0 – 80         | Green  | You got this! Easy win.                                          |
| 80 – 95        | Yellow | Time to lock in and study. It's totally doable.                  |
| 95 – 100       | Orange | Cramming time! Every point counts.                               |
| > 100          | Red    | Mathematically impossible. Time to negotiate for extra credit!   |

The score is rounded to two decimals before the tier is picked, so the color always matches the number on screen.

## Install as an app

The site is a Progressive Web App: `public/manifest.webmanifest`, icons in `public/`, and `public/sw.js` (network-first pages, cache-first hashed assets, never caches `/api`). On Android the footer shows **Install app** when the browser allows it; on iPhone it explains Safari's **Add to Home Screen**. Once visited, pages also open offline.

To publish on Google Play, package the live URL with [PWABuilder](https://www.pwabuilder.com) (Trusted Web Activity) and serve the generated `assetlinks.json` at `public/.well-known/assetlinks.json`.

## Vietnamese section (`#/vn`)

A fully Vietnamese version for students in Vietnam, following Chương trình GDPT 2018 and Thông tư 22/2021:

- **Calculator (`#/vn`)**: 0–10 scores written the Vietnamese way (9,8). Semester mode uses `ĐTB = (tổng ĐGTX + 2 × giữa kì + 3 × cuối kì) ÷ (số ĐGTX + 5)` with 2–4 regular assessments (miệng, 15 phút); year mode uses `(HK I + 2 × HK II) ÷ 3`. Students fill in the scores they have, leave the rest blank, and see the average score they need on what's left, with a step-by-step explanation.
- **Study plan (`#/vn/ke-hoach`)**: grade 6–12 and the scored subjects for THCS or THPT, learning style and time left. Videos are YouTube searches in Vietnamese tuned to subject, grade, topic and the upcoming test; reading links go to Vietnamese e-textbooks, solution sites and news; AI prompts and the prompt-writing lesson are in Vietnamese.
- **Flashcards & quiz (`#/vn/the-ghi-nho`)**: the Flashcard Maker in Vietnamese.
- **Grade board (`#/vn/bang-diem`)**: the class planning sheet ("Kế hoạch HK…") built into the page, so nobody has to open Excel. It opens on a blank copy of the template (Toán → GDQP for THPT, the THCS list for grades 6–9) laid out exactly like the file: Miệng | 15' ×5 | Chuyên đề | 45' ×3 | HS3 | TBHK, weights 1/2/3, yellow cells = final, green = target, plus the class notes and the Mục tiêu (HSG/HSXS) line. Scores are typed straight into the cells, an Excel-style toolbar paints cells yellow/green or erases them, and TBHK is computed like the sheet's formula. In HK II the sheet adds TB HK I and Cả năm columns. A card view is still available. The page also shows the projected kết quả học tập (Tốt/Khá/Đạt) and whether the student qualifies for Học sinh Giỏi / Học sinh Xuất sắc under Thông tư 22, then picks the 6 subjects where 8,0 or 9,0 is easiest to reach and shows the score needed on every unfinished test (the "Cần TB" column). Table in `src/components/vn/BoardSheet.tsx`; Logic in `src/lib/vnBoard.ts`.
- **Appearance panel ("Giao diện")**: opened from the sidebar, the top bar on phones or the footer. Students pick an accent colour (7 presets or any colour from a colour picker; an 11-step OKLCH scale is generated so white text stays readable), a background tone, text size, corner radius, background motion, and for the grade board a "Hiện đại" or "Giống Excel" sheet style. Settings are CSS variables on `<html>`, applied before the first paint and saved in localStorage. Logic in `src/lib/appearance.ts`, UI in `src/components/appearance/`.
- **Class Excel sheet (optional)**: for classes that still collect the file, the grade board can open the class planning file ("Kế hoạch HK…": subjects in column E, Miệng | 15' ×5 | Chuyên đề | 45' ×3 | HS3 | TBHK, yellow = final, green = target), fills every empty target cell with the score needed for the chosen goal (never below the subject's current average), and exports the same template back, including the original TBHK formula, colours, merged cells, notes and the student's goal. Reading and writing live in `src/lib/boardExcel.ts` on top of `src/lib/xlsx.ts`; nothing leaves the device.
- **Multi-subject timetable (`#/vn/lich-on`)**: students add every subject in the exam period (exam date, test type, score needed, hardest topic) plus free hours on weekdays/weekends and start times. `src/lib/vnSchedule.ts` splits each day into 40-minute sessions at real clock times, giving more sessions to sooner exams and higher required scores, interleaving subjects, and ending the evening before each exam with a light review. Every session lists its task with the exact resources (video search, old tests, AI prompt to copy, flashcards). Sessions can be ticked off, exported to the phone calendar as `.ics` with reminders, and shared by link; the timetable is remembered on the device.

Logic lives in `src/lib/vnGrade.ts`; content in `src/data/vn/`; pages in `src/pages/vn/` and `src/components/vn/`.

## Pages

The app uses hash routes, so it runs on any static host with no server config:

- `#/`: the calculator
- `#/plan?c=86&d=90&w=30&s=calculus&t=related+rates&l=ai&days=4-7`: a study plan. Every answer lives in the URL, so plans can be shared and reopened.
- `#/flashcards?t=related+rates`: the Flashcard Maker. It writes an AI prompt for the topic, turns the pasted answer into flip cards, and exports them for Quizlet (copy and paste into Quizlet's Import) or Anki (download a .txt file). The last deck is kept in the browser's local storage.

## Quizzes and Wayground

The Flashcard Maker also turns any deck of 4+ cards into a multiple-choice quiz automatically (definition → pick the term), and accepts AI-written questions in the form `question | A | B | C | D | answer`. Either quiz can be played on the page or downloaded as an `.xlsx` in Wayground's (formerly Quizizz) spreadsheet-import template, written by the small zip/XML writer in `src/lib/xlsx.ts`.

## Layout

On wide screens a left rail holds the main tools and a right rail holds the install-app and buy-me-a-coffee cards; on phones an app-style tab bar sits at the bottom and the two cards appear above the footer (`src/components/shell/`).

## Feedback

The feedback form (footer link and the "Was this plan helpful?" card) saves messages through a Vercel Function, `api/feedback.ts`, into an Upstash Redis database. Read them at `#/inbox`.

One-time setup in the Vercel dashboard:

1. **Storage** tab: create an **Upstash Redis** database (free plan) and connect it to this project. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
2. **Settings → Environment Variables**: add `FEEDBACK_ADMIN_PASSWORD` with the password you'll use for the inbox.
3. Redeploy.

The form stays hidden until the database is connected. The API keeps the newest 1,000 messages, allows 5 messages per visitor every 10 minutes, and never stores IP addresses.

## Project layout

- `src/lib/grade.ts`: input parsing and validation, the formula, and the tiers
- `src/lib/router.ts`: tiny hash router
- `src/pages/CalculatorPage.tsx`: the calculator
- `src/pages/StudyPlanPage.tsx`: the 3-step plan wizard and the finished plan (loaded on demand)
- `src/components/plan/`: wizard steps, plan sections, resource tabs
- `src/data/subjects.ts`: subjects and their video and reading resources
- `src/data/plan.ts`: strategies per score tier, schedules per time left, study tips
- `src/data/prompts.ts`: the prompt-writing lesson and the AI prompt templates
- `src/pages/FlashcardsPage.tsx`, `src/lib/flashcards.ts`: the Flashcard Maker, card parsing and export
- `src/components/feedback/`, `src/pages/InboxPage.tsx`: the feedback dialog and the owner's inbox
- `api/feedback.ts`: the Vercel Function that stores and serves feedback
- `src/components/MeshBackground.tsx`: the animated gradient background (styles are in `src/index.css`)

## Editing study resources

Add or change links in `src/data/subjects.ts`. For a YouTube channel you're not sure of, use `youtubeSearch('channel name')`. A search link always opens and puts the channel at the top.

## Customize

- **Buy me a coffee link:** points to a pay-what-you-want Gumroad product; change `BUY_ME_A_COFFEE_URL` in `src/App.tsx` to use another page.
