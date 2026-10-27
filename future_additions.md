# Future Additions

What Groundline would add after the hackathon prototype, in priority order. Each item names the pain point it addresses.

1. **Persistent database (Firestore).** The prototype keeps data in memory (one Cloud Run instance, demo data reloaded at startup), so data resets when the server restarts. Swapping the repository layer for Firestore makes records permanent and lets Cloud Run scale to many instances. *Pain point: zero workforce visibility needs reliable records.*
2. **Real sign-in with phone OTP.** Replace demo persona sign-in with phone-number one-time codes. Most workers have a phone number but not an email. *Pain point: basic smartphones, limited literacy.*
3. **QR / location check-in.** Workers scan a site QR code (or are geofenced) to check in, which stops proxy attendance and makes hours verifiable by both sides. *Pain point: opaque pay, uncounted overtime.*
4. **Voice reports in regional languages.** Record a voice note; Gemini transcribes, translates, and triages it. *Pain point: limited literacy, unreported safety risks.*
5. **Skill Passport.** A portable record of training, certifications, and verified experience that workers carry between employers. *Pain point: lost career history.*
6. **Organisation onboarding with join codes.** Admins create an organisation, pick an industry preset, and share a join code, like a classroom code. *Feasibility across industries.*
7. **Admin-configurable rules.** Edit pay rates, overtime rules, fatigue limits, and report categories per organisation, beyond the built-in presets. *Calibration per industry.*
8. **Payslip deductions and statutory items.** PF, ESI, and advances shown line by line. *Pain point: opaque pay calculations.*
9. **Escalation alerts.** Notify senior management automatically when a high-severity report stays unresolved past a time limit. *Pain point: delayed escalation.*
10. **More industries and languages.** Factory and campus-staff presets; more Indian languages for the interface and voice. *Scalability.*
