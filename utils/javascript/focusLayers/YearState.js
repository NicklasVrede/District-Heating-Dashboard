class YearStateClass {
    constructor() {
        const maxYear = '2024';
        this._year = Math.min(new Date().getFullYear(), parseInt(maxYear)).toString();
        this._listeners = new Set();
        this._visible = false;
        
        // Initialize the slider once DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeSlider();
        });
    }

    initializeSlider() {
        const slider = document.getElementById('year-slider');
        const label = document.getElementById('year-label');
        const container = document.getElementById('year-slider-container');
        
        if (slider && label && container) {
            // Ensure max year is 2024
            slider.max = '2024';
            
            // Set initial values
            slider.value = this._year;
            label.textContent = this._year;

            // Add event listener for slider changes
            slider.addEventListener('input', (e) => {
                const newYear = e.target.value;
                label.textContent = newYear;
                this.year = newYear; // This will trigger the listeners
            });

            // Set initial visibility
            this.visible = this._visible;
        }
    }

    get year() {
        return this._year;
    }

    set year(newYear) {
        this._year = newYear;
        this._updateDOMElements();
        this._notifyListeners();
    }

    get visible() {
        return this._visible;
    }

    set visible(isVisible) {
        this._visible = isVisible;
        this._updateVisibility();
    }

    _updateDOMElements() {
        const slider = document.getElementById('year-slider');
        const label = document.getElementById('year-label');
        if (slider) slider.value = this._year;
        if (label) label.textContent = this._year;
    }

    _updateVisibility() {
        const container = document.getElementById('year-slider-container');
        if (container) {
            container.classList.toggle('visible', this._visible);
            container.classList.toggle('hidden', !this._visible);
        }
    }

    addListener(callback) {
        this._listeners.add(callback);
    }

    removeListener(callback) {
        this._listeners.delete(callback);
    }

    _notifyListeners() {
        this._listeners.forEach(callback => callback(this._year));
    }
}

export const yearState = new YearStateClass(); 