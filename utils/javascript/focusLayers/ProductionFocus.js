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
        let totalProduction = 0;
        let mainFuel = null;
        let maxProduction = 0;

        Object.entries(yearData).forEach(([fuel, amount]) => {
            const productionAmount = amount || 0;
            totalProduction += productionAmount;
            
            if (productionAmount > maxProduction) {
                maxProduction = productionAmount;
                mainFuel = fuel;
            }
        });

        return { mainFuel, totalProduction };
    }

    updateProductionData(year) {
        const effectiveYear = Math.min(Math.max(year, '2021'), '2023');
        
        console.log('Updating production data for year:', effectiveYear);
        
        // Update circle color based on flat properties
        this.map.setPaintProperty('plants-production', 'circle-color', [
            'match',
            ['get', `mainFuel_${effectiveYear}`],
            'halm', this.fuelColors['halm'],
            'skovflis', this.fuelColors['skovflis'],
            'naturgas', this.fuelColors['naturgas'],
            'affald', this.fuelColors['affald'],
            'kul', this.fuelColors['kul'],
            'elektricitet', this.fuelColors['elektricitet'],
            'traepiller', this.fuelColors['traepiller'],
            'trae- og biomasseaffald', this.fuelColors['trae- og biomasseaffald'],
            'omgivelsesvarme', this.fuelColors['omgivelsesvarme'],
            'braendselsfrit', this.fuelColors['braendselsfrit'],
            'biogas', this.fuelColors['biogas'],
            '#888888'
        ]);

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