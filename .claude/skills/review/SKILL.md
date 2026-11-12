---
name: review
description: Full quality gate before merging a feature branch into develop - lint, tests, build, and a code review with the code-reviewer agent. Use when the user types /review or before every merge.
---

# /review

## When it is invoked

Before merging any `feature/`, `fix/` or `chore/` branch into `develop`, or when the user types `/review`.

## What it does

1. Shows the branch and the changed files: `git status` and `git diff develop...HEAD --stat`.
2. Runs the automatic checks, stopping at the first failure:
   - `npm run lint` (type-check)
   - `npm test` (whole suite)
   - `npm run build`
3. Delegates the code review to the **code-reviewer** agent.
4. Writes a short report.

## Expected output

```
/review · <branch>
lint   ✓ | tests ✓ (N passed) | build ✓
review: APPROVE | CHANGES REQUESTED
1. ...
```

Do not merge if anything fails or the verdict is CHANGES REQUESTED.
