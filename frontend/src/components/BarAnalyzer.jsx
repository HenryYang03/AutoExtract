/**
 * BarAnalyzer Component
 * 
 * Main component for bar graph analysis. Orchestrates file upload,
 * image analysis, and interactive canvas viewing. Uses modular
 * components for better separation of concerns.
 */

import React, { useState, useCallback, useEffect } from 'react';

// Custom hooks
import { useCanvasManager } from '../hooks/useCanvasManager';

// Services
import { uploadImageForAnalysis, updateValues, calculateHeights, updateBoxCategory, removeBox } from '../services/apiService';
import { syncAllBoxes, validateCoordinatesForSync, prepareCoordinatesForSync } from '../services/syncService';

// Components
import FileUpload from './FileUpload';
import ValueEditor from './ValueEditor';
import SelectionInfo from './SelectionInfo';
import CanvasViewer from './CanvasViewer';

const BarAnalyzer = () => {
    // File upload state
    const [file, setFile] = useState(null);
    const [filename, setFilename] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    // Analysis results state
    const [detectionBoxes, setDetectionBoxes] = useState([]);
    const [imageShape, setImageShape] = useState([]);
    const [imageUrl, setImageUrl] = useState('');

    // Value editing state
    const [originValue, setOriginValue] = useState('');
    const [ymaxValue, setYmaxValue] = useState('');
    const [originConversionError, setOriginConversionError] = useState('');
    const [ymaxConversionError, setYmaxConversionError] = useState('');
    const [isUpdatingValues, setIsUpdatingValues] = useState(false);

    // Selection state
    const [selectedInfo, setSelectedInfo] = useState(null);

    // Track pending category changes separately from movement tracking
    const [pendingCategoryChanges, setPendingCategoryChanges] = useState(new Map());

    // Height calculation state
    const [isCalculatingHeights, setIsCalculatingHeights] = useState(false);
    const [heightResults, setHeightResults] = useState(null);

    // Component status state
    const [componentStatus, setComponentStatus] = useState({
        present_components: {},
        missing_components: [],
        all_components_ready: false
    });

    /**
     * Handle file selection change
     * @param {File|null} newFile - Selected file or null to clear
     */
    const handleFileChange = useCallback((newFile) => {
        setFile(newFile);
        setFilename(newFile?.name || '');
        setError('');

        // Clear previous analysis results
        if (!newFile) {
            setDetectionBoxes([]);
            setImageShape([]);
            setImageUrl('');
            setOriginValue('');
            setYmaxValue('');
            setOriginConversionError('');
            setYmaxConversionError('');
            setSelectedInfo(null);
            setHeightResults(null); // Clear height results
            setPendingCategoryChanges(new Map()); // Clear pending category changes
            setComponentStatus({
                present_components: {},
                missing_components: [],
                all_components_ready: false
            });
        }
    }, []);

    /**
     * Handle file upload and analysis
     */
    const handleUpload = useCallback(async () => {
        if (!file) return;

        setIsUploading(true);
        setError('');

        try {
            const data = await uploadImageForAnalysis(file);

            // Update state with analysis results
            setDetectionBoxes(data.detection_boxes || []);
            setImageShape(data.image_shape || []);
            setImageUrl(data.image_url || '');
            setOriginValue(data.origin_value || '');
            setYmaxValue(data.ymax_value || '');
            setOriginConversionError(data.origin_conversion_error || '');
            setYmaxConversionError(data.ymax_conversion_error || '');
            setSelectedInfo(null);
            setPendingCategoryChanges(new Map()); // Clear pending category changes

            // Clear previous calculation results for new image
            setHeightResults(null);

            // Set component status
            setComponentStatus(data.component_status || {
                present_components: {},
                missing_components: [],
                all_components_ready: false
            });

        } catch (err) {
            setError(err.message || 'Failed to analyze image');
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);
        }
    }, [file]);

    /**
     * Handle value updates (origin/ymax)
     * @param {Object} values - Object containing origin_value and ymax_value
     */
    const handleValueUpdate = useCallback(async (values) => {
        setIsUpdatingValues(true);

        try {
            const data = await updateValues(values);

            // Update local state with confirmed values
            setOriginValue(data.origin_value);
            setYmaxValue(data.ymax_value);

            // Update component status if provided
            if (data.component_status) {
                setComponentStatus(data.component_status);
            }

            // Clear conversion errors since values are now valid
            setOriginConversionError('');
            setYmaxConversionError('');

        } catch (err) {
            setError(`Failed to update values: ${err.message}`);
            console.error('Value update error:', err);
        } finally {
            setIsUpdatingValues(false);
        }
    }, []);

    /**
     * Handle height calculation request
     */
    const handleCalculateHeights = useCallback(async () => {
        setIsCalculatingHeights(true);
        setError('');

        try {
            const data = await calculateHeights();

            if (data.success && data.results) {
                setHeightResults(data.results);
                setError(''); // Clear any previous errors
            } else {
                throw new Error('Invalid response from height calculation');
            }

        } catch (err) {
            setError(`Failed to calculate heights: ${err.message}`);
            console.error('Height calculation error:', err);
        } finally {
            setIsCalculatingHeights(false);
        }
    }, []);

    /**
     * Handle box movement and coordinate updates
     * @param {string} boxId - Backend box ID
     * @param {Object} coords - New coordinates {x, y, w, h}
     */
    const handleBoxMove = useCallback(async (boxId, coords) => {
        // This function is no longer used for automatic tracking
        // Coordinates are now updated manually when needed
    }, []);

    // Initialize canvas manager first
    const canvasManager = useCanvasManager(
        imageUrl,
        imageShape,
        detectionBoxes,
        null, // We'll set this after initialization
        handleBoxMove
    );

    /**
     * Handle canvas selection changes - defined after canvasManager
     * @param {fabric.Object|null} target - Selected fabric object or null
     */
    const handleSelectionChange = useCallback((target) => {
        if (!target) {
            setSelectedInfo(null);
            return;
        }

        // Get coordinates in original image space
        const scale = canvasManager.scaleRef.current;
        const left = target.left || 0;
        const top = target.top || 0;
        const width = target.getScaledWidth ? target.getScaledWidth() : (target.width || 0) * (target.scaleX || 1);
        const height = target.getScaledHeight ? target.getScaledHeight() : (target.height || 0) * (target.scaleY || 1);

        // Get the box ID from the canvas manager's ID mapping
        let boxId = '';
        for (const [obj, id] of canvasManager.boxIdMapRef.current.entries()) {
            if (obj === target) {
                boxId = id;
                break;
            }
        }

        // Check if there are pending category changes for this box
        const pendingCategory = pendingCategoryChanges.get(boxId);
        const displayLabel = pendingCategory || target.data?.label || '';

        setSelectedInfo({
            label: displayLabel,
            boxId: boxId,  // Store the actual box ID
            coords: {
                x: Math.round(left / scale),
                y: Math.round(top / scale),
                w: Math.round(width / scale),
                h: Math.round(height / scale)
            }
        });
    }, [canvasManager]);

    // Set up the selection change handler after canvas manager is initialized
    useEffect(() => {
        if (canvasManager && canvasManager.setupSelectionHandler) {
            canvasManager.setupSelectionHandler(handleSelectionChange);
        }
    }, [canvasManager, handleSelectionChange]);

    /**
     * Handle syncing all detection boxes to the backend
     */
    const handleSyncCoordinates = useCallback(async () => {
        try {
            setError(''); // Clear any previous errors

            // CRITICAL FIX: Collect coordinates BEFORE setting sync flag
            // This prevents coordinate functions from reading stale canvas data during sync
            const modifiedCoordinates = canvasManager.getModifiedBoxCoordinates();
            const allCoordinates = canvasManager.getAllBoxCoordinates();
            const newBoxCoordinates = allCoordinates.filter(box => box.boxId.startsWith('temp_'));

            // CRITICAL FIX: Filter out new boxes from modified coordinates to prevent duplication
            // New boxes should only be processed once, not as both new AND modified
            const filteredModifiedCoordinates = modifiedCoordinates.filter(modifiedBox =>
                !newBoxCoordinates.some(newBox => newBox.boxId === modifiedBox.boxId)
            );

            // Combine filtered modified and new box coordinates
            const coordinatesToSync = [...filteredModifiedCoordinates, ...newBoxCoordinates];

            console.log(`Modified coordinates: ${modifiedCoordinates.length}, New coordinates: ${newBoxCoordinates.length}`);
            console.log(`Filtered modified coordinates: ${filteredModifiedCoordinates.length}`);
            console.log(`Total coordinates to sync: ${coordinatesToSync.length}`);

            if (coordinatesToSync.length === 0) {
                console.log('No boxes to sync');
                return;
            }

            // NOW set sync flag to prevent useCanvasManager effect from running during sync
            canvasManager.setSyncing(true);
            console.log('=== SYNC: Started - setSyncing(true) ===');

            // Validate coordinates before sync
            const validation = validateCoordinatesForSync(coordinatesToSync);
            if (!validation.valid) {
                setError(validation.error);
                canvasManager.setSyncing(false); // Reset sync flag
                return;
            }

            // Prepare coordinates for sync
            const preparedCoordinates = prepareCoordinatesForSync(coordinatesToSync);

            // Perform the sync operation
            const syncResult = await syncAllBoxes(preparedCoordinates, pendingCategoryChanges);

            if (syncResult.success) {
                console.log('Sync successful:', syncResult.message);
                setError(''); // Clear any previous errors

                // Clear pending category changes after successful sync
                setPendingCategoryChanges(new Map());

                // Handle new box IDs if any boxes were registered during sync
                if (syncResult.newBoxes && syncResult.newBoxes.length > 0) {
                    console.log('New boxes registered during sync:', syncResult.newBoxes);
                    // Update canvas manager with new box IDs
                    canvasManager.updateBoxIds(syncResult.newBoxes);
                }

                // Update component status if provided (important for yaxis/xaxis detection)
                if (syncResult.componentStatus) {
                    console.log('Updating component status after sync:', syncResult.componentStatus);
                    setComponentStatus(syncResult.componentStatus);
                } else {
                    console.warn('No component status received from sync!');
                }

                // Update detection boxes state with backend data (important for category persistence)
                if (syncResult.detectionBoxes) {
                    console.log('=== SYNC: Updating detection boxes state ===');
                    console.log('Current detectionBoxes count:', detectionBoxes.length);
                    console.log('New detectionBoxes from backend:', syncResult.detectionBoxes);
                    console.log('New detectionBoxes count:', syncResult.detectionBoxes.length);

                    // Don't manually clear the canvas - let the useCanvasManager effect handle re-rendering
                    // This ensures proper cleanup and prevents duplicate boxes
                    setDetectionBoxes(syncResult.detectionBoxes);
                    console.log('=== SYNC: setDetectionBoxes called ===');
                } else {
                    console.warn('No detection boxes received from sync!');
                }

                // Clear modification tracking after successful sync
                canvasManager.clearModifiedTracking();

                // Update coordinates in selection info if a box is selected
                if (selectedInfo && selectedInfo.boxId) {
                    const updatedCoords = canvasManager.getBoxCoordinates(selectedInfo.boxId);
                    if (updatedCoords && updatedCoords.coords) {
                        setSelectedInfo(prev => ({
                            ...prev,
                            coords: updatedCoords.coords
                        }));
                    }
                }

                // Reset sync flag after successful sync
                canvasManager.setSyncing(false);
                console.log('=== SYNC: Completed - setSyncing(false) ===');
            }
        } catch (error) {
            console.error('Sync failed:', error);
            setError(`Sync failed: ${error.message}`);

            // Reset sync flag on error
            canvasManager.setSyncing(false);
            console.log('=== SYNC: Failed - setSyncing(false) ===');
        }
    }, [canvasManager, pendingCategoryChanges, selectedInfo]);

    /**
     * Clear pending category changes (useful for canceling unsaved changes)
     */
    const clearPendingChanges = useCallback(() => {
        if (pendingCategoryChanges.size > 0) {
            console.log(`Clearing ${pendingCategoryChanges.size} pending category changes`);
            setPendingCategoryChanges(new Map());

            // Reset selectedInfo label to original if it was changed
            if (selectedInfo && selectedInfo.boxId) {
                const originalBox = detectionBoxes.find(box => box.id === selectedInfo.boxId);
                if (originalBox) {
                    setSelectedInfo(prev => ({
                        ...prev,
                        label: originalBox.label
                    }));
                }
            }
        }
    }, [pendingCategoryChanges, selectedInfo, detectionBoxes]);

    /**
     * Handle adding a new box
     */
    const handleAddBox = useCallback(async () => {
        try {
            // Get the new box from canvas manager (creates box on canvas with temporary ID)
            const newBoxData = canvasManager.addNewBox();

            if (newBoxData) {
                console.log('New box added to canvas with temporary ID. Use "Sync" to register with backend.');
                setError(''); // Clear any previous errors

                // Don't call backend API immediately - let the sync process handle it
                // This ensures the temporary ID is properly managed during sync
            }
        } catch (error) {
            setError(`Failed to add new box: ${error.message}`);
            console.error('Add box error:', error);
        }
    }, [canvasManager]);

    /**
     * Handle deleting the selected box
     */
    const handleDeleteBox = useCallback(async () => {
        if (!selectedInfo || !selectedInfo.boxId) {
            setError('No box selected for deletion');
            return;
        }

        try {
            // Remove the box from the backend
            const result = await removeBox(selectedInfo.boxId);

            // Update detection boxes state with backend response to prevent duplicates
            if (result.detection_boxes) {
                console.log('Updating detection boxes after deletion:', result.detection_boxes);
                setDetectionBoxes(result.detection_boxes);
            }

            // Only update component status if provided
            if (result.component_status) {
                setComponentStatus(result.component_status);
            }

            // Remove the box from the canvas
            const deletedBoxId = canvasManager.deleteSelected();

            // Verify the deleted box ID matches the selected box ID
            if (deletedBoxId !== selectedInfo.boxId) {
                console.warn(`Box ID mismatch: deleted ${deletedBoxId}, expected ${selectedInfo.boxId}`);
            }

            // Clear selection
            setSelectedInfo(null);

            setError(''); // Clear any previous errors
        } catch (error) {
            setError(`Failed to remove box: ${error.message}`);
            console.error('Remove box error:', error);
        }
    }, [selectedInfo, canvasManager]);

    /**
     * Handle changing the category of a box
     * @param {string} boxId - The box ID to change
     * @param {string} newCategory - The new category
     * @param {boolean} applyImmediately - Whether to apply immediately or store for later sync
     */
    const handleCategoryChange = useCallback((boxId, newCategory, applyImmediately = false) => {
        if (!boxId || !newCategory) {
            setError('Invalid box ID or category');
            return;
        }

        if (applyImmediately) {
            // Apply category change immediately (for immediate sync scenarios)
            handleCategoryChangeImmediate(boxId, newCategory);
        } else {
            // Store category change for later sync
            setPendingCategoryChanges(prev => {
                const newMap = new Map(prev);
                newMap.set(boxId, newCategory);
                console.log(`Stored pending category change for ${boxId}: ${newCategory}`);
                return newMap;
            });

            // CRITICAL FIX: Update the canvas object's label immediately
            // This ensures the correct label is sent during sync
            if (canvasManager.fabricCanvasRef.current) {
                const canvas = canvasManager.fabricCanvasRef.current;
                for (const [obj, id] of canvasManager.boxIdMapRef.current.entries()) {
                    if (id === boxId) {
                        if (obj.data) {
                            obj.data.label = newCategory;
                            console.log(`Updated canvas object label for ${boxId}: ${newCategory}`);
                        }
                        break;
                    }
                }
            }

            // Mark the box as modified for category change
            if (boxId.startsWith('temp_')) {
                // For new boxes, we can't mark as modified yet since they don't have a permanent ID
                console.log(`Category change for new box ${boxId} will be applied during sync`);
            } else {
                // For existing boxes, mark as modified
                console.log(`Marking existing box ${boxId} as modified due to category change`);
            }

            // Update local display
            setSelectedInfo(prev => ({
                ...prev,
                label: newCategory
            }));
        }
    }, [canvasManager]);

    /**
     * Apply category change immediately to backend
     */
    const handleCategoryChangeImmediate = useCallback(async (boxId, newCategory) => {
        try {
            const result = await updateBoxCategory(boxId, newCategory);

            // Don't update detection boxes state - keep canvas state intact
            // This preserves any modified boxes that haven't been synced yet

            // Only update component status if provided
            if (result.component_status) {
                setComponentStatus(result.component_status);
            }

            // Remove from pending changes
            setPendingCategoryChanges(prev => {
                const newMap = new Map(prev);
                newMap.delete(boxId);
                return newMap;
            });

            setError(''); // Clear any previous errors
        } catch (error) {
            setError(`Failed to change category: ${error.message}`);
            console.error('Category change error:', error);
        }
    }, []);

    // Debug: Log when detection boxes change
    useEffect(() => {
        console.log('Detection boxes updated:', detectionBoxes);
    }, [detectionBoxes]);

    return (
        <div className="container-fluid">
            <div className="row">
                {/* Left: File upload section */}
                <FileUpload
                    onUpload={handleUpload}
                    onFileChange={handleFileChange}
                    onCalculateHeights={handleCalculateHeights}
                    filename={filename}
                    error={error}
                    isUploading={isUploading}
                    isCalculating={isCalculatingHeights}
                    heightResults={heightResults}
                    hasDetections={detectionBoxes.length > 0}
                    originConversionError={originConversionError}
                    ymaxConversionError={ymaxConversionError}
                    componentStatus={componentStatus}
                />

                {/* Right: Canvas viewer section */}
                <CanvasViewer
                    canvasContainerRef={canvasManager.canvasContainerRef}
                    selectedInfo={selectedInfo}
                    valueEditor={
                        <ValueEditor
                            originValue={originValue}
                            ymaxValue={ymaxValue}
                            originConversionError={originConversionError}
                            ymaxConversionError={ymaxConversionError}
                            onUpdate={handleValueUpdate}
                            isUpdating={isUpdatingValues}
                            hasDetections={detectionBoxes.length > 0}
                        />
                    }
                    selectionInfo={
                        <SelectionInfo
                            selectedInfo={selectedInfo}
                            onDelete={handleDeleteBox}
                            onSyncCoordinates={handleSyncCoordinates}
                            onCategoryChange={handleCategoryChange}
                            onAddBox={handleAddBox}
                            pendingChanges={pendingCategoryChanges.size}
                        />
                    }
                >
                </CanvasViewer>
            </div>
        </div>
    );
};

export default BarAnalyzer;