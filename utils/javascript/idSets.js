import { getCachedData } from './dataManager.js';

// Initialize sets for storing IDs
export const allPlantIds = new Set();
export const allMunicipalityIds = new Set();

// Function to initialize ID sets from data
export function initializeIdSets() {
    const dataDict = getCachedData();
    if (!dataDict) {
        console.warn('Cannot initialize ID sets: No data available');
        return;
    }

    // Clear existing sets
    allPlantIds.clear();
    allMunicipalityIds.clear();

    // Populate sets from data
    Object.keys(dataDict).forEach(id => {
        const paddedId = id.padStart(8, '0');
        if (dataDict[id].type === 'plant') {
            allPlantIds.add(paddedId);
        } else if (dataDict[id].type === 'municipality') {
            allMunicipalityIds.add(paddedId);
        }
    });

} 