# Google Cloud Setup (for Adwaith)

Use the **same Google account** for every step, and remember which one it is.

**Timing:** the credit link is only shared at **12:00** (in the event WhatsApp group). Do Part A **now**, because it doesn't need credits. Do Part B at 12:00.

## Part A: now (no credits needed, about 3 minutes)
1. In Antigravity's terminal, run `gcloud auth login`. A browser opens: sign in with your Google account and click **Allow**.
2. Go to https://console.cloud.google.com/ and sign in. If asked, accept the terms / Free Program.
3. Click **Select a project** (next to the Google Cloud logo) → **New Project**.
4. Name: `fairshift`. Leave **No organization**. If it asks for billing, skip it for now. Click **Create**.
   - "Project ID already taken"? Edit the ID to add a few random digits.
5. Send Claude the **Project ID** (shown under the name, e.g. `fairshift-123456`) and which Google account you used.

## Part B: at 12:00 (credits)
1. Open the event's full credit link from WhatsApp. It starts with `trygcp.dev/` and has an event-specific path; the bare `trygcp.dev` says "no access".
2. Sign in with the **same** Google account → click the button to access your credits → check your name → **Accept and Continue**.
3. Console → top-left menu → **Billing**. It says the project has no billing account; that's expected. Click **Link a billing account**.
4. Choose **Google Cloud Platform Trial Billing Account** → **Set account**.
5. Check: Billing → **Credits** shows your credits.
6. Tell Claude "billing linked". Claude then enables the services, stores the Gemini key in Secret Manager and deploys (about 5–10 minutes).

## Troubleshooting
- **Can't enable services:** billing isn't linked to the project yet (Part B, steps 3–4).
- **Wrong billing account:** project's three-dot menu → **Change billing** → pick **Google Cloud Platform Trial Billing**.
