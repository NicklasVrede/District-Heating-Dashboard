import { yearState } from './YearState.js';
import { priceColors } from './colors.js';
import { municipalitiesVisible } from '../municipalitiesFunctions.js';
import { allPlantIds, allMunicipalityIds } from '../../../main.js';
import { MainFuelManager } from './MainFuelManager.js';

export class PriceFocus {
    constructor(map, measureContainer) {
        this.map = map;
        this.measureContainer = measureContainer;
        this.priceRankings = null;
        this.priceRanges = {};
        this.legend = null;
        this.lastViewType = null;
        this.lastYear = null;
        this.mainFuelManager = MainFuelManager.getInstance(map);
        
        yearState.addListener((year) => {
            this.updatePriceData();
        });
        
        this.mainFuelManager.addDataUpdateListener(() => {
            this.updatePriceData();
        });
        
        this.createLegend();
    }

    createLegend() {
        if (!this.legend) {
            this.legend = document.createElement('div');
            this.legend.className = 'map-legend price-legend';
            this.legend.style.display = 'none';
            this.map.getContainer().appendChild(this.legend);
        }
    }

    updateLegend(priceRange) {
        if (!this.legend) return;

        const minPrice = Math.round(priceRange.min);
        const maxPrice = Math.round(priceRange.max);
        
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

        const gradientElement = this.legend.querySelector('.legend-gradient');
        gradientElement.style.background = `linear-gradient(to right, 
            ${priceColors.min}, 
            ${priceColors.mid}, 
            ${priceColors.max}
        )`;

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
            const id = municipalitiesVisible ? 
                feature.properties.lau_1.padStart(8, '0') : 
                feature.properties.forsyid.padStart(8, '0');
            
            const price = window.dataDict?.[id]?.prices?.[year]?.mwh_price;
            
            if (price && price > 0) {
                minPrice = Math.min(minPrice, price);
                maxPrice = Math.max(maxPrice, price);
            }
        });

        this.priceRanges[year] = {
            min: minPrice === Infinity ? 0 : minPrice,
            max: maxPrice === -Infinity ? 2000 : maxPrice
        };

        return this.priceRanges[year];
    }

    updatePriceData() {
        try {
            const currentYear = yearState.year;
            
            const source = municipalitiesVisible ? 
                this.map.getSource('municipalities') : 
                this.map.getSource('plants');
            
            if (!source) return;

            const data = source._data;
            if (!data || !data.features) return;

            if (municipalitiesVisible) {
                this.priceRanges = {};
                this.calculatePriceRange(currentYear, data.features);
                this.updateRankings(currentYear, data.features);
            } else if (!this.priceRanges[currentYear] || this.lastViewType !== municipalitiesVisible) {
                this.calculatePriceRange(currentYear, data.features);
                this.updateRankings(currentYear, data.features);
            }
            
            this.lastViewType = municipalitiesVisible;
            
            data.features = data.features.map(feature => {
                const id = municipalitiesVisible ? 
                    feature.properties.lau_1 : 
                    feature.properties.forsyid;
                
                const priceData = window.dataDict?.[id]?.prices?.[currentYear]?.mwh_price ?? null;
                feature.properties.current_price = priceData;
                feature.properties.price_rank = this.priceRankings?.[id]?.rank || 0;
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
            this.map.setPaintProperty('municipalities-price', 'fill-color', [
                'case',
                ['any',
                    ['==', ['string', ['get', 'forsyids']], ''],  // No plants
                    ['all',
                        ['!=', ['string', ['get', 'forsyids']], ''],  // Has plants
                        ['==', ['get', 'current_price'], null]  // But no price data
                    ]
                ],
                '#404040',
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

        this.updateLegend(priceRange);
    }

    remove() {
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
                this.map.setLayoutProperty('plants-price', 'visibility', 'visible');
            }
        } else {
            if (this.map.getLayer('municipalities-price')) {
                this.map.setLayoutProperty('municipalities-price', 'visibility', 'visible');
            }
        }
        this.updatePriceData();
    }

    updateRankings(year) {
        const relevantIds = municipalitiesVisible ? 
            Array.from(allMunicipalityIds).map(id => id.padStart(8, '0')) : 
            Array.from(allPlantIds).map(id => id.padStart(8, '0'));
        
        const priceData = relevantIds
            .map(id => {
                const price = window.dataDict?.[id]?.prices?.[year]?.mwh_price || 0;
                return { id, price };
            })
            .filter(item => item.price > 0)
            .sort((a, b) => b.price - a.price);
            
        this.priceRankings = {};
        priceData.forEach((item, index) => {
            this.priceRankings[item.id] = {
                rank: index + 1,
                price: item.price,
                total: priceData.length
            };
        });

        this.lastUpdateYear = year;
    }

    getTopNByPrice(n) {
        if (!this.priceRankings) return [];
        
        const relevantIds = municipalitiesVisible ? 
            new Set(Array.from(allMunicipalityIds).map(id => id.padStart(8, '0'))) : 
            new Set(Array.from(allPlantIds).map(id => id.padStart(8, '0')));
        
        return Object.entries(this.priceRankings)
            .filter(([id, _]) => relevantIds.has(id))
            .filter(([_, data]) => data.rank <= n)
            .map(([id, _]) => id);
    }

    getBottomNByPrice(n) {
        if (!this.priceRankings) return [];
        
        const relevantIds = municipalitiesVisible ? 
            new Set(Array.from(allMunicipalityIds).map(id => id.padStart(8, '0'))) : 
            new Set(Array.from(allPlantIds).map(id => id.padStart(8, '0')));
        
        const totalRanked = Object.values(this.priceRankings)[0]?.total || 0;
        
        return Object.entries(this.priceRankings)
            .filter(([id, _]) => relevantIds.has(id))
            .filter(([_, data]) => data.rank > totalRanked - n)
            .map(([id, _]) => id);
    }

    getPricePercentile(percentile) {
        if (!this.priceRankings) return [];
        
        const totalRanked = Object.values(this.priceRankings)[0]?.total || 0;
        const rankThreshold = Math.ceil(totalRanked * (percentile / 100));
        
        return Object.entries(this.priceRankings)
            .filter(([_, data]) => data.rank <= rankThreshold)
            .map(([forsyid, _]) => forsyid);
    }

    getAllByPrice() {
        if (!this.priceRankings) return [];
        
        const relevantIds = municipalitiesVisible ? allMunicipalityIds : allPlantIds;
        
        return Object.entries(this.priceRankings)
            .filter(([id, _]) => relevantIds.has(id))
            .map(([id, _]) => id);
    }

    showNoDataMessage() {
        if (!municipalitiesVisible) {
            if (this.map.getLayer('plants-price')) {
                this.map.setPaintProperty('plants-price', 'circle-color', priceColors.null);
            }
        } else {
            if (this.map.getLayer('municipalities-price')) {
                this.map.setPaintProperty('municipalities-price', 'fill-color', priceColors.null);
            }
        }

        if (this.legend) {
            this.legend.innerHTML = `
                <div class="legend-title">Price per MWh</div>
                <div class="legend-scale">
                    <div class="legend-labels">
                        <div class="legend-label">No price data before 2019 (yet)</div>
                    </div>
                </div>
            `;
        }
    }
} 