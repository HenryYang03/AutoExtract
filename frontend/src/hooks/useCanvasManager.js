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

import { useCallback, useEffect, useRef } from 'react';
import * as fabric from 'fabric';

const MAX_CANVAS_WIDTH = 700;

export const useCanvasManager = (imageUrl, imageShape, detectionBoxes, onSelectionChange, onBoxMove) => {
    const canvasContainerRef = useRef(null);
    const fabricCanvasRef = useRef(null);
    const scaleRef = useRef(1);
    const boxIdMapRef = useRef(new Map());

    // Add a flag to prevent effect from running during sync operations
    const isSyncingRef = useRef(false);

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

        const canvas = new fabric.Canvas(canvasEl, {
            selection: true,
            preserveObjectStacking: true,
            width: width * scale,
            height: height * scale,
            renderOnAddRemove: false,  // Prevent auto-render on object changes
            skipTargetFind: false,     // Keep target finding for selection
            enableRetinaScaling: false // Disable retina scaling for better performance
        });

        // Customize control appearance for better visibility
        customizeControls(canvas);

        return canvas;
    }, []);

    /**
     * Customize the appearance of Fabric.js control handles
     * @param {fabric.Canvas} canvas - The canvas instance
     */
    const customizeControls = useCallback((canvas) => {
        // Customize control handle appearance
        fabric.Object.prototype.controls = {
            // Top-left corner - resize and rotate
            tl: new fabric.Control({
                x: -0.5,
                y: -0.5,
                actionHandler: fabric.controlsUtils.scalingEqually,
                cursorStyleHandler: fabric.controlsUtils.scalingCursorStyleHandler,
                render: renderControl,
                actionName: 'scale'
            }),
            // Top-right corner
            tr: new fabric.Control({
                x: 0.5,
                y: -0.5,
                actionHandler: fabric.controlsUtils.scalingEqually,
                cursorStyleHandler: fabric.controlsUtils.scalingCursorStyleHandler,
                render: renderControl,
                actionName: 'scale'
            }),
            // Bottom-left corner
            bl: new fabric.Control({
                x: -0.5,
                y: 0.5,
                actionHandler: fabric.controlsUtils.scalingEqually,
                cursorStyleHandler: fabric.controlsUtils.scalingCursorStyleHandler,
                render: renderControl,
                actionName: 'scale'
            }),
            // Bottom-right corner
            br: new fabric.Control({
                x: 0.5,
                y: 0.5,
                actionHandler: fabric.controlsUtils.scalingEqually,
                cursorStyleHandler: fabric.controlsUtils.scalingCursorStyleHandler,
                render: renderControl,
                actionName: 'scale'
            }),
            // Middle-left - horizontal resize
            ml: new fabric.Control({
                x: -0.5,
                y: 0,
                actionHandler: fabric.controlsUtils.scalingXOrSkewingY,
                cursorStyleHandler: fabric.controlsUtils.scalingCursorStyleHandler,
                render: renderControl,
                actionName: 'scaleX'
            }),
            // Middle-right - horizontal resize
            mr: new fabric.Control({
                x: 0.5,
                y: 0,
                actionHandler: fabric.controlsUtils.scalingXOrSkewingY,
                cursorStyleHandler: fabric.controlsUtils.scalingCursorStyleHandler,
                render: renderControl,
                actionName: 'scaleX'
            }),
            // Middle-top - vertical resize
            mt: new fabric.Control({
                x: 0,
                y: -0.5,
                actionHandler: fabric.controlsUtils.scalingYOrSkewingX,
                cursorStyleHandler: fabric.controlsUtils.scalingCursorStyleHandler,
                render: renderControl,
                actionName: 'scaleY'
            }),
            // Middle-bottom - vertical resize
            mb: new fabric.Control({
                x: 0,
                y: 0.5,
                actionHandler: fabric.controlsUtils.scalingYOrSkewingX,
                cursorStyleHandler: fabric.controlsUtils.scalingCursorStyleHandler,
                render: renderControl,
                actionName: 'scaleY'
            }),
            // Rotation handle
            mtr: new fabric.Control({
                x: 0,
                y: -0.7,
                actionHandler: fabric.controlsUtils.rotationWithSnapping,
                cursorStyleHandler: fabric.controlsUtils.rotationCursorStyleHandler,
                offsetY: -30,
                render: renderControl,
                actionName: 'rotate'
            })
        };
    }, []);

    /**
     * Custom render function for control handles
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} left - Left position
     * @param {number} top - Top position
     * @param {fabric.Control} control - The control instance
     */
    const renderControl = useCallback((ctx, left, top, control) => {
        const size = 8; // Smaller size for better precision
        const halfSize = size / 2;

        // Draw a filled circle with border
        ctx.save();
        ctx.beginPath();
        ctx.arc(left, top, halfSize, 0, 2 * Math.PI);

        // Fill with white for better visibility
        ctx.fillStyle = 'white';
        ctx.fill();

        // Add a colored border based on control type
        if (control.actionName === 'rotate') {
            ctx.strokeStyle = '#0066cc'; // Blue for rotation
        } else {
            ctx.strokeStyle = '#cc6600'; // Orange for resize
        }
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
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
        console.log('=== RENDERING DETECTION BOXES ===');
        console.log('Canvas objects before rendering:', canvas.getObjects().length);
        console.log('Box ID map before rendering:', Array.from(boxIdMapRef.current.entries()));
        console.log('Detection boxes to render:', detectionBoxes);

        const scale = scaleRef.current;

        detectionBoxes.forEach((box, index) => {
            console.log(`Rendering box ${index}:`, box);
            const x1 = box.x1 * scale;
            const y1 = box.y1 * scale;
            const width = (box.x2 - box.x1) * scale;
            const height = (box.y2 - box.y1) * scale;
            createDetectionBox(canvas, x1, y1, width, height, box.label, box.id);
        });

        console.log('Canvas objects after rendering:', canvas.getObjects().length);
        console.log('Box ID map after rendering:', Array.from(boxIdMapRef.current.entries()));
        console.log('=== FINISHED RENDERING ===');
    }, [createDetectionBox]);

    /**
     * Track which boxes have been modified since last sync
     */
    const modifiedBoxesRef = useRef(new Set());

    /**
     * Mark a box as modified
     */
    const markBoxAsModified = useCallback((boxId) => {
        modifiedBoxesRef.current.add(boxId);
        console.log(`Marked box ${boxId} as modified`);
    }, []);

    /**
     * Clear modification tracking
     */
    const clearModifiedTracking = useCallback(() => {
        modifiedBoxesRef.current.clear();
        console.log('Cleared modification tracking');
    }, []);

    /**
     * Get box ID from fabric object
     * @param {fabric.Object} obj - Fabric object
     * @returns {string|null} Box ID or null if not found
     */
    const getBoxIdFromObject = useCallback((obj) => {
        for (const [fabricObj, boxId] of boxIdMapRef.current.entries()) {
            if (fabricObj === obj) {
                return boxId;
            }
        }
        return null;
    }, []);

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

        // Track box modifications
        canvas.on('object:modified', e => {
            const obj = e.target;
            const boxId = getBoxIdFromObject(obj);
            if (boxId) {
                markBoxAsModified(boxId);
                console.log(`Box ${boxId} was modified (moved/resized)`);
            }
        });

        // Track when objects start being modified
        canvas.on('object:moving', e => {
            const obj = e.target;
            const boxId = getBoxIdFromObject(obj);
            if (boxId) {
                markBoxAsModified(boxId);
            }
        });

        canvas.on('object:scaling', e => {
            const obj = e.target;
            const boxId = getBoxIdFromObject(obj);
            if (boxId) {
                markBoxAsModified(boxId);
            }
        });
    }, [onSelectionChange, getBoxIdFromObject, markBoxAsModified]);

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
        console.log('=== CLEANUP STARTED ===');
        console.log('Canvas objects before cleanup:', fabricCanvasRef.current?.getObjects().length || 'No canvas');
        console.log('Box ID map before cleanup:', Array.from(boxIdMapRef.current.entries()));

        if (fabricCanvasRef.current) {
            fabricCanvasRef.current.dispose();
            fabricCanvasRef.current = null;
        }
        if (canvasContainerRef.current) {
            canvasContainerRef.current.innerHTML = '';
        }
        boxIdMapRef.current.clear(); // Clear the ID mapping on cleanup

        console.log('=== CLEANUP COMPLETED ===');
        console.log('Box ID map after cleanup:', Array.from(boxIdMapRef.current.entries()));
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
     * @param {string} label - Box category label (defaults to 'bar')
     */
    const addNewBox = useCallback((x = 100, y = 50, width = 120, height = 60, label = 'bar') => {
        const canvas = fabricCanvasRef.current;
        if (canvas) {
            // Create a temporary ID for the new box
            const tempId = `temp_${Date.now()}`;
            console.log(`Creating new box with temporary ID: ${tempId} and label: ${label}`);

            // Create the box on canvas
            createDetectionBox(canvas, x, y, width, height, label, tempId);

            // Verify the mapping was created
            console.log(`Box ID mapping after creation:`, Array.from(boxIdMapRef.current.entries()));

            // Return the box data for backend processing
            const scale = scaleRef.current;
            return {
                x1: x / scale,
                y1: y / scale,
                x2: (x + width) / scale,
                y2: (y + height) / scale,
                label: label  // Use the provided label, not hardcoded 'bar'
            };
        }
        return null;
    }, [createDetectionBox]);

    /**
     * Delete the currently selected object
     */
    const deleteSelected = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const obj = canvas.getActiveObject();
        if (obj) {
            // Get the box ID before removing it
            let boxId = null;
            for (const [fabricObj, id] of boxIdMapRef.current.entries()) {
                if (fabricObj === obj) {
                    boxId = id;
                    break;
                }
            }

            // Remove from ID mapping
            boxIdMapRef.current.delete(obj);
            canvas.remove(obj);
            canvas.requestRenderAll();
            if (onSelectionChange) onSelectionChange(null);

            return boxId; // Return the box ID that was deleted
        }
        return null;
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

    /**
     * Get only modified box coordinates for smart sync
     * @returns {Array} Array of objects with boxId and coords for modified boxes only
     */
    const getModifiedBoxCoordinates = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) {
            console.log('Canvas is null when getting modified box coordinates');
            return [];
        }

        const coordinates = [];

        // Only get coordinates for modified boxes
        for (const [obj, boxId] of boxIdMapRef.current.entries()) {
            if (modifiedBoxesRef.current.has(boxId)) {
                try {
                    const scale = scaleRef.current;
                    const left = obj.left || 0;
                    const top = obj.top || 0;

                    // Use getScaledWidth/getScaledHeight for accurate dimensions after resizing
                    const width = obj.getScaledWidth ? obj.getScaledWidth() : (obj.width || 0);
                    const height = obj.getScaledHeight ? obj.getScaledHeight() : (obj.height || 0);

                    // Convert to original image coordinates and x1,y1,x2,y2 format
                    const x1 = Math.round(left / scale);
                    const y1 = Math.round(top / scale);
                    const x2 = Math.round((left + width) / scale);
                    const y2 = Math.round((top + height) / scale);

                    coordinates.push({
                        boxId: boxId,
                        coords: { x1, y1, x2, y2 },
                        label: obj.data?.label || 'bar'
                    });

                    console.log(`Including modified box ${boxId} in sync with coords:`, { x1, y1, x2, y2 });
                } catch (error) {
                    console.error(`Error getting coordinates for modified box ${boxId}:`, error);
                }
            } else {
                console.log(`Skipping unmodified box ${boxId} in sync`);
            }
        }

        console.log(`Captured coordinates for ${coordinates.length} modified boxes`);
        return coordinates;
    }, []);

    /**
     * Get current coordinates of ALL boxes for backend sync
     * Simple approach: just capture final state of all boxes
     * @returns {Array} Array of objects with boxId and coords in x1,y1,x2,y2 format
     */
    const getAllBoxCoordinates = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) {
            console.log('Canvas is null when getting box coordinates');
            return [];
        }

        const coordinates = [];

        // Get current coordinates of ALL boxes
        for (const [obj, boxId] of boxIdMapRef.current.entries()) {
            try {
                const scale = scaleRef.current;
                const left = obj.left || 0;
                const top = obj.top || 0;

                // Use getScaledWidth/getScaledHeight for accurate dimensions after resizing
                const width = obj.getScaledWidth ? obj.getScaledWidth() : (obj.width || 0);
                const height = obj.getScaledHeight ? obj.getScaledHeight() : (obj.height || 0);

                // Convert to original image coordinates and x1,y1,x2,y2 format
                const x1 = Math.round(left / scale);
                const y1 = Math.round(top / scale);
                const x2 = Math.round((left + width) / scale);
                const y2 = Math.round((top + height) / scale);

                coordinates.push({
                    boxId: boxId,
                    coords: { x1, y1, x2, y2 },
                    label: obj.data?.label || 'bar' // Include label for new box registration
                });
            } catch (error) {
                console.error(`Error getting coordinates for box ${boxId}:`, error);
            }
        }

        console.log(`Captured final coordinates for ${coordinates.length} boxes`);
        console.log('Final coordinates:', coordinates);
        return coordinates;
    }, []);

    /**
     * Update box ID mapping after new boxes are registered with backend
     * @param {Array} newBoxMappings - Array of {oldId, newId} mappings
     */
    const updateBoxIds = useCallback((newBoxMappings) => {
        if (!newBoxMappings || newBoxMappings.length === 0) return;

        console.log('Updating box ID mappings:', newBoxMappings);

        // Find fabric objects with old IDs and update their mappings
        for (const [obj, oldId] of boxIdMapRef.current.entries()) {
            const mapping = newBoxMappings.find(m => m.oldId === oldId);
            if (mapping) {
                // Update the mapping to use the new backend ID
                boxIdMapRef.current.delete(obj);
                boxIdMapRef.current.set(obj, mapping.newId);
                console.log(`Updated box ID mapping: ${oldId} -> ${mapping.newId}`);

                // Also update the object's data to reflect the new permanent ID
                if (obj.data) {
                    obj.data.permanentId = mapping.newId;
                }
            }
        }
    }, []);

    /**
     * No-op function for compatibility (no longer tracking modifications)
     */
    const clearModifiedBoxes = useCallback(() => {
        console.log('No modification tracking to clear - using final state capture');
    }, []);

    // Main effect for canvas lifecycle
    useEffect(() => {
        // Skip effect execution if we're in the middle of a sync operation
        if (isSyncingRef.current) {
            console.log('=== useCanvasManager effect SKIPPED - sync in progress ===');
            return;
        }

        const timestamp = Date.now();
        console.log(`=== useCanvasManager effect triggered at ${timestamp} ===`);
        console.log('Parameters:', { imageUrl, imageShape, detectionBoxesCount: detectionBoxes.length });
        console.log('Detection boxes:', detectionBoxes);
        console.log('Effect dependencies changed:', { imageUrl: !!imageUrl, imageShape: !!imageShape, detectionBoxesCount: detectionBoxes.length });

        if (!imageUrl || !imageShape.length) {
            console.log('Missing required data, skipping canvas creation');
            return;
        }

        console.log('Starting canvas setup...');
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
            console.log(`Rendering ${detectionBoxes.length} detection boxes:`, detectionBoxes);
            renderDetectionBoxes(canvas, detectionBoxes);
        } else {
            console.log('No detection boxes to render');
        }

        // Setup add box button
        const addBtn = document.getElementById('addBoxBtn');
        if (addBtn) {
            addBtn.onclick = () => addNewBox();
        }

        console.log(`Canvas setup complete at ${timestamp}`);
        // Cleanup on unmount
        return cleanup;
    }, [imageUrl, imageShape, detectionBoxes, createCanvas, loadBackgroundImage, setupEventHandlers, renderDetectionBoxes, addNewBox, cleanup]);

    /**
     * Set sync flag to prevent effect from running during sync operations
     */
    const setSyncing = useCallback((syncing) => {
        isSyncingRef.current = syncing;
        console.log(`Sync flag set to: ${syncing}`);
    }, []);

    return {
        canvasContainerRef,
        fabricCanvasRef,
        addNewBox,
        deleteSelected,
        getOriginalCoordinates,
        scaleRef,
        updateCanvasBoxCoordinates,
        getBoxCoordinates,
        getAllBoxCoordinates,
        getModifiedBoxCoordinates,
        clearModifiedBoxes,
        clearModifiedTracking,
        updateBoxIds,
        boxIdMapRef,
        setupSelectionHandler,
        setSyncing
    };
}; 