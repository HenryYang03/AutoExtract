from __future__ import annotations

import cv2
import torch
import pytesseract
from typing import List, Dict, Any, Tuple

from vision_utils import crop_with_padding, ocr_text, ocr_number


class BarGraphAnalyzer:
    """
    Analyze bar graphs using a YOLO model plus OCR to extract structure and values.

    Responsibilities:
    - Load a YOLO model for object detection on bar graphs
    - Detect key components: bars, ymax, origin, axes, labels, x-groups
    - Extract numeric values and text via OCR
    - Provide structured results and utilities for downstream analysis
    """

    def __init__(self, model_path: str, class_names: List[str], pytesseract_cmd: str | None = None) -> None:
        """
        Initialize the analyzer with model and class metadata.

        Args:
            model_path: Filesystem path to YOLO weights (.pt).
            class_names: Mapping of class indices to human-readable labels.
            pytesseract_cmd: Optional path to the tesseract binary.
        """
        if pytesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = pytesseract_cmd

        # Load YOLOv5 custom model from torch hub
        self.model: Any = torch.hub.load('ultralytics/yolov5', 'custom', path=model_path)
        self.class_names = class_names

        # Runtime state populated per image
        self.image: Any | None = None
        self.detections: List[Dict[str, Any]] | None = None

        # Semantic elements
        self.origin_value: float | str = 0
        self.ymax_value: float | str = 0
        self.x_label_texts: List[str] = []
        self.label_text: str = ""

        # Geometric groups
        self.bars: List[Dict[str, float]] = []
        self.uptails: List[Dict[str, float]] = []
        self.yaxis: Dict[str, float] | None = None
        self.xaxis: Dict[str, float] | None = None

    def detect_box(self, image_path: str) -> None:
        """
        Run detection on an input image and populate analyzer fields.

        Args:
            image_path: Path to the image file to analyze
        """
        # Load the image
        self.image = cv2.imread(image_path)

        # Run YOLO model on the image
        results = self.model(self.image)

        # Extract the detections (x1, y1, x2, y2, conf, cls)
        detections = results.xyxy[0].numpy()
        self.detections = [
            {
                "x1": float(x1),
                "y1": float(y1),
                "x2": float(x2),
                "y2": float(y2),
                "conf": float(conf),
                "class": int(cls),
                "label": self.class_names[int(cls)],
            }
            for x1, y1, x2, y2, conf, cls in detections
        ]

        # Group and extract attributes
        self.bars, self.uptails, self.yaxis, self.xaxis, origin, ymax, label, x_groups = self.filter_detections()

        # OCR numeric values
        self.origin_value = self.extract_numbers(self.image, origin)
        self.ymax_value = self.extract_numbers(self.image, ymax)

        # Sort elements for stable downstream use
        self.bars = sorted(self.bars, key=lambda bar: bar['x1'])
        self.uptails = sorted(self.uptails, key=lambda uptail: uptail['x1'])
        sorted_x_labels = sorted(x_groups, key=lambda bar_label: bar_label['x1'])

        # OCR x-axis labels and main label
        self.x_label_texts = []
        for x_label in sorted_x_labels:
            self.x_label_texts.append(self.extract_text(self.image, x_label))

        if label is not None:
            self.label_text = self.extract_text(self.image, label, rotate=True)

    def analyze_image(self) -> Dict[str, Any]:
        """
        Compute derived measurements such as heights for detected bars.

        Returns:
            A dictionary keyed by the chart title/label containing:
            - bar_heights: list of computed values per bar
            - uptail_heights: list of computed uptail heights
            - origin_value, ymax_value
            - bar_label_texts: list of x labels or fallback string
        """
        return self.calculate_heights()

    def filter_detections(self) -> Tuple[
        List[Dict[str, float]],
        List[Dict[str, float]],
        Dict[str, float],
        Dict[str, float],
        Dict[str, float],
        Dict[str, float],
        Dict[str, float] | None,
        List[Dict[str, float]],
    ]:
        """
        Partition raw detections into semantic groups and validate presence.

        Returns:
            Tuple of (bars, uptails, yaxis, xaxis, origin, ymax, label, x_groups)

        Raises:
            ValueError: If required components are missing or ambiguous
        """
        if self.detections is None:
            raise ValueError("No detections available. Call detect_box() first.")

        bars = [d for d in self.detections if d['label'] == 'bar']
        yaxes = [d for d in self.detections if d['label'] == 'yaxis']
        xaxes = [d for d in self.detections if d['label'] == 'xaxis']
        origins = [d for d in self.detections if d['label'] == 'origin']
        ymaxes = [d for d in self.detections if d['label'] == 'ymax']
        labels = [d for d in self.detections if d['label'] == 'label']
        uptails = [d for d in self.detections if d['label'] == 'uptail']
        x_groups = [d for d in self.detections if d['label'] == 'x_group']

        if not yaxes or not xaxes:
            raise ValueError("No y-axis or x-axis detected in the image.")
        if not ymaxes or not origins:
            raise ValueError("No ymaxes or origins detected in the image.")
        if not bars:
            raise ValueError("No bars detected in the image.")
        if len(yaxes) > 1 or len(xaxes) > 1:
            raise ValueError("Multiple y-axis or x-axis detected in the image.")
        if len(ymaxes) > 1 or len(origins) > 1:
            raise ValueError("Multiple ymaxes or origins detected in the image.")

        yaxis = yaxes[0]
        xaxis = xaxes[0]
        ymax = ymaxes[0]
        origin = origins[0]
        label = labels[0] if labels else None

        return bars, uptails, yaxis, xaxis, origin, ymax, label, x_groups

    def extract_text(self, image, bbox, rotate: bool = False) -> str:
        """
        Extract general text from a region defined by bbox.

        Args:
            image: Full BGR image
            bbox: Detection bbox dict with x1,y1,x2,y2
            rotate: Whether to rotate when text is vertical
        """
        region = crop_with_padding(image, bbox)
        return ocr_text(region, rotate_clockwise=rotate)

    def extract_numbers(self, image, bbox, rotate: bool = False) -> str:
        """
        Extract numeric text from a region defined by bbox.

        Args:
            image: Full BGR image
            bbox: Detection bbox dict with x1,y1,x2,y2
            rotate: Whether to rotate when number runs vertically
        """
        region = crop_with_padding(image, bbox)
        return ocr_number(region, rotate_clockwise=rotate)

    def calculate_heights(self) -> Dict[str, Any]:
        """
        Calculate bar and uptail heights using detected geometry and scale.

        Returns:
            Dictionary keyed by chart label with computed arrays and metadata.
        """
        results: Dict[str, Any] = {}

        try:
            origin_value = float(self.origin_value)
            ymax_value = float(self.ymax_value)
        except ValueError:
            raise ValueError("Can't convert the orgin and ymax to number")

        # y-axis height in pixels (top - bottom). Detections are dicts.
        if self.yaxis is None:
            raise ValueError("yaxis not set")
        yaxis_height = self.yaxis['y1'] - self.yaxis['y2']
        scale_factor = (ymax_value - origin_value) / yaxis_height

        bar_heights: List[float] = []
        for bar in self.bars:
            bar_ymax = bar['y1']
            bar_ymin = bar['y2']
            height = (bar_ymax - bar_ymin) * scale_factor + origin_value
            bar_heights.append(height)

        uptail_heights: List[float] = []
        for uptail in self.uptails:
            uptail_ymax = uptail['y1']
            uptail_ymin = uptail['y2']
            height = (uptail_ymax - uptail_ymin) * scale_factor
            uptail_heights.append(height)

        results[self.label_text] = {
            "bar_heights": bar_heights,
            "uptail_heights": uptail_heights,
            "origin_value": origin_value,
            "ymax_value": ymax_value,
            "bar_label_texts": self.x_label_texts if self.x_label_texts else "No x-group label",
        }
        return results


if __name__ == "__main__":
    # Simple manual test harness (adjust paths as needed)
    model_path = 'models/best.pt'
    class_names = ['label', 'ymax', 'origin', 'yaxis', 'bar', 'uptail', 'legend', 'legend_group', 'xaxis', 'x_group']
    analyzer = BarGraphAnalyzer(model_path, class_names, pytesseract_cmd='/opt/homebrew/bin/tesseract')
    # analyzer.detect_box('/path/to/image.png')
    # print(analyzer.calculate_heights())