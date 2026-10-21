# RealismLab AI

RealismLab AI reviews AI-generated human characters and tells you how believable they look as real photographs — and exactly what to fix.

Upload a portrait or full-body image, and the app produces a report: an overall realism estimate, per-area scores (skin, eyes, mouth, hair, anatomy, lighting, photographic coherence), a prioritized list of visible issues with concrete fixes, and a set of "preserve these" traits (identity, skin tone, eye color, hair, age, clothing, pose, background) so edits don't change who the character is.

## What it does

- **Upload & check.** Drag in a JPEG, PNG or WebP (up to 10 MB, 256–8000 px). The app verifies the real file type, dimensions and image quality before anything runs. No account needed.
- **Pick a goal.** Maximum photorealism, natural skin detail, professional portrait, full-body realism, reference-sheet review, or general believability. The goal shapes what the review focuses on.
- **Get a report.** Each area gets a 0–100 realism estimate, or an honest "not visible / not enough evidence" label when the feature is hidden, cropped or too small to judge — nothing is invented to fill a category.
- **Issues on the image.** When a problem's location is reliable (eyes, mouth, nose, cheeks, forehead, chin, whole face, hands), it's marked with a numbered box found on your device. Lighting, background and hair issues stay text-only, as do images with no face, several faces, or unclear hands.
- **Copyable fix prompts.** Every issue has a "Copy fix prompt" button: a ready-made prompt that fixes just that one issue and tells the editing tool to keep everything else unchanged.
- **Compare versions.** Compare two images side by side to see which edits helped.
- **History.** Reports are kept in your browser, listed with labels, and can be deleted. A demo example shows a full report without uploading anything.

## What it doesn't do

- It does **not** detect whether an image was AI-generated. It judges perceived realism only — how believable it looks as a photograph — never attractiveness, style or fashion.
- Scores are rough estimates, not yet calibrated against human ratings, and can be generous. Treat them as a starting point.
- "Left/right" regions (eyes, cheeks) cover both sides, since the review can't tell the viewer's left from the character's.
- Issues are described in words, and marked on the image only when the location is reliable — never guessed.
- Each live analysis uses AI credits.

## Privacy

- Images never leave your device except one derived copy (max 1600 px) sent for analysis.
- Reports and history live in your browser's local storage; deleting a report removes it permanently.

## How to use

1. Open the **Analyze** page and drop in an image.
2. Add a label (optional) and pick a goal.
3. Read the report: overall estimate first, then per-area scores, then issues ordered High → Medium → Low.
4. On any issue, press **Copy fix prompt** and paste it into your editing or image-generation tool.
5. Re-analyze the edited version and use **Compare** to check progress against the original.

## Built with

- TanStack Start (React 19, TypeScript, Tailwind CSS v4)
- AI analysis via the Lovable AI Gateway, with strict validated output
- On-device face/body landmark detection (MediaPipe) for issue boxes

## Development

```sh
npm i
npm run dev
```

Tests run with `bunx vitest run`.
