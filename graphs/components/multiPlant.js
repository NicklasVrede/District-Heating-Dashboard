import { graphConfig } from '../config/graphConfig.js';
import { showToast } from './toast.js';
import { yearState } from '../../utils/javascript/focusLayers/YearState.js';
import { priceTypeColors } from '../../utils/javascript/focusLayers/colors.js';
import { legendTooltips, tooltipStyle } from '../config/tooltipConfig.js';

// Keep track of current charts
let currentCharts = {
    production: null,
    totalProduction: null,
    price: null
};

const LEGEND_THRESHOLD_PERCENTAGE = 2;

Chart.register(ChartDataLabels);

export function createOrUpdatePlotlyGraph(data, selectedForsyids, focus = 'none') {
    console.log('Current focus:', focus);
    
    const graphContainer = document.getElementById('graph-container');
    
    // Only create the structure if we have valid data to show
    if (!selectedForsyids?.length) return;

    const yearRanges = {
        production: { defaultYear: '2023', minYear: '2021', maxYear: '2023' },
        price: { defaultYear: '2024', minYear: '2019', maxYear: '2024' },
        none: { defaultYear: '2024', minYear: '2019', maxYear: '2024' }
    };
    
    const { defaultYear, minYear, maxYear } = yearRanges[focus] || yearRanges.none;

    // Add a static counter to track if animation has played
    if (!createOrUpdatePlotlyGraph.animationPlayed) {
        createOrUpdatePlotlyGraph.animationPlayed = new Set();
    }

    // Create the structure only when needed
    graphContainer.innerHTML = `
        <div class="graph-header">
            <h2 class="graph-title">Multiple Plants Comparison</h2>
            <div class="year-slider-container ${focus !== 'none' && !createOrUpdatePlotlyGraph.animationPlayed.has(focus) ? 'pulse-animation' : ''}" 
                 id="year-slider-container" 
                 style="display: ${focus === 'none' ? 'none' : 'block'}">
                <label for="year-slider">Year:</label>
                <input 
                    type="range" 
                    id="year-slider" 
                    min="${minYear}" 
                    max="${maxYear}" 
                    value="${defaultYear}"
                    step="1"
                >
                <span id="year-label">${defaultYear}</span>
            </div>
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

    const validForsyids = selectedForsyids.filter(forsyid => {
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

    // Create initial charts
    const effectiveYear = getEffectiveYear(defaultYear, focus);
    createProductionChart(data, validForsyids, effectiveYear, focus);
    createTotalProductionChart(data, validForsyids);
    createPriceChart(data, validForsyids, defaultYear, focus);

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
        // Set initial value from yearState
        yearSlider.value = yearState.year;
        yearLabel.textContent = yearState.year;

        yearSlider.addEventListener('input', (e) => {
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
        return Math.min(Math.max(year, '2021'), '2023');
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

function createProductionChart(data, validForsyids, currentYear, focus) {
    console.log('Creating production chart with focus:', focus);
    const effectiveYear = Math.min(Math.max(currentYear, '2021'), '2023');
    
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
            
            // Calculate total production for this plant in the current year
            const yearTotal = Object.values(plantData.production[effectiveYear] || {})
                .reduce((sum, val) => sum + (val || 0), 0);
            
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
        } else if (currentYear < '2021') {
            titleText = `Production Distribution (2021) - Earliest Available Data`;
        }
    }

    // Create new chart with filtered datasets
    currentCharts.production = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: plantNames,
            datasets: nonEmptyDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Production Share (%)'
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
                    text: titleText
                },
                legend: {
                    position: 'left',
                    align: 'start',
                    labels: {
                        boxWidth: 12,
                        boxHeight: 12,
                        padding: 8,
                        font: {
                            size: 11
                        }
                    },
                    onHover: function(event, legendItem, legend) {
                        const tooltip = legendTooltips.production[legendItem.text];
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
                    },
                    onLeave: function() {
                        const tooltipEl = document.getElementById('chart-tooltip');
                        if (tooltipEl) {
                            tooltipEl.style.display = 'none';
                        }
                    }
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
                    display: true,
                    color: 'white',
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    formatter: function(value, context) {
                        if (value < 12) return '';
                        return `${context.dataset.label}\n${value.toFixed(1)}%`;
                    },
                    align: 'center',
                    anchor: 'center',
                    rotation: 0
                }
            },
            animation: false,
            transitions: {
                active: {
                    animation: false
                }
            },
            onClick: (function() {
                let clickTimeout = null;
                let clickCount = 0;

                return function(e, elements, chart) {
                    if (!elements || !elements.length) return;
                    
                    clickCount++;
                    const element = elements[0];
                    const datasetIndex = element.datasetIndex;
                    
                    if (clickCount === 1) {
                        clickTimeout = setTimeout(() => {
                            // Single click - toggle visibility
                            const meta = chart.getDatasetMeta(datasetIndex);
                            meta.hidden = !meta.hidden;
                            chart.update();
                            
                            clickCount = 0;
                        }, 250);
                    } else if (clickCount === 2) {
                        clearTimeout(clickTimeout);
                        // Double click - show only this dataset
                        const datasets = chart.data.datasets;
                        
                        // Check if all others are already hidden
                        const allOthersHidden = datasets.every((dataset, i) => 
                            i === datasetIndex || chart.getDatasetMeta(i).hidden);
                        
                        datasets.forEach((dataset, i) => {
                            const meta = chart.getDatasetMeta(i);
                            meta.hidden = !allOthersHidden && (i !== datasetIndex);
                        });
                        
                        chart.update();
                        clickCount = 0;
                    }
                };
            })()
        },
        plugins: [ChartDataLabels]
    });
}

function createPriceChart(data, validForsyids, currentYear, focus) {
    console.log('Creating price chart with focus:', focus);
    const canvas = document.getElementById('priceChart');
    
    // Destroy existing chart if it exists
    if (currentCharts.price) {
        currentCharts.price.destroy();
    }

    const ctx = canvas.getContext('2d');

    const plantNames = [];
    const houseData = [];
    const apartmentData = [];
    const mwhData = [];

    validForsyids.forEach(forsyid => {
        const paddedForsyid = forsyid.toString().padStart(8, '0');
        const plantData = data[paddedForsyid];
        
        if (plantData?.prices?.[currentYear]) {
            plantNames.push(plantData.name.split(' ')[0]);
            houseData.push(plantData.prices[currentYear].house_price || 0);
            apartmentData.push(plantData.prices[currentYear].apartment_price || 0);
            mwhData.push(plantData.prices[currentYear].mwh_price || 0);
        }
    });

    // Calculate max price across all years
    let maxPrice = 0;
    validForsyids.forEach(forsyid => {
        const paddedForsyid = forsyid.toString().padStart(8, '0');
        const plantData = data[paddedForsyid];
        
        if (plantData?.prices) {
            Object.values(plantData.prices).forEach(yearData => {
                maxPrice = Math.max(
                    maxPrice,
                    yearData.house_price || 0,
                    yearData.apartment_price || 0,
                    yearData.mwh_price || 0
                );
            });
        }
    });

    // Round up to the nearest 5000
    maxPrice = Math.ceil(maxPrice / 5000) * 5000;

    // Create new chart
    currentCharts.price = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: plantNames,
            datasets: [
                {
                    label: 'House Price',
                    data: houseData,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    order: 3  // Will be rendered first (back)
                },
                {
                    label: 'Apartment Price',
                    data: apartmentData,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    order: 2  // Will be rendered second (middle)
                },
                {
                    label: 'MWh Price',
                    data: mwhData,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    order: 1  // Will be rendered last (front)
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: false
                    }
                },
                y: {
                    stacked: false,
                    title: {
                        display: true,
                        text: 'Price (DKK)'
                    },
                    beginAtZero: true,
                    min: 0,
                    max: maxPrice,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString() + ' DKK';
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Price Comparison (${currentYear})`
                },
                legend: {
                    position: 'left',
                    align: 'start',
                    labels: {
                        boxWidth: 12,
                        boxHeight: 12,
                        padding: 8,
                        font: {
                            size: 11
                        }
                    },
                    onHover: function(event, legendItem, legend) {
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
                    },
                    onLeave: function() {
                        const tooltipEl = document.getElementById('chart-tooltip');
                        if (tooltipEl) {
                            tooltipEl.style.display = 'none';
                        }
                    }
                },
                tooltip: {
                    callbacks: {
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
            }
        }
    });
}

function createTotalProductionChart(data, validForsyids, currentYear = '2023') {
    const effectiveYear = Math.min(Math.max(currentYear, '2021'), '2023');
    const canvas = document.getElementById('totalProductionChart');
    
    if (currentCharts.totalProduction) {
        currentCharts.totalProduction.destroy();
    }

    const ctx = canvas.getContext('2d');
    const plantNames = [];
    const plantTotals = [];

    // Calculate total production for each plant for the current year only
    validForsyids.forEach(forsyid => {
        const paddedForsyid = forsyid.toString().padStart(8, '0');
        const plantData = data[paddedForsyid];
        
        if (plantData?.production?.[effectiveYear]) {
            plantNames.push(plantData.name.split(' ')[0]);
            
            // Sum up all fuels for this plant in the current year
            const total = Object.values(plantData.production[effectiveYear])
                .reduce((sum, val) => sum + (val || 0), 0);
            
            plantTotals.push(total);
        }
    });

    // Create title with note if year was clamped
    let titleText = `Total Production (${effectiveYear})`;
    if (currentYear !== effectiveYear) {
        if (currentYear > '2023') {
            titleText = `Total Production (2023) - Latest Available Data`;
        } else if (currentYear < '2021') {
            titleText = `Total Production (2021) - Earliest Available Data`;
        }
    }

    // Create new chart
    currentCharts.totalProduction = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: plantNames,
            datasets: [{
                label: 'Total Production',
                data: plantTotals,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Total Production (TJ)'
                    },
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return `${value.toLocaleString()} TJ`;
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
                    position: 'left',
                    align: 'start',
                    labels: {
                        boxWidth: 12,
                        boxHeight: 12,
                        padding: 8,
                        font: {
                            size: 11
                        }
                    },
                    onHover: function(event, legendItem, legend) {
                        const tooltip = "Total energy production in terajoules (TJ)";
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
                    },
                    onLeave: function() {
                        const tooltipEl = document.getElementById('chart-tooltip');
                        if (tooltipEl) {
                            tooltipEl.style.display = 'none';
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(1)} TJ`;
                        }
                    }
                }
            },
            animation: false,
            transitions: {
                active: {
                    animation: false
                }
            }
        }
    });
} 