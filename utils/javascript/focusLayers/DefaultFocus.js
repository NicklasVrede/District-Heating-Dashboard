export class DefaultFocus {
    constructor(map, measureContainer) {
        this.map = map;
        this.measureContainer = measureContainer;
    }

    apply() {
        this.map.setLayoutProperty('plants', 'visibility', 'visible');
        this.map.setLayoutProperty('plants-price', 'visibility', 'none');
        this.measureContainer.classList.add('hidden');
    }
} 