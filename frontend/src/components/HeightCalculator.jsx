/**
 * HeightCalculator Component
 * 
 * Displays a button to calculate heights and shows the results
 * including bar heights, uptail heights, and chart labels.
 */

import React, { useState } from 'react';
import { calculateHeights, updateBarNames } from '../services/apiService';

const HeightCalculator = ({
    onCalculate,
    isCalculating,
    results,
    hasDetections,
    originConversionError,
    ymaxConversionError
}) => {
    const [editingBarNames, setEditingBarNames] = useState({});
    const [isUpdatingNames, setIsUpdatingNames] = useState(false);
    /**
     * Handle height calculation button click
     */
    const handleCalculateClick = async () => {
        try {
            await onCalculate();
        } catch (error) {
            console.error('Height calculation error:', error);
        }
    };

    /**
     * Handle bar name input change
     */
    const handleBarNameChange = (index, value) => {
        setEditingBarNames(prev => ({
            ...prev,
            [index]: value
        }));
    };

    /**
     * Handle updating bar names
     */
    const handleUpdateBarNames = async () => {
        if (!results) return;

        setIsUpdatingNames(true);
        try {
            const chartLabel = Object.keys(results)[0];
            const chartData = results[chartLabel];
            const currentBarNames = chartData.bar_names || [];

            // Get updated names (use edited ones or fall back to current)
            const updatedNames = currentBarNames.map((name, index) =>
                editingBarNames[index] !== undefined ? editingBarNames[index] : name
            );

            await updateBarNames(updatedNames);

            // Clear editing state
            setEditingBarNames({});

            // Trigger a refresh of the results
            await onCalculate();

        } catch (error) {
            console.error('Failed to update bar names:', error);
        } finally {
            setIsUpdatingNames(false);
        }
    };

    /**
     * Render bar heights list with editable names
     */
    const renderBarHeights = (barHeights, barNames = []) => {
        if (!barHeights || barHeights.length === 0) return null;

        return (
            <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="text-primary mb-0">
                        <i className="bi bi-bar-chart me-2"></i>
                        Bar Heights:
                    </h6>
                    {barNames.length > 0 && Object.keys(editingBarNames).length > 0 && (
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={handleUpdateBarNames}
                            disabled={isUpdatingNames}
                        >
                            {isUpdatingNames ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check me-2"></i>
                                    Save Names
                                </>
                            )}
                        </button>
                    )}
                </div>
                <ul className="list-group list-group-flush">
                    {barHeights.map((height, index) => {
                        const barName = barNames[index] || `Bar ${index + 1}`;
                        const isEditing = editingBarNames[index] !== undefined;
                        const displayName = isEditing ? editingBarNames[index] : barName;

                        return (
                            <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        style={{ width: '120px' }}
                                        value={displayName}
                                        onChange={(e) => handleBarNameChange(index, e.target.value)}
                                        onFocus={() => setEditingBarNames(prev => ({ ...prev, [index]: barName }))}
                                        placeholder={`Bar ${index + 1}`}
                                    />
                                </div>
                                <span className="badge bg-primary rounded-pill">
                                    {typeof height === 'number' ? height.toFixed(2) : height}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };

    /**
     * Render uptail heights list
     */
    const renderUptailHeights = (uptailHeights) => {
        if (!uptailHeights || uptailHeights.length === 0) return null;

        return (
            <div className="mb-3">
                <h6 className="text-success mb-2">
                    <i className="bi bi-graph-up me-2"></i>
                    Uptail Heights:
                </h6>
                <ul className="list-group list-group-flush">
                    {uptailHeights.map((height, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                            <span>Uptail {index + 1}:</span>
                            <span className="badge bg-success rounded-pill">
                                {typeof height === 'number' ? height.toFixed(2) : height}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };



    return (
        <div className="mt-4 pt-3 border-top">
            <div className="d-flex align-items-center mb-3">
                <i className="bi bi-calculator text-primary me-2"></i>
                <h5 className="mb-0">Height Calculator</h5>
            </div>

            <div className="alert alert-info" role="alert">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Ready to calculate?</strong> Once you are finished adjusting the detections, click here to obtain results.
            </div>

            {/* Show warning when conversion errors exist */}
            {(originConversionError || ymaxConversionError) && (
                <div className="alert alert-warning" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Manual input required!</strong> Please input valid numbers for origin and ymax values above before calculating heights.
                </div>
            )}

            <button
                type="button"
                className="btn btn-primary w-100 mb-3"
                onClick={handleCalculateClick}
                disabled={isCalculating || !hasDetections || originConversionError || ymaxConversionError}
            >
                {isCalculating ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Calculating Heights...
                    </>
                ) : (
                    <>
                        <i className="bi bi-calculator me-2"></i>
                        Calculate Heights
                    </>
                )}
            </button>

            {!hasDetections && (
                <div className="alert alert-warning" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Upload and analyze an image first to enable height calculation.
                </div>
            )}

            {/* Results Display */}
            {results && Object.keys(results).length > 0 && (
                <div className="mt-4">
                    <h6 className="text-success mb-3">
                        <i className="bi bi-check-circle me-2"></i>
                        Calculation Results
                    </h6>

                    {Object.entries(results).map(([chartLabel, chartData]) => (
                        <div key={chartLabel} className="card mb-3">
                            <div className="card-header bg-light">
                                <h6 className="mb-0 text-primary">
                                    <i className="bi bi-graph-up me-2"></i>
                                    {chartLabel || 'Chart Analysis'}
                                </h6>
                            </div>
                            <div className="card-body">
                                {renderBarHeights(chartData.bar_heights, chartData.bar_names)}
                                {renderUptailHeights(chartData.uptail_heights)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HeightCalculator;
