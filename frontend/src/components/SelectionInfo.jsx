import React from 'react';

const SelectionInfo = ({
    selectedInfo,
    onDelete,
    onSyncCoordinates,
    onCategoryChange,
    onAddBox,
    pendingChanges = 0
}) => {
    const hasSelection = !!selectedInfo && !!selectedInfo.coords;
    const { label, coords } = selectedInfo || {};

    return (
        <div className="alert alert-info mb-3">
            {hasSelection ? (
                <div className="row g-2">
                    {/* Category Selection */}
                    <div className="col-12 col-md-6">
                        <div className="mb-2">
                            <strong>Category:</strong>
                            <div className="d-flex align-items-center gap-2 mt-1">
                                <select
                                    className="form-select form-select-sm"
                                    style={{ width: 'auto', minWidth: '80px' }}
                                    value={label}
                                    onChange={(e) => {
                                        const newCategory = e.target.value;
                                        if (newCategory !== label) {
                                            onCategoryChange(selectedInfo.boxId, newCategory, false);
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
                            </div>
                            <small className="text-muted">
                                {pendingChanges > 0
                                    ? `⚠️ ${pendingChanges} pending change(s) - click Sync to apply`
                                    : "Select new category, then click Sync"
                                }
                            </small>
                        </div>
                    </div>

                    {/* Coordinates Display */}
                    <div className="col-12 col-md-6">
                        <div className="mb-2">
                            <strong>Coordinates:</strong>
                            <div className="mt-1">
                                <code className="small">
                                    x={coords?.x}, y={coords?.y}
                                    <br />
                                    w={coords?.w}, h={coords?.h}
                                </code>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="col-12">
                        <div className="d-flex flex-wrap gap-2 justify-content-end">
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={onDelete}
                                title="Delete the selected box"
                            >
                                <i className="bi bi-trash"></i>
                                <span className="d-none d-sm-inline ms-1">Delete</span>
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={onSyncCoordinates}
                                title="Sync coordinates and category changes with backend"
                            >
                                <i className="bi bi-arrow-clockwise"></i>
                                <span className="d-none d-sm-inline ms-1">Sync</span>
                            </button>
                            <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={onAddBox}
                                title="Add a new detection box"
                            >
                                <i className="bi bi-plus-circle"></i>
                                <span className="d-none d-sm-inline ms-1">Add Box</span>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="d-flex align-items-center">
                    <i className="bi bi-cursor me-2"></i>
                    <span className="text-muted">
                        Click on a detected box to see its details and make adjustments
                    </span>
                </div>
            )}
        </div>
    );
};

export default SelectionInfo;