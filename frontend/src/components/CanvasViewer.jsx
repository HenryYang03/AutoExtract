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
    children
}) => {
    return (
        <div className="col-lg-8 col-md-7 ps-lg-4 border-start">
            {/* Header with title and add box button */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                    <i className="bi bi-eye me-2"></i>
                    Interactive Detection Viewer
                </h5>
            </div>

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

            {/* Instructions */}
            <div className="mt-3">
                <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    <strong>Instructions:</strong> Click and drag to select boxes, drag to move/resize,
                    or use the buttons above to add/delete detection boxes.
                </small>
            </div>

            {/* Render children (ValueEditor, SelectionInfo) */}
            {children}
        </div>
    );
};

export default CanvasViewer; 