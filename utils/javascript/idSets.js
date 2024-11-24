// Export the sets so they can be used in other files
export const allPlantIds = new Set();
export const allMunicipalityIds = new Set();

export function initializeIdSets() {
    if (!window.dataDict) return;
    
    // Clear existing sets
    allPlantIds.clear();
    allMunicipalityIds.clear();
    
    // Populate sets based on type in data_dict
    Object.entries(window.dataDict).forEach(([id, data]) => {
        if (data.type === 'plant') {
            allPlantIds.add(id);
        } else if (data.type === 'municipality') {
            allMunicipalityIds.add(id);
        }
    });
    
    console.log(`Initialized with ${allPlantIds.size} plants and ${allMunicipalityIds.size} municipalities`);
} 