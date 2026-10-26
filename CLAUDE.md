# PromptWars x ACM SRM — Project Context

## Who I'm working with
Adwaith, first-year B.Tech ECE student at SRMIST. Beginner at coding. Designs systems and builds with AI. Explain things plainly and do the work yourself where possible.

## The event
- **PromptWars x ACM SRM Student Chapter** — Tue 27 Oct, in person, solo, ~8 hours
- AI building hackathon by Google for Developers and Hack2Skill
- Theme: **SDG 8 (decent work and economic growth)**
- The actual problem statement is revealed on the spot
- Built inside Antigravity with Claude Code. Organizers confirmed Claude Code is allowed.
- Top 10 pitch to a jury of SRMIST faculty (~5 min): the problem, live demo, how it was built, what's next

## Submission rules (strict)
- Public GitHub repo; link goes on the Hack2Skill Submissions tab
- Repo must be **under 10 MB**
- **Only ONE branch** — everything on `main`, no other branches ever
- **Max 2 submission attempts** total
- Submission also needs: project title, short description, AI tools and key prompts used, working demo or project link

## Event-day rules for Claude
1. **Never commit secrets or API keys.** Use `.env`, keep it in `.gitignore`, and check the staged diff before each commit. Adwaith has consented to pasting the Gemini API key into chat, so put it straight into `.env` and don't lecture about it. The GitHub login is still done by Adwaith with `gh auth login`, with no tokens in chat.
2. **Never create extra branches.** Always `main`.
3. **Check repo size before each push** and warn if it nears 10 MB.
4. **Commit small and often** so something submittable always exists.
5. **Log key prompts in `PROMPTS.md`** as we build: the prompt, the tool used, what came out.
6. **Keep the status list below up to date**: what works, what's broken, what's left.
6b. **Update [handoff.md](handoff.md) after every plan change and every build**, covering the current state plus a log entry of what happened and changed, and commit it with the change. A step isn't finished until handoff.md is updated.
7. Confirm with Adwaith before any new outward-facing action (new public repos, new public deployments, submitting).

## How we work together
- **Claude is the architect.** Push back plainly when Adwaith makes a rash or non-ideal choice, and offer one alternative.
- **Research before building.** Adwaith tends to jump straight into code. Pause the build until the problem, user, and approach are understood and critiqued.
- **Watch for overengineering.** If effort isn't paying off in the demo, say so and redirect to the core flow.
- **SDG 8 lens.** Tie every build decision to a specific SDG 8 target and the specific person it helps.
- **Model/effort check before ANY build, deploy, code, or install task, however small.** Recommend a model and effort level, then wait for Adwaith's go-ahead. Only read-only checks and small doc edits are exempt. For the main build, this comes after planning and critique. Be generous: use Opus 5.5 at extra high when unsure.
- **Pre-flight before anything public or irreversible:** check which account is active, what becomes public, and what can't be undone.

## Repo
- https://github.com/adwaithjk98-jpg/promptwars-srm (public, `main` only)
- Git identity for this repo: Adwaith Jayakrishnan <adwaithjk98@gmail.com>

## Deploy
- **NEVER deploy to, or log in to, Adwaith's existing personal Vercel account.** It belongs to a separate personal project and must stay completely apart from this hackathon (details in Claude's memory, not here, because this repo is public).
- Host for this project: **Cloudflare** by default (not yet tested there). Switch to Firebase only if the problem needs logins/data or a Google tool clearly helps. The Cloudflare account may be shared with the personal project: only create new `promptwars-*` resources, and never touch existing ones.
- Pattern: static page(s) + a server function. The Gemini key lives **only** in the host's server-side environment variable (`GEMINI_API_KEY`), read by the server function, and never in browser code.

## Gemini API (tested 26 Oct)
- Key is in `.env` as `GEMINI_API_KEY` (git-ignored). Load it with `set -a; . ./.env; set +a`.
- **Use the Interactions API**, not the old `generateContent`: `POST https://generativelanguage.googleapis.com/v1beta/interactions`, header `x-goog-api-key`, body `{"model": "...", "input": "..."}`. Read the text from the `steps` item with `type: "model_output"` → `content[].text`. The old `generateContent` endpoint hung with this key, and `gemini-2.5-*` models are retired for new users.
- Models that answered on 26 Oct: `gemini-3.1-flash-lite` (~6s), `gemini-flash-lite-latest` (~12s), `gemini-3.5-flash` (~15s). The newest ones (`gemini-3.8-flash`, `3.7`, `3.6`) were overloaded: 503 or hanging. There is no `gemini-3.8-pro`.
- **Demo safety:** every Gemini call needs a timeout (~20s) and a fallback model list, so the live demo never hangs. Re-check which models are fast on the morning of the event.

## Status (update as we go)
**Works:**
- Git + GitHub push pipeline on `main` (history squashed to one clean commit)
- Deploy pattern proven (page + server function, HTTP 200)
- Gemini key works (Interactions API, see above)

**Broken:**
- (nothing)

**Left to do:**
- Confirm the leftover Vercel test project was deleted (Adwaith, via dashboard)
- Optional: quick Cloudflare deploy test (needs model/effort check + go-ahead)
- Event morning: re-check which Gemini models respond fast
- Learn the problem statement (event day)
- Pick an approach, build, demo, README, submit
