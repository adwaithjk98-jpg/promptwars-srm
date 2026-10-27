# Handoff

Current state + a short log. Rules live in [CLAUDE.md](../CLAUDE.md). The challenge is in [docs/problem-statement.md](problem-statement.md). Update this at every commit and every plan change.

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

**Next step:** At 12:00 Adwaith redeems credits, creates the project + billing, sends the project ID → Claude runs `scripts/deploy-cloud-run.sh <project-id>`. (`gcloud` is logged in as Adwaith's account; deploy script ready.)

## Log (newest first)

### 27 Oct, 13:25: project moved into its own folder
- Locally the repo now lives in `promptwars building/groundline/` so the parent folder can be reused for other events. GitHub repo, Cloud Run service and submission links are unchanged. General lessons from this event are in the parent folder's playbook.

### 27 Oct, 12:56: submissions done
- Attempt 2 = 94.15 (attempt 1 was 94.45). The latest score counts, so the final is 94.15; rank 16 (was 12 just before resubmitting; 7th at attempt 1 before others submitted). Both attempts used.
- Remaining clean-up: delete the Cloudflare test Worker `promptwars-deploytest` (holds the Gemini key); keep Cloud Run up for judging.

### 27 Oct, 12:43: attempt 1 = 94.45 (rank 7/672)
- Scores: code quality 88, security 99, efficiency 100, testing 99, accessibility 98, problem alignment 93.
- Improvements pushed (not resubmitted): README requirements checklist + example-feature + rubric mapping; ESLint (recommended) with `npm run lint`, clean; Gemini client tests (43 total).
- Decision on attempt 2 is Adwaith's; the latest score overwrites.

### 27 Oct, 12:27: LIVE on Cloud Run
- Renamed the app to Groundline (the challenge is still FairShift). Live: https://groundline-1029463540920.asia-south1.run.app (service `groundline`, project `fairshift-121859`).
- The first deploy failed on build-account permissions; granted run.builder, storage.objectViewer, artifactregistry.writer and logging.logWriter, then it worked. The first live Gemini call returned no triage (likely propagation); added warning logs (model + status only) and it works now. `/healthz` is reserved by Cloud Run, so it's now `/health`.
- LinkedIn post redrafted in plain text with both industries and an outcomes section.

### 27 Oct, 12:20: deploying
- Event credits never came (organizers said use Vercel or similar). Rejected Vercel/Cloudflare: the in-memory app needs one long-running server. Adwaith activated Google's own free trial; Claude created project `fairshift-121859`, linked the open trial billing account, and started `scripts/deploy-cloud-run.sh`.
- Evaluator pass done: strict CSP (no inline styles), `.env.example`, LICENSE, `test:coverage` (94.6% lines). The evaluator checklist is now in CLAUDE.md §3.
- Onboarding (org creation, join codes, real login) discussed; only if time allows after deploy, otherwise pitched as next.

### 27 Oct, 12:07: tracking code 'not found' explained
- Not a bug in the code: the local server was restarted at 12:02, and in-memory reports vanish on restart. On Cloud Run the same would happen when an idle instance shuts down, so the deploy script now sets `--min-instances 1`. Real fix: Firestore (listed in What's next).

### 27 Oct, 12:05: admin reports UI tidy
- 'Always show original messages' moved into a ⋯ menu (closes on outside click / Escape); show/hide original is now a text link. Static files now revalidate on each load (max-age 0 + ETag), because a 1 h cache was showing stale CSS after changes.

### 27 Oct, 12:00: critique + improvements
- Ran the full flow end to end (worker → anonymous Tamil report → Gemini critical → admin acknowledges → tracking code), and it works. Honest gaps for real use: no real login, no org/worker onboarding, in-memory data, no missed-check-out fix, server text (categories, alerts) English-only.
- Added: 'Other' category; triage judges severity by the problem, not tone; seeded reports carry stored AI summaries; admin show/hide original per report + 'always show' saved per admin (`PATCH /api/admin/preferences`); worker Today: live timer, pay earned so far, 7-day bars; speak-to-type for reports; anonymous tracking codes saved on the phone only. 38 tests pass; headless-Chrome run, no console errors.

### 27 Oct, 11:40: Google Cloud timing
- The credit link is only released at 12:00 (WhatsApp). Plan: gcloud login + project creation now (no credits needed); billing linked at 12:00; deploy right after. The deploy window is roughly 12:05–12:40.

### 27 Oct, 11:47: deploy script ready
- `gcloud auth login` done. Added `scripts/deploy-cloud-run.sh` (enables APIs, Gemini key + session secret into Secret Manager, IAM for the runtime account, deploys `fairshift` to asia-south1 with max 1 instance) and `.gcloudignore` (upload list checked: no `.env`). 35/35 tests pass; server on `$PORT` serves pages.

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
