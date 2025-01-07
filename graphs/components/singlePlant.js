import { graphConfig } from '../config/graphConfig.js';
import { showToast } from './toast.js';
import { legendTooltips, tooltipStyle } from '../config/tooltipConfig.js';

const LEGEND_THRESHOLD_PERCENTAGE = 0;

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
            <h2 class="graph-title"></h2>
            <div class="graphs-container">
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
    const ctx = document.getElementById('productionChart').getContext('2d');
    createPriceChart(plantData, priceGraph);

    // Process data
    const productionYears = Object.keys(plantData.production)
        .filter(year => !isNaN(parseInt(year)))
        .sort();

    // Calculate max production value
    let maxProductionValue = 0;
    productionYears.forEach(year => {
        const yearTotal = Object.entries(plantData.production[year])
            .filter(([key, _]) => key !== 'elprod' && key !== 'varmeprod')
            .reduce((sum, [_, val]) => sum + (val || 0), 0);
        maxProductionValue = Math.max(maxProductionValue, yearTotal);
    });

    // Round up to nearest tenth if less than 100, otherwise nearest hundred
    const roundedMaxProduction = maxProductionValue < 100 
        ? Math.ceil(maxProductionValue / 10) * 10 
        : Math.ceil(maxProductionValue / 100) * 100;

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

    // Store initial data for reset functionality
    const initialData = {
        data: data,
        forsyid: forsyid,
        focus: focus,
        plantData: plantData,
        productionYears: productionYears,
        datasets: datasets
    };

    // Create production chart with percentage-based Y-axis
    const chart = new Chart(ctx, {
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
                    const index = elements[0].index;
                    const year = productionYears[index];
                    createPieChart(this, plantData.production[year], year, initialData);
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
                    title: {
                        display: false
                    },
                    onHover: function(event, legendItem, legend) {
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
                    onLeave: function() {
                        const tooltipEl = document.getElementById('chart-tooltip');
                        if (tooltipEl) {
                            tooltipEl.style.display = 'none';
                        }
                    },
                    onClick: (function() {
                        let clickTimeout = null;
                        let clickCount = 0;

                        return function(e, legendItem, legend) {
                            clickCount++;
                            
                            if (clickCount === 1) {
                                clickTimeout = setTimeout(() => {
                                    // Single click behavior
                                    const index = legendItem.datasetIndex;
                                    const chart = legend.chart;
                                    const meta = chart.getDatasetMeta(index);
                                    meta.hidden = !meta.hidden;
                                    chart.update();
                                    
                                    clickCount = 0;
                                }, 250); // Adjust this delay as needed
                            } else if (clickCount === 2) {
                                clearTimeout(clickTimeout);
                                // Double click behavior
                                const chart = legend.chart;
                                const datasets = chart.data.datasets;
                                
                                // If all others are already hidden, show all (reset)
                                const allOthersHidden = datasets.every((dataset, i) => 
                                    i === legendItem.datasetIndex || chart.getDatasetMeta(i).hidden);
                                
                                datasets.forEach((dataset, i) => {
                                    const meta = chart.getDatasetMeta(i);
                                    meta.hidden = !allOthersHidden && (i !== legendItem.datasetIndex);
                                });
                                
                                chart.update();
                                clickCount = 0;
                            }
                        };
                    })()
                },
                datalabels: {
                    display: false
                }
            }
        }
    });

    // Add the total production chart
    const totalCtx = document.getElementById('totalProductionChart').getContext('2d');
    const totalChart = new Chart(totalCtx, {
        type: 'bar',
        data: {
            labels: productionYears,
            datasets: [
                {
                    label: 'Heat Production',
                    data: productionYears.map(year => 
                        plantData.production[year]?.varmeprod || 0
                    ),
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Electricity Production',
                    data: productionYears.map(year => 
                        plantData.production[year]?.elprod || 0
                    ),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }
            ]
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
                    max: roundedMaxProduction,
                    ticks: {
                        stepSize: Math.ceil(roundedMaxProduction / 10),
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
                    display: false
                },
                legend: {
                    display: true,
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
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const heatValue = context.chart.data.datasets[0].data[index];
                            const electricityValue = context.chart.data.datasets[1].data[index];
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
                    display: false  // Global default
                }
            }
        }
    });

    // Update info box with plant facts
    updateInfoBox(plantData);

    // Return cleanup function
    return function cleanup() {
        graphContainer.classList.remove('single-plant');
        if (chart) chart.destroy();
        if (totalChart) totalChart.destroy();
        if (priceChart) priceChart.destroy();
    };
}

function createPieChart(originalChart, yearData, year, initialData) {
    const ctx = originalChart.ctx;
    
    // Create reset button
    const container = ctx.canvas.parentElement;
    const resetBtn = document.createElement('button');
    resetBtn.innerHTML = 'Back to Timeline';
    resetBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 8px 16px;
        background-color: #fff;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
    `;
    container.appendChild(resetBtn);

    // Prepare pie data
    const pieData = Object.entries(graphConfig.fuelTypes).map(([category, fuelTypes]) => {
        let value;
        
        if (Array.isArray(fuelTypes)) {
            value = fuelTypes.reduce((sum, fuelType) => 
                sum + (yearData[fuelType] || 0), 0);
        } else {
            value = yearData[fuelTypes] || 0;
        }

        return {
            label: category,
            value: value,
            color: graphConfig.colors[category]
        };
    }).filter(item => item.value > 0);

    const total = pieData.reduce((sum, item) => sum + item.value, 0);

    // Destroy old chart with animation
    originalChart.destroy();

    // Create new chart with animation
    const newChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: pieData.map(item => item.label),
            datasets: [{
                data: pieData.map(item => item.value),
                backgroundColor: pieData.map(item => item.color),
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 800,
                easing: 'easeOutQuart'
            },
            plugins: {
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
                datalabels: {
                    display: false
                },
                legend: {
                    position: 'left',
                    labels: {
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const meta = chart.getDatasetMeta(0);
                                    const value = data.datasets[0].data[i];
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return {
                                        text: `${label} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: meta.data[i].hidden ?? false,
                                        index: i,
                                        strokeStyle: '#fff',
                                        lineWidth: 2
                                    };
                                });
                            }
                            return [];
                        },
                        usePointStyle: true,
                        padding: 8,
                        font: {
                            size: 11
                        }
                    },
                    onClick: function(e, legendItem, legend) {
                        const index = legendItem.index;
                        const chart = legend.chart;
                        const meta = chart.getDatasetMeta(0);
                        meta.data[index].hidden = !meta.data[index].hidden;
                        chart.update();
                    }
                }
            }
        }
    });

    // Add reset button functionality
    resetBtn.onclick = () => {
        resetBtn.remove();
        newChart.destroy();
        createSinglePlantGraph(initialData.data, initialData.forsyid, initialData.focus);
    };

    return newChart;
}

function createPriceChart(plantData, container) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
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
            label: 'Apartment Price (per year)',
            data: years.map(year => plantData.prices?.[year]?.apartment_price || 0),
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            tension: 0.1,
            fill: true
        },
        {
            label: 'House Price (per year)',
            data: years.map(year => plantData.prices?.[year]?.house_price || 0),
            borderColor: '#4BC0C0',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            tension: 0.1,
            fill: true
        }
    ];

    const chart = new Chart(ctx, {
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
                    display: false
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
                            return price === 0 ? 
                                'No price data available' : 
                                `${label}: ${price.toFixed(0)} DKK`;
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
                    beginAtZero: true
                }
            }
        }
    });

    return chart;
}

function updateInfoBox(plantData) {
    const infoBox = document.querySelector('.info-box');
    if (!infoBox) return;

    // Format the commissioning date
    const commissionDate = new Date(plantData.idrift).getFullYear();
    
    // Get the latest year's production data
    const productionYears = Object.keys(plantData.production || {})
        .filter(year => !isNaN(parseInt(year)))
        .sort((a, b) => b - a);  // Sort descending to get latest year first
    
    const latestYear = productionYears[0];
    const latestProduction = plantData.production?.[latestYear] || {};
    
    // Choose between population or area based on data type
    const areaOrPopulation = plantData.population ? 
        `<li><strong>Population:</strong> ${plantData.population.toLocaleString('da-DK')} (2024)</li>` :
        `<li><strong>Total Area:</strong> ${plantData.total_area_km2?.toFixed(2) || 'N/A'} km²</li>`;

    infoBox.innerHTML = `
        <ul style="list-style: none; padding: 0;">
            <li><strong>Commissioned:</strong> ${commissionDate}</li>
            ${areaOrPopulation}
            <li><strong>Electrical Capacity:</strong> ${plantData.elkapacitet_MW?.toFixed(1) || 'N/A'} MW</li>
            <li><strong>Electricity Production (${latestYear}):</strong> ${latestProduction.elprod?.toFixed(1) || 'N/A'} TJ</li>
            <li><strong>Heat Capacity:</strong> ${plantData.varmekapacitet_MW?.toFixed(1) || 'N/A'} MW</li>
            <li><strong>Heat Production (${latestYear}):</strong> ${latestProduction.varmeprod?.toFixed(1) || 'N/A'} TJ</li>
        </ul>
    `;
    
    // Show the info box
    infoBox.classList.add('visible');
} 