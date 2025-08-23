/**
 * Centralized application state management
 * Uses React hooks for state management
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing application state
 * @returns {Object} Application state and actions
 */
export const useAppStore = () => {
    // File upload state
    const [uploadState, setUploadState] = useState('idle');
    const [filename, setFilename] = useState('');
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isCalculatingHeights, setIsCalculatingHeights] = useState(false);

    // Image and detection state
    const [imageUrl, setImageUrl] = useState('');
    const [imageShape, setImageShape] = useState([]);
    const [detectionBoxes, setDetectionBoxes] = useState([]);
    const [componentStatus, setComponentStatus] = useState({});

    // Value editor state
    const [originValue, setOriginValue] = useState('');
    const [ymaxValue, setYmaxValue] = useState('');
    const [originConversionError, setOriginConversionError] = useState(false);
    const [ymaxConversionError, setYmaxConversionError] = useState(false);

    // Selection state
    const [selectedInfo, setSelectedInfo] = useState(null);
    const [pendingCategoryChanges, setPendingCategoryChanges] = useState(new Map());

    // Results state
    const [heightResults, setHeightResults] = useState(null);

    // Actions
    const updateUploadState = useCallback((newState) => {
        setUploadState(newState);
    }, []);

    const updateFilename = useCallback((newFilename) => {
        setFilename(newFilename);
    }, []);

    const updateError = useCallback((newError) => {
        setError(newError);
    }, []);

    const updateImageData = useCallback((url, shape) => {
        setImageUrl(url);
        setImageShape(shape);
    }, []);

    const updateDetectionBoxes = useCallback((boxes) => {
        setDetectionBoxes(boxes);
    }, []);

    const updateComponentStatus = useCallback((status) => {
        setComponentStatus(status);
    }, []);

    const updateValues = useCallback((origin, ymax, originError, ymaxError) => {
        setOriginValue(origin);
        setYmaxValue(ymax);
        setOriginConversionError(originError);
        setYmaxConversionError(ymaxError);
    }, []);

    const updateSelection = useCallback((info) => {
        setSelectedInfo(info);
    }, []);

    const updatePendingCategoryChanges = useCallback((changes) => {
        setPendingCategoryChanges(changes);
    }, []);

    const updateHeightResults = useCallback((results) => {
        setHeightResults(results);
    }, []);

    const clearAll = useCallback(() => {
        setUploadState('idle');
        setFilename('');
        setError('');
        setIsUploading(false);
        setIsCalculatingHeights(false);
        setImageUrl('');
        setImageShape([]);
        setDetectionBoxes([]);
        setComponentStatus({});
        setOriginValue('');
        setYmaxValue('');
        setOriginConversionError(false);
        setYmaxConversionError(false);
        setSelectedInfo(null);
        setPendingCategoryChanges(new Map());
        setHeightResults(null);
    }, []);

    // Computed values
    const hasDetections = useMemo(() => detectionBoxes.length > 0, [detectionBoxes]);
    const canCalculateHeights = useMemo(() => {
        return componentStatus.status === 'ready';
    }, [componentStatus]);

    // State object
    const state = {
        uploadState,
        filename,
        error,
        isUploading,
        isCalculatingHeights,
        imageUrl,
        imageShape,
        detectionBoxes,
        componentStatus,
        originValue,
        ymaxValue,
        originConversionError,
        ymaxConversionError,
        selectedInfo,
        pendingCategoryChanges,
        heightResults,
        hasDetections,
        canCalculateHeights
    };

    // Actions object
    const actions = {
        updateUploadState,
        updateFilename,
        updateError,
        updateImageData,
        updateDetectionBoxes,
        updateComponentStatus,
        updateValues,
        updateSelection,
        updatePendingCategoryChanges,
        updateHeightResults,
        clearAll
    };

    return { state, actions };
};
