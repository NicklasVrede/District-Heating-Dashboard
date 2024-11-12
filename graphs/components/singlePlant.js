import { graphConfig } from '../config/graphConfig.js';
import { showToast } from './toast.js';

const LEGEND_THRESHOLD_PERCENTAGE = 2;

export function createSinglePlantGraph(data, forsyid, focus) {
    // Input validation
    if (!data || !forsyid) {
        console.error('Missing required parameters');
        return;
    }

    const graphContainer = document.getElementById('graph-container');
    if (!graphContainer) {
        console.error('Graph container not found');
        return;
    }

    const plantId = forsyid.toString().padStart(8, '0');
    const plantData = data[plantId];
    
    if (!plantData?.production) {
        showToast("No data available for the selected plant");
        return;
    }

    // Clear and setup graph containers
    let titleElement = document.querySelector('.graph-title');
    let productionGraph = document.querySelector('.production-graph');
    let priceGraph = document.querySelector('.price-graph');
    let infoBox = document.querySelector('.info-box');

    // Create containers if they don't exist
    if (!titleElement) {
        titleElement = document.createElement('h2');
        titleElement.className = 'graph-title';
        graphContainer.insertBefore(titleElement, graphContainer.firstChild);
    }

    if (!productionGraph) {
        productionGraph = document.createElement('div');
        productionGraph.className = 'production-graph';
        graphContainer.appendChild(productionGraph);
    }

    if (!priceGraph) {
        priceGraph = document.createElement('div');
        priceGraph.className = 'price-graph';
        graphContainer.appendChild(priceGraph);
    }

    if (!infoBox) {
        infoBox = document.createElement('div');
        infoBox.className = 'info-box';
        graphContainer.appendChild(infoBox);
    }

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

    // Store initial data for reset functionality
    const initialData = {
        data: data,
        forsyid: forsyid,
        focus: focus,
        plantData: plantData,
        productionYears: productionYears,
        datasets: datasets
    };

    // Create chart
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

    // Update info box with plant facts
    updateInfoBox(plantData);

    return chart;
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
    const pieData = graphConfig.attributes.map(attr => {
        const mappedKeys = graphConfig.fuelTypes[attr];
        let value;
        
        if (Array.isArray(mappedKeys)) {
            value = mappedKeys.reduce((sum, key) => 
                sum + (yearData[key] || 0), 0);
        } else {
            value = yearData[mappedKeys] || 0;
        }

        return {
            label: attr,
            value: value,
            color: graphConfig.colors[attr]
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
                legend: {
                    position: 'right',
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
    
    // Create the content without the title
    infoBox.innerHTML = `
        <ul style="list-style: none; padding: 0;">
            <li><strong>Commissioned:</strong> ${commissionDate}</li>
            <li><strong>Electrical Capacity:</strong> ${plantData.elkapacitet_MW?.toFixed(1) || 'N/A'} MW</li>
            <li><strong>Heat Capacity:</strong> ${plantData.varmekapacitet_MW?.toFixed(1) || 'N/A'} MW</li>
            <li><strong>Total Area:</strong> ${plantData.total_area_km2?.toFixed(2) || 'N/A'} km²</li>
        </ul>
    `;
    
    // Show the info box
    infoBox.classList.add('visible');
} 