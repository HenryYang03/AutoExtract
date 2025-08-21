/**
 * SelectionInfo Component
 * 
 * Displays information about the currently selected detection box,
 * including category, coordinates, and actions like deletion.
 */

import React from 'react';

const SelectionInfo = ({ selectedInfo, onDelete, onAddBox, onSyncCoordinates }) => {
    if (!selectedInfo) {
        return null;
    }

    const { label, coords } = selectedInfo;

    return (
        <div className="alert alert-info d-flex justify-content-between align-items-center mb-3">
            <div className="flex-grow-1">
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <div className="d-flex align-items-center gap-3">
                            <div>
                                <strong>Category:</strong>
                                <span className="badge bg-primary ms-2">{label}</span>
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
                                className="btn btn-outline-primary"
                                onClick={onSyncCoordinates}
                                title="Sync coordinates with backend"
                            >
                                <i className="bi bi-arrow-clockwise me-1"></i>
                                Sync Coordinates
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-success"
                                onClick={onAddBox}
                                title="Add a new detection box"
                            >
                                <i className="bi bi-plus-circle me-1"></i>
                                Add Box
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={onDelete}
                                title="Delete the selected box"
                            >
                                <i className="bi bi-trash me-1"></i>
                                Delete Selected
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectionInfo; 