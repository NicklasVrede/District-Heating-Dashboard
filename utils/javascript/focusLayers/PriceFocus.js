import { yearState } from './YearState.js';
import { priceColors } from './colors.js';
import { municipalitiesVisible } from '../municipalitiesFunctions.js';


export class PriceFocus {
    constructor(map, measureContainer) {
        this.map = map;
        this.measureContainer = measureContainer;
        this.priceRankings = null;
        this.priceRanges = {}; // Cache for price ranges by year
        this.legend = null;
        this.lastViewType = null;
        this.lastYear = null;
        
        yearState.addListener((year) => {
            this.updatePriceData();
        });
        
        this.createLegend();
    }

    createLegend() {
        // Create legend container if it doesn't exist
        if (!this.legend) {
            this.legend = document.createElement('div');
            this.legend.className = 'map-legend price-legend';
            this.legend.style.display = 'none';
            this.map.getContainer().appendChild(this.legend);
        }
    }

    updateLegend(priceRange) {
        if (!this.legend) return;

        // Format price values
        const minPrice = Math.round(priceRange.min);
        const maxPrice = Math.round(priceRange.max);
        
        // Store previous values for comparison
        const previousLabels = Array.from(this.legend.querySelectorAll('.legend-label'))
            .map(label => label.textContent);
        
        this.legend.innerHTML = `
            <div class="legend-title">Price per MWh</div>
            <div class="legend-scale">
                <div class="legend-labels">
                    <div class="legend-label">${minPrice} kr</div>
                    <div class="legend-label">${maxPrice} kr</div>
                </div>
                <div class="legend-gradient"></div>
            </div>
        `;

        // Add gradient background to the scale
        const gradientElement = this.legend.querySelector('.legend-gradient');
        gradientElement.style.background = `linear-gradient(to right, 
            ${priceColors.min}, 
            ${priceColors.mid}, 
            ${priceColors.max}
        )`;

        // Animate changed values
        const newLabels = Array.from(this.legend.querySelectorAll('.legend-label'))
            .map(label => label.textContent);
        
        newLabels.forEach((newLabel, index) => {
            if (newLabel !== previousLabels[index]) {
                const label = this.legend.querySelectorAll('.legend-label')[index];
                label.classList.add('pop');
                setTimeout(() => {
                    label.classList.remove('pop');
                }, 200);
            }
        });
    }

    calculatePriceRange(year, features) {
        let minPrice = Infinity;
        let maxPrice = -Infinity;

        features.forEach(feature => {
            // Use lau_1 for municipalities, forsyid for plants
            const id = municipalitiesVisible ? 
                feature.properties.lau_1 : 
                feature.properties.forsyid || 'lau_!';
            
            const price = window.dataDict?.[id]?.prices?.[year]?.mwh_price;
            
            if (price && price > 0) { // Ignore zero or null prices
                minPrice = Math.min(minPrice, price);
                maxPrice = Math.max(maxPrice, price);
            }
        });

        // Cache the range for this year
        this.priceRanges[year] = {
            min: minPrice === Infinity ? 0 : minPrice,
            max: maxPrice === -Infinity ? 2000 : maxPrice // fallback max
        };

        return this.priceRanges[year];
    }

    updatePriceData() {
        try {
            const currentYear = yearState.year;
            const source = municipalitiesVisible ? this.map.getSource('municipalities') : this.map.getSource('plants');
            
            if (!source) {
                console.error(`${municipalitiesVisible ? 'Municipalities' : 'Plants'} source not found`);
                return;
            }

            const data = source._data;
            if (!data || !data.features) {
                console.error('Invalid source data structure');
                return;
            }

            // Force recalculation of price ranges for municipalities
            if (municipalitiesVisible) {
                this.priceRanges = {}; // Clear cache for municipalities view
                this.calculatePriceRange(currentYear, data.features);
            } else if (!this.priceRanges[currentYear] || this.lastViewType !== municipalitiesVisible) {
                this.calculatePriceRange(currentYear, data.features);
            }
            
            // Track the view type
            this.lastViewType = municipalitiesVisible;
            
            // Map features with prices
            data.features = data.features.map(feature => {
                const forsyid = municipalitiesVisible ? 
                    feature.properties.lau_1 : // Use lau_1 for municipalities
                    feature.properties.forsyid || 'lau_!';
                
                feature.properties.current_price = window.dataDict?.[forsyid]?.prices?.[currentYear]?.mwh_price ?? null;
                feature.properties.price_rank = this.priceRankings?.[forsyid]?.rank || 0;
                return feature;
            });
            
            source.setData(data);
            this.updateCircleStyle(currentYear);
        } catch (error) {
            console.error('Error updating price data:', error);
        }
    }

    updateCircleStyle(year) {
        const priceRange = this.priceRanges[year];
        
        if (!municipalitiesVisible) {
            // Update circle color with dynamic range
            this.map.setPaintProperty('plants-price', 'circle-color', [
                'case',
                ['==', ['get', 'current_price'], null],
                priceColors.null,
                [
                    'interpolate',
                    ['linear'],
                    ['get', 'current_price'],
                    priceRange.min, priceColors.min,
                    (priceRange.min + priceRange.max) / 2, priceColors.mid,
                    priceRange.max, priceColors.max
                ]
            ]);

            // Update circle size and stroke
            this.map.setPaintProperty('plants-price', 'circle-radius', [
                'interpolate',
                ['linear'],
                ['zoom'],
                5, 4, 
                10, 12,
                15, 20   
            ]);

            this.map.setPaintProperty('plants-price', 'circle-stroke-width', 2);
            this.map.setPaintProperty('plants-price', 'circle-stroke-color', 'white');
        }
        else {
            // Update fill color for municipalities with the same price logic
            this.map.setPaintProperty('municipalities-price', 'fill-color', [
                'case',
                ['==', ['get', 'current_price'], null],
                priceColors.null,
                [
                    'interpolate',
                    ['linear'],
                    ['get', 'current_price'],
                    priceRange.min, priceColors.min,
                    (priceRange.min + priceRange.max) / 2, priceColors.mid,
                    priceRange.max, priceColors.max
                ]
            ]);
        }

        // Always update the legend, regardless of view type
        this.updateLegend(priceRange);
    }

    remove() {
        console.log('Removing price focus');
        this.measureContainer.classList.add('hidden');
        this.legend.style.display = 'none';
        
        if (!municipalitiesVisible) {
            if (this.map.getLayer('plants-price')) {
                this.map.setLayoutProperty('plants-price', 'visibility', 'none');
            }
        } else {
            if (this.map.getLayer('municipalities-price')) {
                this.map.setLayoutProperty('municipalities-price', 'visibility', 'none');
            }
        }
    }

    apply() {
        this.measureContainer.classList.remove('hidden');
        this.legend.style.display = 'block';
        if (!municipalitiesVisible) {
            if (this.map.getLayer('plants-price')) {
                console.log('Applying price focus');
                this.map.setLayoutProperty('plants-price', 'visibility', 'visible');
            }
        } else {
            if (this.map.getLayer('municipalities-price')) {
                console.log('Price focus applying for municipalities');
                this.map.setLayoutProperty('municipalities-price', 'visibility', 'visible');
            }
        }
        this.updatePriceData();
    }

    updateRankings(year, features) {
        // Create array of price data
        const priceData = features
            .map(feature => {
                const forsyid = feature.properties.forsyid || 'lau_!';
                const price = window.dataDict?.[forsyid]?.prices?.[year]?.mwh_price || 0;
                return { forsyid, price };
            })
            .filter(item => item.price > 0)
            .sort((a, b) => b.price - a.price);
            
        // Create rankings object
        this.priceRankings = {};
        priceData.forEach((item, index) => {
            this.priceRankings[item.forsyid] = {
                rank: index + 1,
                price: item.price,
                total: priceData.length
            };
        });

        this.lastUpdateYear = year;
    }

    // Helper methods for selections
    getTopNByPrice(n) {
        if (!this.priceRankings) return [];
        
        return Object.entries(this.priceRankings)
            .filter(([_, data]) => data.rank <= n)
            .map(([forsyid, _]) => forsyid);
    }

    getBottomNByPrice(n) {
        if (!this.priceRankings) return [];
        
        const totalRanked = Object.values(this.priceRankings)[0]?.total || 0;
        return Object.entries(this.priceRankings)
            .filter(([_, data]) => data.rank > totalRanked - n)
            .map(([forsyid, _]) => forsyid);
    }

    getPricePercentile(percentile) {
        if (!this.priceRankings) return [];
        
        const totalRanked = Object.values(this.priceRankings)[0]?.total || 0;
        const rankThreshold = Math.ceil(totalRanked * (percentile / 100));
        
        return Object.entries(this.priceRankings)
            .filter(([_, data]) => data.rank <= rankThreshold)
            .map(([forsyid, _]) => forsyid);
    }
} 