# AutoExtract

A web app that uses deep learning and OCR to extract data from scientific plots. The backend runs on Flask with a YOLO-based detector and OCR; the frontend is a Vite + React app with an interactive canvas powered by Fabric.js.

## Quick Start

**Pull and run**

```bash
docker pull yanghenry/autoextract:latest
docker run --rm -p 9000:9000 \
  -v /absolute/path/on/host/best.pt:/app/backend/models/best.pt:ro \
  yanghenry/autoextract:latest
```

The image bundles the production-built frontend and the Flask API on port **9000**. YOLO weights (`backend/models/best.pt`) are **not** in the repository; mount your own file at runtime.

## Features

- Upload a bar-graph image and auto-detect key components (bars, y-axis, x-axis, origin, ymax, labels)
- Interactive viewer on canvas (select/move/resize boxes)
- External info panel shows selected box category and coordinates (original image pixels)
- Edit ymax and origin values via inputs and Update button (persists to backend for current session)
- Add new boxes and delete the selected box

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


## Acknowledgements

- Ultralytics YOLOv5 (object detection)
- Flask (backend) and React + Vite (frontend)
- Fabric.js (interactive canvas)

