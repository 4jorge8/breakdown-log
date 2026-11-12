---
name: smoke-test
description: Tests the three main flows of the app in a real browser (mobile and desktop) as a user would. Use after every feature and after every deployment.
---

# /smoke-test

## When it is invoked

After a feature passes `/review`, after a deployment to Vercel, or when the user types `/smoke-test`.

## What it does

1. Starts the production build: `npm run build && npm run preview` (or uses the URL the user gives, e.g. the Vercel deployment).
2. In a browser at **390×844 (mobile)**:
   - Send the report form empty → 4 error messages in Spanish.
   - Report a breakdown (machine, description, high priority, machine stopped, name) → confirmation.
3. At **1200×800 (desktop)**:
   - **Averías**: the new breakdown appears in triage order; *Empezar reparación* → *Marcar resuelta* → it moves to *Resueltas*.
   - **Indicadores**: totals and the per-machine table are consistent.
   - Reload with F5 on `/indicators` → the page loads (SPA fallback).
4. If the deployment has shared storage, open the app in a second browser and check the breakdown is there.
5. Check the browser console has no errors.

If Playwright is available, automate these steps and take screenshots; otherwise give the user the checklist.

## Expected output

A PASS / FAIL table per step, with screenshots or the exact error of any failure.
