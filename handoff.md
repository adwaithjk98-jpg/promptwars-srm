# Handoff

Current state + a short log. Rules live in [CLAUDE.md](CLAUDE.md). Update this at every commit and every plan change.

## Current state — Mon 26 Oct 2026, night (pre-event)

**Phase:** Pre-event setup complete. Next: event day, arrival checks, then research (CLAUDE.md §3).

**Works**
- Repo on `main`, pushed; pipeline tested.
- Gemini key (`.env`) via the Interactions API.
- Cloudflare: public page → server function → Gemini, end to end (test Worker `promptwars-deploytest`).

**Broken:** nothing.

**Decisions**
| Decision | Why |
|---|---|
| Static page + one server function | Keeps the key server-side; fits almost any AI web app |
| Gemini Interactions API + timeout + fallback models | `generateContent` hung; newest models overloaded; the demo must never freeze |
| Cloudflare Workers as default host (Firebase if the problem needs it) | Free, no card, generous limits; tested |
| No app code before the event | Event fairness; the setup steps are in CLAUDE.md §5 |
| Lighter process during the build: one approved plan = go-ahead; feature freeze at hour 6; attempt 1 at ~6:30 | Per-task approvals would eat time and tokens |

**Open items**
- [ ] Arrival: ask organizers about judging criteria, whether a pre-created repo is OK, and whether post-submission commits count
- [ ] Arrival: re-check fast Gemini models; find Antigravity's built-in agents (plan B)
- [ ] Research phase: draft the pitch outline alongside the plan
- [ ] After the event: delete test Worker `promptwars-deploytest` (it calls Gemini with the key)

**Next step:** Adwaith pastes the problem statement → research and plan, no code.

## Log (newest first)

### 26 Oct, night: files restructured
- Each fact now has one home: CLAUDE.md = rules (rewritten by phase of use), handoff.md = state + capped log, Claude's memory = private details only. Memory went from 12 overlapping files to 2, with no rule dropped.
- Process lightened: an approved plan counts as the go-ahead; feature freeze at hour 6; submission timing set; plan B noted.

### 26 Oct, night: Cloudflare deploy test passed
- Pre-flight: one account, the Worker name was free, nothing existing touched. Key stored as a Worker secret and confirmed absent from the public page.
- `/api/hello` → `gemini-3.1-flash-lite` answered in ~5s.

### 26 Oct, evening: Gemini key tested
- The Interactions API works. `generateContent` hangs, and `gemini-2.5-*` is retired. The newest models were overloaded, which led to the timeout + fallback rule.

### Earlier (26 Oct)
- Setup: CLAUDE.md, README, PROMPTS.md, `.gitignore`, public repo, pipeline tested.
- Working agreement set: architect role, research first, overengineering flags, SDG 8 lens, model/effort checks.
- Vercel test worked but went into a personal account by mistake. Logged out; Adwaith deleted the project; personal-account rule added.
- History squashed to one clean commit by Adwaith (removed a personal-project mention and wrong pronouns).
