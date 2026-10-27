# LinkedIn post (plain text: LinkedIn doesn't render markdown)

Audience must be set to **Anyone**. Add a dashboard screenshot. Tag the organisers with `@` (see the tags line).

---

On a construction site, a mason works 10-hour days for weeks. His overtime sits in a paper register he never sees. When the scaffolding loses its guard rails, he says nothing, because complaining could cost him his job.

In a hospital across town, a nurse finishes a 12-hour night shift and is rostered back six hours later. No one notices until something goes wrong.

That's the problem I took on at Prompt Wars 2026, hosted by ACM SRMIST with Google for Developers and Hack2Skill, under UN SDG 8: Decent Work and Economic Growth.

THE PROBLEM
Construction sites, hospitals and factories still run large workforces on paper registers and WhatsApp groups. Workers can't see how their pay is calculated, fear being identified if they speak up, and hazards go unreported until someone gets hurt. Employers find out who is overworked or about to quit only when it's too late.

WHAT I BUILT: GROUNDLINE
A decent-work platform with two apps, one engine:
→ For workers: one tap to check in and out, a payslip that shows every rupee and the rule behind it, rest and fatigue alerts, and safety reporting with an anonymous option and a tracking code. In English, Tamil and Hindi, with read-aloud for workers with limited literacy.
→ For managers: a dashboard that flags overwork and quit risk with the reasons, and reports triaged by AI. Gemini turns a report written in any language into a neutral English summary with a severity level, even when the original is angry.
→ For any industry: a construction site and a hospital each get their own overtime, rest and hazard rules from the same code.

THE OUTCOMES
Workers can trust their pay and raise problems without fear. Managers see risks while there's still time to act, so injuries and resignations come down.

HOW I BUILT IT
Solo, in one day, with Claude Code inside Antigravity, the Gemini API, Node.js and Google Cloud Run. It has unit tests, a strict security policy, server-side access control, and anonymous reports that store no identity.

Transparent pay, a safe voice and early warnings are what decent work looks like on the ground.

Live demo: https://groundline-1029463540920.asia-south1.run.app
Code: https://github.com/adwaithjk98-jpg/promptwars-srm.git

Thank you @ACM SRMIST @Google for Developers @Hack2Skill for organising Prompt Wars.

#PromptWars #PromptWars2026 #SDG8 #DecentWork #GoogleCloud #CloudRun #Gemini #ClaudeCode #Antigravity #ACMSRM #Hack2Skill
