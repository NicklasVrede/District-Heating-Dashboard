import { graphConfig } from '../config/graphConfig.js';
import { showToast } from './toast.js';

const LEGEND_THRESHOLD_PERCENTAGE = 2;

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

    // Create datasets for each fuel type
    const datasets = graphConfig.attributes.map(attr => {
        const values = productionYears.map(year => {
            const mappedKeys = graphConfig.fuelTypes[attr];
            if (Array.isArray(mappedKeys)) {
                return mappedKeys.reduce((sum, key) => 
                    sum + (plantData.production[year]?.[key] || 0), 0);
            }
            return plantData.production[year]?.[mappedKeys] || 0;
        });

        // Calculate percentage contribution
        const totalAttr = values.reduce((sum, val) => sum + val, 0);
        const totalAll = productionYears.reduce((sum, year) => 
            sum + Object.values(plantData.production[year]).reduce((s, val) => s + (val || 0), 0), 0);
        const percentage = (totalAttr / totalAll) * 100;

        return {
            label: attr,
            data: values,
            backgroundColor: graphConfig.colors[attr],
            borderColor: graphConfig.colors[attr],
            fill: true,
            hidden: percentage < LEGEND_THRESHOLD_PERCENTAGE
        };
    });

    // Calculate the maximum stacked value for each year
    const maxStackedValue = productionYears.map(year => {
        return Object.values(plantData.production[year]).reduce((sum, val) => sum + (val || 0), 0);
    }).reduce((max, val) => Math.max(max, val), 0);

    // Round up to nearest thousand
    const roundedMax = Math.ceil(maxStackedValue / 1000) * 1000;

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
                        text: 'Production (TJ)'
                    },
                    stacked: true,
                    grid: {
                        color: '#E4E4E4'
                    },
                    beginAtZero: true,
                    max: maxValue // Use the shared rounded max value
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Production Distribution'
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
                            return `${context.dataset.label}: ${value.toFixed(0)} TJ (${percentage}%)`;
                        },
                        footer: function(tooltipItems) {
                            const total = tooltipItems.reduce(
                                (sum, item) => sum + item.raw, 
                                0
                            );
                            return `Total: ${total.toFixed(0)} TJ`;
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x'
                    },
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x'
                    }
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
                    }
                }
            }
        }
    });
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
            label: 'Apartment Price',
            data: years.map(year => plantData.prices?.[year]?.apartment_price || 0),
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            tension: 0.1,
            fill: true
        },
        {
            label: 'House Price',
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
                            return price === 0 ? 
                                'No price data available' : 
                                `Price: ${price.toFixed(0)} DKK`;
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x'
                    },
                    zoom: {
                        wheel: {
                            enabled: true
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

function updateInfoBox(plantData, index) {
    const infoBox = document.querySelector(`.plant-column:nth-child(${index}) .info-box`);
    if (!infoBox) return;

    const commissionDate = new Date(plantData.idrift).getFullYear();
    
    infoBox.innerHTML = `
        <ul style="list-style: none; padding: 0;">
            <li><strong>Commissioned:</strong> ${commissionDate}</li>
            <li><strong>Electrical Capacity:</strong> ${plantData.elkapacitet_MW?.toFixed(1) || 'N/A'} MW</li>
            <li><strong>Heat Capacity:</strong> ${plantData.varmekapacitet_MW?.toFixed(1) || 'N/A'} MW</li>
            <li><strong>Total Area:</strong> ${plantData.total_area_km2?.toFixed(2) || 'N/A'} km²</li>
        </ul>
    `;
    
    infoBox.classList.add('visible');
} 