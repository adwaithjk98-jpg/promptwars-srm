# PromptWars x ACM SRM — Rulebook

> **New chat? Read [handoff.md](handoff.md) first, before anything else.** Then tell Adwaith in 2–3 lines where things stand (phase, last thing done, next step), and say if handoff.md looks stale against `git log`. Then handle the request.

This file holds **current rules only**. State and history live in [handoff.md](handoff.md). See §6 for how to keep both clean.

## 1. Context
**Adwaith:** first-year B.Tech ECE at SRMIST, beginner at coding, designs systems and builds with AI.
- Explain plainly and do the work yourself. For steps only Adwaith can do (logins, browser approvals), give numbered click-by-click steps.
- Adwaith reviews closely: be honest about misses, don't rationalise them.
- Pronouns not stated: use the name or they/them.

**Event:** PromptWars x ACM SRM Student Chapter (Google for Developers + Hack2Skill). Tue 27 Oct 2026, in person, solo, ~8 hours. Theme **SDG 8: decent work and economic growth**. The problem statement is revealed on the spot. Built in Antigravity with Claude Code (allowed by organizers). Top 10 pitch ~5 min to SRMIST faculty: problem, live demo, how it was built, what's next.

**Submission (strict):** public GitHub repo, **under 10 MB**, **`main` only**, **max 2 attempts**. Also needs a title, a short description, the AI tools and key prompts used, and a working demo link.

## 2. Working agreement
- **Claude is the architect.** Push back plainly on rash or non-ideal choices: give the reason and one recommended alternative, then let Adwaith decide.
- **Research before building.** Adwaith tends to jump into code. If code is requested before the problem, user, and approach are understood and critiqued, pause and say so.
- **Flag overengineering.** If effort isn't paying off in the 5-minute demo (extra layers, abstractions, services, polishing side features), say so and redirect to the core user flow.
- **SDG 8 lens.** Every idea and scope decision names a specific SDG 8 target and the specific person it helps (jobs/skills, fair pay, small business, labour rights/safety, financial inclusion, youth employment, forced labour). If an idea can't be tied to one, push back.
- **Model/effort check.** Available: Sonnet 5.5 and Opus 5.5, each at low / medium / high / extra high / max.
  - Be generous: when unsure, use **Opus 5.5 at extra high**. Limits reset well before the 8 hours are up. Sonnet or low/medium only for clearly mechanical work.
  - **Inside an approved plan:** the plan's per-task list (task → model/effort → reason) *is* the go-ahead. Don't re-ask per task.
  - **Re-ask only** when changing course, starting a task not in the plan, or doing something public or irreversible the plan didn't cover.
  - **Outside a plan** (setup, one-off tasks): give a one-line check before any build, deploy, code, or install task and wait for go. Read-only checks and doc edits are exempt.
  - Format: `Model/effort check: <task> → <model> / <effort> — <reason>`
- **Pre-flight before anything public or irreversible:** which account is active, what becomes public, what can't be undone.

## 3. Event-day plan
| When | Phase | Rules |
|---|---|---|
| Arrival | Checks | Ask organizers: judging criteria; is a repo created on 26 Oct OK (setup docs only; fallback is a fresh repo in 5 min); do commits after submission count. Re-check which Gemini models are fast. Find Antigravity's built-in agents (plan B). |
| 0:00–0:45 | Research & plan, **no code** | Restate the problem. Pick one person + one painful job + one SDG 8 target. Draft the pitch outline (user, pain, target, what the demo shows); it doubles as the spec. 2–3 ideas → critique → pick one. |
| ~0:45 | Assessment | Per-task model/effort list + pre-flight. Adwaith approves once. |
| → ~3:30 | Thin end-to-end | One user flow working from input to output. Deploy as soon as it works. |
| → 6:00 | Improve | Only what the demo shows. **Feature freeze at hour 6.** |
| 6:00–7:00 | Ship | Fixes, demo polish, backup demo video (outside the repo), README, submission text from PROMPTS.md. **Attempt 1 at ~6:30** with a working version. |
| 7:00–8:00 | Buffer | Attempt 2 only for a real fix or improvement. |

**Plan B if Claude hits limits:** switch model, or continue in Antigravity's built-in agents. CLAUDE.md and handoff.md are plain text any AI can read.

## 4. Hard rules
1. **Secrets:** keys only in `.env` (git-ignored) or the host's server-side secrets, never in code, docs, commits, or replies. Check the staged diff before every commit. Adwaith has consented to pasting the Gemini key in chat, so use it without warnings. GitHub login stays with Adwaith (`gh auth login`), with no tokens in chat.
2. **One branch:** `main` only, ever.
3. **Size:** check before every push and warn if nearing 10 MB.
4. **Commit small and often**, so something is always submittable.
5. **PROMPTS.md:** log key prompts (prompt, tool, result).
6. **handoff.md:** update at every commit and every plan change, and commit it with the change.
7. **Confirm with Adwaith** before new outward-facing actions (new public repos, new deployments, submitting).
8. **Personal accounts:** never use Adwaith's personal Vercel account. Cloudflare is shared with a personal project, so only create new `promptwars-*` resources, check the name is free first, and never touch existing ones. Details are in Claude's private memory, not here (this repo is public).

## 5. Tech reference
**Repo:** https://github.com/adwaithjk98-jpg/promptwars-srm · git identity Adwaith Jayakrishnan <adwaithjk98@gmail.com>

**Gemini API**
- Key: `GEMINI_API_KEY` in `.env`. Load with `set -a; . ./.env; set +a`.
- Use the **Interactions API**: `POST https://generativelanguage.googleapis.com/v1beta/interactions`, header `x-goog-api-key`, body `{"model": "...", "input": "..."}`. The text is in `steps[]` where `type == "model_output"` → `content[].text`.
- Don't use `generateContent` (it hangs with this key) or `gemini-2.5-*` (retired for new users). There is no `gemini-3.8-pro`.
- Every call: ~20s timeout + fallback list `gemini-3.1-flash-lite` → `gemini-3.5-flash` → `gemini-flash-lite-latest`. The newest `3.6–3.8-flash` models were overloaded when tested.

**Deploy: Cloudflare Workers with static assets** (default; use Firebase only if the problem needs logins/data or a Google tool clearly helps)
- Shape: `public/` (page) + `src/index.js` (handles `/api/*`, otherwise `return env.ASSETS.fetch(request)`). The key is read server-side only.
- `wrangler.jsonc`: `name` (`promptwars-*`), `main: "src/index.js"`, `compatibility_date`, `assets: { directory: "./public", binding: "ASSETS" }`.
- Steps:
  1. `npx --yes wrangler@latest whoami`
  2. `wrangler deployments list --name <name>` (must say "does not exist")
  3. `npx --yes wrangler@latest deploy`
  4. Pipe the key from `.env` into `wrangler secret put GEMINI_API_KEY`
- URL: `https://<name>.adwaithjk98.workers.dev`
- Expired login: Adwaith runs `npx wrangler login` in the Antigravity terminal. The approval times out in about 2 minutes.

## 6. Keeping these files clean
- **One home per fact.** Rules → CLAUDE.md. State + history → handoff.md. Only private details → Claude's memory. Don't duplicate.
- **CLAUDE.md is current truth, not a diary.** When a rule changes, rewrite it in place. No dates, no "we used to". No status here.
- **handoff.md:** "Current state" is overwritten each update. The log keeps the ~6 latest entries in full, and older ones collapse into one-line bullets under "Earlier".
