import { graphConfig } from '../config/graphConfig.js';
import { showToast } from './toast.js';
import { yearState } from '../../utils/javascript/focusLayers/YearState.js';
import { priceTypeColors } from '../../utils/javascript/focusLayers/colors.js';
import { legendTooltips, tooltipStyle } from '../config/tooltipConfig.js';
import { municipalitiesVisible } from '../../utils/javascript/municipalitiesFunctions.js';
import { highlightStyles } from '../../styles/highlightStyles.js';
import { highlightPlant, removePlantHighlight, highlightArea, resetAreaHighlight } from '../../utils/javascript/eventListeners.js';
import { chartFilterState } from '../../utils/javascript/focusLayers/ChartFilterState.js';

// Keep track of current charts
let currentCharts = {
    production: null,
    totalProduction: null,
    price: null
};

const LEGEND_WIDTH = 80;
const LEGEND_THRESHOLD_PERCENTAGE = 0;

Chart.register(ChartDataLabels);

// Common legend configuration
const commonLegendConfig = {
    position: 'left',
    align: 'start',
    // Force legend to be at a fixed position
    x: 0,
    maxWidth: LEGEND_WIDTH,
    width: LEGEND_WIDTH, // Force fixed width
    labels: {
        boxWidth: 12,
        boxHeight: 12,
        padding: 8,
        font: {
            size: 11
        }
    },
    onHover: function(event, legendItem, legend) {
        event.native.target.style.cursor = 'pointer';
        const tooltip = legendTooltips.production[legendItem.text];
        if (tooltip) {
            // Create or get tooltip element
            let tooltipEl = document.getElementById('chart-tooltip');
            if (!tooltipEl) {
                tooltipEl = document.createElement('div');
                tooltipEl.id = 'chart-tooltip';
                tooltipEl.style.cssText = tooltipStyle;
                document.body.appendChild(tooltipEl);
            }

            // Get mouse position from the event
            const mouseX = event.native.clientX;
            const mouseY = event.native.clientY;

            tooltipEl.innerHTML = tooltip;
            tooltipEl.style.left = (mouseX + 10) + 'px';
            tooltipEl.style.top = (mouseY + 10) + 'px';
            tooltipEl.style.display = 'block';
        }
    },
    onLeave: function(event) {
        if (event?.native?.target) {
            event.native.target.style.cursor = 'default';
        }
        const tooltipEl = document.getElementById('chart-tooltip');
        if (tooltipEl) {
            tooltipEl.style.display = 'none';
        }
    }
};

// Shared click handler factory
function createClickHandler(chartType) {
    let clickTimeout = null;
    let clickCount = 0;

    return function(chart, datasetIndex) {
        console.log(`Click detected for ${chartType}, dataset ${datasetIndex}`);
        clickCount++;
        
        if (clickCount === 1) {
            clickTimeout = setTimeout(() => {
                console.log(`Single click executed for ${chartType}, dataset ${datasetIndex}`);
                const meta = chart.getDatasetMeta(datasetIndex);
                meta.hidden = !meta.hidden;
                // Save filter state
                chartFilterState.updateFilter(chartType, datasetIndex, meta.hidden);
                console.log('Updated filter state:', chartFilterState.getFilterState(chartType));
                chart.update();
                clickCount = 0;
            }, 250);
        } else if (clickCount === 2) {
            console.log(`Double click executed for ${chartType}, dataset ${datasetIndex}`);
            clearTimeout(clickTimeout);
            const datasets = chart.data.datasets;
            
            const allOthersHidden = datasets.every((dataset, i) => 
                i === datasetIndex || chart.getDatasetMeta(i).hidden);
            
            datasets.forEach((dataset, i) => {
                const meta = chart.getDatasetMeta(i);
                meta.hidden = !allOthersHidden && (i !== datasetIndex);
                // Save filter state
                chartFilterState.updateFilter(chartType, i, meta.hidden);
            });
            
            console.log('Updated filter state after double click:', chartFilterState.getFilterState(chartType));
            chart.update();
            clickCount = 0;
        }
    };
}

// Create click handlers for legend and chart
function createChartClickHandlers(chartType) {
    const clickHandler = createClickHandler(chartType);

    return {
        legendClick: function(e, legendItem, legend) {
            clickHandler(legend.chart, legendItem.datasetIndex);
        },
        chartClick: function(e, elements) {
            if (!elements || !elements.length) return;
            clickHandler(e.chart, elements[0].datasetIndex);
        }
    };
}

export function createOrUpdatePlotlyGraph(data, selectedForsyids, focus) {
    // Reset any specific settings or data
    if (focus === 'none') {
    }

    const graphContainer = document.getElementById('graph-container');
    
    // Only create the structure if we have valid data to show
    if (!selectedForsyids?.length) return;

    const yearRanges = {
        production: { defaultYear: '2023', minYear: '2000', maxYear: '2023' },
        price: { defaultYear: '2024', minYear: '2019', maxYear: '2024' },
        none: { defaultYear: '2024', minYear: '2019', maxYear: '2024' }
    };
    
    const { defaultYear, minYear, maxYear } = yearRanges[focus] || yearRanges.none;

    // Use yearState.year instead of defaultYear for initial creation
    const initialYear = yearState.year || defaultYear;

    // Add a static counter to track if animation has played
    if (!createOrUpdatePlotlyGraph.animationPlayed) {
        createOrUpdatePlotlyGraph.animationPlayed = new Set();
    }

    // Create the structure only when needed
    graphContainer.innerHTML = `
        <div class="graph-header">
            <h2 class="graph-title">${municipalitiesVisible ? 'Multiple Municipalities Comparison' : 'Multiple Plants Comparison'}</h2>
        </div>
        <div class="graphs-container">
            ${focus === 'price' ? `
                <div class="price-graph">
                    <canvas id="priceChart"></canvas>
                </div>
                <div class="production-graph">
                    <canvas id="productionChart"></canvas>
                </div>
                <div class="total-production-graph">
                    <canvas id="totalProductionChart"></canvas>
                </div>
            ` : `
                <div class="production-graph">
                    <canvas id="productionChart"></canvas>
                </div>
                <div class="total-production-graph">
                    <canvas id="totalProductionChart"></canvas>
                </div>
                <div class="price-graph">
                    <canvas id="priceChart"></canvas>
                </div>
            `}
        </div>
    `;

    // Input validation
    if (!selectedForsyids?.length) return;

    // Sort forsyids by price if price focus is active
    let sortedForsyids = [...selectedForsyids];
    if (focus === 'price') {
        sortedForsyids.sort((a, b) => {
            const priceA = data[a.toString().padStart(8, '0')]?.prices?.[defaultYear]?.mwh_price || 0;
            const priceB = data[b.toString().padStart(8, '0')]?.prices?.[defaultYear]?.mwh_price || 0;
            return priceB - priceA; // Sort descending (highest price first)
        });
    }

    // Replace selectedForsyids with sortedForsyids in subsequent function calls
    const validForsyids = sortedForsyids.filter(forsyid => {
        const paddedForsyid = forsyid.toString().padStart(8, '0');
        return data[paddedForsyid]?.production && Object.keys(data[paddedForsyid].production).length > 0;
    });

    if (!validForsyids.length) {
        showToast("No data available for the selected plant(s)");
        return;
    }

    // Add event listener for year slider if focus is not none
    if (focus !== 'none') {
        setupYearSliderListener(data, validForsyids, focus);
    }

    // Create initial charts with yearState.year
    const effectiveYear = getEffectiveYear(initialYear, focus);
    createProductionChart(data, validForsyids, effectiveYear, focus);
    createTotalProductionChart(data, validForsyids);
    createPriceChart(data, validForsyids, initialYear, focus);

    // Mark this focus type as having played the animation
    if (focus !== 'none') {
        createOrUpdatePlotlyGraph.animationPlayed.add(focus);
    }

    return () => cleanupCharts();
}

function setupYearSliderListener(data, validForsyids, focus) {
    const yearSlider = document.getElementById('year-slider');
    const yearLabel = document.getElementById('year-label');
    
    if (yearSlider && yearLabel) {
        // Remove any existing event listeners
        const newSlider = yearSlider.cloneNode(true);
        yearSlider.parentNode.replaceChild(newSlider, yearSlider);

        // Set initial value from yearState
        newSlider.value = yearState.year;
        yearLabel.textContent = yearState.year;

        newSlider.addEventListener('input', (e) => {
            const selectedYear = e.target.value;
            yearLabel.textContent = selectedYear;
            // Update the shared year state
            yearState.year = selectedYear;
            
            const effectiveYear = getEffectiveYear(selectedYear, focus);
            createProductionChart(data, validForsyids, effectiveYear, focus);
            createTotalProductionChart(data, validForsyids, selectedYear);
            createPriceChart(data, validForsyids, selectedYear, focus);
        });
    }
}

function getEffectiveYear(year, focus) {
    if (focus === 'production') {
        return Math.min(Math.max(year, '2000'), '2023');
    }
    return year;
}

function cleanupCharts() {
    Object.values(currentCharts).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });
    currentCharts = { production: null, totalProduction: null, price: null };
}

function handleChartHover(forsyid, map, entering) {
    if (!map) return;
    
    if (entering) {
        // Highlight municipality border
        map.setPaintProperty('municipalities-selected-line', 'line-color', [
            'case',
            ['==', ['get', 'lau_1'], forsyid],
            highlightStyles.municipalityHover.lineColor,
            highlightStyles.selectedMunicipalitiesLine.paint['line-color']
        ]);
        map.setPaintProperty('municipalities-selected-line', 'line-width', [
            'case',
            ['==', ['get', 'lau_1'], forsyid],
            highlightStyles.municipalityHover.lineWidth,
            highlightStyles.selectedMunicipalitiesLine.paint['line-width']
        ]);
        
        // Highlight plant and area
        highlightPlant(map, forsyid);
        highlightArea(map, forsyid);
    } else {
        // Reset all highlights
        map.setPaintProperty('municipalities-selected-line', 'line-color', 
            highlightStyles.selectedMunicipalitiesLine.paint['line-color']
        );
        map.setPaintProperty('municipalities-selected-line', 'line-width',
            highlightStyles.selectedMunicipalitiesLine.paint['line-width']
        );
        
        // Reset plant and area highlights
        removePlantHighlight(map);
        resetAreaHighlight(map);
    }
}

function createProductionChart(data, validForsyids, currentYear, focus) {
    const effectiveYear = Math.min(Math.max(currentYear, '2000'), '2023');
    
    const canvas = document.getElementById('productionChart');
    
    if (currentCharts.production) {
        currentCharts.production.destroy();
    }

    const ctx = canvas.getContext('2d');
    const plantNames = [];
    const datasets = Object.entries(graphConfig.fuelTypes).map(([category, fuelTypes]) => ({
        label: category,
        data: [],
        backgroundColor: graphConfig.colors[category],
        borderColor: graphConfig.colors[category],
        borderWidth: 1,
        fill: true
    }));

    // Calculate percentages for each plant
    validForsyids.forEach((forsyid, plantIndex) => {
        const paddedForsyid = forsyid.toString().padStart(8, '0');
        const plantData = data[paddedForsyid];
        
        if (plantData) {
            plantNames.push(plantData.name.split(' ')[0]);
            
            // Calculate total production for this plant in the current year, excluding elprod and varmeprod
            const yearTotal = Object.entries(plantData.production[effectiveYear] || {})
                .filter(([key, _]) => key !== 'elprod' && key !== 'varmeprod')
                .reduce((sum, [_, val]) => sum + (val || 0), 0);
            
            // Calculate percentage for each category using fuelTypes mapping
            Object.entries(graphConfig.fuelTypes).forEach(([category, fuelTypes], index) => {
                let categoryValue = 0;

                if (Array.isArray(fuelTypes)) {
                    // Sum up all fuel types in this category
                    categoryValue = fuelTypes.reduce((sum, fuelType) => 
                        sum + (plantData.production[effectiveYear]?.[fuelType] || 0), 0);
                } else {
                    // Single fuel type
                    categoryValue = plantData.production[effectiveYear]?.[fuelTypes] || 0;
                }
                
                // Convert to percentage and only add if above threshold
                const percentage = yearTotal > 0 ? (categoryValue / yearTotal) * 100 : 0;
                datasets[index].data[plantIndex] = percentage < LEGEND_THRESHOLD_PERCENTAGE ? 0 : percentage;
            });
        }
    });

    // Filter out datasets that have no data (all zeros)
    const nonEmptyDatasets = datasets.filter(dataset => {
        return dataset.data.some(value => value > 0);
    });

    // Create title with note if year was clamped
    let titleText = `Production Distribution (${effectiveYear})`;
    if (currentYear !== effectiveYear) {
        if (currentYear > '2023') {
            titleText = `Production Distribution (2023) - Latest Available Data`;
        } else if (currentYear < '2000') {
            titleText = `Production Distribution (2000) - Earliest Available Data`;
        }
    }

    // Get saved filter state before creating datasets
    const savedFilters = chartFilterState.getFilterState('production');
    console.log('Applying saved production filters:', savedFilters);

    datasets.forEach((dataset, i) => {
        if (savedFilters[i] !== undefined) {
            dataset.hidden = savedFilters[i];
        }
    });

    const handlers = createChartClickHandlers('production');
    
    currentCharts.production = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: plantNames,
            datasets: nonEmptyDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 0,
                    top: 2
                }
            },
            scales: {
                x: {
                    stacked: true,
                    position: 'top',
                    title: {
                        display: false
                    },
                    ticks: {
                        display: true,
                        autoSkip: false,
                        maxRotation: 0,
                        minRotation: 0,
                        padding: 0,
                        font: {
                            size: 14
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: false
                    },
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: titleText,
                    padding: {
                        top: 0,
                        bottom: 10
                    }
                },
                legend: {
                    ...commonLegendConfig,
                    onClick: handlers.legendClick
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label; // Plant name
                        },
                        label: function(context) {
                            // Get all datasets for this plant
                            const allDatasets = context.chart.data.datasets;
                            let tooltipLines = [];
                            
                            allDatasets.forEach(dataset => {
                                const value = dataset.data[context.dataIndex];
                                if (value > 0) { // Only show non-zero values
                                    // Create colored box using HTML
                                    const colorBox = `<span style="display:inline-block; width:10px; height:10px; margin-right:5px; background-color:${dataset.backgroundColor}"></span>`;
                                    // Bold the line if it matches the hovered dataset
                                    const isHovered = dataset.label === context.dataset.label;
                                    const labelText = isHovered ? 
                                        `<strong>${dataset.label}: ${value.toFixed(1)}%</strong>` : 
                                        `${dataset.label}: ${value.toFixed(1)}%`;
                                    tooltipLines.push(`${colorBox}${labelText}`);
                                }
                            });
                            
                            return tooltipLines;
                        }
                    },
                    enabled: false, // Disable default tooltip
                    external: function(context) {
                        // Get tooltip element
                        let tooltipEl = document.getElementById('chart-tooltip');
                        
                        if (!tooltipEl) {
                            tooltipEl = document.createElement('div');
                            tooltipEl.id = 'chart-tooltip';
                            tooltipEl.style.cssText = tooltipStyle;
                            document.body.appendChild(tooltipEl);
                        }

                        // Hide if no tooltip
                        const tooltipModel = context.tooltip;
                        if (tooltipModel.opacity === 0) {
                            tooltipEl.style.display = 'none';
                            return;
                        }

                        // Set Text
                        if (tooltipModel.body) {
                            const titleLines = tooltipModel.title || [];
                            const bodyLines = tooltipModel.body.map(b => b.lines).flat();

                            let innerHtml = `<div style="font-weight: bold; margin-bottom: 5px;">${titleLines[0]}</div>`;
                            innerHtml += bodyLines.join('<br>');

                            tooltipEl.innerHTML = innerHtml;
                        }

                        const position = context.chart.canvas.getBoundingClientRect();
                        tooltipEl.style.display = 'block';
                        tooltipEl.style.left = position.left + context.tooltip.caretX + 10 + 'px';
                        tooltipEl.style.top = position.top + context.tooltip.caretY + 'px';
                    }
                },
                datalabels: {
                    display: false
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: 'ctrl'  // Only pan when ctrl is pressed
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                            modifierKey: 'ctrl'  // Only zoom when ctrl is pressed
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x'
                    }
                }
            },
            animation: false,
            transitions: {
                active: {
                    animation: false
                }
            },
            onClick: handlers.chartClick,
            onHover: (event, elements) => {
                const canvas = event.chart.canvas;
                canvas.style.cursor = elements.length ? 'pointer' : 'default';
                if (elements && elements.length > 0) {
                    const forsyid = validForsyids[elements[0].index];
                    handleChartHover(forsyid, window.map, true);
                } else {
                    handleChartHover(null, window.map, false);
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function createPriceChart(data, validForsyids, currentYear, focus) {
    const canvas = document.getElementById('priceChart');
    
    if (currentCharts.price) {
        currentCharts.price.destroy();
    }

    // Use 2019 data for any year before 2019
    const effectiveYear = currentYear < '2019' ? '2019' : currentYear;
    
    // Create title text with note about earliest data
    const titleText = currentYear < '2019' ? 
        `Price Comparison (2019) - Earliest Available Data` : 
        `Price Comparison (${currentYear})`;

    const ctx = canvas.getContext('2d');
    const plantNames = [];
    const mwhData = [];
    const apartmentData = [];
    const houseData = [];

    validForsyids.forEach(forsyid => {
        const paddedForsyid = forsyid.toString().padStart(8, '0');
        const plantData = data[paddedForsyid];
        
        plantNames.push(plantData?.name?.split(' ')[0] || paddedForsyid);
        
        // Get raw prices directly
        mwhData.push(plantData?.prices?.[effectiveYear]?.mwh_price || 0);
        apartmentData.push(plantData?.prices?.[effectiveYear]?.apartment_price || 0);
        houseData.push(plantData?.prices?.[effectiveYear]?.house_price || 0);
    });

    // Create price-specific legend config
    const priceLegendConfig = {
        ...commonLegendConfig,
        onHover: function(event, legendItem, legend) {
            event.native.target.style.cursor = 'pointer';
            const tooltip = legendTooltips.prices[legendItem.text];
            
            if (tooltip) {
                let tooltipEl = document.getElementById('chart-tooltip');
                if (!tooltipEl) {
                    tooltipEl = document.createElement('div');
                    tooltipEl.id = 'chart-tooltip';
                    tooltipEl.style.cssText = tooltipStyle;
                    document.body.appendChild(tooltipEl);
                }

                const mouseX = event.native.clientX;
                const mouseY = event.native.clientY;

                tooltipEl.innerHTML = tooltip;
                tooltipEl.style.left = (mouseX + 10) + 'px';
                tooltipEl.style.top = (mouseY + 10) + 'px';
                tooltipEl.style.display = 'block';
            }
        }
    };

    // Function to toggle dataset visibility
    const toggleDataset = (chart, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        meta.hidden = meta.hidden === null ? !chart.data.datasets[datasetIndex].hidden : null;
        chart.update();
    };

    // Function to show only one dataset
    const showOnlyDataset = (chart, datasetIndex) => {
        chart.data.datasets.forEach((dataset, index) => {
            const meta = chart.getDatasetMeta(index);
            meta.hidden = index !== datasetIndex;
        });
        chart.update();
    };

    // Get saved filter state
    const savedFilters = chartFilterState.getFilterState('price');
    console.log('Applying saved price filters:', savedFilters);

    const datasets = [
       {
            label: 'MWh Price',
            data: mwhData,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
           hidden: savedFilters[0] || false, // Apply saved state
        },
        {
            label: 'Apartment',
            data: apartmentData,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            hidden: savedFilters[1] || false, // Apply saved state
        },
        {
            label: 'House',
            data: houseData,
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            hidden: savedFilters[2] || false, // Apply saved state
        }
    ];

    const handlers = createChartClickHandlers('price');
    
    currentCharts.price = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: plantNames,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 0
                }
            },
            scales: {
                x: {
                    stacked: false,
                    ticks: {
                        display: false
                    }
                },
                y: {
                    stacked: false,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000) {
                                return `${(value/1000).toFixed(1)}k DKK`;
                            }
                            return `${value.toLocaleString()} DKK`;
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: titleText
                },
                legend: {
                    ...priceLegendConfig,
                    onClick: handlers.legendClick
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toLocaleString()} DKK`;
                        }
                    }
                }
            },
            animation: false,
            transitions: {
                active: {
                    animation: false
                }
            },
            onClick: handlers.chartClick,
            onHover: (event, elements) => {
                const canvas = event.chart.canvas;
                canvas.style.cursor = elements.length ? 'pointer' : 'default';
                if (elements && elements.length > 0) {
                    const forsyid = validForsyids[elements[0].index];
                    handleChartHover(forsyid, window.map, true);
                } else {
                    handleChartHover(null, window.map, false);
                }
            }
        }
    });
}

function createTotalProductionChart(data, validForsyids) {
    const effectiveYear = Math.min(Math.max(yearState.year, '2000'), '2023');
    const canvas = document.getElementById('totalProductionChart');
    
    if (currentCharts.totalProduction) {
        currentCharts.totalProduction.destroy();
    }

    const ctx = canvas.getContext('2d');
    const plantNames = [];
    const heatProduction = [];
    const electricityProduction = [];

    // Get production data for each plant
    validForsyids.forEach(forsyid => {
        const paddedForsyid = forsyid.toString().padStart(8, '0');
        const plantData = data[paddedForsyid];
        
        if (plantData) {  // Changed condition to always add the plant
            plantNames.push(plantData.name.split(' ')[0]);
            // Use 0 as fallback value when no production data exists
            heatProduction.push(plantData.production?.[effectiveYear]?.varmeprod || 0);
            electricityProduction.push(plantData.production?.[effectiveYear]?.elprod || 0);
        }
    });

    // Create title with note if year was clamped
    let titleText = `Heat and Electricity Production (${effectiveYear})`;
    if (yearState.year !== effectiveYear) {
        if (yearState.year > '2023') {
            titleText = `Heat and Electricity Production (2023) - Latest Available Data`;
        } else if (yearState.year < '2000') {
            titleText = `Heat and Electricity Production (2000) - Earliest Available Data`;
        }
    }

    // Update the commonLegendConfig for this specific chart
   const totalProductionLegendConfig = {
        ...commonLegendConfig,
        onHover: function(event, legendItem, legend) {
            event.native.target.style.cursor = 'pointer';
            const tooltip = legendTooltips.productionTypes[legendItem.text];
            
            if (tooltip) {
                let tooltipEl = document.getElementById('chart-tooltip');
                if (!tooltipEl) {
                    tooltipEl = document.createElement('div');
                    tooltipEl.id = 'chart-tooltip';
                    tooltipEl.style.cssText = tooltipStyle;
                    document.body.appendChild(tooltipEl);
                }

                const mouseX = event.native.clientX;
                const mouseY = event.native.clientY;

                tooltipEl.innerHTML = tooltip;
                tooltipEl.style.left = (mouseX + 10) + 'px';
                tooltipEl.style.top = (mouseY + 10) + 'px';
                tooltipEl.style.display = 'block';
            }
        }
    };

    // Function to toggle dataset visibility
    const toggleDataset = (chart, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        meta.hidden = meta.hidden === null ? !chart.data.datasets[datasetIndex].hidden : null;
        chart.update();
    };

    // Function to show only one dataset
    const showOnlyDataset = (chart, datasetIndex) => {
        chart.data.datasets.forEach((dataset, index) => {
            const meta = chart.getDatasetMeta(index);
            meta.hidden = index !== datasetIndex;
        });
        chart.update();
    };

    // Get saved filter state
    const savedFilters = chartFilterState.getFilterState('totalProduction');
    console.log('Applying saved total production filters:', savedFilters);

    const datasets = [
        {
            label: 'Heating',
            data: heatProduction,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            hidden: savedFilters[0] || false, // Apply saved state
            datalabels: {
                display: true,
                align: 'center',
                anchor: 'center',
                formatter: function(value) {
                    return value > 0 ? value.toLocaleString() : '';
                }
            }
        },
        {
            label: 'Electricity',
            data: electricityProduction,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            hidden: savedFilters[1] || false, // Apply saved state
            datalabels: {
                display: false
            }
        }
    ];

    const handlers = createChartClickHandlers('totalProduction');
    
    currentCharts.totalProduction = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: plantNames,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 0
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: false
                    },
                    ticks: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: false
                    },
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000) {
                                return `${(value/1000)}k TJ`;
                            }
                            return `${value} TJ`;
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: titleText
                },
                legend: {
                    ...totalProductionLegendConfig,
                    onClick: handlers.legendClick
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label; // Plant name
                        },
                        label: function(context) {
                            const plantIndex = context.dataIndex;
                            const heatValue = context.chart.data.datasets[0].data[plantIndex];
                            const electricityValue = context.chart.data.datasets[1].data[plantIndex];
                            
                            return [
                                `Heat Production: ${heatValue.toLocaleString()} TJ`,
                                `Electricity Production: ${electricityValue.toLocaleString()} TJ`,
                                `Total: ${(heatValue + electricityValue).toLocaleString()} TJ`
                            ];
                        }
                    }
                }
            },
            animation: false,
            transitions: {
                active: {
                    animation: false
                }
            },
            onClick: handlers.chartClick
        }
    });
} 