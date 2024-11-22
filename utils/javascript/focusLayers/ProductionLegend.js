import { graphConfig } from '../../../graphs/config/graphConfig.js';
import { tooltipStyle, legendTooltips } from '../../../graphs/config/tooltipConfig.js';
import { municipalitiesVisible } from '../municipalitiesFunctions.js';


export class ProductionLegend {
    constructor(map) {
        this.map = map;
        this.legend = null;
        this.tooltip = null;
        this.hiddenCategories = new Set();
        this.createLegend();
    }

    createLegend() {
        if (!this.legend) {
            this.legend = document.createElement('div');
            this.legend.className = 'map-legend production-legend';
            this.legend.style.display = 'none';
            this.map.getContainer().appendChild(this.legend);
            
            this.tooltip = document.createElement('div');
            this.tooltip.style.cssText = tooltipStyle;
            this.tooltip.style.display = 'none';
            document.body.appendChild(this.tooltip);
        }
    }

    updateLegend() {
        if (!this.legend) return;

        const hasIcons = Object.keys(graphConfig.fuelTypes).some(category => 
            this.map.hasImage(`icon-${category.toLowerCase().replace(/ & /g, '-').replace(/[, ]/g, '-')}`)
        );

        this.legend.innerHTML = this.createLegendHTML(hasIcons);
        this.addClickHandlers();
    }

    createLegendHTML(hasIcons) {
        const isFirstColumnCategory = (category) => {
            const firstColumnCategories = ['Kul', 'Olie', 'Gas', 'Affald', 'Halm', 'El'];
            return firstColumnCategories.includes(category);
        };

        return `
            <div class="legend-title">Main Fuel</div>
            <div class="legend-items">
                ${Object.entries(graphConfig.fuelTypes).map(([category, fuelTypes]) => {
                    const iconId = category.toLowerCase().replace(/ & /g, '-').replace(/[, ]/g, '-');
                    const tooltip = legendTooltips.production[category] || '';
                    const isFirstColumn = isFirstColumnCategory(category);
                    
                    return `
                        <div class="legend-item" data-category="${category}" data-tooltip="${tooltip}" data-short="${isFirstColumn}">
                            ${hasIcons ? 
                                `<img src="./assets/icons/${iconId}.png" class="legend-icon" alt="${category}"/>` :
                                `<div class="legend-color" style="background-color: ${graphConfig.colors[category]}"></div>`
                            }
                            <span class="legend-label">${category}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    addClickHandlers() {
        let clickTimeout = null;
        let clickCount = 0;
        const legendItems = this.legend.querySelectorAll('.legend-item');

        legendItems.forEach(item => {
            item.addEventListener('click', () => {
                clickCount++;
                const category = item.dataset.category;

                if (clickCount === 1) {
                    clickTimeout = setTimeout(() => {
                        this.toggleCategoryVisibility(category);
                        clickCount = 0;
                    }, 250);
                } else if (clickCount === 2) {
                    clearTimeout(clickTimeout);
                    this.showOnlyCategory(category);
                    clickCount = 0;
                }
            });

            item.addEventListener('mouseover', () => {
                const tooltipText = item.dataset.tooltip;
                this.tooltip.innerHTML = tooltipText;
                this.tooltip.style.display = 'block';
                this.tooltip.style.left = `${event.pageX + 5}px`;
                this.tooltip.style.top = `${event.pageY + 5}px`;
            });

            item.addEventListener('mouseout', () => {
                this.tooltip.style.display = 'none';
            });
        });
    }

    toggleCategoryVisibility(category) {
        const layerId = municipalitiesVisible ? 'municipalities-production' : 'plants-production';
        const layer = this.map.getLayer(layerId);
        if (!layer) return;

        const legendItem = this.legend.querySelector(`[data-category="${category}"]`);
        const isHidden = this.hiddenCategories.has(category);

        if (isHidden) {
            this.hiddenCategories.delete(category);
            legendItem?.classList.remove('hidden');
        } else {
            this.hiddenCategories.add(category);
            legendItem?.classList.add('hidden');
        }

        this.updateMapFilters();
    }

    showOnlyCategory(category) {
        const layerId = municipalitiesVisible ? 'municipalities-production' : 'plants-production';
        const layer = this.map.getLayer(layerId);
        if (!layer) return;

        const otherCategoriesHidden = Object.keys(graphConfig.fuelTypes)
            .every(cat => cat === category || this.hiddenCategories.has(cat));
        
        if (otherCategoriesHidden) {
            this.reset();
            return;
        }

        this.hiddenCategories.clear();
        Object.keys(graphConfig.fuelTypes).forEach(cat => {
            if (cat !== category) {
                this.hiddenCategories.add(cat);
            }
        });

        const legendItems = this.legend.querySelectorAll('.legend-item');
        legendItems.forEach(item => {
            const itemCategory = item.dataset.category;
            if (itemCategory === category) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });

        this.updateMapFilters();
    }

    updateMapFilters() {
        const layerId = municipalitiesVisible ? 'municipalities-production' : 'plants-production';
        
        if (this.hiddenCategories.size === 0) {
            this.map.setFilter(layerId, ['all']);
            return;
        }

        const filterConditions = Array.from(this.hiddenCategories).flatMap(category => {
            const fuelTypes = graphConfig.fuelTypes[category];
            return Array.isArray(fuelTypes)
                ? fuelTypes.map(fuel => ['!=', 'currentMainFuel', fuel])
                : [['!=', 'currentMainFuel', fuelTypes]];
        });

        this.map.setFilter(layerId, ['all', ...filterConditions]);
    }

    show() {
        if (this.legend) {
            this.legend.style.display = 'block';
            this.updateMapFilters();
        }
    }

    hide() {
        if (this.legend) {
            this.legend.style.display = 'none';
            const layerId = municipalitiesVisible ? 'municipalities-production' : 'plants-production';
            this.map.setFilter(layerId, ['all']);
        }
    }

    reset() {
        this.hiddenCategories.clear();
        const legendItems = this.legend?.querySelectorAll('.legend-item');
        legendItems?.forEach(item => item.classList.remove('hidden'));
        this.updateMapFilters();
    }
} 