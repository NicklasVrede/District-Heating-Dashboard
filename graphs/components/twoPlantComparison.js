import { graphConfig } from '../config/graphConfig.js';
import { showToast } from './toast.js';
import { legendTooltips, tooltipStyle } from '../config/tooltipConfig.js';

const LEGEND_THRESHOLD_PERCENTAGE = 0;

export function createTwoPlantComparison(data, validForsyids) {
    // Input validation
    if (!data || !validForsyids || validForsyids.length !== 2) {
        console.error('Invalid parameters for two plant comparison');
        return;
    }

    const graphContainer = document.getElementById('graph-container');
    if (!graphContainer) {
        console.error('Graph container not found');
        return;
    }

    // Store chart instances for cleanup
    const charts = [];

    // Clear existing content and create two-plant container
    graphContainer.innerHTML = `
        <div class="two-plant-container">
            <div class="plant-column">
                <h2 class="graph-title"></h2>
                <div class="production-graph">
                    <canvas id="productionChart1"></canvas>
                </div>
                <div class="total-production-graph">
                    <canvas id="totalProductionChart1"></canvas>
                </div>
                <div class="price-graph">
                    <canvas id="priceChart1"></canvas>
                </div>
                <div class="info-box"></div>
            </div>
            <div class="plant-column">
                <h2 class="graph-title"></h2>
                <div class="production-graph">
                    <canvas id="productionChart2"></canvas>
                </div>
                <div class="total-production-graph">
                    <canvas id="totalProductionChart2"></canvas>
                </div>
                <div class="price-graph">
                    <canvas id="priceChart2"></canvas>
                </div>
                <div class="info-box"></div>
            </div>
        </div>
    `;

    // Calculate max values across both plants before creating charts
    const maxValues = {
        production: {},
        prices: {
            mwh_price: 0,
            apartment_price: 0,
            house_price: 0
        }
    };

    // Calculate max production values for each fuel type
    validForsyids.forEach(forsyid => {
        const plantId = forsyid.toString().padStart(8, '0');
        const plantData = data[plantId];
        
        if (plantData?.production) {
            Object.keys(plantData.production).forEach(year => {
                Object.entries(plantData.production[year]).forEach(([key, value]) => {
                    maxValues.production[key] = Math.max(
                        maxValues.production[key] || 0,
                        value || 0
                    );
                });
            });
        }

        if (plantData?.prices) {
            Object.values(plantData.prices).forEach(yearPrices => {
                maxValues.prices.mwh_price = Math.max(
                    maxValues.prices.mwh_price,
                    yearPrices.mwh_price || 0
                );
                maxValues.prices.apartment_price = Math.max(
                    maxValues.prices.apartment_price,
                    yearPrices.apartment_price || 0
                );
                maxValues.prices.house_price = Math.max(
                    maxValues.prices.house_price,
                    yearPrices.house_price || 0
                );
            });
        }
    });

    // Calculate max production value across both plants
    let maxProductionValue = 0;
    validForsyids.forEach(forsyid => {
        const plantId = forsyid.toString().padStart(8, '0');
        const plantData = data[plantId];
        
        if (plantData?.production) {
            Object.keys(plantData.production).forEach(year => {
                const yearTotal = Object.values(plantData.production[year])
                    .reduce((sum, val) => sum + (val || 0), 0);
                maxProductionValue = Math.max(maxProductionValue, yearTotal);
            });
        }
    });

    // Round up to nearest thousand
    const roundedMaxProduction = Math.ceil(maxProductionValue / 1000) * 1000;

    // Create charts for both plants with shared max values
    validForsyids.forEach((forsyid, index) => {
        const plantId = forsyid.toString().padStart(8, '0');
        const plantData = data[plantId];

        if (!plantData?.production) {
            showToast(`No data available for plant ${index + 1}`);
            return;
        }

        const column = graphContainer.querySelector(`.plant-column:nth-child(${index + 1})`);
        
        // Set plant title
        const titleElement = column.querySelector('.graph-title');
        titleElement.textContent = plantData.name || `Plant ${index + 1}`;

        // Create and store chart instances with shared max values
        charts.push(createProductionChart(plantData, index + 1, roundedMaxProduction));
        charts.push(createPriceChart(plantData, index + 1, maxValues.prices));
        charts.push(createTotalProductionChart(plantData, index + 1, roundedMaxProduction));

        updateInfoBox(plantData, index + 1);
    });

    // Return cleanup function
    return function cleanup() {
        charts.forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        graphContainer.innerHTML = '';
    };
}

function createProductionChart(plantData, index, maxValue) {
    const ctx = document.getElementById(`productionChart${index}`).getContext('2d');
    
    const productionYears = Object.keys(plantData.production)
        .filter(year => !isNaN(parseInt(year)))
        .sort();

    // Create datasets for each category using the new fuelTypes mapping
    const datasets = Object.entries(graphConfig.fuelTypes).map(([category, fuelTypes]) => {
        const values = productionYears.map(year => {
            // Get the total production for this year
            const yearTotal = Object.values(plantData.production[year])
                .reduce((sum, val) => sum + (val || 0), 0);

            // Calculate the sum for this category
            let categoryValue = 0;
            if (Array.isArray(fuelTypes)) {
                categoryValue = fuelTypes.reduce((sum, fuelType) => 
                    sum + (plantData.production[year]?.[fuelType] || 0), 0);
            } else {
                categoryValue = plantData.production[year]?.[fuelTypes] || 0;
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
            borderWidth: 1
        };
    }).filter(dataset => dataset !== null);

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
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    const clickIndex = elements[0].index;
                    const year = productionYears[clickIndex];
                    createPieChart(this, plantData.production[year], year, {
                        data: plantData,
                        index: index,
                        maxValue: maxValue
                    });
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        font: {
                            size: 10
                        },
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
                datalabels: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    });
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
    canvas.id = `pieChart${initialData.index}`;
    
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
                    position: 'left'
                }
            }
        }
    });

    resetBtn.onclick = () => {
        // Recreate the original canvas with the correct ID
        container.innerHTML = `<canvas id="${originalCanvasId}"></canvas>`;
        
        // Recreate the production chart
        createProductionChart(initialData.data, initialData.index, initialData.maxValue);
    };

    return newChart;
}

function createPriceChart(plantData, index, maxValues) {
    const ctx = document.getElementById(`priceChart${index}`).getContext('2d');
    const years = ['2019', '2020', '2021', '2022', '2023', '2024'];
    
    const datasets = [
        {
            label: 'MWh Price',
            data: years.map(year => plantData.prices?.[year]?.mwh_price || 0),
            borderColor: '#FF6384',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            tension: 0.1,
            fill: true
        },
        {
            label: 'Apartment Price (Yearly)',
            data: years.map(year => plantData.prices?.[year]?.apartment_price || 0),
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            tension: 0.1,
            fill: true
        },
        {
            label: 'House Price (Yearly)',
            data: years.map(year => plantData.prices?.[year]?.house_price || 0),
            borderColor: '#4BC0C0',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            tension: 0.1,
            fill: true
        }
    ];

    const maxPrice = Math.max(
        maxValues.mwh_price,
        maxValues.apartment_price,
        maxValues.house_price
    );
    
    // Round up to nearest thousand
    const roundedMaxPrice = Math.ceil(maxPrice / 1000) * 1000;

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
                datalabels: {
                    display: false
                },
                legend: {
                    position: 'right',
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
                    onLeave: function() {
                        const tooltipEl = document.getElementById('chart-tooltip');
                        if (tooltipEl) {
                            tooltipEl.style.display = 'none';
                        }
                    }
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
                            return price === 0 ? 
                                'No price data available' : 
                                label.includes('Price') ? 
                                    `${label}: ${price.toFixed(0)} DKK` : 
                                    `Price: ${price.toFixed(0)} DKK`;
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
                    max: roundedMaxPrice
                }
            }
        }
    });
}

function createTotalProductionChart(plantData, index, maxValue) {
    const ctx = document.getElementById(`totalProductionChart${index}`).getContext('2d');
    
    const productionYears = Object.keys(plantData.production)
        .filter(year => !isNaN(parseInt(year)))
        .sort();

    // Calculate total production for each year by summing all fuel types
    const yearlyTotals = productionYears.map(year => {
        const yearData = plantData.production[year];
        const totalMWh = Object.entries(yearData).reduce((sum, [fuelType, value]) => {
            return sum + (value || 0);
        }, 0);
        return totalMWh;
    });

    // Calculate max production and round up to the nearest 100
    const maxProduction = Math.max(...yearlyTotals);
    const roundedMaxProduction = Math.ceil(maxProduction / 100) * 100;

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: productionYears,
            datasets: [{
                label: 'Total Production',
                data: yearlyTotals,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            if (value >= 1000) {
                                return `Total: ${(value / 1000).toFixed(1)}k TJ`;
                            }
                            return `Total: ${value.toFixed(1)} TJ`;
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
                datalabels: {
                    display: true,
                    formatter: function(value) {
                        if (value >= 1000) {
                            return `${Math.round(value / 1000)}k`;
                        }
                        return Math.round(value);
                    },
                    font: {
                        size: 10
                    },
                    offset: -20,
                    align: 'end',
                    anchor: 'end'
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    max: roundedMaxProduction, // Use the rounded max production
                    ticks: {
                        stepSize: 100, // Ensure step size is set to 100
                        font: {
                            size: 10
                        },
                        callback: function(value) {
                            return `${value.toLocaleString()} TJ`;
                        }
                    },
                    grid: {
                        color: '#E4E4E4'
                    }
                }
            }
        }
    });
}

function updateInfoBox(plantData, index) {
    const infoBox = document.querySelector(`.plant-column:nth-child(${index}) .info-box`);
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