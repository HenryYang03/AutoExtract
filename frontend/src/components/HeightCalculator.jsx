/**
 * HeightCalculator Component
 * 
 * Displays a button to calculate heights and shows the results
 * including bar heights, uptail heights, and chart labels.
 */

import React, { useState } from 'react';
import { calculateHeights, updateBarNames } from '../services/apiService';
import { exportToCSV, exportToExcel } from '../utils/exportUtils';

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
 * Convert results to long format for export
 */
    const convertToLongFormat = (results) => {
        const longFormatData = [];

        Object.entries(results).forEach(([chartLabel, chartData]) => {
            const { bar_heights, uptail_heights, bar_names } = chartData;

            // Create one row per bar with mean (bar height), error (uptail height), and group (bar name)
            bar_heights.forEach((barHeight, index) => {
                const uptailHeight = uptail_heights[index] || 0;
                const groupName = bar_names[index] || `Bar ${index + 1}`;

                longFormatData.push({
                    mean: barHeight,
                    error: uptailHeight,
                    group: groupName
                });
            });
        });

        return longFormatData;
    };

    /**
     * Get filename from chart label or use default
     */
    const getFilename = () => {
        if (!results) return 'bar_analysis_results';
        const chartLabel = Object.keys(results)[0];
        // Clean the label for filename (remove special characters, limit length)
        const cleanLabel = chartLabel
            ? chartLabel.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50)
            : 'bar_analysis_results';
        return cleanLabel || 'bar_analysis_results';
    };

    /**
     * Handle CSV export
     */
    const handleExportCSV = () => {
        if (!results) return;
        const longFormatData = convertToLongFormat(results);
        const filename = getFilename();
        exportToCSV(longFormatData, filename);
    };

    /**
     * Handle Excel export
     */
    const handleExportExcel = () => {
        if (!results) return;
        const longFormatData = convertToLongFormat(results);
        const filename = getFilename();
        exportToExcel(longFormatData, filename);
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

                    {/* Export Buttons */}
                    <div className="mt-3">
                        <div className="d-flex gap-2">
                            <button
                                type="button"
                                className="btn btn-outline-success"
                                onClick={handleExportCSV}
                                disabled={!results}
                            >
                                <i className="bi bi-file-earmark-text me-2"></i>
                                Export to CSV
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={handleExportExcel}
                                disabled={!results}
                            >
                                <i className="bi bi-file-earmark-excel me-2"></i>
                                Export to Excel
                            </button>
                        </div>
                        <small className="text-muted d-block mt-2">
                            <i className="bi bi-info-circle me-1"></i>
                            Data will be exported with columns: mean (bar height), error (uptail height), group (bar name)
                        </small>

                        {/* Export Data Preview */}
                        <div className="mt-3">
                            <h6 className="text-info mb-2">
                                <i className="bi bi-table me-2"></i>
                                Export Data Preview (Mean, Error, Group Format)
                            </h6>
                            <div className="table-responsive">
                                <table className="table table-sm table-bordered">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Mean</th>
                                            <th>Error</th>
                                            <th>Group</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {convertToLongFormat(results).slice(0, 2).map((row, index) => (
                                            <tr key={index}>
                                                <td>{typeof row.mean === 'number' ? row.mean.toFixed(2) : row.mean}</td>
                                                <td>{typeof row.error === 'number' ? row.error.toFixed(2) : row.error}</td>
                                                <td>{row.group}</td>
                                            </tr>
                                        ))}
                                        {convertToLongFormat(results).length > 2 && (
                                            <tr>
                                                <td colSpan="3" className="text-center text-muted">
                                                    ... and {convertToLongFormat(results).length - 2} more rows
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <small className="text-muted">
                                <i className="bi bi-info-circle me-1"></i>
                                This preview shows the first 2 rows. Full export will include all data.
                            </small>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeightCalculator;
