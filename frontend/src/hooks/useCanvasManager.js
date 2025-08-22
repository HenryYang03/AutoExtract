/**
 * Custom hook for managing Fabric.js canvas lifecycle and operations
 * 
 * This hook handles:
 * - Canvas creation and disposal
 * - Background image loading
 * - Detection box rendering
 * - Selection event handling
 * - Coordinate scaling between display and original image space
 * - Object movement tracking and coordinate updates
 */

import { useRef, useCallback, useEffect } from 'react';
import * as fabric from 'fabric';

const MAX_CANVAS_WIDTH = 500;

export const useCanvasManager = (imageUrl, imageShape, detectionBoxes, onSelectionChange, onBoxMove) => {
    const canvasContainerRef = useRef(null);
    const fabricCanvasRef = useRef(null);
    const scaleRef = useRef(1);
    const boxIdMapRef = useRef(new Map()); // Map fabric objects to their backend IDs

    /**
     * Create and configure a new Fabric.js canvas
     * @param {number} width - Original image width
     * @param {number} height - Original image height
     * @returns {fabric.Canvas} The configured canvas instance
     */
    const createCanvas = useCallback((width, height) => {
        const scale = MAX_CANVAS_WIDTH / width;
        scaleRef.current = scale;

        const canvasEl = document.createElement('canvas');
        canvasEl.id = 'detectionCanvas';
        canvasEl.style.border = '1px solid #ccc';
        canvasEl.style.display = 'block';

        canvasContainerRef.current?.appendChild(canvasEl);

        return new fabric.Canvas(canvasEl, {
            selection: true,
            preserveObjectStacking: true,
            width: width * scale,
            height: height * scale,
            renderOnAddRemove: false,  // Prevent auto-render on object changes
            skipTargetFind: false,     // Keep target finding for selection
            enableRetinaScaling: false // Disable retina scaling for better performance
        });
    }, []);

    /**
     * Load background image onto the canvas
     * @param {fabric.Canvas} canvas - The canvas instance
     * @param {string} imageUrl - URL of the image to load
     * @param {number} scale - Scale factor for the image
     */
    const loadBackgroundImage = useCallback((canvas, imageUrl, scale) => {
        const img = new Image();
        img.src = imageUrl;
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const fabricImage = new fabric.Image(img, {
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                objectCaching: true,  // Enable caching for background
                evented: false        // Disable events on background
            });

            fabricImage.canvas = canvas;
            canvas.backgroundImage = fabricImage;
            canvas.requestRenderAll();  // Use requestRenderAll instead of renderAll
        };
    }, []);

    /**
     * Create a detection box rectangle on the canvas
     * @param {fabric.Canvas} canvas - The canvas instance
     * @param {number} left - Left position
     * @param {number} top - Top position
     * @param {number} width - Box width
     * @param {number} height - Box height
     * @param {string} label - Box label
     * @param {string} boxId - Backend box ID for coordinate updates
     */
    const createDetectionBox = useCallback((canvas, left, top, width, height, label = '', boxId = '') => {
        const rect = new fabric.Rect({
            left, top, width, height,
            fill: 'transparent',
            stroke: 'green',
            strokeWidth: 2,
            objectCaching: true,  // Enable object caching for better performance
            selectable: true,
            hasControls: true,
            hasBorders: true
        });
        rect.data = { label };

        // Store mapping between fabric object and backend ID
        if (boxId) {
            boxIdMapRef.current.set(rect, boxId);
            console.log(`Created mapping: ${boxId} -> fabric object`, rect);
        } else {
            console.warn(`No boxId provided for label: ${label}`);
        }

        canvas.add(rect);

        // Don't set as active object or trigger selection change during initial rendering
        // This prevents issues with coordinate syncing before the canvas is fully set up
        canvas.requestRenderAll();
    }, []);

    /**
     * Render all detection boxes from the API response
     * @param {fabric.Canvas} canvas - The canvas instance
     * @param {Array} detectionBoxes - Array of detection box data
     */
    const renderDetectionBoxes = useCallback((canvas, detectionBoxes) => {
        const scale = scaleRef.current;

        detectionBoxes.forEach(box => {
            const x1 = box.x1 * scale;
            const y1 = box.y1 * scale;
            const width = (box.x2 - box.x1) * scale;
            const height = (box.y2 - box.y1) * scale;
            createDetectionBox(canvas, x1, y1, width, height, box.label, box.id);
        });
    }, [createDetectionBox]);

    /**
     * Setup canvas event handlers
     * @param {fabric.Canvas} canvas - The canvas instance
     */
    const setupEventHandlers = useCallback((canvas) => {
        canvas.on('selection:created', e => {
            if (onSelectionChange) onSelectionChange(e.selected?.[0]);
        });
        canvas.on('selection:updated', e => {
            if (onSelectionChange) onSelectionChange(e.selected?.[0]);
        });
        canvas.on('selection:cleared', () => {
            if (onSelectionChange) onSelectionChange(null);
        });
    }, [onSelectionChange]);

    /**
     * Set up the selection change handler after initialization
     * @param {Function} handler - The selection change handler function
     */
    const setupSelectionHandler = useCallback((handler) => {
        if (fabricCanvasRef.current) {
            // Remove existing handlers
            fabricCanvasRef.current.off('selection:created');
            fabricCanvasRef.current.off('selection:updated');
            fabricCanvasRef.current.off('selection:cleared');

            // Set up new handlers
            fabricCanvasRef.current.on('selection:created', e => {
                if (handler) handler(e.selected?.[0]);
            });
            fabricCanvasRef.current.on('selection:updated', e => {
                if (handler) handler(e.selected?.[0]);
            });
            fabricCanvasRef.current.on('selection:cleared', () => {
                if (handler) handler(null);
            });
        }
    }, []);

    /**
     * Clean up canvas resources
     */
    const cleanup = useCallback(() => {
        if (fabricCanvasRef.current) {
            fabricCanvasRef.current.dispose();
            fabricCanvasRef.current = null;
        }
        if (canvasContainerRef.current) {
            canvasContainerRef.current.innerHTML = '';
        }
        boxIdMapRef.current.clear(); // Clear the ID mapping on cleanup
    }, []);

    /**
     * Get coordinates in original image space
     * @param {fabric.Object} target - The selected fabric object
     * @returns {Object|null} Coordinates object or null
     */
    const getOriginalCoordinates = useCallback((target) => {
        if (!target) return null;

        const scale = scaleRef.current;
        const left = target.left || 0;
        const top = target.top || 0;
        const width = target.getScaledWidth ? target.getScaledWidth() : (target.width || 0) * (target.scaleX || 1);
        const height = target.getScaledHeight ? target.getScaledHeight() : (target.height || 0) * (target.scaleY || 1);

        return {
            label: target.data?.label || '',
            coords: {
                x: Math.round(left / scale),
                y: Math.round(top / scale),
                w: Math.round(width / scale),
                h: Math.round(height / scale)
            }
        };
    }, []);

    /**
     * Add a new box to the canvas
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Box width
     * @param {number} height - Box height
     */
    const addNewBox = useCallback((x = 100, y = 50, width = 120, height = 60) => {
        const canvas = fabricCanvasRef.current;
        if (canvas) {
            createDetectionBox(canvas, x, y, width, height, 'new');
        }
    }, [createDetectionBox]);

    /**
     * Delete the currently selected object
     */
    const deleteSelected = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const obj = canvas.getActiveObject();
        if (obj) {
            // Remove from ID mapping
            boxIdMapRef.current.delete(obj);
            canvas.remove(obj);
            canvas.requestRenderAll();
            if (onSelectionChange) onSelectionChange(null);
        }
    }, [onSelectionChange]);

    /**
     * Update the coordinates of a specific box on the canvas
     * @param {string} boxId - Backend box ID
     * @param {Object} coords - New coordinates {x, y, w, h}
     */
    const updateCanvasBoxCoordinates = useCallback((boxId, coords) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        // Find the fabric object by ID
        for (const [obj, id] of boxIdMapRef.current.entries()) {
            if (id === boxId) {
                const scale = scaleRef.current;
                obj.set({
                    left: coords.x * scale,
                    top: coords.y * scale,
                    width: coords.w * scale,
                    height: coords.h * scale
                });
                canvas.requestRenderAll();
                break;
            }
        }
    }, []);

    /**
     * Get current coordinates of a specific box for backend update
     * @param {string} boxId - Backend box ID
     * @returns {Object|null} Current coordinates or null if not found
     */
    const getBoxCoordinates = useCallback((boxId) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) {
            console.log(`Canvas is null when looking for box ${boxId}`);
            return null;
        }

        console.log(`Looking for box with ID: ${boxId}`);
        console.log(`Current canvas has ${canvas.getObjects().length} objects`);
        console.log(`Current boxIdMap entries:`, Array.from(boxIdMapRef.current.entries()));
        console.log(`Canvas objects:`, canvas.getObjects().map(obj => ({
            type: obj.type,
            left: obj.left,
            top: obj.top,
            data: obj.data
        })));

        // Find the fabric object by ID
        for (const [obj, id] of boxIdMapRef.current.entries()) {
            if (id === boxId) {
                console.log(`Found box ${boxId}, returning coordinates`);
                return getOriginalCoordinates(obj);
            }
        }

        console.log(`Box ${boxId} not found in boxIdMap`);
        return null;
    }, [getOriginalCoordinates]);

    // Main effect for canvas lifecycle
    useEffect(() => {
        if (!imageUrl || !imageShape.length) return;

        // Cleanup previous canvas
        cleanup();

        const [imgHeight, imgWidth] = imageShape;
        const canvas = createCanvas(imgWidth, imgHeight);
        fabricCanvasRef.current = canvas;

        // Load background and setup
        loadBackgroundImage(canvas, imageUrl, scaleRef.current);
        setupEventHandlers(canvas);

        // Render detection boxes
        if (detectionBoxes.length > 0) {
            renderDetectionBoxes(canvas, detectionBoxes);
        }

        // Setup add box button
        const addBtn = document.getElementById('addBoxBtn');
        if (addBtn) {
            addBtn.onclick = () => addNewBox();
        }

        // Cleanup on unmount
        return cleanup;
    }, [imageUrl, imageShape, detectionBoxes, createCanvas, loadBackgroundImage, setupEventHandlers, renderDetectionBoxes, addNewBox, cleanup]);

    return {
        canvasContainerRef,
        fabricCanvasRef,
        addNewBox,
        deleteSelected,
        getOriginalCoordinates,
        scaleRef,
        updateCanvasBoxCoordinates,
        getBoxCoordinates,
        boxIdMapRef,
        setupSelectionHandler
    };
}; 