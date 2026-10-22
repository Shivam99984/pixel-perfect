# Plan: Make RealismLab AI percentages more accurate

Goal: turn the current estimates into scores we can measure and improve, so every change provably makes results better, not just different.

## Step 1 — Benchmark set and accuracy check (first milestone)
- Add a "Benchmark" page where you upload reference images and give each one your own rating (0–100) for overall realism and for each part: skin, eyes, mouth, hair, body and hands, lighting, scene. You can also mark a part as "not visible".
- Run the app's analysis on every benchmark image and show how close it gets to your ratings:
  - average difference per part (for example "eyes: off by 9 points on average")
  - how often it correctly says "n/a" for hidden parts
  - whether it ranks images in the same order you do
- Save each run, so you can see whether a later change made things better or worse.

## Step 2 — Consistent results
- Analyze each image 2–3 times and combine the answers. Parts where the answers disagree a lot get lower confidence or "n/a".
- Show a "stability" note on the report when results vary.

## Step 3 — Stricter "n/a" rules
- Use the face and body points we already detect to decide what's visible. Example: no hands detected means body/hands shows "n/a" even if the AI gives a score.
- Very small faces or blurry images lower the confidence, using the existing sharpness and exposure checks.

## Step 4 — Extra measurements per area
- Use face and body points for simple checks: eye symmetry, face proportions, body proportions.
- Run the sharpness and noise checks separately on the face, so overly smooth "plastic" skin gets flagged.
- These count as supporting evidence and lightly adjust confidence. They never replace the AI's judgment.

## Step 5 — Adjust the scoring with real data
- Use the benchmark ratings from Step 1 to tune how much each part counts and how scores are scaled (for example, if the AI always scores skin 10 points too high, correct for it).
- Release this as a new scoring version. Old and new reports are labeled so they aren't compared unfairly.

## Step 6 — Feedback from you
- Add "This score seems too high / too low" buttons on each part of a report. Your feedback gets added to the benchmark set over time.

## Needs your decision
- Steps 1, 5 and 6 work best with Lovable Cloud, so benchmark ratings and feedback are stored safely and don't get lost when the browser is cleared. Without it, they stay in this browser only.
- You'll need about 20–50 rated images for the numbers to mean anything.

## Technical details
- New module `src/features/calibration/` (benchmark types, metrics: MAE per dimension, n/a accuracy, Spearman rank correlation, run history). Kept separate from the UI, in line with existing analysis-engine rules.
- Multi-sample: run `analyzeCharacter` N times, take the median score per dimension and use the spread to lower confidence. This costs N times as many AI credits, so N is configurable.
- Visibility gating: feed `Landmarks` into `scoreAnalysis` as an optional input and mark dimensions `not_visible` when landmarks contradict the AI.
- Regional quality: run `computeQuality` on the face bounding box crop.
- Calibration: fit a per-dimension linear correction (a·score+b) plus refit weights, then bump `SCORING_VERSION` to `rl-score-2.0`. Comparisons already flag mixed versions.
- Tests: metric functions, gating rules and calibration mapping, with fixed fixtures.
