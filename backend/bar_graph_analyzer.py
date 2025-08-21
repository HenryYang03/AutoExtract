import cv2
import torch
import pytesseract
import imutils
import re

class BarGraphAnalyzer:
    def __init__(self, model_path, class_names, pytesseract_cmd = None):

        if pytesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = pytesseract_cmd

        self.model = torch.hub.load('ultralytics/yolov5', 'custom', path = model_path)
        self.class_names = class_names
        self.detections = None
        self.image = None

        self.origin_value = 0
        self.ymax_value = 0
        self.x_label_texts = []
        self.label_text = ""

        self.bars = []
        self.uptails = []
        self.yaxis = None
        self.xaxis = None


    def detect_box(self, image_path):
        # Load the image
        self.image = cv2.imread(image_path)

        # Run YOLO model on the image
        results = self.model(self.image)

        # Extract the detections
        detections = results.xyxy[0].numpy()  # (x1, y1, x2, y2, conf, cls)

        self.detections = [
            {
                "x1": float(x1),
                "y1": float(y1),
                "x2": float(x2),
                "y2": float(y2),
                "conf": float(conf),
                "class": int(cls),
                "label": self.class_names[int(cls)]
            }
            for x1, y1, x2, y2, conf, cls in detections
        ]

        self.bars, self.uptails, self.yaxis, self.xaxis, origin, ymax, label, x_groups = self.filter_detections()

        self.origin_value = self.extract_numbers(self.image, origin)
        self.ymax_value = self.extract_numbers(self.image, ymax)

        self.bars = sorted(self.bars, key = lambda bar: bar['x1'])
        self.uptails = sorted(self.uptails, key = lambda uptail: uptail['x1'])
        sorted_x_labels = sorted(x_groups, key = lambda bar_label: bar_label['x1'])

        for x_label in sorted_x_labels:
            self.x_label_texts.append(self.extract_text(self.image, x_label))

        if label is not None:
            self.label_text = self.extract_text(self.image, label, rotate = True)

    def analyze_image(self):
        results = self.calculate_heights()

        return results

    def filter_detections(self):
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
        elif not ymaxes or not origins:
            raise ValueError("No ymaxes or origins detected in the image.")
        elif not bars:
            raise ValueError("No bars detected in the image.")
        elif len(yaxes) > 1 or len(xaxes) > 1:
            raise ValueError("Multiple y-axis or x-axis detected in the image.")
        elif len(ymaxes) > 1 or len(origins) > 1:
            raise ValueError("Multiple ymaxes or origins detected in the image.")

        yaxis = yaxes[0]
        xaxis = xaxes[0]
        ymax = ymaxes[0]
        origin = origins[0]
        label = labels[0]

        return bars, uptails, yaxis, xaxis, origin, ymax, label, x_groups

    def preprocess_image(self, image, bbox, for_numbers = False, padding = 4, save_images = False):
        x1, y1, x2, y2 = map(int, [bbox["x1"], bbox["y1"], bbox["x2"], bbox["y2"]])
        height, width = image.shape[:2]
        x1 = max(0, x1 - padding)
        y1 = max(0, y1 - padding)
        x2 = min(width, x2 + padding)
        y2 = min(height, y2 + padding)
        cropped_image = image[y1:y2, x1:x2]

        gray_image = cv2.cvtColor(cropped_image, cv2.COLOR_BGR2GRAY)
        resized_image = imutils.resize(gray_image, width=500)

        _, binary_image = cv2.threshold(resized_image, 175, 255, cv2.THRESH_BINARY_INV)

        if for_numbers:
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            morph_image = cv2.morphologyEx(binary_image, cv2.MORPH_CLOSE, kernel)
            inverted_image = 255 - morph_image
            blurred_image = cv2.GaussianBlur(inverted_image, (5, 5), 0)

            if save_images:
                cv2.imwrite('blurred_image.png', blurred_image)
            return blurred_image

        return binary_image

    def extract_text(self, image, bbox, rotate = False):
        preprocessed_image = self.preprocess_image(image, bbox)
        if rotate:
            preprocessed_image = cv2.rotate(preprocessed_image, cv2.ROTATE_90_CLOCKWISE)

        config = r'--oem 3 --psm 6'
        text = pytesseract.image_to_string(preprocessed_image, config = config)
        return text.strip()

    def extract_numbers(self, image, bbox, rotate = False):
        preprocessed_image = self.preprocess_image(image, bbox, for_numbers = True, save_images = True)
        if rotate:
            preprocessed_image = cv2.rotate(preprocessed_image, cv2.ROTATE_90_CLOCKWISE)

        custom_config = r'--oem 3 --psm 13 -c tessedit_char_whitelist=0123456789.'
        text = pytesseract.image_to_string(preprocessed_image, config = custom_config)

        numbers = re.findall(r'\d+\.\d+|\d+', text)
        return numbers[0] if numbers else ''

    def calculate_heights(self):
        results = {}

        try:
            origin_value = float(self.origin_value)
            ymax_value = float(self.ymax_value)
        except ValueError:
            raise ValueError("Can't convert the orgin and ymax to number")

        yaxis_height = self.yaxis[1] - self.yaxis[3]
        scale_factor = (ymax_value - origin_value) / yaxis_height

        bar_heights = []
        for bar in self.bars:
            bar_ymax = bar[1] # y-coordinate of the top of the bar
            bar_ymin = bar[3]
            height = (bar_ymax - bar_ymin) * scale_factor + origin_value  # Calculate the true height
            bar_heights.append(height)

        uptail_heights = []
        for uptail in self.uptails:
            uptail_ymax = uptail[1]
            uptail_ymin = uptail[3]
            height = (uptail_ymax - uptail_ymin) * scale_factor
            uptail_heights.append(height)

        results[self.label_text] = {
            "bar_heights": bar_heights,
            "uptail_heights": uptail_heights,
            "origin_value": origin_value,
            "ymax_value": ymax_value,
            "bar_label_texts": self.x_label_texts if not self.x_label_texts else "No x-group label"
        }

        return results

if __name__ == "__main__":
    model_path = 'models/best.pt'
    class_names = ['label', 'ymax', 'origin', 'yaxis', 'bar', 'uptail', 'legend', 'legend_group', 'xaxis', 'x_group']
    analyzer = BarGraphAnalyzer(model_path, class_names, pytesseract_cmd='/opt/homebrew/bin/tesseract')

    image_path = '/Users/mohanyang/Desktop/new.png'
    bar_graph_heights = analyzer.analyze_image(image_path)
    print("Relative heights of the bars for each bar graph:", bar_graph_heights)