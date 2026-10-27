# Google Cloud Setup (for Adwaith)

Takes about 10 minutes. Use the **same Google account** for every step, and remember which one it is.

## 1. Redeem the credits
1. Open the **trygcp.dev** credit link (from the hackathon dashboard's **Quick Links**, or the WhatsApp group).
2. Sign in with your Google account.
3. Click the button to access your credits.
4. Check your first and last name, then click **Accept and Continue**.

## 2. Create the project
1. Go to https://console.cloud.google.com/ and sign in. If asked, activate the Google Cloud Free Program.
2. Click **Select a project** (next to the Google Cloud logo) → **New Project**.
3. Name: `fairshift`. Leave **No organization**. If asked for billing, pick **Google Cloud Platform Trial Billing Account**. Click **Create**.
   - "Project ID already taken"? Edit the ID to add a few random digits.
4. In the pop-up, click **Select Project**.

## 3. Link billing (required, or nothing can be deployed)
1. Top-left menu → **Billing**.
2. It will say the project has no billing account. That's expected. Click **Link a billing account**.
3. Choose **Google Cloud Platform Trial Billing Account** → **Set account**.
4. Check: Billing → **Credits** shows your credits.

## 4. Send Claude
- The **Project ID** (shown under the project name, e.g. `fairshift-123456`)
- **Which Google account** you used

Then Claude will ask you to run one login command (`gcloud auth login`) in the Antigravity terminal and click Allow in the browser.
