"""
API routes module for AutoExtract backend application.

This module contains all the Flask route handlers for the API endpoints,
including file upload, analysis, and value updates.
"""

from flask import request, jsonify, send_from_directory
from typing import Dict, Any, Tuple
import os

from model_manager import model_manager
from file_utils import get_secure_filename, clear_upload_folder
from config import UPLOAD_DIR


def handle_bar_analyzer() -> Tuple[Dict[str, Any], int]:
    """
    Handle bar graph analysis requests.
    
    This endpoint processes uploaded images and returns detection results
    including bounding boxes, image dimensions, and extracted values.
    
    Returns:
        Tuple[Dict[str, Any], int]: JSON response and HTTP status code
        
    Example Response:
        {
            "filename": "image.png",
            "detection_boxes": [...],
            "image_shape": [height, width],
            "image_url": "/static/uploads/image.png",
            "origin_value": 0,
            "ymax_value": 25
        }
    """
    # Validate file upload
    if 'file' not in request.files:
        return {'error': 'No file part'}, 400
    
    file = request.files['file']
    filename = get_secure_filename(file)
    
    if not filename:
        return {'error': 'Invalid or missing file'}, 400
    
    try:
        # Get analyzer instance
        analyzer = model_manager.get_analyzer()
        
        # Save uploaded file
        filepath = os.path.join(UPLOAD_DIR, filename)
        clear_upload_folder(UPLOAD_DIR)
        file.save(filepath)
        
        # Process image with analyzer
        analyzer.detect_box(filepath)
        
        # Validate image processing
        if analyzer.image is None:
            return {'error': 'Failed to process image'}, 400
        
        # Prepare response
        response_data = {
            'filename': filename,
            'detection_boxes': analyzer.detections,
            'image_shape': list(analyzer.image.shape[:2]),
            'image_url': f'/static/uploads/{filename}',
            'origin_value': analyzer.origin_value,
            'ymax_value': analyzer.ymax_value
        }
        
        return response_data, 200
        
    except ValueError as e:
        return {'error': str(e)}, 400
    except Exception as e:
        return {'error': f'Internal server error: {str(e)}'}, 500


def handle_update_values() -> Tuple[Dict[str, Any], int]:
    """
    Handle requests to update origin and ymax values.
    
    This endpoint allows updating the origin and ymax values used by
    the graph analyzer for calculations.
    
    Returns:
        Tuple[Dict[str, Any], int]: JSON response and HTTP status code
        
    Example Request:
        {
            "origin_value": 0,
            "ymax_value": 25
        }
        
    Example Response:
        {
            "success": true,
            "origin_value": 0,
            "ymax_value": 25
        }
    """
    try:
        data = request.get_json()
        if not data:
            return {'error': 'No JSON data provided'}, 400
        
        # Get analyzer instance
        analyzer = model_manager.get_analyzer()
        
        # Update values if provided
        origin_value = data.get('origin_value')
        ymax_value = data.get('ymax_value')
        
        if origin_value is not None:
            analyzer.origin_value = origin_value
        if ymax_value is not None:
            analyzer.ymax_value = ymax_value
        
        # Return updated values
        response_data = {
            'success': True,
            'origin_value': analyzer.origin_value,
            'ymax_value': analyzer.ymax_value
        }
        
        return response_data, 200
        
    except Exception as e:
        return {'error': f'Failed to update values: {str(e)}'}, 400


def handle_uploaded_file(filename: str) -> Any:
    """
    Serve uploaded files from the uploads directory.
    
    Args:
        filename (str): Name of the file to serve
        
    Returns:
        Flask response: The requested file or 404 error
    """
    return send_from_directory(UPLOAD_DIR, filename) 