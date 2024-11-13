import { graphConfig } from '../config/graphConfig.js';
import { showToast } from './toast.js';

// Keep track of current charts
let currentCharts = {
    production: null,
    price: null
};

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

    // Create the structure only when needed
    graphContainer.innerHTML = `
        <div class="graph-header">
            <h2 class="graph-title">Multiple Plants Comparison</h2>
            <div class="year-slider-container" id="year-slider-container" style="display: ${focus === 'none' ? 'none' : 'block'}">
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
            <div class="production-graph">
                <canvas id="productionChart"></canvas>
            </div>
            <div class="price-graph">
                <canvas id="priceChart"></canvas>
            </div>
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
    createPriceChart(data, validForsyids, defaultYear, focus);

    return () => cleanupCharts();
}

function setupYearSliderListener(data, validForsyids, focus) {
    const yearSlider = document.getElementById('year-slider');
    const yearLabel = document.getElementById('year-label');
    
    if (yearSlider && yearLabel) {
        yearSlider.addEventListener('input', (e) => {
            const selectedYear = e.target.value;
            yearLabel.textContent = selectedYear;
            
            const effectiveYear = getEffectiveYear(selectedYear, focus);
            createProductionChart(data, validForsyids, effectiveYear, focus);
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
    currentCharts = { production: null, price: null };
}

function createProductionChart(data, validForsyids, currentYear, focus) {
    console.log('Creating production chart with focus:', focus);
    // Clamp production year between 2021 and 2023
    const effectiveYear = Math.min(Math.max(currentYear, '2021'), '2023');
    
    const canvas = document.getElementById('productionChart');
    
    // Destroy existing chart if it exists
    if (currentCharts.production) {
        currentCharts.production.destroy();
    }

    const ctx = canvas.getContext('2d');

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
                        sum + (plantData.production[effectiveYear]?.[key] || 0), 0);
                } else {
                    value = plantData.production[effectiveYear]?.[mappedKeys] || 0;
                }
                
                datasets[index].data.push(value);
            });
        }
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

    // Create new chart
    currentCharts.production = new Chart(ctx, {
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
                    text: titleText
                },
                legend: {
                    position: 'right',
                    align: 'start'
                }
            }
        }
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
            plantNames.push(plantData.name);
            houseData.push(plantData.prices[currentYear].house_price || 0);
            apartmentData.push(plantData.prices[currentYear].apartment_price || 0);
            mwhData.push(plantData.prices[currentYear].mwh_price || 0);
        }
    });

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