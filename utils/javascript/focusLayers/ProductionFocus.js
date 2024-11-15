import { yearState } from './YearState.js';
import { graphConfig } from '../../../graphs/config/graphConfig.js';

export class ProductionFocus {
    constructor(map, measureContainer) {
        this.map = map;
        this.measureContainer = measureContainer;
        
        // Create a mapping of fuel types to colors from graphConfig
        this.fuelColors = {};
        
        // Map all fuel types to their respective category colors
        Object.entries(graphConfig.fuelTypes).forEach(([category, fuelTypes]) => {
            const color = graphConfig.colors[category];
            if (Array.isArray(fuelTypes)) {
                fuelTypes.forEach(fuelType => {
                    this.fuelColors[fuelType] = color;
                });
            } else {
                this.fuelColors[fuelTypes] = color;
            }
        });
        
        // Precalculate main fuels for all years
        this.initializeProductionData();
        
        // Add listener for year changes
        yearState.addListener((year) => {
            this.updateProductionData(year);
        });
    }

    initializeProductionData() {
        const source = this.map.getSource('plants');
        if (!source) return;

        const data = source._data;
        if (!data || !data.features) return;

        console.log('Initializing production data');

        // Update features with precalculated data for all years
        data.features = data.features.map(feature => {
            const forsyid = feature.properties.forsyid;
            const plantData = window.dataDict?.[forsyid]?.production;
            
            if (plantData) {
                // Store data directly in properties without nesting
                for (let year = 2021; year <= 2023; year++) {
                    const yearData = plantData[year.toString()];
                    if (yearData) {
                        const { mainFuel, totalProduction } = this.calculateProductionStats(yearData);
                        // Store as flat properties with year suffix
                        feature.properties[`mainFuel_${year}`] = mainFuel;
                        feature.properties[`totalProduction_${year}`] = totalProduction;
                    }
                }
            }
            return feature;
        });

        // Debug log to check data
        console.log('Sample feature:', data.features[0]?.properties);
        
        source.setData(data);
    }

    calculateProductionStats(yearData) {
        // Group production by categories
        const categoryProduction = {};
        
        Object.entries(yearData).forEach(([fuel, amount]) => {
            // Find which category this fuel belongs to
            for (const [category, fuelTypes] of Object.entries(graphConfig.fuelTypes)) {
                if ((Array.isArray(fuelTypes) && fuelTypes.includes(fuel)) || fuelTypes === fuel) {
                    categoryProduction[category] = (categoryProduction[category] || 0) + (amount || 0);
                    break;
                }
            }
        });
        
        // Find the main category
        let mainCategory = null;
        let maxProduction = 0;
        let totalProduction = 0;
        
        Object.entries(categoryProduction).forEach(([category, amount]) => {
            totalProduction += amount;
            if (amount > maxProduction) {
                maxProduction = amount;
                mainCategory = category;
            }
        });
        
        // Return the main fuel type from the category
        const mainFuel = Object.entries(graphConfig.fuelTypes)
            .find(([category]) => category === mainCategory)?.[1];
        
        return {
            mainFuel: Array.isArray(mainFuel) ? mainFuel[0] : mainFuel,
            totalProduction
        };
    }

    updateProductionData(year) {
        const effectiveYear = Math.min(Math.max(year, '2021'), '2023');
        
        console.log('Updating production data for year:', effectiveYear);
        
        // Create the match expression for all fuel types
        const matchExpression = ['match', ['get', `mainFuel_${effectiveYear}`]];
        
        // Add all fuel types from the new category structure
        Object.entries(graphConfig.fuelTypes).forEach(([category, fuelTypes]) => {
            if (Array.isArray(fuelTypes)) {
                fuelTypes.forEach(fuel => {
                    matchExpression.push(fuel, graphConfig.colors[category]);
                });
            } else {
                matchExpression.push(fuelTypes, graphConfig.colors[category]);
            }
        });
        
        // Add default color
        matchExpression.push('#888888');
        
        // Set the paint property with the new match expression
        this.map.setPaintProperty('plants-production', 'circle-color', matchExpression);
        
        // Circle radius with significant zoom scaling
        this.map.setPaintProperty('plants-production', 'circle-radius', [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, [  // At zoom level 5 (far out)
                'interpolate',
                ['linear'],
                ['get', `totalProduction_${effectiveYear}`],
                0, 5,
                100000, 15
            ],
            10, [  // At zoom level 10 (medium)
                'interpolate',
                ['linear'],
                ['get', `totalProduction_${effectiveYear}`],
                0, 10,
                100000, 30
            ],
            15, [  // At zoom level 15 (close)
                'interpolate',
                ['linear'],
                ['get', `totalProduction_${effectiveYear}`],
                0, 20,
                100000, 60
            ]
        ]);

        this.map.setPaintProperty('plants-production', 'circle-stroke-width', 2);
        this.map.setPaintProperty('plants-production', 'circle-stroke-color', 'white');
    }

    apply() {
        console.log('Applying production focus');
        this.measureContainer.classList.remove('hidden');
        
        if (this.map.getLayer('plants-price')) {
            this.map.setLayoutProperty('plants-price', 'visibility', 'none');
        }
        
        this.map.setLayoutProperty('plants-production', 'visibility', 'visible');
        this.updateProductionData(yearState.year);
    }

    remove() {
        this.measureContainer.classList.add('hidden');
        this.map.setLayoutProperty('plants-production', 'visibility', 'none');
    }
} 