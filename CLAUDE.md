# PromptWars x ACM SRM — Rulebook

> **New chat? Read [handoff.md](handoff.md) first, before anything else.** Then tell Adwaith in 2–3 lines where things stand (phase, last thing done, next step), and say if handoff.md looks stale against `git log`. Then handle the request.
>
> **Track time.** Run `date` at the start of every reply during the event and state the time, plus the time left to the next deadline once it's known (see handoff.md).

This file holds **current rules only**. State and history live in [handoff.md](handoff.md). The assigned challenge is in [docs/problem-statement.md](docs/problem-statement.md). See §6 for how to keep files clean.

## 1. Context
**Adwaith:** first-year B.Tech ECE at SRMIST, beginner at coding, designs systems and builds with AI.
- Explain plainly and do the work yourself. For steps only Adwaith can do (logins, browser approvals, sign-ups), give numbered click-by-click steps.
- Adwaith reviews closely: be honest about misses, don't rationalise them.
- Pronouns not stated: use the name or they/them.
- Adwaith's notes may come from Wispr Flow voice transcription, which contains errors. Prefer the slide transcript where they conflict, and flag real conflicts.

**Event:** Prompt Wars 2026, ACM SRM (Google for Developers + Hack2Skill). Tue 27 Oct 2026, in person, solo. Built in Antigravity with Claude Code (allowed).

**Challenge: FairShift, Decent Work Platform (SDG 8).** Full brief in [docs/problem-statement.md](docs/problem-statement.md). Must have:
- **3 or more working features**
- **2 UIs** (worker + employer/admin)
- **2 or more industries** with a short adoption explanation
- Built for regional languages, low literacy (voice + visual cues), and low-end phones

**Submission (Innovator Dashboard, log in with the registered email):**
1. **GitHub link ending in `.git`:** `https://github.com/adwaithjk98-jpg/promptwars-srm.git`. Public, **exactly one branch**, **under 10 MB**.
2. **Live Google Cloud Run URL.** Vercel, Netlify, Cloudflare or any other host is **rejected**.
3. **LinkedIn post link** (public): the problem → what was built and with which tools → how the solution fits the problem.

**Scoring:** an AI evaluator scores out of 100. **Max 2 attempts, and the latest score counts, even if it's lower.** Attempt 1 shows the gaps. Submit attempt 2 only if confident it scores higher.

## 2. Working agreement
- **Claude is the architect.** Push back plainly on rash or non-ideal choices: give the reason and one recommended alternative, then let Adwaith decide.
- **Research before building.** If code is requested before the problem, user, and approach are understood and critiqued, pause and say so.
- **Flag overengineering.** If effort isn't paying off in the demo or the score, say so and redirect to the core flow.
- **SDG 8 lens.** Every feature names the pain point and the person it helps, and ties to SDG 8 (decent work, safety, fair pay, worker voice).
- **Model/effort check.** Available: Sonnet 5.5 and Opus 5.5, each at low / medium / high / extra high / max.
  - **Research, planning and critique: always Opus 5.5 at extra high.** Use max only for a single hard call. If limits hit mid-planning, continue on Sonnet 5.5 at high.
  - Be generous: when unsure, use **Opus 5.5 at extra high**. Sonnet or low/medium only for clearly mechanical work.
  - **Inside an approved plan:** the plan's per-task list (task → model/effort → reason) *is* the go-ahead. Re-ask only when changing course, starting an unplanned task, or doing something public or irreversible the plan didn't cover.
  - **Outside a plan:** a one-line check before any build, deploy, code, or install task, then wait for go. Read-only checks and doc edits are exempt.
  - Format: `Model/effort check: <task> → <model> / <effort> — <reason>`
- **Pre-flight before anything public or irreversible:** which account/project is active, what becomes public, what can't be undone.

## 3. Build quality bar (the AI evaluator scores these)
- **Code quality:** clean folder structure, full descriptive names, small focused functions, comments only where they help.
- **Security:** no keys in code or the repo; secrets via Google Secret Manager / env vars; validate all input; no sensitive data in logs; anonymous feedback must be truly anonymous (no identifying fields stored).
- **Efficiency:** lightweight, no unnecessary dependencies or build bloat, stateless server so Cloud Run can scale, small pages for low-end phones.
- **Testing:** unit tests for core logic (pay/overtime, fatigue, risk scoring, input validation) written alongside the features, runnable with one command.
- **Accessibility:** WCAG AA contrast, full keyboard navigation, visible focus, labels, `lang` attributes, large tap targets, icons + voice for low literacy.
- **Problem alignment:** the README maps each feature to the pain point it solves and explains the 2-industry adoption.

**Before every commit that touches code, check against the AI evaluator:**
- `npm test` passes, and new logic has tests (coverage ~95%; `npm run test:coverage`).
- No inline `style=` or inline scripts. The CSP is strict (`style-src 'self'`, `script-src 'self'`), so use CSS classes. Setting `element.style.x` from JS is fine.
- User text is rendered only with `textContent`, never `innerHTML`.
- Every new API route has a server-side role check, is scoped to the session's organisation, and validates its input.
- No secrets anywhere; new config is documented in `.env.example`.
- No `console.log` except the startup line, no TODOs, no dead code, full descriptive names.
- No new dependencies unless clearly needed (currently 3).
- README is updated if a feature or pain-point mapping changed.

## 4. Hard rules
1. **Secrets:** keys only in `.env` (git-ignored) or the host's secret store, never in code, docs, commits, or replies. Check the staged diff before every commit. Adwaith has consented to pasting the Gemini key in chat, so use it without warnings. GitHub login stays with Adwaith (`gh auth login`), with no tokens in chat.
2. **One branch:** `main` only, ever.
3. **Size:** check before every push and warn if nearing 10 MB. No datasets, videos, or build output.
4. **Commit small and often**, so something is always submittable.
5. **PROMPTS.md:** log key prompts (prompt, tool, result). It's needed for the LinkedIn post and the pitch.
6. **handoff.md:** update at every commit and every plan change, and commit it with the change.
7. **Confirm with Adwaith** before new outward-facing actions (new public deployments, submitting, posting).
8. **Personal accounts:** never use Adwaith's personal Vercel account. Cloudflare and any shared cloud accounts may hold a personal project, so only touch resources created for this hackathon. Details are in Claude's private memory, not here (this repo is public).

## 5. Tech reference
**Repo:** https://github.com/adwaithjk98-jpg/promptwars-srm.git · git identity Adwaith Jayakrishnan <adwaithjk98@gmail.com>

**Gemini API** (AI Studio key; AI Studio and Vertex AI are both allowed)
- Key: `GEMINI_API_KEY` in `.env`. Load with `set -a; . ./.env; set +a`.
- Use the **Interactions API**: `POST https://generativelanguage.googleapis.com/v1beta/interactions`, header `x-goog-api-key`, body `{"model": "...", "input": "..."}`. The text is in `steps[]` where `type == "model_output"` → `content[].text`.
- Don't use `generateContent` (it hangs with this key) or `gemini-2.5-*` (retired for new users). There is no `gemini-3.8-pro`.
- Every call: ~20s timeout + fallback list `gemini-3.1-flash-lite` → `gemini-3.5-flash` → `gemini-flash-lite-latest`.

**Deploy: Google Cloud Run (mandatory final host). Not yet tested.**
- Container: a `Dockerfile` whose server listens on `process.env.PORT` (Cloud Run sets it, default 8080).
- Deploy from source (Cloud Build builds it, no local Docker needed): `gcloud run deploy <service> --source . --region asia-south1 --allow-unauthenticated`.
- Key via Secret Manager: create secret `gemini-api-key` from `.env`, deploy with `--set-secrets GEMINI_API_KEY=gemini-api-key:latest`, and grant the runtime service account Secret Accessor.
- Needs: a Google Cloud project with billing/free credits, and the Run, Cloud Build, Artifact Registry and Secret Manager APIs enabled.
- Firebase/Firestore is allowed as a backend if the plan needs persistence.

## 6. Keeping these files clean
- **One home per fact.** Rules → CLAUDE.md. The challenge → docs/problem-statement.md. State + history → handoff.md. Only private details → Claude's memory. Don't duplicate.
- **CLAUDE.md is current truth, not a diary.** When a rule changes, rewrite it in place. No dates, no "we used to". No status here.
- **handoff.md:** "Current state" is overwritten each update. The log keeps the ~6 latest entries in full, and older ones collapse into one-line bullets under "Earlier".
