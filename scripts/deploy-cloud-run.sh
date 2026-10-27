#!/usr/bin/env bash
# Deploys Groundline to Google Cloud Run from source (Cloud Build builds the Dockerfile).
# Usage: scripts/deploy-cloud-run.sh <project-id>
# Safe to re-run: existing secrets and settings are kept.
set -euo pipefail

PROJECT_ID="${1:?Usage: scripts/deploy-cloud-run.sh <project-id>}"
SERVICE_NAME="groundline"
REGION="asia-south1"
GEMINI_SECRET_NAME="gemini-api-key"
SESSION_SECRET_NAME="groundline-session-secret"

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "Missing .env with GEMINI_API_KEY." >&2
  exit 1
fi
set -a; . ./.env; set +a
: "${GEMINI_API_KEY:?GEMINI_API_KEY is not set in .env}"

echo "==> Using project $PROJECT_ID"
gcloud config set project "$PROJECT_ID" --quiet

echo "==> Enabling Cloud Run, Cloud Build, Artifact Registry and Secret Manager"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com --quiet

create_secret_if_missing() {
  local secret_name="$1"
  local secret_value="$2"
  if gcloud secrets describe "$secret_name" >/dev/null 2>&1; then
    echo "    Secret $secret_name already exists, keeping it."
  else
    printf '%s' "$secret_value" | gcloud secrets create "$secret_name" \
      --replication-policy=automatic --data-file=- --quiet
  fi
}

echo "==> Storing secrets in Secret Manager"
create_secret_if_missing "$GEMINI_SECRET_NAME" "$GEMINI_API_KEY"
create_secret_if_missing "$SESSION_SECRET_NAME" "$(openssl rand -hex 32)"

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "==> Granting $RUNTIME_SERVICE_ACCOUNT access to the secrets and to build from source"
for secret_name in "$GEMINI_SECRET_NAME" "$SESSION_SECRET_NAME"; do
  gcloud secrets add-iam-policy-binding "$secret_name" \
    --member="serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
    --role=roles/secretmanager.secretAccessor --quiet >/dev/null
done
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
  --role=roles/run.builder --condition=None --quiet >/dev/null

# Demo data lives in memory: max 1 instance so every request reaches the same data, and min 1 so it
# isn't shut down when idle (which would wipe reports and tracking codes between visits).
echo "==> Deploying $SERVICE_NAME to $REGION (first build takes a few minutes)"
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-secrets "GEMINI_API_KEY=${GEMINI_SECRET_NAME}:latest,SESSION_SECRET=${SESSION_SECRET_NAME}:latest" \
  --min-instances 1 \
  --max-instances 1 \
  --memory 512Mi \
  --quiet

SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)')"
echo "==> Live at $SERVICE_URL"
