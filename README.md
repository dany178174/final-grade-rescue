# Final Grade Rescue Calculator

Find out what you need on your final exam to reach the grade you want. The result updates as you type.

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

## Project layout

- `src/lib/grade.ts`: input parsing and validation, the formula, and the tiers
- `src/components/PercentInput.tsx`: labeled 0–100 input with an inline error
- `src/components/ResultPanel.tsx`: the result, the progress meter, and the message
- `src/components/MeshBackground.tsx`: the animated gradient background (styles are in `src/index.css`)
- `src/App.tsx`: page layout, the Reset button, and the footer

## Customize

- **Buy me a coffee link:** set `BUY_ME_A_COFFEE_URL` in `src/App.tsx`.
