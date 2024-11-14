import { yearState } from './YearState.js';
import { graphConfig } from '../../../graphs/config/graphConfig.js';

export class ProductionFocus {
    constructor(map, measureContainer) {
        this.map = map;
        this.measureContainer = measureContainer;
        
        // Create a mapping of fuel types to colors from graphConfig
        this.fuelColors = {};
        // Map the lowercase fuel types to their colors from graphConfig
        this.fuelColors = {
            'halm': graphConfig.colors['Halm'],
            'skovflis': graphConfig.colors['Skovflis'],
            'naturgas': graphConfig.colors['Gas'],
            'affald': graphConfig.colors['Affald'],
            'kul': graphConfig.colors['Kul'],
            'elektricitet': graphConfig.colors['Elektricitet'],
            'traepiller': graphConfig.colors['Træpiller'],
            'trae- og biomasseaffald': graphConfig.colors['Træaffald'],
            'omgivelsesvarme': graphConfig.colors['Varmepumper'],
            'braendselsfrit': graphConfig.colors['Varmepumper'],
            'biogas': graphConfig.colors['Biogas']
        };
        
        // Add listener for year changes
        yearState.addListener((year) => {
            this.updateProductionData(year);
        });
    }

    updateProductionData(year) {
        if (!this.map.getLayer('plants-production')) return;
        
        // Update the production visualization based on the year
        // For now, we're just using the main_fuel property, but you could
        // add year-specific logic here
    }

    apply() {
        console.log('Applying production focus');
        this.measureContainer.classList.remove('hidden');
        
        // Debug: Log all features and their main_fuel values
        const features = this.map.getSource('plants')._data.features;
        console.log('Plants with main_fuel:', features.map(f => ({
            forsyid: f.properties.forsyid,
            main_fuel: f.properties.main_fuel
        })));
        
        if (this.map.getLayer('plants-price')) {
            this.map.setLayoutProperty('plants-price', 'visibility', 'none');
        }
        
        this.map.setLayoutProperty('plants-production', 'visibility', 'visible');
    }

    remove() {
        this.measureContainer.classList.add('hidden');
        this.map.setLayoutProperty('plants-production', 'visibility', 'none');
    }
} 