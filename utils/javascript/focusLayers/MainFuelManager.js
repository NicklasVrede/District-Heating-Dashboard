import { yearState } from './YearState.js';
import { municipalitiesVisible } from '../municipalitiesFunctions.js';

export class MainFuelManager {
    static instance = null;

    static getInstance(map) {
        if (!MainFuelManager.instance) {
            MainFuelManager.instance = new MainFuelManager(map);
        }
        return MainFuelManager.instance;
    }

    constructor(map) {
        if (MainFuelManager.instance) {
            return MainFuelManager.instance;
        }
        
        this.map = map;
        this.dataUpdateListeners = new Set();
        
        // Initialize with current year
        this.updateMainFuel(yearState.year);
        
        // Add listener for year changes
        yearState.addListener((year) => {
            this.updateMainFuel(year);
        });

        MainFuelManager.instance = this;
    }

    addDataUpdateListener(callback) {
        this.dataUpdateListeners.add(callback);
    }

    removeDataUpdateListener(callback) {
        this.dataUpdateListeners.delete(callback);
    }

    calculateMainFuel(yearData) {
        if (!yearData) return 'unknown';
        
        // Find main fuel type based on highest production
        let maxProduction = 0;
        let mainFuel = 'unknown';
        
        Object.entries(yearData).forEach(([fuel, amount]) => {
            // Skip varmeprod and elprod in the calculation
            if (fuel !== 'varmeprod' && fuel !== 'elprod') {
                if (amount > maxProduction) {
                    maxProduction = amount;
                    mainFuel = fuel;
                }
            }
        });
        
        return mainFuel;
    }

    updateMainFuel(year) {
        const effectiveYear = Math.min(Math.max(year, '2000'), '2023');
        
        // Update both plants and municipality centroids
        ['plants', 'municipality-centroids'].forEach(sourceId => {
            const source = this.map.getSource(sourceId);
            if (!source) return;

            const data = source._data;
            if (!data || !data.features) return;

            data.features = data.features.map(feature => {
                const id = sourceId === 'municipality-centroids' ? 
                    feature.properties.lau_1.padStart(8, '0') : 
                    feature.properties.forsyid.padStart(8, '0');
                
                const plantData = window.dataDict?.[id]?.production;
                
                if (plantData && plantData[effectiveYear]) {
                    const yearData = plantData[effectiveYear];
                    feature.properties.currentMainFuel = this.calculateMainFuel(yearData);
                }
                return feature;
            });

            source.setData(data);
        });

        // Notify listeners after data update
        this.dataUpdateListeners.forEach(callback => callback());
    }
} 