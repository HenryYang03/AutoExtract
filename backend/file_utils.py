"""
Utility functions for AutoExtract backend application.

This module contains helper functions for file operations, validation,
and other common tasks.
"""

import os
from typing import Optional
from werkzeug.utils import secure_filename
from config import ALLOWED_EXTENSIONS


def allowed_file(filename: str) -> bool:
    """
    Check if a filename has an allowed extension.
    
    Args:
        filename (str): The filename to check
        
    Returns:
        bool: True if the file extension is allowed, False otherwise
        
    Example:
        >>> allowed_file("image.png")
        True
        >>> allowed_file("document.pdf")
        False
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def clear_upload_folder(upload_dir: str) -> None:
    """
    Clear all files from the upload directory.
    
    This function removes all files and symbolic links from the specified
    upload directory. If the directory doesn't exist, it creates it.
    
    Args:
        upload_dir (str): Path to the upload directory to clear
        
    Example:
        >>> clear_upload_folder("/path/to/uploads")
        # Removes all files from the uploads directory
    """
    if not os.path.isdir(upload_dir):
        os.makedirs(upload_dir, exist_ok=True)
        return
        
    for filename in os.listdir(upload_dir):
        file_path = os.path.join(upload_dir, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
        except Exception as e:
            print(f'Failed to delete {file_path}. Reason: {e}')


def get_secure_filename(file) -> Optional[str]:
    """
    Get a secure filename from an uploaded file object.
    
    Args:
        file: The uploaded file object from Flask request
        
    Returns:
        Optional[str]: Secure filename if valid, None otherwise
        
    Example:
        >>> filename = get_secure_filename(request.files['file'])
        >>> if filename:
        ...     # Process the file
    """
    if not file or file.filename == '':
        return None
    
    filename_raw = file.filename or ""
    if allowed_file(filename_raw):
        return secure_filename(filename_raw)
    
    return None


def create_upload_paths(base_dir: str, upload_dir: str) -> tuple[str, str]:
    """
    Create upload file paths and ensure directories exist.
    
    Args:
        base_dir (str): Base directory for uploads
        upload_dir (str): Upload directory name
        
    Returns:
        tuple[str, str]: Tuple of (upload_directory_path, upload_file_path)
        
    Example:
        >>> upload_dir_path, file_path = create_upload_paths("/app", "uploads")
        >>> # Creates directories and returns paths
    """
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir, os.path.join(upload_dir, "temp_file") 