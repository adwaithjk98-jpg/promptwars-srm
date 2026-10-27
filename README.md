# Groundline: a FairShift Decent Work Platform

**Fair pay you can see. A voice you can trust. Safer work for everyone.**

Groundline replaces paper registers, spreadsheets and WhatsApp groups for employee-intensive workplaces. Workers see exactly how their pay is calculated and can report problems safely, even anonymously. Employers get an early-warning view of who is overworked, unhappy or likely to quit.

Built for **Prompt Wars 2026 (ACM SRMIST)**, challenge **FairShift** (Decent Work Platform), aligned with **UN SDG 8: Decent Work and Economic Growth** (targets 8.5 fair pay, 8.7/8.8 safe and secure working environments and labour rights).

- **Live app:** https://groundline-1029463540920.asia-south1.run.app
- **Problem statement:** [docs/problem-statement.md](docs/problem-statement.md)

## Features and the problems they solve

| Feature | Who | Pain point it solves |
|---|---|---|
| **One-tap check-in / check-out** with a live timer, pay earned so far this shift and a 7-day hours chart (overtime days in amber) | Worker | Overtime hours not counted; manual registers |
| **Clear payslip:** regular pay, overtime at 2×, night-shift allowance, with the rule behind each line | Worker | Opaque pay calculations |
| **Read-aloud payslip** and full **English / Tamil / Hindi** interface | Worker | Regional languages, limited literacy |
| **Fatigue alerts:** weekly hours over the limit, too little rest between shifts, over-long shifts | Worker + manager | Overwork, unreported safety risk |
| **Safety and issue reporting** with **speak-to-type** (Tamil/Hindi/English), an **anonymous toggle**, a tracking code saved only on the worker's phone, and status tracking (open → acknowledged → resolved) | Worker | Fear of identification, hazards ignored until injury |
| **AI triage (Gemini):** turns any-language reports into a neutral English summary, sets severity by the problem (not the tone), flags abusive wording; managers can show the original words per report or always | Manager | Delayed escalation; keeps anonymous feedback civil |
| **Workforce dashboard:** totals, a "needs attention" list, per-worker hours, overtime and pay | Manager | Zero workforce visibility |
| **Explainable quit-risk score:** every score lists its reasons | Manager | High attrition risk |

Two separate interfaces: a mobile-first **worker app** and a desktop-first **manager dashboard**.

## Two industries, one engine

Each organisation picks an **industry preset**. The same code then applies that industry's rules (overtime threshold, weekly limit, minimum rest, night allowance, hazard categories).

| | Construction site | Hospital |
|---|---|---|
| Typical worker | Daily-wage masons, helpers, steel fixers; many migrant workers | Nurses, sanitation staff, ward attendants on rotating shifts |
| Main risk | Long days, uncounted overtime, falls and electrical hazards | Night shifts, back-to-back shifts, needle-stick and infection risk |
| Rules in the preset | Overtime after 8 h at 2×; weekly limit 48 h; 10 h minimum rest | Overtime after 8 h at 2×; ₹150 night allowance; 11 h minimum rest |
| Report categories | Fall from height, scaffolding, electrical, heat stress, machinery | Needle-stick, chemical exposure, infection risk, patient aggression, slip or fall |
| How it's adopted | Contractor registers the site; workers check in on any basic phone at the gate | Facilities manager adds staff; shift change becomes one tap per person |

Adding a factory or a campus is a new preset, not new code.

## Architecture

```
public/            Static worker app, manager dashboard and sign-in (vanilla HTML/CSS/JS, no build step)
src/
  app.js           Express app: security headers, rate limits, sessions, routes
  server.js        Entry point (listens on $PORT for Cloud Run)
  config/          Industry presets
  domain/          Pure business logic: pay, fatigue, quit risk, report rules
  security/        Signed session tokens and role checks
  services/        Workforce insights, Gemini client and report triage
  data/            Repository interface (in-memory for the prototype) and demo data
tests/             Unit and API tests (node:test)
```

- **Stateless server:** the data layer is a repository interface; the prototype keeps data in memory, and Firestore is the next step ([docs/future-additions.md](docs/future-additions.md)).
- **Lightweight:** three runtime dependencies (express, helmet, express-rate-limit). Pages are plain HTML and JavaScript, so they load fast on low-end phones.

## Security

- No secrets in the code or repo. The Gemini key is read from the environment (Google Secret Manager on Cloud Run).
- Sessions are HMAC-signed, HttpOnly, SameSite=Strict cookies. **Roles are enforced on the server.** Workers can't reach manager APIs, and managers only see their own organisation.
- **Anonymous reports store no user ID and no exact time** (date only), so they can't be traced through shift timings.
- All input is validated and length-limited. User text is rendered with `textContent` only (no HTML injection).
- Helmet security headers and a Content Security Policy. Rate limits on the API and on report submission. Errors never leak internals.
- The Gemini prompt treats report text as data, and its output is validated before use. If Gemini fails, the report is still saved.

## Accessibility

- Keyboard navigation throughout, including arrow-key tabs, a skip link and visible focus outlines.
- WCAG AA colour contrast, 48 px tap targets, labelled form fields, `lang` set per language.
- Icons paired with text, read-aloud for pay, and simple one-tap actions for workers with limited literacy.

## Run locally

```bash
npm install
npm test                      # unit + API tests
GEMINI_API_KEY=... npm start  # optional key enables AI triage; open http://localhost:8080
```

## Deploy (Google Cloud Run)

```bash
gcloud run deploy groundline --source . --region asia-south1 --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest --max-instances 1
```

## Built with

Claude Code (Claude Opus 5.5) in Antigravity, Gemini API, Node.js, Express, Google Cloud Run. Key prompts are logged in [docs/PROMPTS.md](docs/PROMPTS.md).
