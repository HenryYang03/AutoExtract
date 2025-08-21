/**
 * ValueEditor Component
 * 
 * Provides an interface for editing origin and ymax values used in
 * bar graph calculations. Shows current values and allows updates.
 */

import React, { useState, useEffect } from 'react';

const ValueEditor = ({ originValue, ymaxValue, onUpdate, isUpdating = false }) => {
    const [editingOrigin, setEditingOrigin] = useState('');
    const [editingYmax, setEditingYmax] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    // Update local state when props change
    useEffect(() => {
        setEditingOrigin(originValue || '');
        setEditingYmax(ymaxValue || '');
    }, [originValue, ymaxValue]);

    /**
     * Validate input values
     * @returns {boolean} True if all inputs are valid
     */
    const validateInputs = () => {
        const errors = {};

        if (editingOrigin === '') {
            errors.origin = 'Origin value is required';
        } else if (isNaN(Number(editingOrigin))) {
            errors.origin = 'Origin must be a valid number';
        }

        if (editingYmax === '') {
            errors.ymax = 'Ymax value is required';
        } else if (isNaN(Number(editingYmax))) {
            errors.ymax = 'Ymax must be a valid number';
        } else if (Number(editingYmax) <= Number(editingOrigin)) {
            errors.ymax = 'Ymax must be greater than origin';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    /**
     * Handle update button click
     */
    const handleUpdate = () => {
        if (validateInputs()) {
            onUpdate({
                origin_value: editingOrigin,
                ymax_value: editingYmax
            });
        }
    };

    /**
     * Handle input changes with validation
     * @param {string} field - Field name ('origin' or 'ymax')
     * @param {string} value - New input value
     */
    const handleInputChange = (field, value) => {
        if (field === 'origin') {
            setEditingOrigin(value);
        } else if (field === 'ymax') {
            setEditingYmax(value);
        }

        // Clear validation error for this field
        if (validationErrors[field]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    // Don't render if no values are available
    if (!originValue && !ymaxValue) {
        return null;
    }

    return (
        <div className="alert alert-secondary mb-3">
            <div className="row align-items-center">
                <div className="col-md-6">
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center gap-2">
                            <strong className="text-nowrap">ymax:</strong>
                            <div className="position-relative">
                                <input
                                    type="number"
                                    className={`form-control form-control-sm ${validationErrors.ymax ? 'is-invalid' : ''
                                        }`}
                                    placeholder="ymax"
                                    value={editingYmax}
                                    onChange={(e) => handleInputChange('ymax', e.target.value)}
                                    style={{ width: '80px' }}
                                    disabled={isUpdating}
                                />
                                {validationErrors.ymax && (
                                    <div className="invalid-feedback position-absolute">
                                        {validationErrors.ymax}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <strong className="text-nowrap">origin:</strong>
                            <div className="position-relative">
                                <input
                                    type="number"
                                    className={`form-control form-control-sm ${validationErrors.origin ? 'is-invalid' : ''
                                        }`}
                                    placeholder="origin"
                                    value={editingOrigin}
                                    onChange={(e) => handleInputChange('origin', e.target.value)}
                                    style={{ width: '80px' }}
                                    disabled={isUpdating}
                                />
                                {validationErrors.origin && (
                                    <div className="invalid-feedback position-absolute">
                                        {validationErrors.origin}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 text-end">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={handleUpdate}
                        disabled={isUpdating}
                    >
                        {isUpdating ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Updating...
                            </>
                        ) : (
                            'Update Values'
                        )}
                    </button>
                </div>
            </div>

            {/* Current values display */}
            <div className="mt-2 pt-2 border-top">
                <small className="text-muted">
                    Current: ymax = {ymaxValue}, origin = {originValue}
                </small>
            </div>
        </div>
    );
};

export default ValueEditor; 