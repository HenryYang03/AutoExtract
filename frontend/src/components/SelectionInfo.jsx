/**
 * SelectionInfo Component
 * 
 * Displays information about the currently selected detection box,
 * including category, coordinates, and actions like deletion.
 */

import React from 'react';

const SelectionInfo = ({ selectedInfo, onDelete, onSyncCoordinates, onCategoryChange, onAddBox, pendingChanges = 0 }) => {
    const hasSelection = !!selectedInfo;
    const { label, coords } = selectedInfo || {};

    return (
        <div className="alert alert-info d-flex justify-content-between align-items-center mb-3">
            <div className="flex-grow-1">
                <div className="row align-items-center">
                    {hasSelection ? (
                        // Show full selection info when a box is selected
                        <>
                            <div className="col-md-8">
                                <div className="d-flex align-items-center gap-3">
                                    <div>
                                        <strong>Category:</strong>
                                        <div className="d-flex align-items-center gap-2">
                                            <select
                                                className="form-select form-select-sm"
                                                style={{ width: 'auto' }}
                                                value={label}
                                                onChange={(e) => {
                                                    // Store the new category but don't apply it yet
                                                    const newCategory = e.target.value;
                                                    if (newCategory !== label) {
                                                        // Update local selection info for display
                                                        onCategoryChange(selectedInfo.boxId, newCategory, false); // false = don't apply yet
                                                    }
                                                }}
                                            >
                                                <option value="bar">Bar</option>
                                                <option value="uptail">Uptail</option>
                                                <option value="yaxis">Y-Axis</option>
                                                <option value="xaxis">X-Axis</option>
                                                <option value="ymax">Y-Max</option>
                                                <option value="origin">Origin</option>
                                                <option value="label">Label</option>
                                                <option value="x_group">X-Group</option>
                                                <option value="legend">Legend</option>
                                                <option value="legend_group">Legend Group</option>
                                            </select>
                                            <small className="text-muted">
                                                {pendingChanges > 0
                                                    ? `⚠️ ${pendingChanges} pending change(s) - click Sync to apply`
                                                    : "Select new category, then click Sync"
                                                }
                                            </small>
                                        </div>
                                    </div>
                                    <div>
                                        <strong>Coordinates:</strong>
                                        <code className="ms-2">
                                            x={coords.x}, y={coords.y}, w={coords.w}, h={coords.h}
                                        </code>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4 text-end">
                                <div className="btn-group btn-group-sm" role="group">
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger"
                                        onClick={onDelete}
                                        title="Delete the selected box"
                                    >
                                        <i className="bi bi-trash me-1"></i>
                                        Delete
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary"
                                        onClick={onSyncCoordinates}
                                        title="Sync coordinates and category changes with backend"
                                    >
                                        <i className="bi bi-arrow-clockwise me-1"></i>
                                        Sync
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={onAddBox}
                                        title="Add a new detection box"
                                    >
                                        <i className="bi bi-plus-circle me-1"></i>
                                        Add Box
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Show minimal info when no box is selected
                        <>
                            <div className="col-md-8">
                                <div className="d-flex align-items-center">
                                    <i className="bi bi-cursor me-2"></i>
                                    <span className="text-muted">
                                        Click on a detection box to select and edit it, or use the buttons to manage detections.
                                    </span>
                                </div>
                            </div>
                            <div className="col-md-4 text-end">
                                <div className="btn-group btn-group-sm" role="group">
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary"
                                        onClick={onSyncCoordinates}
                                        title="Sync all detection boxes with backend"
                                    >
                                        <i className="bi bi-arrow-clockwise me-1"></i>
                                        Sync
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={onAddBox}
                                        title="Add a new detection box"
                                    >
                                        <i className="bi bi-plus-circle me-1"></i>
                                        Add Box
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SelectionInfo; 