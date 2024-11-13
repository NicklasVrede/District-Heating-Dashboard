import { createOrUpdatePlotlyGraph } from '../../../graphs/components/multiPlant.js';

export class DefaultFocus {
    constructor(map, measureContainer) {
        this.map = map;
        this.measureContainer = measureContainer;
    }

    apply() {
        console.log('DefaultFocus applying with focus: none');
        
        // Reset to default visualization state
        if (this.map) {
            this.map.setLayoutProperty('plants', 'visibility', 'visible');
            this.map.setLayoutProperty('plants-price', 'visibility', 'none');
        }
        
        // Hide measure container
        if (this.measureContainer) {
            this.measureContainer.classList.remove('visible');
            this.measureContainer.classList.add('hidden');
        }

        // Hide year slider container
        const yearSliderContainer = document.getElementById('year-slider-container');
        if (yearSliderContainer) {
            yearSliderContainer.style.display = 'none';
        }

        const data = window.dataDict;
        const selectedForsyids = Array.from(window.selectionSet);
        
        if (data && selectedForsyids.length > 0) {
            console.log('DefaultFocus: Calling createOrUpdatePlotlyGraph with none focus');
            createOrUpdatePlotlyGraph(data, selectedForsyids, 'none');
        }
    }
} 