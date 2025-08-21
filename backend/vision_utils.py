"""
Vision utilities for image preprocessing and OCR extraction.

This module groups reusable computer-vision helpers used by analyzers.
"""

from __future__ import annotations

from typing import Tuple
import cv2
import imutils
import pytesseract
import numpy as np


def crop_with_padding(image: np.ndarray, bbox: dict, padding: int = 4) -> np.ndarray:
    """
    Crop a region from an image with optional padding.

    Args:
        image: Source BGR image as a NumPy array.
        bbox: Bounding box dict with keys x1, y1, x2, y2 (floats or ints).
        padding: Extra pixels around the bbox to include.

    Returns:
        Cropped BGR image as a NumPy array.
    """
    x1, y1, x2, y2 = map(int, [bbox["x1"], bbox["y1"], bbox["x2"], bbox["y2"]])
    height, width = image.shape[:2]

    x1 = max(0, x1 - padding)
    y1 = max(0, y1 - padding)
    x2 = min(width, x2 + padding)
    y2 = min(height, y2 + padding)

    return image[y1:y2, x1:x2]


def to_binary(image_bgr: np.ndarray, width: int = 500) -> np.ndarray:
    """
    Convert a BGR image to a high-contrast binary image suitable for OCR.

    Steps: gray → resize → global threshold (binary inverse).

    Args:
        image_bgr: BGR image to process.
        width: Target width used for resizing prior to thresholding.

    Returns:
        Single-channel binary image (uint8) with foreground as white (255).
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    resized = imutils.resize(gray, width=width)
    _, binary_inv = cv2.threshold(resized, 175, 255, cv2.THRESH_BINARY_INV)
    return binary_inv


def enhance_for_digits(binary_image: np.ndarray) -> np.ndarray:
    """
    Enhance a binary image for digit OCR by morphological cleanup and blur.

    Args:
        binary_image: Single-channel binary image (uint8).

    Returns:
        Enhanced single-channel image optimized for digit OCR.
    """
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    morph = cv2.morphologyEx(binary_image, cv2.MORPH_CLOSE, kernel)
    inverted = cv2.bitwise_not(morph)
    blurred = cv2.GaussianBlur(inverted, (5, 5), 0)
    return blurred


def ocr_text(image: np.ndarray, rotate_clockwise: bool = False) -> str:
    """
    Run OCR for general text from an image region.

    Args:
        image: Input BGR image region.
        rotate_clockwise: Whether to rotate 90 degrees clockwise prior to OCR.

    Returns:
        Extracted text with whitespace trimmed.
    """
    if rotate_clockwise:
        image = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
    binary = to_binary(image)
    config = r"--oem 3 --psm 6"
    return pytesseract.image_to_string(binary, config=config).strip()


def ocr_number(image: np.ndarray, rotate_clockwise: bool = False) -> str:
    """
    Run OCR targeting numeric values from an image region.

    Args:
        image: Input BGR image region.
        rotate_clockwise: Whether to rotate 90 degrees clockwise prior to OCR.

    Returns:
        First number found (string) or empty string if none detected.
    """
    if rotate_clockwise:
        image = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
    binary = to_binary(image)
    enhanced = enhance_for_digits(binary)
    config = r"--oem 3 --psm 13 -c tessedit_char_whitelist=0123456789."
    text = pytesseract.image_to_string(enhanced, config=config)

    import re
    numbers = re.findall(r"\d+\.\d+|\d+", text)
    return numbers[0] if numbers else "" 