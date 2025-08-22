/**
 * HeightCalculator Component
 * 
 * Displays a button to calculate heights and shows the results
 * including bar heights, uptail heights, and chart labels.
 */

import React from 'react';
import { calculateHeights } from '../services/apiService';

const HeightCalculator = ({
    onCalculate,
    isCalculating,
    results,
    hasDetections,
    originConversionError,
    ymaxConversionError
}) => {
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
     * Render bar heights list
     */
    const renderBarHeights = (barHeights) => {
        if (!barHeights || barHeights.length === 0) return null;

        return (
            <div className="mb-3">
                <h6 className="text-primary mb-2">
                    <i className="bi bi-bar-chart me-2"></i>
                    Bar Heights:
                </h6>
                <ul className="list-group list-group-flush">
                    {barHeights.map((height, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                            <span>Bar {index + 1}:</span>
                            <span className="badge bg-primary rounded-pill">
                                {typeof height === 'number' ? height.toFixed(2) : height}
                            </span>
                        </li>
                    ))}
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
                                {renderBarHeights(chartData.bar_heights)}
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
