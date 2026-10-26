# Key Prompts Log

Running log of the key prompts used while building, which AI tool handled them, and what came out. Used for the Hack2Skill submission.

| # | Prompt (summary) | Tool | Result |
|---|------------------|------|--------|
| 1 | Set up project: CLAUDE.md, git on `main`, .gitignore, README | Claude Code (in Antigravity) | Created project context file, git repo, ignore rules, README and this log |
| 2 | Create public repo `promptwars-srm`, push `main`, test the commit/push pipeline | Claude Code + GitHub CLI | Repo live at github.com/adwaithjk98-jpg/promptwars-srm, pipeline verified |
| 3 | Do a complete end-to-end deploy test in a throwaway folder before the event | Claude Code + Vercel CLI | Hello-world page plus server function live on Vercel, Gemini key kept server-side |
| 4 | Here's the Gemini API key, test it | Claude Code + Gemini API | Key stored in `.env` only; found that new keys need the Interactions API and that the newest models were overloaded, so we use timeouts and fallbacks |
| 5 | Run a Cloudflare deploy test (after a model/effort check: Opus 5.5, high) | Claude Code + Cloudflare Wrangler + Gemini API | Public page → server function → Gemini working on Cloudflare Workers; key stored as a server secret |
