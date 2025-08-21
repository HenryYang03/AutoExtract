import React, { useState, useRef, useEffect } from 'react';
import * as fabric from 'fabric';

const MAX_CANVAS_WIDTH = 800;

const BarAnalyzer = () => {
    const [file, setFile] = useState(null);
    const [filename, setFilename] = useState('');
    const [detectionBoxes, setDetectionBoxes] = useState([]);
    const [imageShape, setImageShape] = useState([]);
    const [imageUrl, setImageUrl] = useState('');
    const [error, setError] = useState('');
    const canvasRef = useRef(null);
    const fabricCanvasRef = useRef(null);

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
                setError('');
            } else {
                const errorMsg = await response.text();
                setError(errorMsg);
            }
        } catch (err) {
            setError('Error uploading file');
        }
    };

    // Setup Fabric.js canvas when detectionBoxes and imageUrl are available
    useEffect(() => {
        if (!imageUrl || !imageShape.length) return;

        // Remove previous canvas if exists
        if (fabricCanvasRef.current) {
            fabricCanvasRef.current.dispose();
        }

        const [imgHeight, imgWidth] = imageShape;
        const scale = MAX_CANVAS_WIDTH / imgWidth;

        const canvas = new fabric.Canvas(canvasRef.current, {
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

        // Helper to create a detection box
        function createRect(left, top, width, height, label = '') {
            const rect = new fabric.Rect({
                left, top, width, height,
                fill: 'transparent',
                stroke: 'green',
                strokeWidth: 2,
                objectCaching: false
            });

            // Delete control
            rect.controls.deleteControl = new fabric.Control({
                x: 0.5, y: -0.5, offsetY: 16,
                cursorStyle: 'pointer',
                mouseUpHandler: function (_, transform) {
                    const canvas = transform.target.canvas;
                    canvas.remove(transform.target);
                    canvas.requestRenderAll();
                },
                render: function (ctx, left, top, _, fabricObject) {
                    const size = this.cornerSize;
                    ctx.save();
                    ctx.translate(left, top);
                    ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
                    // Simple red X
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(-size / 2, -size / 2);
                    ctx.lineTo(size / 2, size / 2);
                    ctx.moveTo(size / 2, -size / 2);
                    ctx.lineTo(-size / 2, size / 2);
                    ctx.stroke();
                    ctx.restore();
                },
                cornerSize: 24
            });

            const text = new fabric.Text(label, {
                fontSize: 14,
                fill: 'green',
                left: left + 4,
                top: top - 18,
                selectable: false
            });

            const group = new fabric.Group([rect, text], {
                left, top,
                hasControls: true,
                hasBorders: true,
                lockUniScaling: false
            });

            canvas.add(group);
            canvas.setActiveObject(group);
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

        // Double click to add box
        canvas.on('mouse:dblclick', opt => {
            const pointer = canvas.getPointer(opt.e);
            createRect(pointer.x, pointer.y, 100, 60, 'new');
        });

        // Clean up on unmount
        return () => {
            canvas.dispose();
        };
    }, [detectionBoxes, imageUrl, imageShape]);

    return (
        <div>
            <h1>Bar Analyzer</h1>
            <p>Upload a bar graph image to detect all relevant components.</p>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleUpload} className="form-group">
                <input type="file" onChange={handleFileChange} required />
                <button type="submit" className="btn btn-primary">Upload</button>
            </form>

            {filename && (
                <div className="card mt-3">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <span>Interactive Detection Viewer</span>
                        <button className="btn btn-sm btn-success" id="addBoxBtn">+ Add Box</button>
                    </div>
                    <div className="card-body">
                        <canvas
                            ref={canvasRef}
                            id="detectionCanvas"
                            style={{ border: '1px solid #ccc', display: 'block' }}
                        ></canvas>
                        <small className="form-text text-muted mt-2">
                            Double-click to add box, drag to move/resize, or click ❌ icon to delete.
                        </small>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BarAnalyzer;