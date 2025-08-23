/**
 * Synchronization service for detection boxes
 * Handles all sync operations between frontend canvas and backend
 */

import { updateBoxCoordinates, updateBoxCategory, addNewBox } from './apiService';

/**
 * Sync all detection boxes to backend
 * @param {Array} allCoordinates - Array of all box coordinates from canvas
 * @param {Map} pendingCategoryChanges - Map of pending category changes
 * @returns {Promise<Object>} Sync results
 */
export const syncAllBoxes = async (allCoordinates, pendingCategoryChanges = new Map()) => {
    try {
        console.log(`Starting sync: ${allCoordinates.length} boxes, ${pendingCategoryChanges.size} category changes`);

        // Step 1: Register new boxes first
        const results = [];
        for (const { boxId, coords, label = 'bar' } of allCoordinates) {
            try {
                if (boxId.startsWith('temp_')) {
                    // New box - register with backend
                    console.log(`Registering new box: ${boxId} as ${label}`);
                    const boxData = { x1: coords.x1, y1: coords.y1, x2: coords.x2, y2: coords.y2, label };
                    console.log('Sending box data to backend:', boxData);

                    const result = await addNewBox(boxData);
                    console.log('Backend response:', result);

                    if (result.success) {
                        results.push({
                            boxId,
                            success: true,
                            isNew: true,
                            newBoxId: result.box_id,
                            componentStatus: result.component_status,
                            detectionBoxes: result.detection_boxes
                        });
                        console.log(`Successfully registered: ${boxId} -> ${result.box_id}`);
                    } else {
                        throw new Error(`Failed to register new box: ${result.error}`);
                    }
                } else {
                    // Existing box - update coordinates
                    console.log(`Updating coordinates for: ${boxId}`);
                    const result = await updateBoxCoordinates(boxId, coords);

                    results.push({
                        boxId,
                        success: true,
                        isNew: false,
                        componentStatus: result.component_status,
                        detectionBoxes: result.detection_boxes
                    });
                }
            } catch (error) {
                console.error(`Failed to sync box ${boxId}:`, error);
                results.push({ boxId, success: false, error: error.message });
            }
        }

        // Check for failures
        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
            throw new Error(`${failed.length} box(es) failed to sync`);
        }

        // Step 2: Apply category changes using permanent IDs
        if (pendingCategoryChanges.size > 0) {
            console.log(`Applying ${pendingCategoryChanges.size} category changes...`);

            // Create mapping from temporary to permanent IDs
            const tempToPermMap = new Map();
            results.filter(r => r.isNew).forEach(r => {
                tempToPermMap.set(r.boxId, r.newBoxId);
            });

            for (const [boxId, newCategory] of pendingCategoryChanges.entries()) {
                const actualBoxId = tempToPermMap.has(boxId) ? tempToPermMap.get(boxId) : boxId;
                console.log(`Changing category: ${boxId} -> ${newCategory} (using ID: ${actualBoxId})`);

                const result = await updateBoxCategory(actualBoxId, newCategory);
                if (result.success) {
                    // Update the results with the latest component status and detection boxes
                    const lastResult = results[results.length - 1];
                    if (lastResult) {
                        lastResult.componentStatus = result.component_status;
                        lastResult.detectionBoxes = result.detection_boxes;
                    }
                }
            }
        }

        // Get final state from last successful operation
        const finalResult = results[results.length - 1];

        return {
            success: true,
            syncedBoxes: results.length,
            categoryChanges: pendingCategoryChanges.size,
            newBoxes: results.filter(r => r.isNew).map(r => ({ oldId: r.boxId, newId: r.newBoxId })),
            componentStatus: finalResult?.componentStatus || null,
            detectionBoxes: finalResult?.detectionBoxes || null,
            message: `Successfully synced ${results.length} boxes and ${pendingCategoryChanges.size} category changes`
        };

    } catch (error) {
        console.error('Sync operation failed:', error);
        throw error;
    }
};

/**
 * Validate coordinates before sync
 */
export const validateCoordinatesForSync = (coordinates) => {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
        return { valid: false, error: 'No coordinates provided for sync' };
    }

    const invalidBoxes = coordinates.filter(({ boxId, coords }) => {
        if (!boxId || !coords) return true;
        if (!coords.x1 || !coords.y1 || !coords.x2 || !coords.y2) return true;
        if (coords.x2 <= coords.x1 || coords.y2 <= coords.y1) return true;
        return false;
    });

    if (invalidBoxes.length > 0) {
        return {
            valid: false,
            error: `${invalidBoxes.length} box(es) have invalid coordinates`,
            invalidBoxes
        };
    }

    return { valid: true };
};

/**
 * Prepare coordinates for sync
 */
export const prepareCoordinatesForSync = (coordinates) => {
    return coordinates.map(({ boxId, coords, label }) => ({
        boxId,
        coords: {
            x1: Math.round(coords.x1 || 0),
            y1: Math.round(coords.y1 || 0),
            x2: Math.round(coords.x2 || 0),
            y2: Math.round(coords.y2 || 0)
        },
        label: label || 'bar'
    }));
};
