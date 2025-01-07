import { graphConfig } from '../config/graphConfig.js';
import { legendTooltips, tooltipStyle } from '../config/tooltipConfig.js';
import { municipalitiesVisible } from '../../utils/javascript/municipalitiesFunctions.js';

export function createOverviewPlants(data, selectedForsyids) {
    // Only handle if we have more than 10 plants
    if (!selectedForsyids || selectedForsyids.length <= 10) return false;

    const graphContainer = document.getElementById('graph-container');
    
    // Create the structure
    graphContainer.innerHTML = `
        <div class="graphs-wrapper">
            <h2 class="graph-title">Overview of ${selectedForsyids.length} ${municipalitiesVisible ? 'Municipalities' : 'Plants'}</h2>
            <div class="graphs-container">
                <div class="production-graph">
                    <canvas id="fuelDistributionChart"></canvas>
                </div>
                <div class="price-graph">
                    <canvas id="priceDistributionChart"></canvas>
                </div>
            </div>
        </div>
    `;

    createFuelDistributionChart(data, selectedForsyids);
    createPriceDistributionChart(data, selectedForsyids);

    return true;
}

function createFuelDistributionChart(data, selectedForsyids) {
    const ctx = document.getElementById('fuelDistributionChart').getContext('2d');
    
    // Get all available years from the data
    const years = new Set();
    selectedForsyids.forEach(forsyid => {
        const plantData = data[forsyid.toString().padStart(8, '0')];
        if (plantData?.production) {
            Object.keys(plantData.production)
                .filter(year => !isNaN(parseInt(year)))
                .forEach(year => years.add(year));
        }
    });
    const productionYears = Array.from(years).sort();

    // Initialize aggregated data structure
    const aggregatedProduction = {};
    Object.keys(graphConfig.fuelTypes).forEach(category => {
        aggregatedProduction[category] = productionYears.map(() => 0);
    });

    // Aggregate production data for all plants
    selectedForsyids.forEach(forsyid => {
        const plantData = data[forsyid.toString().padStart(8, '0')];
        if (!plantData?.production) return;

        Object.entries(graphConfig.fuelTypes).forEach(([category, fuelTypes]) => {
            productionYears.forEach((year, yearIndex) => {
                if (Array.isArray(fuelTypes)) {
                    // Sum up all fuel types in this category
                    const sum = fuelTypes.reduce((acc, fuelType) => 
                        acc + (plantData.production[year]?.[fuelType] || 0), 0);
                    aggregatedProduction[category][yearIndex] += sum;
                } else {
                    // Single fuel type
                    aggregatedProduction[category][yearIndex] += 
                        plantData.production[year]?.[fuelTypes] || 0;
                }
            });
        });
    });

    // Create datasets for the chart
    const datasets = Object.entries(aggregatedProduction)
        .map(([category, values]) => {
            // Calculate total production for this category
            const totalCategory = values.reduce((sum, val) => sum + val, 0);
            
            // Skip categories with no production
            if (totalCategory === 0) return null;

            return {
                label: category,
                data: values,
                backgroundColor: graphConfig.colors[category],
                borderColor: graphConfig.colors[category],
                fill: true,
                tension: 0.1
            };
        })
        .filter(dataset => dataset !== null);

    // Store initial data for reset functionality
    const initialData = {
        data,
        selectedForsyids,
        productionYears,
        datasets,
        aggregatedProduction
    };

    new Chart(ctx, {
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
            plugins: {
                datalabels: {
                    display: false  // Disable datalabels
                },
                title: {
                    display: true,
                    text: 'Aggregated Production Over Time'
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
                                }, 250);
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
                    })(),
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
                        text: 'Total Production (TJ)'
                    },
                    stacked: true,
                    grid: {
                        color: '#E4E4E4'
                    },
                    beginAtZero: true
                }
            },
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const year = productionYears[index];
                    createAggregatedPieChart(this, aggregatedProduction, year, initialData);
                }
            }
        }
    });
}

function createAggregatedPieChart(originalChart, aggregatedProduction, year, initialData) {
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
    const yearIndex = initialData.productionYears.indexOf(year);
    const pieData = Object.entries(aggregatedProduction)
        .map(([category, values]) => ({
            label: category,
            value: values[yearIndex] || 0,
            color: graphConfig.colors[category]
        }))
        .filter(item => item.value > 0);

    const total = pieData.reduce((sum, item) => sum + item.value, 0);

    // Destroy old chart
    originalChart.destroy();

    // Create new pie chart
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
                datalabels: {
                    display: false
                },
                title: {
                    display: true,
                    text: `Aggregated Production Distribution ${year}`
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
                    },
                    onHover: (e, legendItem, legend) => {
                        e.native.target.style.cursor = 'pointer';
                    },
                    onLeave: (e, legendItem, legend) => {
                        e.native.target.style.cursor = 'default';
                    }
                }
            }
        },
        plugins: [{
            id: 'legendDoubleClick',
            beforeInit: function(chart) {
                let lastClick = 0;
                let lastClickedIndex = -1;
                
                chart.legend.options.onClick = function(e, legendItem, legend) {
                    const index = legendItem.index;
                    const chart = legend.chart;
                    const meta = chart.getDatasetMeta(0);
                    const currentTime = new Date().getTime();
                    
                    // Check for double click (within 300ms)
                    if (currentTime - lastClick < 300 && lastClickedIndex === index) {
                        // Double click - focus on this segment
                        const data = chart.data;
                        const labels = data.labels;
                        const datasets = data.datasets;
                        
                        // Show only the clicked segment
                        meta.data.forEach((dataPoint, i) => {
                            dataPoint.hidden = i !== index;
                        });
                        
                        chart.update();
                    } else {
                        // Single click - toggle visibility
                        meta.data[index].hidden = !meta.data[index].hidden;
                        chart.update();
                    }
                    
                    lastClick = currentTime;
                    lastClickedIndex = index;
                };
            }
        }]
    });

    // Add reset button functionality
    resetBtn.onclick = () => {
        resetBtn.remove();
        newChart.destroy();
        createOverviewPlants(initialData.data, initialData.selectedForsyids);
    };

    return newChart;
}

function createPriceDistributionChart(data, selectedForsyids) {
    const ctx = document.getElementById('priceDistributionChart').getContext('2d');
    
    // Define years we want to show
    const years = ['2019', '2020', '2021', '2022', '2023', '2024'];
    
    // Initialize aggregated price data
    const aggregatedPrices = {
        mwh_price: years.map(() => 0),
        apartment_price: years.map(() => 0),
        house_price: years.map(() => 0)
    };
    
    // Count plants with price data for averaging
    const plantCounts = {
        mwh_price: years.map(() => 0),
        apartment_price: years.map(() => 0),
        house_price: years.map(() => 0)
    };

    // Aggregate price data
    selectedForsyids.forEach(forsyid => {
        const plantData = data[forsyid.toString().padStart(8, '0')];
        if (!plantData?.prices) return;

        years.forEach((year, index) => {
            if (plantData.prices[year]) {
                ['mwh_price', 'apartment_price', 'house_price'].forEach(priceType => {
                    const price = plantData.prices[year][priceType];
                    if (price && price > 0) {
                        aggregatedPrices[priceType][index] += price;
                        plantCounts[priceType][index]++;
                    }
                });
            }
        });
    });

    // Calculate averages
    Object.keys(aggregatedPrices).forEach(priceType => {
        aggregatedPrices[priceType] = aggregatedPrices[priceType].map((sum, index) => 
            plantCounts[priceType][index] > 0 ? sum / plantCounts[priceType][index] : 0
        );
    });

    // Create datasets
    const datasets = [
        {
            label: 'Average MWh Price',
            data: aggregatedPrices.mwh_price,
            borderColor: '#FF6384',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            tension: 0.1,
            fill: true
        },
        {
            label: 'Average Apartment Price (Yearly)',
            data: aggregatedPrices.apartment_price,
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            tension: 0.1,
            fill: true
        },
        {
            label: 'Average House Price (Yearly)',
            data: aggregatedPrices.house_price,
            borderColor: '#4BC0C0',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            tension: 0.1,
            fill: true
        }
    ];

    new Chart(ctx, {
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
                datalabels: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Average Price Development'
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
        }
    });
}
