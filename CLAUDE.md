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
- Host for this project: to be decided (separate service or separate account). See status below.
- Pattern: static page(s) + a server function. The Gemini key lives **only** in the host's server-side environment variable (`GEMINI_API_KEY`), read by the server function, and never in browser code.

## Status (update as we go)
**Works:**
- Git + GitHub push pipeline on `main`
- Deploy pattern proven (page + server function, HTTP 200)

**Broken:**
- (nothing)

**Left to do:**
- Delete the leftover Vercel test project (Adwaith, via dashboard)
- Sign up for a separate deploy host account (Netlify) — pattern already proven, just need the account ready
- Gemini call through the server function (waiting on the API key)
- Learn the problem statement (event day)
- Pick an approach, build, demo, README, submit
