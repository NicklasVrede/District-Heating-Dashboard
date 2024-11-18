import { yearState } from './YearState.js';
import { graphConfig } from '../../../graphs/config/graphConfig.js';

export class ProductionFocus {
    constructor(map, measureContainer) {
        this.map = map;
        this.measureContainer = measureContainer;
        this.legend = null;
        
        // Create a mapping of fuel types to colors from graphConfig (fallback)
        this.fuelColors = {};
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
        
        // Load icons before initializing
        this.loadIcons().then(() => {
            this.initializeProductionData();
            
            // Add listener for year changes after icons are loaded
            yearState.addListener((year) => {
                this.updateProductionData(year);
            });
        });
        
        this.createLegend();
    }

    async loadIcons() {
        try {
            const iconPromises = Object.keys(graphConfig.fuelTypes).map(category => {
                return new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => {
                        // Convert category name to kebab-case for file naming
                        const iconId = `icon-${category.toLowerCase().replace(/ & /g, '-').replace(/[, ]/g, '-')}`;
                        this.map.addImage(iconId, image);
                        resolve();
                    };  
                    image.onerror = () => {
                        console.warn(`Failed to load icon for ${category}, will use color fallback`);
                        resolve(); // Resolve anyway to continue loading
                    };
                    // Adjust path to match your icon filenames
                    image.src = `/assets/icons/${category.toLowerCase().replace(/ & /g, '-').replace(/[, ]/g, '-')}.png`;
                });
            });
            
            await Promise.all(iconPromises);
        } catch (error) {
            console.error('Error loading icons:', error);
        }
    }

    initializeProductionData() {
        const source = this.map.getSource('plants');
        if (!source) return;

        const data = source._data;
        if (!data || !data.features) return;

        data.features = data.features.map(feature => {
            const forsyid = feature.properties.forsyid;
            const plantData = window.dataDict?.[forsyid]?.production;
            
            if (plantData) {
                for (let year = 2021; year <= 2023; year++) {
                    const yearData = plantData[year.toString()];
                    if (yearData) {
                        feature.properties[`totalProduction_${year}`] = 
                            Object.values(yearData).reduce((sum, val) => sum + (val || 0), 0);
                        
                        // Find main fuel type
                        let maxProduction = 0;
                        let mainFuel = 'unknown';
                        
                        Object.entries(yearData).forEach(([fuel, amount]) => {
                            if (amount > maxProduction) {
                                maxProduction = amount;
                                mainFuel = fuel;
                            }
                        });
                        
                        feature.properties[`mainFuel_${year}`] = mainFuel;
                    }
                }
            }
            return feature;
        });

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
        
        // Check if icons are loaded
        const hasIcons = Object.keys(graphConfig.fuelTypes).some(category => 
            this.map.hasImage(`icon-${category.toLowerCase().replace(/ & /g, '-').replace(/[, ]/g, '-')}`)
        );

        if (hasIcons) {
            // Convert to symbol layer if not already
            if (this.map.getLayer('plants-production').type !== 'symbol') {
                this.map.removeLayer('plants-production');
                this.map.addLayer({
                    'id': 'plants-production',
                    'type': 'symbol',
                    'source': 'plants',
                    'layout': {
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true,
                        'icon-size': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            5, 0.25,
                            10, 0.75,
                            15, 1  
                        ]
                    }
                });
            }

            // Use icons
            this.map.setLayoutProperty('plants-production', 'icon-image', [
                'match',
                ['get', `mainFuel_${effectiveYear}`],
                ...Object.entries(graphConfig.fuelTypes).flatMap(([category, fuelTypes]) => {
                    const iconId = `icon-${category.toLowerCase().replace(/ & /g, '-').replace(/[, ]/g, '-')}`;
                    if (Array.isArray(fuelTypes)) {
                        return fuelTypes.flatMap(fuel => [fuel, iconId]);
                    }
                    return [fuelTypes, iconId];
                }),
                'icon-default' // fallback icon
            ]);
        } else {
            // Fallback to colored circles
            if (this.map.getLayer('plants-production').type !== 'circle') {
                this.map.removeLayer('plants-production');
                this.map.addLayer({
                    'id': 'plants-production',
                    'type': 'circle',
                    'source': 'plants'
                });
            }

            // Use original color-based styling
            const matchExpression = ['match', ['get', `mainFuel_${effectiveYear}`]];
            Object.entries(graphConfig.fuelTypes).forEach(([category, fuelTypes]) => {
                if (Array.isArray(fuelTypes)) {
                    fuelTypes.forEach(fuel => {
                        matchExpression.push(fuel, graphConfig.colors[category]);
                    });
                } else {
                    matchExpression.push(fuelTypes, graphConfig.colors[category]);
                }
            });
            matchExpression.push('#888888'); // default color

            this.map.setPaintProperty('plants-production', 'circle-color', matchExpression);
            
            // Original circle radius logic
            this.map.setPaintProperty('plants-production', 'circle-radius', [
                'interpolate',
                ['linear'],
                ['zoom'],
                5, [
                    'interpolate',
                    ['linear'],
                    ['get', `totalProduction_${effectiveYear}`],
                    0, 5,
                    100000, 15
                ],
                15, [
                    'interpolate',
                    ['linear'],
                    ['get', `totalProduction_${effectiveYear}`],
                    0, 20,
                    100000, 60
                ]
            ]);
        }
    }

    createLegend() {
        if (!this.legend) {
            this.legend = document.createElement('div');
            this.legend.className = 'map-legend production-legend';
            this.legend.style.display = 'none';
            this.map.getContainer().appendChild(this.legend);
        }
    }

    updateLegend() {
        if (!this.legend) return;

        // Check if icons are loaded
        const hasIcons = Object.keys(graphConfig.fuelTypes).some(category => 
            this.map.hasImage(`icon-${category.toLowerCase().replace(/ & /g, '-').replace(/[, ]/g, '-')}`)
        );

        this.legend.innerHTML = `
            <div class="legend-title">Main Fuel</div>
            <div class="legend-items">
                ${Object.entries(graphConfig.fuelTypes).map(([category, _]) => {
                    const iconId = category.toLowerCase().replace(/ & /g, '-').replace(/[, ]/g, '-');
                    if (hasIcons) {
                        return `
                            <div class="legend-item">
                                <img 
                                    src="/assets/icons/${iconId}.png" 
                                    class="legend-icon" 
                                    alt="${category}"
                                />
                                <span class="legend-label">${category}</span>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="legend-item">
                                <div 
                                    class="legend-color" 
                                    style="background-color: ${graphConfig.colors[category]}"
                                ></div>
                                <span class="legend-label">${category}</span>
                            </div>
                        `;
                    }
                }).join('')}
            </div>
        `;
    }

    apply() {
        console.log('Applying production focus');
        this.measureContainer.classList.remove('hidden');
        this.legend.style.display = 'block';  // Show legend
        
        if (this.map.getLayer('plants-price')) {
            this.map.setLayoutProperty('plants-price', 'visibility', 'none');
        }
        
        this.map.setLayoutProperty('plants-production', 'visibility', 'visible');
        this.updateProductionData(yearState.year);
        this.updateLegend();  // Update legend
    }

    remove() {
        this.measureContainer.classList.add('hidden');
        this.legend.style.display = 'none';  // Hide legend
        this.map.setLayoutProperty('plants-production', 'visibility', 'none');
    }

    getTopNByProduction(n, measureType) {
        console.log(`Getting top ${n} plants for ${measureType}`);
        const plants = this.getPlantData();
        const ranked = this.rankPlantsByProduction(plants, measureType);
        const result = ranked.slice(0, n).map(plant => plant.id);
        console.log('Selected plants:', result);
        return result;
    }

    getBottomNByProduction(n, measureType) {
        console.log(`Getting bottom ${n} plants for ${measureType}`);
        const plants = this.getPlantData();
        const ranked = this.rankPlantsByProduction(plants, measureType);
        const result = ranked.slice(-n).map(plant => plant.id);
        console.log('Selected plants:', result);
        return result;
    }

    rankPlantsByProduction(plants, measureType) {
        console.log('Ranking plants for measure:', measureType);
        
        if (!Array.isArray(plants)) {
            console.warn('Plants data is not an array:', plants);
            return [];
        }

        const year = '2023';
        const fuelTypes = this.getFuelTypesForMeasure(measureType);
        console.log('Using fuel types for ranking:', fuelTypes);

        // Debug: Log a sample of the data structure
        if (plants.length > 0) {
            console.log('Sample plant data structure:', {
                id: plants[0].id,
                name: plants[0].name,
                production: plants[0].production?.[year]
            });
        }

        const filteredPlants = plants.filter(plant => {
            if (!plant.production || !plant.production[year]) {
                console.log(`Plant ${plant.id} - No production data for ${year}`);
                return false;
            }

            const totalProduction = fuelTypes.reduce((sum, fuelType) => {
                const value = plant.production[year][fuelType];
                if (value && value > 0) {
                    console.log(`Plant ${plant.id} - ${plant.name} - ${fuelType}: ${value}`);
                }
                return sum + (value || 0);
            }, 0);

            if (totalProduction > 0) {
                plant.totalProduction = totalProduction;
                console.log(`Plant ${plant.id} - ${plant.name} - Total ${measureType} production: ${totalProduction}`);
                return true;
            }
            return false;
        });

        console.log(`Found ${filteredPlants.length} plants with ${measureType} production in ${year}`);

        const sortedPlants = filteredPlants.sort((a, b) => {
            return b.totalProduction - a.totalProduction;
        });

        // Log the top results
        if (sortedPlants.length > 0) {
            console.log('Top plants by production:');
            sortedPlants.slice(0, 5).forEach(plant => {
                console.log(`${plant.name}: ${plant.totalProduction}`);
            });
        } else {
            console.log('No plants found with production data');
        }

        return sortedPlants;
    }

    getPlantData() {
        const dataDict = window.dataDict;
        console.log('Raw dataDict:', dataDict);
        
        if (!dataDict) {
            console.warn('No plant data available');
            return [];
        }

        const plantsArray = Object.entries(dataDict).map(([id, plant]) => ({
            id,
            ...plant
        }));
        
        console.log('Converted plants array:', plantsArray);
        return plantsArray;
    }

    getFuelTypesForMeasure(measureType) {
        const fuelTypes = {
            'gas': ['naturgas', 'lpg', 'raffinaderigas'],
            'olie': ['fuelolie', 'gasolie', 'spildolie'],
            'bioaffald': ['spildolie', 'trae- og biomasseaffald'],
            'biomasse': ['skovflis', 'traepiller'],
            'biogas': ['biogas', 'bio-olie'],
            'el': ['elektricitet'],
            'solvarme': ['solenergi'],
            'braendselsfrit': ['braendselsfrit', 'omgivelsesvarme', 'vandkraft']
        };

        const types = fuelTypes[measureType] || [measureType];
        console.log(`Measure type: ${measureType} -> Fuel types:`, types);
        return types;
    }

    getAllByProduction(measureType) {
        console.log(`Getting all plants with ${measureType} production`);
        const plants = this.getPlantData();
        const year = '2023';
        
        if (measureType === 'all') {
            // For 'all', we want to get plants with any production
            const filteredPlants = plants.filter(plant => {
                if (!plant.production || !plant.production[year]) {
                    return false;
                }

                // Check if plant has any non-zero production value
                const hasProduction = Object.values(plant.production[year]).some(value => value > 0);
                
                if (hasProduction) {
                    console.log(`Including plant ${plant.id} - ${plant.name}`);
                }
                
                return hasProduction;
            });

            console.log(`Found ${filteredPlants.length} total plants with any production`);
            return filteredPlants.map(plant => plant.id);
        }

        // For specific measure types
        const fuelTypes = this.getFuelTypesForMeasure(measureType);
        console.log('Using fuel types:', fuelTypes);

        const filteredPlants = plants.filter(plant => {
            if (!plant.production || !plant.production[year]) return false;

            const totalProduction = fuelTypes.reduce((sum, fuelType) => {
                const value = plant.production[year][fuelType];
                if (value && value > 0) {
                    console.log(`Plant ${plant.id} - ${fuelType}: ${value}`);
                }
                return sum + (value || 0);
            }, 0);

            if (totalProduction > 0) {
                console.log(`Including plant ${plant.id} - ${plant.name} - Total ${measureType}: ${totalProduction}`);
                return true;
            }
            return false;
        });

        console.log(`Found ${filteredPlants.length} total plants with ${measureType} production`);
        return filteredPlants.map(plant => plant.id);
    }
} 