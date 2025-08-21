import React, { useState, useRef, useEffect } from 'react';
import * as fabric from 'fabric';

const MAX_CANVAS_WIDTH = 500;

const BarAnalyzer = () => {
    const [file, setFile] = useState(null);
    const [filename, setFilename] = useState('');
    const [detectionBoxes, setDetectionBoxes] = useState([]);
    const [imageShape, setImageShape] = useState([]);
    const [imageUrl, setImageUrl] = useState('');
    const [error, setError] = useState('');
    const canvasContainerRef = useRef(null);
    const fabricCanvasRef = useRef(null);

    // External selection info (shown above canvas)
    const [selectedInfo, setSelectedInfo] = useState(null);
    const scaleRef = useRef(1);

    // Origin and ymax values
    const [originValue, setOriginValue] = useState('');
    const [ymaxValue, setYmaxValue] = useState('');
    const [editingOrigin, setEditingOrigin] = useState('');
    const [editingYmax, setEditingYmax] = useState('');

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setFilename(event.target.files[0].name);
    };

    const handleUpload = async (event) => {
        event.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/bar_analyzer', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setDetectionBoxes(data.detection_boxes);
                setImageShape(data.image_shape);
                setImageUrl(data.image_url);
                setOriginValue(data.origin_value || '');
                setYmaxValue(data.ymax_value || '');
                setEditingOrigin(data.origin_value || '');
                setEditingYmax(data.ymax_value || '');
                setError('');
            } else {
                const errorMsg = await response.text();
                setError(errorMsg);
            }
        } catch (err) {
            setError('Error uploading file');
        }
    };

    const handleUpdateValues = async () => {
        try {
            const response = await fetch('/api/update_values', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    origin_value: editingOrigin,
                    ymax_value: editingYmax
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setOriginValue(data.origin_value);
                setYmaxValue(data.ymax_value);
                setEditingOrigin(data.origin_value);
                setEditingYmax(data.ymax_value);
            } else {
                console.error('Failed to update values');
            }
        } catch (err) {
            console.error('Error updating values:', err);
        }
    };

    // Setup Fabric.js canvas when detectionBoxes and imageUrl are available
    useEffect(() => {
        if (!imageUrl || !imageShape.length) return;

        // Dispose previous canvas if exists and clear container
        if (fabricCanvasRef.current) {
            fabricCanvasRef.current.dispose();
            fabricCanvasRef.current = null;
        }
        if (canvasContainerRef.current) {
            canvasContainerRef.current.innerHTML = '';
        }

        const [imgHeight, imgWidth] = imageShape;
        const scale = MAX_CANVAS_WIDTH / imgWidth;
        scaleRef.current = scale;

        // Create a canvas element imperatively so React doesn't manage it
        const canvasEl = document.createElement('canvas');
        canvasEl.id = 'detectionCanvas';
        canvasEl.style.border = '1px solid #ccc';
        canvasEl.style.display = 'block';
        canvasContainerRef.current?.appendChild(canvasEl);

        const canvas = new fabric.Canvas(canvasEl, {
            selection: true,
            preserveObjectStacking: true,
            width: imgWidth * scale,
            height: imgHeight * scale,
        });
        fabricCanvasRef.current = canvas;

        // Set background image
        const img = new Image();
        img.src = imageUrl;
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const fabricImage = new fabric.Image(img, {
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                objectCaching: false
            });

            fabricImage.canvas = canvas;  // optional but safe
            canvas.backgroundImage = fabricImage;  // 👈 modern way
            canvas.renderAll();  // or canvas.requestRenderAll();
        };

        // Helper to update external info panel
        function updatePanel(target) {
            if (!target) {
                setSelectedInfo(null);
                return;
            }
            const s = scaleRef.current || 1;
            const left = target.left || 0;
            const top = target.top || 0;
            const width = target.getScaledWidth ? target.getScaledWidth() : (target.width || 0) * (target.scaleX || 1);
            const height = target.getScaledHeight ? target.getScaledHeight() : (target.height || 0) * (target.scaleY || 1);
            setSelectedInfo({
                label: target.data?.label || '',
                coords: {
                    x: Math.round(left / s),
                    y: Math.round(top / s),
                    w: Math.round(width / s),
                    h: Math.round(height / s)
                }
            });
        }

        // Helper to create a detection box (no in-canvas label)
        function createRect(left, top, width, height, label = '') {
            const rect = new fabric.Rect({
                left, top, width, height,
                fill: 'transparent',
                stroke: 'green',
                strokeWidth: 2,
                objectCaching: false
            });
            rect.data = { label };

            // Removed in-canvas delete control; use panel's Delete Selected instead

            canvas.add(rect);
            canvas.setActiveObject(rect);
            updatePanel(rect);
        }

        // Draw detection boxes
        detectionBoxes.forEach(box => {
            const x1 = box.x1 * scale;
            const y1 = box.y1 * scale;
            const width = (box.x2 - box.x1) * scale;
            const height = (box.y2 - box.y1) * scale;
            createRect(x1, y1, width, height, box.label);
        });

        // Add box button
        const addBtn = document.getElementById('addBoxBtn');
        if (addBtn) {
            addBtn.onclick = () => {
                createRect(100, 50, 120, 60, 'new');
            };
        }

        // Selection events → external panel
        canvas.on('selection:created', e => updatePanel(e.selected?.[0]));
        canvas.on('selection:updated', e => updatePanel(e.selected?.[0]));
        canvas.on('selection:cleared', () => setSelectedInfo(null));

        // Clean up on unmount
        return () => {
            if (fabricCanvasRef.current) {
                fabricCanvasRef.current.dispose();
                fabricCanvasRef.current = null;
            }
            if (canvasContainerRef.current) {
                canvasContainerRef.current.innerHTML = '';
            }
        };
    }, [detectionBoxes, imageUrl, imageShape]);

    const deleteSelected = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const obj = canvas.getActiveObject();
        if (obj) {
            canvas.remove(obj);
            canvas.requestRenderAll();
            setSelectedInfo(null);
        }
    };

    return (
        <div className="container-fluid">
            <div className="row">
                {/* Left: 3/7 area for title and upload */}
                <div className="col-lg-4 col-md-5 pe-lg-4">
                    <h1>Bar Analyzer</h1>
                    <p>Upload a bar graph image to detect all relevant components.</p>

                    {error && <div className="alert alert-danger">{error}</div>}

                    <form onSubmit={handleUpload} className="form-group">
                        <input type="file" onChange={handleFileChange} required />
                        <button type="submit" className="btn btn-primary ms-2">Upload</button>
                    </form>
                </div>

                {/* Right: 7/7 area for canvas and info with separator */}
                <div className="col-lg-8 col-md-7 ps-lg-4 border-start">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Interactive Detection Viewer</span>
                        <button className="btn btn-sm btn-success" id="addBoxBtn">+ Add Box</button>
                    </div>

                    {/* Origin and Ymax values display and editing */}
                    {(originValue || ymaxValue) && (
                        <div className="alert alert-secondary mb-2">
                            <div className="row align-items-center">
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center gap-2">
                                        <strong>ymax:</strong>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            placeholder="ymax"
                                            value={editingYmax}
                                            onChange={(e) => setEditingYmax(e.target.value)}
                                            style={{ width: '80px' }}
                                        />
                                        <strong>origin:</strong>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            placeholder="origin"
                                            value={editingOrigin}
                                            onChange={(e) => setEditingOrigin(e.target.value)}
                                            style={{ width: '80px' }}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6 text-end">
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={handleUpdateValues}
                                    >
                                        Update
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedInfo && (
                        <div className="alert alert-info d-flex justify-content-between align-items-center">
                            <div>
                                <strong>Category:</strong> {selectedInfo.label} &nbsp;&nbsp;
                                <strong>Coords:</strong> x={selectedInfo.coords.x}, y={selectedInfo.coords.y}, w={selectedInfo.coords.w}, h={selectedInfo.coords.h}
                            </div>
                            <button className="btn btn-sm btn-outline-danger" onClick={deleteSelected}>Delete Selected</button>
                        </div>
                    )}

                    <div ref={canvasContainerRef} />
                    <small className="form-text text-muted mt-2 d-block">
                        Drag to move/resize the box, use the Delete Selected button to remove boxes.
                    </small>
                </div>
            </div>
        </div>
    );
};

export default BarAnalyzer;