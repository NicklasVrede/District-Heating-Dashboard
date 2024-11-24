import { yearState } from './YearState.js';
import { graphConfig } from '../../../graphs/config/graphConfig.js';
import { tooltipStyle, legendTooltips } from '../../../graphs/config/tooltipConfig.js';
import { ProductionLegend } from './ProductionLegend.js';
import { municipalitiesVisible } from '../municipalitiesFunctions.js';
import { allPlantIds, allMunicipalityIds, selectionSet } from '../../../main.js';
import { updateSelectedMunicipalities, updateSelectedPlants } from '../eventListeners.js';


export class ProductionFocus {
    constructor(map, measureContainer) {
        this.map = map;
        this.measureContainer = measureContainer;
        this.isActive = false;
        this.legend = new ProductionLegend(map);
        
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
                if (this.isActive) {
                    this.updateProductionData(year);
                }
            });
        });
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
                    
                    image.src = `./assets/icons/${category.toLowerCase().replace(/ & /g, '-').replace(/[, ]/g, '-')}.png`;
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
        
        // Get the correct source based on view type
        const source = this.map.getSource(municipalitiesVisible ? 'municipality-centroids' : 'plants');
        if (!source) return;

        const data = source._data;
        if (!data || !data.features) return;

        // Update features with current year's main fuel
        data.features = data.features.map(feature => {
            // Use the correct ID field based on view type
            const id = municipalitiesVisible ? 
                feature.properties.lau_1.padStart(8, '0') : 
                feature.properties.forsyid.padStart(8, '0');
            
            const plantData = window.dataDict?.[id]?.production;
            
            if (plantData && plantData[effectiveYear]) {
                const yearData = plantData[effectiveYear];
                const { mainFuel } = this.calculateProductionStats(yearData);
                feature.properties[`currentMainFuel`] = mainFuel;
            }
            return feature;
        });

        // Update the source with new data
        source.setData(data);
        
        // Check if icons are loaded
        const hasIcons = Object.keys(graphConfig.fuelTypes).some(category => 
            this.map.hasImage(`icon-${category.toLowerCase().replace(/ & /g, '-').replace(/[, ]/g, '-')}`)
        );

        // Get the correct layer ID based on view type
        const layerId = municipalitiesVisible ? 'municipalities-production' : 'plants-production';

        if (hasIcons) {
            // Add debug logging
            console.log('Municipality view:', municipalitiesVisible);
            
            if (this.map.getLayer(layerId).type !== 'symbol') {
                this.map.removeLayer(layerId);
                
                const iconSizeConfig = municipalitiesVisible ? 
                    [5, 0.375, 10, 1.125, 15, 1.5] : 
                    [5, 0.3, 10, 0.6, 15, 0.85];
                    
                console.log('Using icon size config:', iconSizeConfig);
                
                this.map.addLayer({
                    'id': layerId,
                    'type': 'symbol',
                    'source': municipalitiesVisible ? 'municipality-centroids' : 'plants',
                    'layout': {
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true,
                        'icon-size': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            ...iconSizeConfig
                        ]
                    }
                });
            } else {
                // If layer exists, update its icon-size property
                this.map.setLayoutProperty(layerId, 'icon-size', [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    ...(municipalitiesVisible ? 
                        [5, 0.375, 10, 1.125, 15, 1.5] : 
                        [5, 0.3, 10, 0.6, 15, 0.85])
                ]);
            }

            // Use icons with current main fuel
            this.map.setLayoutProperty(layerId, 'icon-image', [
                'match',
                ['get', 'currentMainFuel'],
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
            if (this.map.getLayer(layerId).type !== 'circle') {
                this.map.removeLayer(layerId);
                this.map.addLayer({
                    'id': layerId,
                    'type': 'circle',
                    'source': municipalitiesVisible ? 'municipality-centroids' : 'plants'
                });
            }

            const matchExpression = ['match', ['get', 'currentMainFuel']];
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

            this.map.setPaintProperty(layerId, 'circle-color', matchExpression);
            
            // Update circle radius logic
            this.map.setPaintProperty(layerId, 'circle-radius', [
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

    apply() {
        console.log('Applying production focus');
        this.isActive = true;
        this.measureContainer.classList.remove('hidden');
        this.legend.show();
        
        const layerId = municipalitiesVisible ? 'municipalities-production' : 'plants-production';
        
        // Hide the other layer type
        if (municipalitiesVisible) {
            this.map.setLayoutProperty('plants-production', 'visibility', 'none');
        } else {
            this.map.setLayoutProperty('municipalities-production', 'visibility', 'none');
        }
        
        // Show the current layer
        this.map.setLayoutProperty(layerId, 'visibility', 'visible');
        this.updateProductionData(yearState.year);
        this.legend.updateLegend();
    }

    remove() {
        this.isActive = false;
        this.measureContainer.classList.add('hidden');
        this.legend.hide();
        
        // Hide both layer types
        this.map.setLayoutProperty('plants-production', 'visibility', 'none');
        this.map.setLayoutProperty('municipalities-production', 'visibility', 'none');
    }

    getPlantData() {
        const dataDict = window.dataDict;
        console.log('Raw dataDict:', dataDict);
        
        if (!dataDict) {
            console.warn('No data available');
            return [];
        }

        // Filter based on current view type and ensure IDs are padded
        const relevantIds = municipalitiesVisible ? 
            Array.from(allMunicipalityIds).map(id => id.padStart(8, '0')) : 
            Array.from(allPlantIds).map(id => id.padStart(8, '0'));
        
        const entitiesArray = relevantIds.map(id => ({
            id,
            ...dataDict[id.padStart(8, '0')] // Ensure lookup uses padded ID
        }));
        
        console.log(`Converted ${municipalitiesVisible ? 'municipalities' : 'plants'} array:`, entitiesArray);
        return entitiesArray;
    }

    rankPlantsByProduction(entities, measureType) {
        console.log('Ranking entities for measure:', measureType);
        
        if (!Array.isArray(entities)) {
            console.warn('Entities data is not an array:', entities);
            return [];
        }

        const year = '2023';
        const fuelTypes = this.getFuelTypesForMeasure(measureType);
        console.log('Using fuel types for ranking:', fuelTypes);

        const filteredEntities = entities.filter(entity => {
            // Ensure we're using padded ID for lookup
            const paddedId = entity.id.padStart(8, '0');
            if (!entity.production || !entity.production[year]) {
                console.log(`Entity ${paddedId} - No production data for ${year}`);
                return false;
            }

            const totalProduction = fuelTypes.reduce((sum, fuelType) => {
                const value = entity.production[year][fuelType];
                if (value && value > 0) {
                    console.log(`Entity ${paddedId} - ${entity.name} - ${fuelType}: ${value}`);
                }
                return sum + (value || 0);
            }, 0);

            if (totalProduction > 0) {
                entity.totalProduction = totalProduction;
                console.log(`Entity ${paddedId} - ${entity.name} - Total ${measureType} production: ${totalProduction}`);
                return true;
            }
            return false;
        });

        console.log(`Found ${filteredEntities.length} entities with ${measureType} production in ${year}`);

        return filteredEntities.sort((a, b) => b.totalProduction - a.totalProduction);
    }

    getTopNByProduction(n, measureType) {
        console.log(`=== Getting top ${n} ${municipalitiesVisible ? 'municipalities' : 'plants'} for ${measureType} ===`);
        const entities = this.getPlantData();
        console.log('All available entities:', entities.map(e => ({
            id: e.id,
            name: e.name,
            type: e.type
        })));
        
        const ranked = this.rankPlantsByProduction(entities, measureType);
        console.log('Ranked entities:', ranked.map(e => ({
            id: e.id,
            name: e.name,
            production: e.totalProduction
        })));
        
        const result = ranked.slice(0, n).map(entity => entity.id.padStart(8, '0'));
        console.log('Final selected IDs:', result);
        
        // First, update the selection set
        selectionSet.clear();
        result.forEach(id => selectionSet.add(id));
        
        // Then update the map selections based on view type
        if (municipalitiesVisible) {
            updateSelectedMunicipalities(this.map);
        } else {
            updateSelectedPlants(this.map);
        }
        
        return result;
    }

    getBottomNByProduction(n, measureType) {
        console.log(`=== Getting bottom ${n} ${municipalitiesVisible ? 'municipalities' : 'plants'} for ${measureType} ===`);
        const entities = this.getPlantData();
        console.log('All available entities:', entities.map(e => ({
            id: e.id,
            name: e.name,
            type: e.type
        })));
        
        const ranked = this.rankPlantsByProduction(entities, measureType);
        console.log('Ranked entities:', ranked.map(e => ({
            id: e.id,
            name: e.name,
            production: e.totalProduction
        })));
        
        const result = ranked.slice(-n).map(entity => entity.id.padStart(8, '0'));
        console.log('Final selected IDs:', result);
        
        // First, update the selection set
        selectionSet.clear();
        result.forEach(id => selectionSet.add(id));
        
        // Then update the map selections based on view type
        if (municipalitiesVisible) {
            updateSelectedMunicipalities(this.map);
        } else {
            updateSelectedPlants(this.map);
        }
        
        return result;
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
        console.log(`Getting all ${municipalitiesVisible ? 'municipalities' : 'plants'} with ${measureType} production`);
        const entities = this.getPlantData();
        const year = '2023';
        
        if (measureType === 'all') {
            const filteredEntities = entities.filter(entity => {
                const paddedId = entity.id.padStart(8, '0');
                if (!entity.production || !entity.production[year]) {
                    return false;
                }

                const hasProduction = Object.values(entity.production[year]).some(value => value > 0);
                
                if (hasProduction) {
                    console.log(`Including entity ${paddedId} - ${entity.name}`);
                }
                
                return hasProduction;
            });

            console.log(`Found ${filteredEntities.length} total entities with any production`);
            const result = filteredEntities.map(entity => entity.id.padStart(8, '0'));
            
            // First, update the selection set
            selectionSet.clear();
            result.forEach(id => selectionSet.add(id));
            
            // Then update the map selections based on view type
            if (municipalitiesVisible) {
                updateSelectedMunicipalities(this.map);
            } else {
                updateSelectedPlants(this.map);
            }
            
            return result;
        }

        // For specific measure types
        const fuelTypes = this.getFuelTypesForMeasure(measureType);
        console.log('Using fuel types:', fuelTypes);

        const filteredEntities = entities.filter(entity => {
            if (!entity.production || !entity.production[year]) return false;

            const totalProduction = fuelTypes.reduce((sum, fuelType) => {
                const value = entity.production[year][fuelType];
                if (value && value > 0) {
                    console.log(`Entity ${entity.id} - ${fuelType}: ${value}`);
                }
                return sum + (value || 0);
            }, 0);

            if (totalProduction > 0) {
                console.log(`Including entity ${entity.id} - ${entity.name} - Total ${measureType}: ${totalProduction}`);
                return true;
            }
            return false;
        });

        console.log(`Found ${filteredEntities.length} total entities with ${measureType} production`);
        return filteredEntities.map(entity => entity.id);
    }
} 