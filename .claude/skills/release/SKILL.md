---
name: release
description: Prepares a release from develop to main following the course steps 5.1-5.4 (checks, changelog, version, tag). Use when the user types /release or asks to publish a version.
---

# /release

## When it is invoked

When all the user stories planned for a version are merged into `develop` and the user asks to publish it.

## What it does

1. Checks that every story planned for the version is merged and listed in `CHANGELOG.md`.
2. Checks there are no secrets in Git: `.env` ignored, `git grep` for keys and tokens.
3. Runs `/review` on `develop` (lint, tests, build).
4. Moves `[Unreleased]` in `CHANGELOG.md` to the new version with today's date and updates `version` in `package.json`.
5. Shows the user the commands and **waits for approval** before running them:

```bash
git switch main
git merge --no-ff develop -m "chore(release): publish vX.Y.Z"
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin main develop --tags
```

6. After the push, reminds the user to run `/smoke-test` on the Vercel deployment.

## Expected output

A short release report (stories included, checks passed, version) and the commands, not yet run.
