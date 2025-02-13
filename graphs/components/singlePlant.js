import { graphConfig } from '../config/graphConfig.js';
import { showToast } from './toast.js';
import { legendTooltips, tooltipStyle } from '../config/tooltipConfig.js';
import { chartFilterState } from '../../utils/javascript/focusLayers/ChartFilterState.js';

const LEGEND_THRESHOLD_PERCENTAGE = 0;

// Create click handlers at the module level
const clickHandlers = {
    production: createClickHandler('production'),
    price: createClickHandler('price'),
    totalProduction: createClickHandler('totalProduction')
};

function createClickHandler(chartType) {
    let clickTimeout = null;
    let clickCount = 0;

    return function(chart, datasetIndex) {
        clickCount++;
        
        if (clickCount === 1) {
            clickTimeout = setTimeout(() => {
                // Single click behavior
                const meta = chart.getDatasetMeta(datasetIndex);
                meta.hidden = !meta.hidden;
                chart.update();
                clickCount = 0;
            }, 250);
        } else if (clickCount === 2) {
            clearTimeout(clickTimeout);
            // Double click behavior
            const datasets = chart.data.datasets;
            
            // If all others are already hidden, show all (reset)
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
}

export function createSinglePlantGraph(data, forsyid, focus) {
    // Input validation
    if (!data || !forsyid) {
        const graphContainer = document.getElementById('graph-container');
        if (graphContainer) {
            graphContainer.innerHTML = '';
        }
        return;
    }

    const graphContainer = document.getElementById('graph-container');
    if (!graphContainer) {
        console.error('Graph container not found');
        return;
    }

    // Add class for single plant styling
    graphContainer.classList.add('single-plant');

    const plantId = forsyid.toString().padStart(8, '0');
    const plantData = data[plantId];

    if (!plantData?.production) {
        showToast("No data available for the selected plant");
        return;
    }

    // Clear and setup graph containers
    graphContainer.innerHTML = `
        <div class="graphs-wrapper">
            <div class="graphs-container">
                <h2 class="graph-title"></h2>
                <div class="production-graph">
                    <canvas id="productionChart"></canvas>
                </div>
                <div class="total-production-graph">
                    <canvas id="totalProductionChart"></canvas>
                </div>
                <div class="price-graph">
                    <canvas id="priceChart"></canvas>
                </div>
                <div class="info-box"></div>
            </div>
        </div>
    `;

    // Get references to the elements
    const titleElement = graphContainer.querySelector('.graph-title');
    const productionGraph = graphContainer.querySelector('.production-graph');
    const priceGraph = graphContainer.querySelector('.price-graph');
    const infoBox = graphContainer.querySelector('.info-box');

    // Set the title
    titleElement.textContent = plantData.name || 'Selected Plant';

    // Set content for graphs
    productionGraph.innerHTML = '<canvas id="productionChart"></canvas>';
    priceGraph.innerHTML = '<canvas id="priceChart"></canvas>';

    // Initialize charts
    const charts = [];
    charts.push(createProductionChart(plantData, 'productionChart', null));
    charts.push(createPriceChart(plantData, 'priceChart', null));
    charts.push(createTotalProductionChart(plantData, 'totalProductionChart', null));

    // Update info box
    updateInfoBox(plantData, infoBox);

    // Return cleanup function
    return function cleanup() {
        graphContainer.classList.remove('single-plant');
        charts.forEach(chart => {
            if (chart) chart.destroy();
        });
    };
}

// Add this common legend configuration that can be reused
const commonLegendConfig = {
    position: 'left',
    align: 'start',
    labels: {
        boxWidth: 12,
        boxHeight: 12,
        padding: 8,
        font: {
            size: 11
        },
        textAlign: 'left',
        generateLabels: function(chart) {
            const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
            return originalLabels.map(label => ({
                ...label,
                text: label.text.padEnd(15, '\u00A0')
            }));
        }
    }
};

export function createProductionChart(plantData, canvasId, maxValue = null) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const productionYears = Object.keys(plantData.production)
        .filter(year => !isNaN(parseInt(year)))
        .sort();

    // Create datasets for each fuel type
    const datasets = Object.entries(graphConfig.fuelTypes).map(([category, fuelTypes]) => {
        const values = productionYears.map(year => {
            // Get the total production for this year, excluding elprod and varmeprod
            const yearData = plantData.production[year];
            const yearTotal = Object.entries(yearData)
                .filter(([key, _]) => key !== 'elprod' && key !== 'varmeprod')
                .reduce((sum, [_, val]) => sum + (val || 0), 0);

            // Calculate the sum for this category
            let categoryValue = 0;
            if (Array.isArray(fuelTypes)) {
                categoryValue = fuelTypes.reduce((sum, fuelType) => 
                    sum + (yearData?.[fuelType] || 0), 0);
            } else {
                categoryValue = yearData?.[fuelTypes] || 0;
            }

            return yearTotal > 0 ? (categoryValue / yearTotal) * 100 : 0;
        });

        const hasProduction = values.some(val => val > 0);
        if (!hasProduction) return null;

        return {
            label: category,
            data: values,
            backgroundColor: graphConfig.colors[category],
            borderColor: graphConfig.colors[category],
            fill: true,
            borderWidth: 1,
            pointRadius: 0
        };
    }).filter(dataset => dataset !== null);

    // Get saved filter state
    const savedFilters = chartFilterState.getFilterState('production');
    datasets.forEach((dataset, i) => {
        if (savedFilters[i] !== undefined) {
            dataset.hidden = savedFilters[i];
        }
    });

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: productionYears,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            onHover: (event, elements) => {
                const canvas = event.chart.canvas;
                canvas.style.cursor = elements.length ? 'pointer' : 'default';
            },
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    const clickIndex = elements[0].index;
                    const year = productionYears[clickIndex];
                    createPieChart(this, plantData.production[year], year, {
                        data: plantData,
                        canvasId: canvasId,
                        maxValue: maxValue
                    });
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return `${value}%`;
                        }
                    },
                    grid: {
                        color: '#E4E4E4'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Production Distribution Over Time'
                },
                tooltip: {
                    mode: 'index',
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.chart.data.datasets.reduce(
                                (sum, dataset) => sum + (dataset.data[context.dataIndex] || 0), 
                                0
                            );
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.dataset.label}: ${value.toFixed(0)}% (${percentage}%)`;
                        },
                        footer: function(tooltipItems) {
                            const total = tooltipItems.reduce(
                                (sum, item) => sum + item.raw, 
                                0
                            );
                            return `Total: ${total.toFixed(0)}%`;
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: 'ctrl'
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                            modifierKey: 'ctrl'
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x'
                    }
                },
                legend: {
                    ...commonLegendConfig,
                    onClick: function(e, legendItem, legend) {
                        clickHandlers.production(legend.chart, legendItem.datasetIndex);
                    },
                    onHover: function(event, legendItem, legend) {
                        event.native.target.style.cursor = 'pointer';
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
                datalabels: {
                    display: false
                }
            }
        }
    });
}

export function createPriceChart(plantData, canvasId, maxValues = null) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const years = ['2019', '2020', '2021', '2022', '2023', '2024'];

    const datasets = [
        {
            label: 'MWh Price',
            data: years.map(year => plantData.prices?.[year]?.mwh_price || null),
            borderColor: '#FF6384',
            backgroundColor: '#FF6384',
            tension: 0.1,
            fill: false,
            spanGaps: true
        },
        {
            label: 'Apartment',
            data: years.map(year => plantData.prices?.[year]?.apartment_price || null),
            borderColor: '#36A2EB',
            backgroundColor: '#36A2EB',
            tension: 0.1,
            fill: false,
            spanGaps: true
        },
        {
            label: 'House',
            data: years.map(year => plantData.prices?.[year]?.house_price || null),
            borderColor: '#4BC0C0',
            backgroundColor: '#4BC0C0',
            tension: 0.1,
            fill: false,
            spanGaps: true
        }
    ];

    // Get saved filter state
    const savedFilters = chartFilterState.getFilterState('price');
    datasets.forEach((dataset, i) => {
        if (savedFilters[i] !== undefined) {
            dataset.hidden = savedFilters[i];
        }
    });

    let maxPrice = null;
    if (maxValues) {
        maxPrice = Math.max(
            maxValues.mwh_price,
            maxValues.apartment_price,
            maxValues.house_price
        );
        maxPrice = Math.ceil(maxPrice / 1000) * 1000;
    }

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    ...commonLegendConfig,
                    onClick: function(e, legendItem, legend) {
                        clickHandlers.price(legend.chart, legendItem.datasetIndex);
                    },
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
                },
                datalabels: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Price Development'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const price = context.raw;
                            const label = context.dataset.label;
                            if (price === 0) {
                                return 'No price data available';
                            }
                            return `${label}: ${price.toFixed(0)} DKK`;
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: 'ctrl'
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                            modifierKey: 'ctrl'
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x'
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    },
                    grid: {
                        color: '#E4E4E4'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Price (DKK)'
                    },
                    grid: {
                        color: '#E4E4E4'
                    },
                    beginAtZero: true,
                    max: maxPrice
                }
            }
        }
    });
}

export function createTotalProductionChart(plantData, canvasId, maxValue = null) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const productionYears = Object.keys(plantData.production)
        .filter(year => !isNaN(parseInt(year)))
        .sort();

    const heatProduction = productionYears.map(year => 
        plantData.production[year]?.varmeprod || 0
    );
    
    const electricityProduction = productionYears.map(year => 
        plantData.production[year]?.elprod || 0
    );

    const datasets = [
        {
            label: 'Heating',
            data: heatProduction,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        },
        {
            label: 'Electricity',
            data: electricityProduction,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }
    ];

    // Get saved filter state
    const savedFilters = chartFilterState.getFilterState('totalProduction');
    datasets.forEach((dataset, i) => {
        if (savedFilters[i] !== undefined) {
            dataset.hidden = savedFilters[i];
        }
    });

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: productionYears,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 10
                        },
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: false,
                        callback: function(val, index) {
                            const year = this.getLabelForValue(val);
                            return parseInt(year) % 2 === 0 ? year : '';
                        }
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: maxValue,
                    ticks: {
                        stepSize: maxValue ? Math.ceil(maxValue / 10) : undefined,
                        font: {
                            size: 10
                        },
                        callback: function(value) {
                            if (value >= 1000) {
                                return `${(value/1000).toFixed(1)}k TJ`;
                            }
                            return `${value.toLocaleString()} TJ`;
                        }
                    },
                    grid: {
                        color: '#E4E4E4'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Total Production Over Time'
                },
                legend: {
                    ...commonLegendConfig,
                    onClick: function(e, legendItem, legend) {
                        clickHandlers.totalProduction(legend.chart, legendItem.datasetIndex);
                    },
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
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            const index = context.dataIndex;
                            const heatValue = heatProduction[index];
                            const electricityValue = electricityProduction[index];
                            const total = heatValue + electricityValue;
                            
                            return [
                                `Heat Production: ${heatValue.toLocaleString()} TJ`,
                                `Electricity Production: ${electricityValue.toLocaleString()} TJ`,
                                `Total: ${total.toLocaleString()} TJ`
                            ];
                        }
                    }
                },
                datalabels: {
                    display: false
                }
            }
        }
    });
}

export function updateInfoBox(plantData, infoBox) {
    if (!infoBox) return;

    const commissionDate = new Date(plantData.idrift).getFullYear();

    infoBox.innerHTML = `
        <ul style="list-style: none; padding: 0;">
            <li><strong>Commissioned:</strong> ${commissionDate}</li>
            <li><strong>Power Capacity:</strong> ${plantData.elkapacitet_MW?.toFixed(1) || 'N/A'} MW</li>
            <li><strong>Heat Capacity:</strong> ${plantData.varmekapacitet_MW?.toFixed(1) || 'N/A'} MW</li>
            <li><strong>Total Area:</strong> ${plantData.total_area_km2?.toFixed(2) || 'N/A'} km²</li>
        </ul>
    `;

    infoBox.classList.add('visible');
}

function createPieChart(originalChart, yearData, year, initialData) {
    if (!yearData) return;

    const total = Object.values(yearData).reduce((sum, val) => sum + (val || 0), 0);
    if (total === 0) return;

    const pieData = Object.entries(graphConfig.fuelTypes).map(([category, fuelTypes]) => {
        let value;
        if (Array.isArray(fuelTypes)) {
            value = fuelTypes.reduce((sum, fuel) => sum + (yearData[fuel] || 0), 0);
        } else {
            value = yearData[fuelTypes] || 0;
        }
        return {
            category,
            value,
            color: graphConfig.colors[category]
        };
    }).filter(item => item.value > 0);

    pieData.sort((a, b) => b.value - a.value);

    const canvas = document.createElement('canvas');
    canvas.id = 'pieChart';
    
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Back to Timeline';
    resetBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 8px 16px;
        background-color: #fff;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        z-index: 10;
    `;

    const container = originalChart.canvas.parentElement;
    container.style.position = 'relative';
    
    // Store the original canvas ID before clearing
    const originalCanvasId = originalChart.canvas.id;
    
    container.innerHTML = '';
    container.appendChild(resetBtn);
    container.appendChild(canvas);

    const newChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: pieData.map(d => d.category),
            datasets: [{
                data: pieData.map(d => d.value),
                backgroundColor: pieData.map(d => d.color)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    display: false
                },
                title: {
                    display: true,
                    text: `Production Distribution ${year}`
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value.toFixed(0)} TJ (${percentage}%)`;
                        }
                    }
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
                    }
                }
            }
        }
    });

    resetBtn.onclick = () => {
        // Recreate the original canvas with the correct ID
        container.innerHTML = `<canvas id="${originalCanvasId}"></canvas>`;
        
        // Recreate the production chart
        createProductionChart(initialData.data, initialData.canvasId, initialData.maxValue);
    };

    return newChart;
}
