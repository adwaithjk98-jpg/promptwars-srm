# Handoff

The living record of where this project stands. It's updated after every change to the plan and every build, so any new session (or a fresh Claude after a usage-limit reset) can pick up exactly where we left off.

Read this together with [CLAUDE.md](CLAUDE.md), which holds the rules. This file holds the story and the current state.

---

## Current state (last updated: Mon 26 Oct 2026, evening, pre-event)

**Phase:** Pre-event setup done. Waiting for the problem statement (Tue 27 Oct).

**What exists**
- Public repo https://github.com/adwaithjk98-jpg/promptwars-srm, `main` only, history squashed to one clean commit.
- `CLAUDE.md` (rules + context), `PROMPTS.md` (prompt log for submission), `README.md` (placeholder), `.gitignore`, this file.
- `.env` with `GEMINI_API_KEY`, local only, git-ignored.
- No app code yet, on purpose: building starts after the problem statement, research, and critique.

**Decisions so far**
| Decision | Why |
|---|---|
| Single repo `promptwars-srm`, `main` only | Submission rules: one branch, public, under 10 MB |
| App shape: static page + one server function | Keeps the Gemini key on the server; fits almost any AI web app |
| Gemini via the **Interactions API** | The older `generateContent` call hung with this key; `gemini-2.5-*` is retired for new users |
| Timeout + fallback model list on every Gemini call | Newest models were overloaded on 26 Oct; the live demo must never hang |
| Host: **Cloudflare Workers** (with static assets) by default; switch to Firebase only if the problem needs logins/data or a Google tool would clearly help with the jury | Free, no card, generous limits, key stays server-side. Tested end to end on 26 Oct |
| Never use the personal Vercel account | It belongs to a separate personal project that must stay apart |

**Open items**
- [x] Leftover Vercel test project deleted (Adwaith confirmed)
- [x] Cloudflare deploy test: page → server → Gemini works publicly
- [ ] Event morning: re-check which Gemini models respond fast
- [ ] After the event: delete the test Worker `promptwars-deploytest` (it calls Gemini with the key, so it shouldn't stay up forever)
- [ ] Event day: problem statement → research → plan → critique → model/effort assessment → build

**Next step:** On event day, Adwaith pastes the problem statement. Start with research and planning, not code.

---

## Log (newest first)

### 26 Oct, night: Cloudflare deploy test passed
- Model/effort check given first (Opus 5.5, high), and Adwaith said go.
- Pre-flight: Wrangler logged in to one account; confirmed the Worker name `promptwars-deploytest` didn't exist, so nothing was overwritten. Nothing else on the account was touched.
- Deployed a Worker with static assets: https://promptwars-deploytest.adwaithjk98.workers.dev
- Gemini key added as a Worker **secret** (piped from `.env`, never printed). Confirmed it's not visible in the public page.
- Public test: page HTTP 200; `/api/hello` → `gemini-3.1-flash-lite` answered "Gemini is connected." in ~5s.
- The server code used a 20s timeout per model and the fallback list `gemini-3.1-flash-lite` → `gemini-3.5-flash` → `gemini-flash-lite-latest`. Reuse this pattern in the real build.
- The test code lives in Claude's temporary scratchpad, not this repo, on purpose (no pre-built app code). The setup is in CLAUDE.md → Deploy.
- Earlier: Adwaith confirmed the leftover Vercel test project is deleted.

### 26 Oct, evening: Gemini key tested
- Key saved to `.env` only, and confirmed absent from every tracked file.
- The model list works (46 models). `generateContent` hung, and the new Interactions API works.
- Fast models: `gemini-3.1-flash-lite` (~6s), `gemini-flash-lite-latest` (~12s), `gemini-3.5-flash` (~15s). `gemini-3.8/3.7/3.6-flash` were overloaded (503 or hanging).
- Recorded in CLAUDE.md so tomorrow's code uses the right call.

### 26 Oct, evening: host discussion
- Adwaith asked whether to pick a host before knowing the project. Agreed: we're not choosing architecture, just making sure some public link is possible.
- Adwaith suggested Cloudflare. Accepted as the default, since it's linked to a personal account but that's fine as long as nothing of the other project is touched.

### 26 Oct, evening: repo history cleaned
- Adwaith squashed all commits into one and force-pushed `main`, which removed an earlier mention of the personal project and some wrong pronoun wording from public history. Verified: one branch, one commit, history scan clean.

### 26 Oct, evening: deploy test
- A hello-world page + server function deployed and worked publicly (HTTP 200), which proved the pattern.
- Mistake: it went into the personal Vercel account. Claude logged the CLI out. Deleting the leftover project is pending (dashboard).
- Process fix: model/effort check and a pre-flight (which account, what goes public, what's irreversible) before every build or deploy.

### 26 Oct, evening: working agreement
- Claude acts as architect: push back on rash choices, stop building-before-research, flag overengineering, SDG 8 lens on every decision.
- Model/effort recommendation before any build, deploy, code, or install task; be generous (Opus 5.5 extra high when unsure).

### 26 Oct, evening: setup
- CLAUDE.md, README, PROMPTS.md, `.gitignore`, git on `main`, public repo created and pushed, pipeline tested.
