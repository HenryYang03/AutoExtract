# AutoExtract

A web app that uses deep learning and OCR to extract data from scientific plots (currently focused on bar graphs). The backend runs on Flask with a YOLO-based detector and OCR; the frontend is a Vite + React app with an interactive canvas powered by Fabric.js.

Status: Runs locally today. Deployment is in progress.

## Features

- Upload a bar-graph image and auto-detect key components (bars, y-axis, x-axis, origin, ymax, labels)
- Interactive viewer on canvas (select/move/resize boxes)
- External info panel shows selected box category and coordinates (original image pixels)
- Edit ymax and origin values via inputs and Update button (persists to backend for current session)
- Add new boxes and delete the selected box

## Prerequisites

- Python 3.12 (recommended via Conda)
- Node.js 18+ and npm
- Tesseract OCR (macOS):
  ```bash
  brew install tesseract
  ```
- Model weights at `backend/models/best.pt` (YOLOv5 custom weights)

## Conda Environment Setup

```bash
bash scripts/create_conda_env.sh  # creates env: AutoExtract (python 3.12) and installs deps
conda activate AutoExtract
```

Manual setup:
```bash
conda create -y -n AutoExtract python=3.12
conda activate AutoExtract
pip install -r requirements.txt
```

## Quick Start (Local)

1) Backend
```bash
# from repo root
conda activate AutoExtract
python backend/app.py  # Flask at http://localhost:9000
```

2) Frontend
```bash
# new terminal tab/window
conda activate AutoExtract  # optional; keep environments consistent
cd frontend
npm install
npm run dev  # opens http://localhost:5173
```

Notes
- The frontend dev server proxies requests to the backend (see `frontend/vite.config.js`):
  - `/api` → `http://localhost:9000`
  - `/static` → `http://localhost:9000`

## Using the App

1. Open `http://localhost:5173`
2. Choose an image file of a bar graph and click Upload
3. Select any detection box in the canvas to view its label and coordinates
4. Adjust `ymax` and `origin` in the inputs at the top of the viewer and click Update
5. Use “+ Add Box” to add a new rectangle, or “Delete Selected” to remove the active one

## API Overview

- POST `/api/bar_analyzer`
  - multipart/form-data with `file`
  - Response JSON:
    ```json
    {
      "filename": "image.png",
      "detection_boxes": [{"x1": 0, "y1": 0, "x2": 0, "y2": 0, "conf": 0.0, "class": 0, "label": "bar"}],
      "image_shape": [height, width],
      "image_url": "/static/uploads/image.png",
      "origin_value": "0",
      "ymax_value": "25"
    }
    ```

- POST `/api/update_values`
  - JSON body: `{ "origin_value": number|string, "ymax_value": number|string }`
  - Response JSON: `{ "success": true, "origin_value": ..., "ymax_value": ... }`

- GET `/static/uploads/:filename`
  - Serves last uploaded image

## Architecture

Backend (`backend/`)
- `app.py`: Flask app factory, routes registration, error handlers, entry point
- `routes.py`: Request handlers for analysis and value updates
- `model_manager.py`: Initializes and serves the `BarGraphAnalyzer` model
- `bar_graph_analyzer.py`: Core detection + OCR orchestration
- `vision_utils.py`: Reusable CV/OCR helpers (crop, binarize, OCR text/number)
- `file_utils.py`: Upload/filename utilities; allowed extensions
- `config.py`: Centralized settings (paths, ports, secrets, model, classes)

Frontend (`frontend/`)
- Vite + React app (HMR dev server)
- `src/components/BarAnalyzer.jsx`: Main interactive viewer (Fabric.js)
- Proxy config in `vite.config.js` to reach Flask during development

## Roadmap

- Deployment (Docker + cloud runtime)
- Additional analyzers (box plots, line plots)
- Authentication and multi-user sessions

## Acknowledgements

- Ultralytics YOLOv5 (object detection)
- Flask (backend) and React + Vite (frontend)
- Fabric.js (interactive canvas)

---
Thank you for trying AutoExtract!
