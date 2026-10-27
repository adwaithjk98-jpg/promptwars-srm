# Handoff

Current state + a short log. Rules live in [CLAUDE.md](CLAUDE.md). The challenge is in [docs/problem-statement.md](docs/problem-statement.md). Update this at every commit and every plan change.

## Current state — Tue 27 Oct 2026, 11:40 IST (event day)

**Phase:** Plan approved. P1 core built and tested locally (35/35 tests pass; Gemini triage verified with a Tamil report). Waiting on Google Cloud credits: organizers release the trygcp.dev link in the WhatsApp group **at 12:00**. **Final deadline: 1:00 pm** (confirmed).

**Deadlines** (unconfirmed, need organizer answers)
- "Something before 1 pm": Adwaith's notes say "problem statement submission is before 1pm". What exactly is due?
- Final submission: the slides imply today; Wispr notes say "improve and submit within the next week". Conflicting.

**Works**
- Repo on `main`, pushed. Gemini key via the Interactions API.
- App shape proven on Cloudflare (page → server → Gemini). Cloudflare isn't allowed as the final host, but the pattern carries over to Cloud Run.

**Broken / blocked**
- No Google Cloud project or credits until 12:00 (bare `trygcp.dev` says "no access"; the event link isn't out yet). `gcloud` is installed but not logged in.

**Decisions**
| Decision | Why |
|---|---|
| Final host: Google Cloud Run (replaces Cloudflare) | Organizer rule; everything else is rejected |
| Gemini Interactions API + timeout + fallback models | `generateContent` hung; newest models overloaded; the demo must never freeze |
| Quality bar from the start: unit tests, security, accessibility, clean code, lean deps | The AI evaluator scores exactly these |
| One approved plan = go-ahead; planning on Opus 5.5 at extra high | Saves time and tokens; mistakes cost most in planning |
| Attempt 1 = a complete, deployed version; attempt 2 only if confident of a higher score | The latest score overwrites, even if lower |

**Open items**
- [ ] Ask organizers: what's due at 1 pm; final deadline; does the first "check" use an attempt; Google Cloud credits (coupon or free trial); is a repo created on 26 Oct OK
- [ ] Adwaith: Google Cloud account + free credits + project → send Claude the project ID
- [ ] Claude: install `gcloud` (needs a model/effort go-ahead), then Adwaith runs `gcloud auth login`
- [ ] Planning: features, 2 industries, stack, architecture, pitch/LinkedIn outline, per-task model/effort list
- [ ] Find Antigravity's built-in agents (plan B)
- [ ] Later: delete the Cloudflare test Worker `promptwars-deploytest` (no longer needed; it holds the key)

**Approved plan (11:10)**
- **Product:** a work portal. The worker side is mobile-first, read-mostly, one tap per shift. The admin side is desktop-first and configures the org. Two roles only (worker, admin); industry belongs to the organisation and sets presets (pay/overtime rules, fatigue limits, hazard categories, wording).
- **Industries:** construction site + hospital (contrast: pay/overtime + site hazards vs rotating night shifts + fatigue).
- **P1 (must, by ~12:05):** persona sign-in with signed-cookie sessions and server-side role checks · one-tap check-in/out → automatic hours, overtime and pay breakdown (payslip) · fatigue alerts · issue/safety reports with an anonymous toggle, anonymous tracking code and status tracking · admin dashboard · unit tests · Cloud Run deploy.
- **P2 (~12:05–12:40):** Gemini triage of reports (neutral rewrite, category, severity, translation, abuse flag; graceful fallback) · attrition-risk score · Tamil + Hindi strings + read-aloud · accessibility pass · README feature→pain map + 2-industry adoption.
- **P3 / "what's next":** QR site check-in, voice-recorded reports, skill passport, org join codes, Firestore persistence, phone-OTP login.
- **Stack:** Node 22 + Express + helmet + express-rate-limit; vanilla HTML/CSS/JS (no build step); `node:test`; Gemini via `fetch`; in-memory repository behind a clean interface (Cloud Run `max-instances=1`); Dockerfile on `$PORT`; secrets via Secret Manager.
- **Checkpoints (revised 11:40, credits at 12:00):** before 12:00 `gcloud auth login` + one-command deploy script + accessibility pass · 12:00–12:10 redeem credits, project, billing · ~12:20 live on Cloud Run · 12:30 if not live, Render fallback · 12:40–12:55 final test, LinkedIn post, attempt 1.

**Next step:** Adwaith runs `gcloud auth login` now (no project needed). Claude writes the one-command deploy script. At 12:00 Adwaith redeems credits → sends project ID → Claude deploys.

## Log (newest first)

### 27 Oct, 11:40: credits delayed to 12:00
- The credit link comes only from the WhatsApp group at 12:00 (the dashboard Quick Links has none). Moved login and deploy prep before 12:00 so deploy takes one command once the project exists. Fixed the credit-link wording in docs/google-cloud-setup.md.

### 27 Oct, 11:40: UI redesign + README
- Adwaith asked for an official look with fewer emojis and less clutter. Redesigned: worker app with Today / Pay / Report tabs (mobile-first, document-style payslip), manager app with Overview ("needs attention") / Workforce / Reports tabs, SVG line icons, accessible keyboard tabs. Checked with Playwright screenshots (desktop + mobile + Tamil), no console errors.
- README rewritten: feature → pain-point map, 2-industry table, architecture, security, accessibility.
- Staying in auto mode (plan mode would add round trips).

### 27 Oct, 11:27: core built
- Built the stack as planned: Express + helmet + rate limit, signed-cookie persona sessions, server-side role checks, pay/overtime/night allowance, fatigue alerts, explainable quit-risk score, anonymous reports (no identity, date only, tracking code), Gemini triage with fallback, worker UI (EN/TA/HI + read-aloud) and admin dashboard. 35 tests pass.
- Organizers: deploy issues are allowed to fall back to other hosts; decision: stay on Cloud Run, fallback Render at 12:15 if Cloud Run isn't live.
- `gcloud` installed (SDK 590). Docs added: docs/google-cloud-setup.md, future_additions.md.

### 27 Oct, 10:36: brief received
- Challenge: FairShift (fair, safe, transparent work for large workforces; 3+ features, 2 UIs, 2+ industries; regional languages, low literacy, low-end phones). Saved to docs/problem-statement.md.
- New rules: Cloud Run is the only allowed host; the repo link must end in `.git`; LinkedIn post required; AI evaluator on 6 parameters; 2 attempts, latest counts. CLAUDE.md rewritten to match.

### 26 Oct, night: files restructured
- One home per fact (CLAUDE.md rules, handoff.md state, memory private only). Lighter build process. Planning on Opus 5.5 at extra high.

### Earlier (26 Oct)
- Setup: CLAUDE.md, README, PROMPTS.md, `.gitignore`, public repo, pipeline tested; history squashed to one commit.
- Working agreement set: architect role, research first, overengineering flags, SDG 8 lens, model/effort checks.
- Gemini key tested: Interactions API works; `generateContent` hangs.
- Deploy tests: Vercel (wrong personal account, cleaned up) and Cloudflare (worked end to end).
