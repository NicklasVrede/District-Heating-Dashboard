import { graphConfig } from '../config/graphConfig.js';
import { showToast } from './toast.js';

export function createOrUpdatePlotlyGraph(data, selectedForsyids) {
    const graphContainer = document.getElementById('graph-container');
    
    // Clear existing content
    graphContainer.innerHTML = `
        <h2 class="graph-title">Multiple Plants Comparison</h2>
        <div class="production-graph">
            <canvas id="productionChart"></canvas>
        </div>
        <div class="price-graph">
            <canvas id="priceChart"></canvas>
        </div>
    `;

    // Input validation
    if (!selectedForsyids || selectedForsyids.length === 0) {
        return;
    }

    const validForsyids = selectedForsyids.filter(forsyid => {
        const paddedForsyid = forsyid.toString().padStart(8, '0');
        const forsyidData = data[paddedForsyid];
        return forsyidData && Object.keys(forsyidData.production).length > 0;
    });

    if (validForsyids.length === 0) {
        showToast("No data available for the selected plant(s)");
        return;
    }

    // Create production chart
    createProductionChart(data, validForsyids);
    
    // Create price chart
    createPriceChart(data, validForsyids);

    return function cleanup() {
        const charts = Chart.instances;
        charts.forEach(chart => chart.destroy());
    };
}

function createProductionChart(data, validForsyids) {
    const ctx = document.getElementById('productionChart').getContext('2d');
    const currentYear = '2023'; // Or make this configurable

    const plantNames = [];
    const datasets = graphConfig.attributes.map(attr => {
        return {
            label: attr,
            data: [],
            backgroundColor: graphConfig.colors[attr],
        };
    });

    validForsyids.forEach(forsyid => {
        const paddedForsyid = forsyid.toString().padStart(8, '0');
        const plantData = data[paddedForsyid];
        
        if (plantData) {
            plantNames.push(plantData.name);
            
            graphConfig.attributes.forEach((attr, index) => {
                const mappedKeys = graphConfig.fuelTypes[attr];
                let value = 0;

                if (Array.isArray(mappedKeys)) {
                    value = mappedKeys.reduce((sum, key) => 
                        sum + (plantData.production[currentYear]?.[key] || 0), 0);
                } else {
                    value = plantData.production[currentYear]?.[mappedKeys] || 0;
                }
                
                datasets[index].data.push(value);
            });
        }
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: plantNames,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Plants'
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Production (TJ)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Production Distribution (${currentYear})`
                },
                legend: {
                    position: 'right',
                    align: 'start'
                }
            }
        }
    });
}

function createPriceChart(data, validForsyids) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    const currentYear = '2023';

    const plantNames = [];
    const houseData = [];
    const apartmentData = [];
    const mwhData = [];

    validForsyids.forEach(forsyid => {
        const paddedForsyid = forsyid.toString().padStart(8, '0');
        const plantData = data[paddedForsyid];
        
        if (plantData?.prices?.[currentYear]) {
            plantNames.push(plantData.name);
            houseData.push(plantData.prices[currentYear].house_price || 0);
            apartmentData.push(plantData.prices[currentYear].apartment_price || 0);
            mwhData.push(plantData.prices[currentYear].mwh_price || 0);
        }
    });

    new Chart(ctx, {
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
                        display: true,
                        text: 'Plants'
                    }
                },
                y: {
                    stacked: false,  // Disable stacking
                    title: {
                        display: true,
                        text: 'Price (DKK)'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Price Comparison (${currentYear})`
                },
                legend: {
                    position: 'right',
                    align: 'start'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toLocaleString()} DKK`;
                        }
                    }
                }
            }
        }
    });
} 