# LinkedIn post draft (fill in the two links before posting)

---

On a construction site, a mason works 10-hour days for weeks. His overtime is written in a paper register he never sees. When the scaffolding near the lift shaft loses its guard rails, he says nothing, because complaining could cost him his job.

That was the problem I tackled at **Prompt Wars 2026** (ACM SRMIST × Google for Developers × Hack2Skill), under **UN SDG 8: Decent Work and Economic Growth**.

**The problem:** construction sites, hospitals and factories still run large workforces on paper registers and WhatsApp groups. Workers can't see how their pay is calculated, fear being identified if they report problems, and hazards go unreported until someone gets hurt. Employers only find out who is overworked or about to quit when it's too late.

**What I built: Groundline**, a decent-work platform with two apps:
- **Workers:** one tap to check in and out, a payslip that shows every rupee and the rule behind it, fatigue alerts, and safety reporting with an anonymous option and a tracking code. Available in English, Tamil and Hindi, with read-aloud.
- **Managers:** a dashboard that flags overwork and quit risk (with reasons), and AI-triaged reports. Gemini turns a report in any language into a neutral English summary with a severity level, even when the original is angry.

The same engine adapts to each industry: a construction site and a hospital have different overtime, rest and hazard rules.

**How I built it:** solo in one day with **Claude Code** inside **Antigravity**, the **Gemini API**, Node.js, and **Google Cloud Run**, with unit tests, server-side access control, and anonymous reports that store no identity.

**Why it fits:** transparent pay, a safe voice, and early warnings are what decent work looks like on the ground.

Live demo: [Cloud Run link]
Code: [GitHub link]

#PromptWars #SDG8 #DecentWork #GoogleCloud #Gemini #ClaudeCode #ACMSRM
