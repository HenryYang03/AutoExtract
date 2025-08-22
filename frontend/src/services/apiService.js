/**
 * API service for communicating with the AutoExtract backend
 * 
 * This module handles all HTTP requests to the Flask backend,
 * including file uploads, analysis requests, and value updates.
 */

const API_BASE = '/api';

/**
 * Upload an image file for bar graph analysis
 * 
 * @param {File} file - The image file to upload
 * @returns {Promise<Object>} Analysis results including detection boxes and metadata
 * @throws {Error} If the upload fails or analysis errors occur
 */
export const uploadImageForAnalysis = async (file) => {
    if (!file) {
        throw new Error('No file provided');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE}/bar_analyzer`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to reach the backend server');
        }
        throw error;
    }
};

/**
 * Update origin and ymax values in the backend
 * 
 * @param {Object} values - Object containing origin_value and ymax_value
 * @param {string|number} values.origin_value - The new origin value
 * @param {string|number} values.ymax_value - The new ymax value
 * @returns {Promise<Object>} Updated values confirmation
 * @throws {Error} If the update fails
 */
export const updateValues = async ({ origin_value, ymax_value }) => {
    try {
        const response = await fetch(`${API_BASE}/update_values`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ origin_value, ymax_value }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to reach the backend server');
        }
        throw error;
    }
};

/**
 * Update box coordinates on the backend
 * @param {string} boxId - Unique identifier of the box
 * @param {Object} coords - New coordinates {x, y, w, h}
 * @returns {Promise<Object>} Response from the backend
 */
export const updateBoxCoordinates = async (boxId, coords) => {
    try {
        const response = await fetch('/api/update_box_coordinates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                box_id: boxId,
                x1: coords.x,
                y1: coords.y,
                x2: coords.x + coords.w,
                y2: coords.y + coords.h
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update box coordinates');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating box coordinates:', error);
        throw error;
    }
};

/**
 * Calculate bar and uptail heights using current detections
 * 
 * @returns {Promise<Object>} Height calculation results
 * @throws {Error} If the calculation fails
 */
export const calculateHeights = async () => {
    try {
        const response = await fetch('/api/calculate_heights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to calculate heights');
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to reach the backend server');
        }
        throw error;
    }
};

/**
 * Get the URL for an uploaded image
 * 
 * @param {string} filename - The filename of the uploaded image
 * @returns {string} Full URL to the image
 */
export const getImageUrl = (filename) => {
    return `/static/uploads/${filename}`;
};

/**
 * Validate file type and size
 * 
 * @param {File} file - The file to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
export const validateFile = (file) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!file) {
        return { isValid: false, error: 'No file selected' };
    }

    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: 'Invalid file type. Please select a PNG, JPEG, or JPG image.'
        };
    }

    if (file.size > maxSize) {
        return {
            isValid: false,
            error: 'File too large. Please select an image smaller than 10MB.'
        };
    }

    return { isValid: true, error: null };
};

/**
 * Update bar names in the backend
 * 
 * @param {Array<string>} barNames - Array of new bar names
 * @returns {Promise<Object>} Response from the backend
 * @throws {Error} If the update fails
 */
export const updateBarNames = async (barNames) => {
    try {
        const response = await fetch('/api/update_bar_names', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bar_names: barNames }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update bar names');
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to reach the backend server');
        }
        throw error;
    }
}; 