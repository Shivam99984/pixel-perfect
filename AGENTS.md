<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Analysis engine lives in `src/features/analysis/` (contracts, provider server fn, scoring, report builder) and stays independent of UI — so providers or calibrated scoring can be swapped without touching report screens.
- Provider output is always validated with zod (`providerOutputSchema`) before scoring or display; never show unvalidated or fabricated results.
- Scoring is deterministic and versioned (`SCORING_VERSION`); bump the version when weights/thresholds change so comparisons can flag mismatched methods.
- Demo data is a hand-written fixture flagged `demo: true` and always rendered with the DEMO banner; never fall back to it on a failed live analysis.
- Reports currently persist in browser localStorage (`report-store.ts`) until accounts/Cloud storage are added.
- Issue markers come from browser-side MediaPipe landmarks (`src/features/localization/`), never from AI-guessed coordinates; a finding is marked only when its region resolves to exactly one detected face/body, otherwise it stays text-only.
