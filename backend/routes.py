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
            
        origin_value = data.get('origin_value')
        ymax_value = data.get('ymax_value')
        
        if origin_value is None or ymax_value is None:
            return {'error': 'Both origin_value and ymax_value are required'}, 400
            
        # Get analyzer instance and update values
        analyzer = model_manager.get_analyzer()
        analyzer.origin_value = origin_value
        analyzer.ymax_value = ymax_value
        
        return {
            'success': True,
            'origin_value': analyzer.origin_value,
            'ymax_value': analyzer.ymax_value
        }, 200
        
    except Exception as e:
        return {'error': f'Failed to update values: {str(e)}'}, 500


def handle_update_box_coordinates() -> Tuple[Dict[str, Any], int]:
    """
    Handle requests to update box coordinates when moved on the frontend.
    
    This endpoint allows updating the coordinates of detection boxes
    when they are moved or resized on the interactive canvas.
    
    Returns:
        Tuple[Dict[str, Any], int]: JSON response and HTTP status code
        
    Example Request:
        {
            "box_id": "bar_1",
            "x1": 100,
            "y1": 50,
            "x2": 200,
            "y2": 150
        }
        
    Example Response:
        {
            "success": true,
            "message": "Box coordinates updated successfully"
        }
    """
    try:
        data = request.get_json()
        if not data:
            return {'error': 'No JSON data provided'}, 400
            
        box_id = data.get('box_id')
        x1 = data.get('x1')
        y1 = data.get('y1')
        x2 = data.get('x2')
        y2 = data.get('y2')
        
        if not all(v is not None for v in [box_id, x1, y1, x2, y2]):
            return {'error': 'All coordinates (box_id, x1, y1, x2, y2) are required'}, 400
            
        # Get analyzer instance and update box coordinates
        analyzer = model_manager.get_analyzer()
        success = analyzer.update_box_coordinates(box_id, x1, y1, x2, y2)
        
        if success:
            return {
                'success': True,
                'message': 'Box coordinates updated successfully'
            }, 200
        else:
            return {'error': f'Box with ID {box_id} not found'}, 404
        
    except ValueError as e:
        return {'error': f'Invalid coordinates: {str(e)}'}, 400
    except Exception as e:
        return {'error': f'Failed to update box coordinates: {str(e)}'}, 500


def handle_uploaded_file(filename: str) -> Any:
    """
    Serve uploaded files from the uploads directory.
    
    Args:
        filename (str): Name of the file to serve
        
    Returns:
        Flask response: The requested file or 404 error
    """
    return send_from_directory(UPLOAD_DIR, filename) 