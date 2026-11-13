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

## Vietnamese section (`#/vn`)

A fully Vietnamese version for students in Vietnam, following Chương trình GDPT 2018 and Thông tư 22/2021:

- **Calculator (`#/vn`)**: 0–10 scores written the Vietnamese way (9,8). Semester mode uses `ĐTB = (tổng ĐGTX + 2 × giữa kì + 3 × cuối kì) ÷ (số ĐGTX + 5)` with 2–4 regular assessments (miệng, 15 phút); year mode uses `(HK I + 2 × HK II) ÷ 3`. Students fill in the scores they have, leave the rest blank, and see the average score they need on what's left, with a step-by-step explanation.
- **Study plan (`#/vn/ke-hoach`)**: grade 6–12 and the scored subjects for THCS or THPT, learning style and time left. Videos are YouTube searches in Vietnamese tuned to subject, grade, topic and the upcoming test; reading links go to Vietnamese e-textbooks, solution sites and news; AI prompts and the prompt-writing lesson are in Vietnamese.
- **Flashcards (`#/vn/the-ghi-nho`)**: the Flashcard Maker in Vietnamese.

Logic lives in `src/lib/vnGrade.ts`; content in `src/data/vn/`; pages in `src/pages/vn/` and `src/components/vn/`.

## Pages

The app uses hash routes, so it runs on any static host with no server config:

- `#/`: the calculator
- `#/plan?c=86&d=90&w=30&s=calculus&t=related+rates&l=ai&days=4-7`: a study plan. Every answer lives in the URL, so plans can be shared and reopened.
- `#/flashcards?t=related+rates`: the Flashcard Maker. It writes an AI prompt for the topic, turns the pasted answer into flip cards, and exports them for Quizlet (copy and paste into Quizlet's Import) or Anki (download a .txt file). The last deck is kept in the browser's local storage.

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
