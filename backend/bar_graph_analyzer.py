from __future__ import annotations

import cv2
import torch
import pytesseract
from typing import List, Dict, Any

from vision_utils import crop_with_padding, ocr_text, ocr_number


class BarGraphAnalyzer:
    """
    Analyze bar graphs using a YOLO model plus OCR to extract structure and values.

    Responsibilities:
    - Load a YOLO model for object detection on bar graphs
    - Detect key components: bars, ymax, origin, axes, labels, x-groups
    - Extract numeric values and text via OCR
    - Provide structured results and utilities for downstream analysis
    - Track and update box coordinates when modified
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
        self.origin_conversion_error: str | None = None
        self.ymax_conversion_error: str | None = None
        self.x_label_texts: List[str] = []
        self.label_text: str = ""

        # All detection types as dictionaries with unique IDs
        self.bars: Dict[str, Dict[str, Any]] = {}
        self.uptails: Dict[str, Dict[str, Any]] = {}
        self.yaxis: Dict[str, Dict[str, Any]] = {}
        self.xaxis: Dict[str, Dict[str, Any]] = {}
        self.origins: Dict[str, Dict[str, Any]] = {}
        self.ymaxes: Dict[str, Dict[str, Any]] = {}
        self.labels: Dict[str, Dict[str, Any]] = {}
        self.x_groups: Dict[str, Dict[str, Any]] = {}
        self.legends: Dict[str, Dict[str, Any]] = {}
        self.legend_groups: Dict[str, Dict[str, Any]] = {}
        
    @property
    def _category_dicts(self) -> List[Dict[str, Any]]:
        """
        Dynamically return the current category dictionaries.
        This ensures we always have the latest references.
        """
        return [
            self.bars, self.uptails, self.yaxis, self.xaxis,
            self.origins, self.ymaxes, self.labels,
            self.x_groups, self.legends, self.legend_groups
        ]

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

        # First organize detections with IDs
        self._organize_detections()

        # Extract single objects for calculations (since we need one of each type)
        yaxis = next(iter(self.yaxis.values())) if self.yaxis else None
        xaxis = next(iter(self.xaxis.values())) if self.xaxis else None
        origin = next(iter(self.origins.values())) if self.origins else None
        ymax = next(iter(self.ymaxes.values())) if self.ymaxes else None
        label = next(iter(self.labels.values())) if self.labels else None
        x_groups = list(self.x_groups.values())

        # Validate required components
        if not yaxis or not xaxis:
            raise ValueError("No y-axis or x-axis detected in the image.")
        if not ymax or not origin:
            raise ValueError("No ymaxes or origins detected in the image.")
        if not self.bars:
            raise ValueError("No bars detected in the image.")

        # OCR numeric values and validate conversion
        origin_text = self.extract_numbers(self.image, origin)
        ymax_text = self.extract_numbers(self.image, ymax)
        
        # Try to convert to numbers and store conversion status
        self.origin_value = origin_text
        self.ymax_value = ymax_text
        self.origin_conversion_error = None
        self.ymax_conversion_error = None
        
        try:
            float(origin_text)
        except ValueError:
            self.origin_conversion_error = f"Manual input needed for origin value: '{origin_text}'"
            
        try:
            float(ymax_text)
        except ValueError:
            self.ymax_conversion_error = f"Manual input needed for ymax value: '{ymax_text}'"
        
        # OCR x-axis labels and main label
        self.x_label_texts = []
        for x_label in x_groups:
            self.x_label_texts.append(self.extract_text(self.image, x_label))

        if label is not None:
            self.label_text = self.extract_text(self.image, label, rotate=True)

    def _organize_detections(self) -> None:
        """
        Organize detections into dictionaries with unique IDs and sort them.
        This method creates unique identifiers for each detection and organizes
        them into the appropriate category dictionaries.
        """
        # Clear previous organization
        self.bars = {}
        self.uptails = {}
        self.yaxis = {}
        self.xaxis = {}
        self.origins = {}
        self.ymaxes = {}
        self.labels = {}
        self.x_groups = {}
        self.legends = {}
        self.legend_groups = {}
        
        # Organize detections by label using a mapping
        detection_lists = {
            'bar': [],
            'uptail': [],
            'yaxis': [],
            'xaxis': [],
            'origin': [],
            'ymax': [],
            'label': [],
            'x_group': [],
            'legend': [],
            'legend_group': []
        }
        
        for detection in self.detections:
            label = detection['label']
            if label in detection_lists:
                detection_lists[label].append(detection)
        
        # Sort by x1 coordinate where applicable
        sorted_bars = sorted(detection_lists['bar'], key=lambda bar: bar['x1'])
        sorted_uptails = sorted(detection_lists['uptail'], key=lambda uptail: uptail['x1'])
        sorted_x_groups = sorted(detection_lists['x_group'], key=lambda x_group: x_group['x1'])
        
        # Assign sequential IDs and organize
        for i, bar in enumerate(sorted_bars):
            new_id = f"bar_{i+1}"
            bar['id'] = new_id
            self.bars[new_id] = bar
            
        for i, uptail in enumerate(sorted_uptails):
            new_id = f"uptail_{i+1}"
            uptail['id'] = new_id
            self.uptails[new_id] = uptail
            
        for i, yaxis in enumerate(detection_lists['yaxis']):
            new_id = f"yaxis_{i+1}"
            yaxis['id'] = new_id
            self.yaxis[new_id] = yaxis
            
        for i, xaxis in enumerate(detection_lists['xaxis']):
            new_id = f"xaxis_{i+1}"
            xaxis['id'] = new_id
            self.xaxis[new_id] = xaxis
            
        for i, origin in enumerate(detection_lists['origin']):
            new_id = f"origin_{i+1}"
            origin['id'] = new_id
            self.origins[new_id] = origin
            
        for i, ymax in enumerate(detection_lists['ymax']):
            new_id = f"ymax_{i+1}"
            ymax['id'] = new_id
            self.ymaxes[new_id] = ymax
            
        for i, label in enumerate(detection_lists['label']):
            new_id = f"label_{i+1}"
            label['id'] = new_id
            self.labels[new_id] = label
            
        for i, x_group in enumerate(sorted_x_groups):
            new_id = f"x_group_{i+1}"
            x_group['id'] = new_id
            self.x_groups[new_id] = x_group
            
        for i, legend in enumerate(detection_lists['legend']):
            new_id = f"legend_{i+1}"
            legend['id'] = new_id
            self.legends[new_id] = legend
            
        for i, legend_group in enumerate(detection_lists['legend_group']):
            new_id = f"legend_group_{i+1}"
            legend_group['id'] = new_id
            self.legend_groups[new_id] = legend_group

    def update_box_coordinates(self, box_id: str, x1: float, y1: float, x2: float, y2: float) -> bool:
        """
        Update the coordinates of a specific detection box.
        
        Args:
            box_id: Unique identifier of the box to update
            x1: New left coordinate
            y1: New top coordinate  
            x2: New right coordinate
            y2: New bottom coordinate
            
        Returns:
            bool: True if update was successful, False if box not found
            
        Raises:
            ValueError: If coordinates are invalid
        """
        if x1 >= x2 or y1 >= y2:
            raise ValueError("Invalid coordinates: x1 must be < x2 and y1 must be < y2")
            
        # Find which category the box belongs to and update it
        new_coords = {'x1': float(x1), 'y1': float(y1), 'x2': float(x2), 'y2': float(y2)}
        
        # Check all category dictionaries
        for category_dict in self._category_dicts:
            if box_id in category_dict:
                category_dict[box_id].update(new_coords)
                return True
        
        return False

    def get_box_by_id(self, box_id: str) -> Dict[str, Any] | None:
        """
        Get a detection box by its unique ID.
        
        Args:
            box_id: Unique identifier of the box
            
        Returns:
            Dict[str, Any] | None: Box data or None if not found
        """
        # Search in all category dictionaries
        for category_dict in self._category_dicts:
            if box_id in category_dict:
                return category_dict[box_id]
        
        return None

    def get_all_boxes(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all detection boxes organized by category.
        
        Returns:
            Dict containing all detection categories with their boxes
        """
        # Create a mapping of category names to their dictionaries
        category_names = ['bars', 'uptails', 'yaxis', 'xaxis', 'origins', 
                         'ymaxes', 'labels', 'x_groups', 'legends', 'legend_groups']
        return dict(zip(category_names, self._category_dicts))

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

        # Convert to numbers (validation handled on frontend)
        origin_value = float(self.origin_value)
        ymax_value = float(self.ymax_value)

        # y-axis height in pixels (top - bottom). Get the first yaxis detection
        if not self.yaxis:
            raise ValueError("yaxis not set")
        yaxis_obj = next(iter(self.yaxis.values()))
        yaxis_height = yaxis_obj['y1'] - yaxis_obj['y2']
        scale_factor = (ymax_value - origin_value) / yaxis_height

        bar_heights: List[float] = []
        for bar in self.bars.values():
            bar_ymax = bar['y1']
            bar_ymin = bar['y2']
            height = (bar_ymax - bar_ymin) * scale_factor + origin_value
            bar_heights.append(height)

        uptail_heights: List[float] = []
        for uptail in self.uptails.values():
            uptail_ymax = uptail['y1']
            uptail_ymin = uptail['y2']
            height = (uptail_ymax - uptail_ymin) * scale_factor
            uptail_heights.append(height)

        # Generate bar names - use x_label_texts if available, otherwise generate default names
        bar_names = []
        num_bars = len(bar_heights)
        
        if self.x_label_texts and len(self.x_label_texts) >= num_bars:
            # Use existing x_label_texts
            bar_names = self.x_label_texts[:num_bars]
        else:
            # Generate default names: Bar 1, Bar 2, etc.
            bar_names = [f"Bar {i+1}" for i in range(num_bars)]
            # Update self.x_label_texts with the generated names
            self.x_label_texts = bar_names.copy()

        results[self.label_text] = {
            "bar_heights": bar_heights,
            "uptail_heights": uptail_heights,
            "origin_value": origin_value,
            "ymax_value": ymax_value,
            "bar_names": bar_names,  # Use the generated/updated names
        }
        return results

    def update_bar_names(self, bar_names: List[str]) -> bool:
        """
        Update the bar names in x_label_texts.
        
        Args:
            bar_names: List of new bar names
            
        Returns:
            bool: True if update was successful
        """
        try:
            if len(bar_names) != len(self.bars):
                return False
            
            self.x_label_texts = bar_names.copy()
            return True
        except Exception:
            return False


if __name__ == "__main__":
    # Simple manual test harness (adjust paths as needed)
    model_path = 'models/best.pt'
    class_names = ['label', 'ymax', 'origin', 'yaxis', 'bar', 'uptail', 'legend', 'legend_group', 'xaxis', 'x_group']
    analyzer = BarGraphAnalyzer(model_path, class_names, pytesseract_cmd='/opt/homebrew/bin/tesseract')
    # analyzer.detect_box('/path/to/image.png')
    # print(analyzer.calculate_heights())