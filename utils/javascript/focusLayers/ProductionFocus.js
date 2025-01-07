import { yearState } from './YearState.js';
import { graphConfig } from '../../../graphs/config/graphConfig.js';
import { tooltipStyle, legendTooltips } from '../../../graphs/config/tooltipConfig.js';
import { ProductionLegend } from './ProductionLegend.js';
import { municipalitiesVisible } from '../municipalitiesFunctions.js';
import { allPlantIds, allMunicipalityIds, selectionSet } from '../../../main.js';
import { updateSelectedMunicipalities, updateSelectedPlants } from '../eventListeners.js';
import { MainFuelManager } from './MainFuelManager.js';
import { getCachedData } from '../../../utils/javascript/dataManager.js';


export class ProductionFocus {
    constructor(map, measureContainer) {
        this.map = map;
        this.measureContainer = measureContainer;
        this.isActive = false;
        this.legend = new ProductionLegend(map);
        this.mainFuelManager = MainFuelManager.getInstance(map);
        
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

        const dataDict = getCachedData();
        const data = source._data;
        if (!data || !data.features) return;

        data.features = data.features.map(feature => {
            const forsyid = feature.properties.forsyid;
            const plantData = dataDict?.[forsyid]?.production;
            
            if (plantData) {
                for (let year = 2000; year <= 2023; year++) {
                    const yearData = plantData[year.toString()];
                    if (yearData) {
                        feature.properties[`totalProduction_${year}`] = 
                            Object.values(yearData).reduce((sum, val) => sum + (val || 0), 0);
                    }
                }
            }
            return feature;
        });

        source.setData(data);
    }

    updateProductionData(year) {
        const effectiveYear = Math.min(Math.max(year, '2000'), '2023');
        
        // Use MainFuelManager to update the main fuel data
        this.mainFuelManager.updateMainFuel(year);
        
        // Check if icons are loaded
        const hasIcons = Object.keys(graphConfig.fuelTypes).some(category => 
            this.map.hasImage(`icon-${category.toLowerCase().replace(/ & /g, '-').replace(/[, ]/g, '-')}`)
        );

        // Get the correct layer ID based on view type
        const layerId = municipalitiesVisible ? 'municipalities-production' : 'plants-production';

        if (hasIcons) {
            if (this.map.getLayer(layerId).type !== 'symbol') {
                this.map.removeLayer(layerId);
                
                const iconSizeConfig = municipalitiesVisible ? 
                    [5, 0.375, 10, 1.125, 15, 1.5] : 
                    [5, 0.3, 10, 0.6, 15, 0.85];

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
        const dataDict = getCachedData();

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
        
        return entitiesArray;
    }

    rankPlantsByProduction(entities, measureType) {

        if (!Array.isArray(entities)) {
            console.warn('Entities data is not an array:', entities);
            return [];
        }

        const year = '2023';
        const fuelTypes = this.getFuelTypesForMeasure(measureType);

        const filteredEntities = entities.filter(entity => {
            // Ensure we're using padded ID for lookup
            const paddedId = entity.id.padStart(8, '0');
            if (!entity.production || !entity.production[year]) {
                return false;
            }

            const totalProduction = fuelTypes.reduce((sum, fuelType) => {
                const value = entity.production[year][fuelType];
                return sum + (value || 0);
            }, 0);

            if (totalProduction > 0) {
                entity.totalProduction = totalProduction;
                return true;
            }
            return false;
        });

        return filteredEntities.sort((a, b) => b.totalProduction - a.totalProduction);
    }

    getTopNByProduction(n, measureType) {
        const entities = this.getPlantData();
        const ranked = this.rankPlantsByProduction(entities, measureType);
        const result = ranked.slice(0, n).map(entity => entity.id.padStart(8, '0'));
        
        selectionSet.clear();
        result.forEach(id => selectionSet.add(id));
        
        if (municipalitiesVisible) {
            updateSelectedMunicipalities(this.map);
        } else {
            updateSelectedPlants(this.map);
        }
        
        return result;
    }

    getBottomNByProduction(n, measureType) {
        const entities = this.getPlantData();
        const ranked = this.rankPlantsByProduction(entities, measureType);
        const result = ranked.slice(-n).map(entity => entity.id.padStart(8, '0'));

        selectionSet.clear();
        result.forEach(id => selectionSet.add(id));
        
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
        return types;
    }

    getAllByProduction(measureType) {
        const entities = this.getPlantData();
        const year = '2023';
        
        if (measureType === 'all') {
            const filteredEntities = entities.filter(entity => {
                const paddedId = entity.id.padStart(8, '0');
                if (!entity.production || !entity.production[year]) {
                    return false;
                }
                return Object.values(entity.production[year]).some(value => value > 0);
            });

            const result = filteredEntities.map(entity => entity.id.padStart(8, '0'));
            
            selectionSet.clear();
            result.forEach(id => selectionSet.add(id));
            
            if (municipalitiesVisible) {
                updateSelectedMunicipalities(this.map);
            } else {
                updateSelectedPlants(this.map);
            }
            
            return result;
        }

        const fuelTypes = this.getFuelTypesForMeasure(measureType);

        const filteredEntities = entities.filter(entity => {
            if (!entity.production || !entity.production[year]) return false;

            const totalProduction = fuelTypes.reduce((sum, fuelType) => {
                const value = entity.production[year][fuelType];
                return sum + (value || 0);
            }, 0);

            return totalProduction > 0;
        });

        return filteredEntities.map(entity => entity.id);
    }
} 