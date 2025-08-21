#!/usr/bin/env bash
set -euo pipefail

# Create Conda environment for AutoExtract
# Usage: bash scripts/create_conda_env.sh

ENV_NAME=${1:-AutoExtract}
PYTHON_VERSION=${PYTHON_VERSION:-3.12}

echo "[AutoExtract] Creating conda env: ${ENV_NAME} (python=${PYTHON_VERSION})"
conda create -y -n "${ENV_NAME}" python="${PYTHON_VERSION}"

# Activate env in a sub-shell for one-off installs
# shellcheck disable=SC1091
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate "${ENV_NAME}"

# Install backend dependencies
pip install -r requirements.txt

cat <<'NOTE'

[AutoExtract] Environment is ready.

Next steps:
1) Install Tesseract OCR (macOS):
   brew install tesseract

2) Ensure YOLO weights exist:
   backend/models/best.pt

3) Run backend:
   python backend/app.py

4) Run frontend:
   cd frontend && npm install && npm run dev

To activate later:
   conda activate ${ENV_NAME}
NOTE 