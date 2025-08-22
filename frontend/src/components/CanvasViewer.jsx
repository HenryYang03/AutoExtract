/**
 * CanvasViewer Component
 * 
 * Manages the canvas container and provides the interface for the
 * interactive detection viewer. Integrates with the useCanvasManager hook.
 */

import React from 'react';

const CanvasViewer = ({
    canvasContainerRef,
    onAddBox,
    selectedInfo,
    children,
    valueEditor,
    selectionInfo
}) => {
    return (
        <div className="col-lg-8 col-md-7 ps-lg-4 border-start">
            {/* Header with title and add box button */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                    <i className="bi bi-eye me-2"></i>
                    Interactive Detection Viewer
                </h5>
                <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={onAddBox}
                    title="Add a new detection box"
                >
                    <i className="bi bi-plus-circle me-1"></i>
                    Add Box
                </button>
            </div>

            {/* Instructions above canvas */}
            <div className="mb-3">
                <div className="alert alert-info py-2">
                    <small className="text-info">
                        <i className="bi bi-info-circle me-2"></i>
                        <strong>How to adjust detection boxes:</strong>
                    </small>
                    <div className="mt-2">
                        <small className="text-info">
                            1. <strong>Click on a detected box</strong> to select it and see its details
                        </small>
                        <br />
                        <small className="text-info">
                            2. <strong>Drag the box</strong> to move it to the correct position
                        </small>
                        <br />
                        <small className="text-info">
                            3. <strong>Change category</strong> using the dropdown if needed
                        </small>
                        <br />
                        <small className="text-info">
                            4. <strong>Click "Sync"</strong> to save position and category changes
                        </small>
                    </div>
                </div>
            </div>

            {/* Value Editor above canvas */}
            {valueEditor && (
                <div className="mb-3">
                    {valueEditor}
                </div>
            )}

            {/* Selection Info above canvas */}
            {selectionInfo && (
                <div className="mb-3">
                    {selectionInfo}
                </div>
            )}

            {/* Canvas container */}
            <div className="card">
                <div className="card-body p-0">
                    <div
                        ref={canvasContainerRef}
                        className="canvas-container"
                        style={{
                            minHeight: '400px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    />
                </div>
            </div>

            {/* Render children (ValueEditor, SelectionInfo) */}
            {children}
        </div>
    );
};

export default CanvasViewer; 