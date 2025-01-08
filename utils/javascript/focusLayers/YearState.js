class YearStateClass {
    constructor() {
        const maxYear = '2024';
        this._year = Math.min(new Date().getFullYear(), parseInt(maxYear)).toString();
        this._listeners = new Set();
        this._visible = false;
        this._wheelEventListener = null;
        this._updateGraphCallback = null;
        
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
            // Remove existing wheel event listener if it exists
            if (this._wheelEventListener) {
                container.removeEventListener('wheel', this._wheelEventListener);
            }

            // Create new wheel event listener
            this._wheelEventListener = (e) => {
                e.preventDefault();
                
                const currentYear = parseInt(this._year);
                const minYear = parseInt(slider.min);
                const maxYear = parseInt(slider.max);
                
                const delta = e.deltaY > 0 ? -1 : 1;
                const newYear = Math.min(Math.max(currentYear + delta, minYear), maxYear);
                
                if (newYear !== currentYear) {
                    // Update both the slider value and yearState
                    slider.value = newYear.toString();
                    this.year = newYear.toString();
                    
                    // Update the year label
                    label.textContent = newYear.toString();
                    
                    // Update the graphs using the imported function
                    if (this.updateGraphCallback) {
                        this.updateGraphCallback();
                    }
                }
            };

            // Add the wheel event listener
            container.addEventListener('wheel', this._wheelEventListener, { passive: false });
            
            // Ensure max year is 2024
            slider.max = '2024';
            
            // Set initial values
            slider.value = this._year;
            label.textContent = this._year;

            // Remove any existing event listeners
            const newSlider = slider.cloneNode(true);
            slider.parentNode.replaceChild(newSlider, slider);

            // Add event listener for slider changes
            newSlider.addEventListener('input', (e) => {
                const selectedYear = e.target.value;
                label.textContent = selectedYear;
                this.year = selectedYear;
                // Update the graphs using the imported function
                if (this.updateGraphCallback) {
                    this.updateGraphCallback();
                }
            });

            // Set initial visibility
            this.visible = this._visible;
        }
    }

    // Method to set the update graph callback
    setUpdateGraphCallback(callback) {
        this.updateGraphCallback = callback;
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

    // Add cleanup method
    cleanup() {
        const container = document.getElementById('year-slider-container');
        if (this._wheelEventListener && container) {
            container.removeEventListener('wheel', this._wheelEventListener);
            this._wheelEventListener = null;
        }
    }
}

// Create and export the instance immediately
const yearState = new YearStateClass();
export { yearState };

// Separate the graph update setup into a new function
export function initializeYearState(updateGraphFn) {
    yearState.setUpdateGraphCallback(updateGraphFn);
} 