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
import { uploadImageForAnalysis, updateValues, updateBoxCoordinates, calculateHeights } from '../services/apiService';

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

        setSelectedInfo({
            label: target.data?.label || '',
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
     * Manually sync coordinates for the currently selected box
     */
    const handleSyncCoordinates = useCallback(async () => {
        if (!selectedInfo || !selectedInfo.boxId) {
            setError('No box selected for coordinate sync');
            return;
        }

        try {
            // Get current coordinates from the canvas using the box ID
            const currentCoords = canvasManager.getBoxCoordinates(selectedInfo.boxId);
            if (!currentCoords) {
                setError('Could not get current box coordinates');
                return;
            }

            // Update coordinates on the backend using the box ID
            await updateBoxCoordinates(selectedInfo.boxId, currentCoords.coords);

            // Update local selection info
            setSelectedInfo(prev => ({
                ...prev,
                coords: currentCoords.coords
            }));

            setError(''); // Clear any previous errors
        } catch (error) {
            setError(`Failed to sync coordinates: ${error.message}`);
            console.error('Coordinate sync error:', error);
        }
    }, [selectedInfo, canvasManager]);

    /**
     * Handle adding a new box
     */
    const handleAddBox = useCallback(() => {
        canvasManager.addNewBox();
    }, []);

    /**
     * Handle deleting the selected box
     */
    const handleDeleteBox = useCallback(() => {
        canvasManager.deleteSelected();
    }, []);

    // useEffect(() => { // This useEffect is no longer needed
    //     return () => {
    //         // No debounce timeout to clear
    //     };
    // }, []);

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
                    onAddBox={handleAddBox}
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
                            onAddBox={handleAddBox}
                            onSyncCoordinates={handleSyncCoordinates}
                        />
                    }
                >
                </CanvasViewer>
            </div>
        </div>
    );
};

export default BarAnalyzer;