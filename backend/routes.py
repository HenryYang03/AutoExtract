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
            'ymax_value': analyzer.ymax_value,
            'origin_conversion_error': analyzer.origin_conversion_error,
            'ymax_conversion_error': analyzer.ymax_conversion_error
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
    after they have been moved or resized on the frontend canvas.
    
    Returns:
        Tuple[Dict[str, Any], int]: JSON response and HTTP status code
        
    Example Request:
        {
            "box_id": "bar_1",
            "x1": 100.0,
            "y1": 200.0,
            "x2": 150.0,
            "y2": 300.0
        }
        
    Example Response:
        {
            "success": true,
            "message": "Box coordinates updated successfully"
        }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['box_id', 'x1', 'y1', 'x2', 'y2']
        for field in required_fields:
            if field not in data:
                return {'error': f'Missing required field: {field}'}, 400
        
        box_id = data['box_id']
        x1 = float(data['x1'])
        y1 = float(data['y1'])
        x2 = float(data['x2'])
        y2 = float(data['y2'])
        
        # Validate coordinate values
        if x1 >= x2 or y1 >= y2:
            return {'error': 'Invalid coordinates: x1 must be < x2 and y1 must be < y2'}, 400
        
        # Get analyzer instance and update coordinates
        analyzer = model_manager.get_analyzer()
        success = analyzer.update_box_coordinates(box_id, x1, y1, x2, y2)
        
        if success:
            return {'success': True, 'message': 'Box coordinates updated successfully'}, 200
        else:
            return {'error': f'Box with ID {box_id} not found'}, 404
            
    except ValueError as e:
        return {'error': f'Invalid coordinates: {str(e)}'}, 400
    except Exception as e:
        return {'error': f'Failed to update box coordinates: {str(e)}'}, 500


def handle_calculate_heights() -> Tuple[Dict[str, Any], int]:
    """
    Handle requests to calculate bar and uptail heights.
    
    This endpoint triggers the height calculation using the current
    detection boxes and returns the computed results.
    
    Returns:
        Tuple[Dict[str, Any], int]: JSON response and HTTP status code
        
    Example Response:
        {
            "success": true,
            "results": {
                "chart_label": {
                    "bar_heights": [6.5, 8.2],
                    "uptail_heights": [0.8, 1.2],
                    "origin_value": 0,
                    "ymax_value": 25,
                    "bar_label_texts": ["Group A", "Group B"]
                }
            }
        }
    """
    try:
        # Get analyzer instance
        analyzer = model_manager.get_analyzer()
        
        # Check if image has been processed
        if analyzer.image is None:
            return {'error': 'No image has been processed yet. Please upload and analyze an image first.'}, 400
        
        # Check if detections exist
        if not analyzer.detections:
            return {'error': 'No detections found. Please ensure the image has been analyzed.'}, 400
        
        # Calculate heights
        results = analyzer.calculate_heights()
        
        return {
            'success': True,
            'results': results
        }, 200
        
    except ValueError as e:
        return {'error': f'Calculation error: {str(e)}'}, 400
    except Exception as e:
        return {'error': f'Failed to calculate heights: {str(e)}'}, 500


def handle_update_bar_names() -> Tuple[Dict[str, Any], int]:
    """
    Handle requests to update bar names.
    
    This endpoint allows updating the names of bars in the analysis results.
    
    Returns:
        Tuple[Dict[str, Any], int]: JSON response and HTTP status code
        
    Example Request:
        {
            "bar_names": ["Control", "Treatment A", "Treatment B"]
        }
        
    Example Response:
        {
            "success": true,
            "message": "Bar names updated successfully"
        }
    """
    try:
        data = request.get_json()
        if not data:
            return {'error': 'No JSON data provided'}, 400
            
        bar_names = data.get('bar_names')
        if not bar_names or not isinstance(bar_names, list):
            return {'error': 'bar_names must be a list'}, 400
            
        # Get analyzer instance and update bar names
        analyzer = model_manager.get_analyzer()
        success = analyzer.update_bar_names(bar_names)
        
        if success:
            return {
                'success': True, 
                'message': 'Bar names updated successfully',
                'bar_names': bar_names
            }, 200
        else:
            return {'error': 'Failed to update bar names. Number of names must match number of bars.'}, 400
        
    except Exception as e:
        return {'error': f'Failed to update bar names: {str(e)}'}, 500


def handle_uploaded_file(filename: str) -> Any:
    """
    Serve uploaded files from the uploads directory.
    
    Args:
        filename (str): Name of the file to serve
        
    Returns:
        Flask response: The requested file or 404 error
    """
    return send_from_directory(UPLOAD_DIR, filename) 