/**
 * FileUpload Component
 * 
 * Handles file selection, validation, and submission for bar graph analysis.
 * Provides user feedback for upload status and errors.
 */

import React, { useState } from 'react';
import { validateFile } from '../services/apiService';
import HeightCalculator from './HeightCalculator';

const FileUpload = ({
    onUpload,
    onFileChange,
    onCalculateHeights,
    filename,
    error,
    isUploading,
    isCalculating,
    heightResults,
    hasDetections,
    originConversionError,
    ymaxConversionError
}) => {
    const [dragActive, setDragActive] = useState(false);

    /**
     * Handle file selection from input
     * @param {Event} event - Change event from file input
     */
    const handleFileInputChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            onFileChange(file);
        }
    };

    /**
     * Handle drag and drop events
     * @param {DragEvent} event - Drag event
     */
    const handleDrag = (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (event.type === 'dragenter' || event.type === 'dragover') {
            setDragActive(true);
        } else if (event.type === 'dragleave') {
            setDragActive(false);
        }
    };

    /**
     * Handle file drop
     * @param {DragEvent} event - Drop event
     */
    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);

        const files = event.dataTransfer.files;
        if (files && files[0]) {
            const file = files[0];
            const validation = validateFile(file);

            if (validation.isValid) {
                onFileChange(file);
            } else {
                // You could add a toast notification here
                console.error(validation.error);
            }
        }
    };

    /**
     * Handle form submission
     * @param {Event} event - Form submit event
     */
    const handleSubmit = (event) => {
        event.preventDefault();
        if (filename && !isUploading) {
            onUpload();
        }
    };

    return (
        <div className="col-lg-4 col-md-5 pe-lg-4">
            <h1>Bar Analyzer</h1>
            <p className="text-muted">
                Upload a bar graph image to detect all relevant components.
            </p>

            {error && (
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="mb-3">
                <div
                    className={`border-2 border-dashed rounded p-4 text-center ${dragActive ? 'border-primary bg-light' : 'border-secondary'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {filename ? (
                        <div>
                            <i className="bi bi-file-earmark-image text-success fs-1"></i>
                            <p className="mb-2 text-success fw-bold">{filename}</p>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Processing...
                                    </>
                                ) : (
                                    'Analyze Image'
                                )}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <i className="bi bi-cloud-upload text-muted fs-1"></i>
                            <p className="mb-2">
                                Drag and drop an image here, or{' '}
                                <label htmlFor="file-input" className="text-primary fw-bold" style={{ cursor: 'pointer' }}>
                                    browse files
                                </label>
                            </p>
                            <input
                                id="file-input"
                                type="file"
                                onChange={handleFileInputChange}
                                accept="image/png,image/jpeg,image/jpg"
                                className="d-none"
                                required
                            />
                            <small className="text-muted">
                                Supports PNG, JPEG, JPG (max 10MB)
                            </small>
                        </div>
                    )}
                </div>
            </form>

            {filename && (
                <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                        Ready to analyze: {filename}
                    </small>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => onFileChange(null)}
                    >
                        Change File
                    </button>
                </div>
            )}

            {/* Height Calculator Section */}
            <HeightCalculator
                onCalculate={onCalculateHeights}
                isCalculating={isCalculating}
                results={heightResults}
                hasDetections={hasDetections}
                originConversionError={originConversionError}
                ymaxConversionError={ymaxConversionError}
            />
        </div>
    );
};

export default FileUpload; 