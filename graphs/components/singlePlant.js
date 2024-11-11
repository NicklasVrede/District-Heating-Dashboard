import { graphConfig } from '../config/graphConfig.js';
import { showToast } from './toast.js';

// Percentage for including the color in legend
const LEGEND_THRESHOLD_PERCENTAGE = 2; // Minimum percentage to show in legend

function createResetButton(container, callback) {
    const existingButton = container.querySelector('.reset-zoom-btn');
    if (existingButton) {
        return existingButton;
    }

    const resetBtn = document.createElement('button');
    resetBtn.innerHTML = 'Exit Distribution View';
    resetBtn.className = 'reset-zoom-btn';
    resetBtn.onclick = callback;
    container.appendChild(resetBtn);
    return resetBtn;
}

export function createSinglePlantGraph(data, forsyid, focus) {
    const graphContainer = document.getElementById('graph-container');
    const plantData = data[forsyid.toString().padStart(8, '0')];
    
    if (!plantData) {
        showToast("No data available for the selected plant");
        Plotly.purge(graphContainer);
        return;
    }

    if (!plantData.production || Object.keys(plantData.production).length === 0) {
        showToast("No production data available for the selected plant");
        Plotly.purge(graphContainer);
        return;
    }

    const attributeMapping = {
        'Kul': 'kul',
        'Olie': ['fuelolie', 'spildolie', 'gasolie'],
        'Gas': ['naturgas', 'lpg', 'raffinaderigas'],
        'Affald': 'affald',
        'Biogas': 'biogas',
        'Skovflis': 'skovflis',
        'Halm': 'halm',
        'Træaffald': 'trae- og biomasseaffald',
        'Træpiller': 'traepiller',
        'Biobrændsler (bioolie)': 'bio-olie',
        'Varmepumper': ['omgivelsesvarme', 'braendselsfrit'],
        'Solvarme': 'solenergi',
        'Elektricitet': 'elektricitet'
    };

    const productionYears = Object.keys(plantData.production)
        .filter(year => !isNaN(parseInt(year)))
        .sort();

    const priceYears = Object.keys(plantData.prices)
        .filter(year => !isNaN(parseInt(year)))
        .sort();

    const layout = {
        grid: {
            rows: 2,
            columns: 1,
            pattern: 'independent',
            roworder: 'top to bottom',
            rowheight: [0.6, 0.4]
        },
        height: 600,
        title: `${plantData.name}`,
        showlegend: true,
        legend: {
            orientation: 'v',
            x: 1.1,
            y: 0.5,
            xanchor: 'left',
        },
        hovermode: 'x unified',
        hoverlabel: {
            namelength: -1
        },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        margin: {
            t: 50,
            b: 100,
            l: 80,
            r: 150
        },
        xaxis: {
            title: 'Time (Year)',
            showgrid: true,
            gridwidth: 1,
            gridcolor: '#E4E4E4',
            domain: [0, 1],
            dtick: 1,
            hovertemplate: '%{x} - Total: %{customdata:,.0f} TJ<br>'
        },
        xaxis2: {
            title: 'Time (Year)',
            showgrid: true,
            gridwidth: 1,
            gridcolor: '#E4E4E4',
            domain: [0, 1],
            dtick: 1
        },
        yaxis: {
            title: 'Production (TJ)',
            showgrid: true,
            gridwidth: 1,
            gridcolor: '#E4E4E4',
            rangemode: 'tozero'
        },
        yaxis2: {
            title: 'Price (DKK)',
            showgrid: true,
            gridwidth: 1,
            gridcolor: '#E4E4E4',
            rangemode: 'tozero'
        },
        width: graphContainer.clientWidth * 0.95,
        autosize: false
    };

    const productionTraces = graphConfig.attributes.map((attr, index) => {
        const mappedKeys = graphConfig.fuelTypes[attr];
        const y = productionYears.map(year => {
            if (Array.isArray(mappedKeys)) {
                return mappedKeys.reduce((sum, key) => 
                    sum + (plantData.production[year]?.[key] || 0), 0);
            } else if (mappedKeys) {
                return plantData.production[year]?.[mappedKeys] || 0;
            }
            return 0;
        });

        // Calculate the percentage contribution of this fuel type
        const totalProduction = productionYears.reduce((sum, year) => {
            return sum + y[productionYears.indexOf(year)];
        }, 0);

        const totalAllProduction = productionYears.reduce((sum, year) => {
            return sum + Object.values(plantData.production[year]).reduce((s, val) => s + (val || 0), 0);
        }, 0);

        const contributionPercentage = (totalProduction / totalAllProduction) * 100;
        const meetsThreshold = contributionPercentage >= LEGEND_THRESHOLD_PERCENTAGE;

        // Create hover text with percentage
        const hoverText = productionYears.map(year => {
            const yearValue = y[productionYears.indexOf(year)];
            const yearTotal = Object.values(plantData.production[year]).reduce((sum, val) => sum + (val || 0), 0);
            const yearPercentage = (yearValue / yearTotal) * 100;
            return `%{y:,.0f} TJ (${attr} - ${yearPercentage.toFixed(1)}%)`; 
        });

        return {
            x: productionYears,
            y: y,
            type: 'scatter',
            mode: 'lines',
            stackgroup: 'one',
            name: attr,
            fill: 'tonexty',
            line: {
                width: 0.5,
                color: graphConfig.colors[attr]
            },
            fillcolor: graphConfig.colors[attr],
            yaxis: 'y',
            xaxis: 'x',
            showlegend: meetsThreshold,
            hoverinfo: meetsThreshold ? 'name+y' : 'skip',
            hovertemplate: meetsThreshold ? hoverText : undefined,
            visible: true,
            legendgroup: attr,
            hoveron: meetsThreshold ? 'points+fills' : 'skip'
        };
    });

    // Add a trace for the total (invisible but shows in hover)
    const totalTrace = {
        x: productionYears,
        y: productionYears.map(() => 0),  // Dummy values
        type: 'scatter',
        mode: 'lines',
        name: ' ',  // Empty name to avoid showing the line marker
        hovertemplate: 'Total: %{customdata:,.0f} TJ<extra></extra>',  // Add "Total: " to the template
        customdata: productionYears.map(year => 
            Object.values(plantData.production[year]).reduce((sum, val) => sum + (val || 0), 0)
        ),
        showlegend: false,
        visible: true,
        yaxis: 'y',
        xaxis: 'x',
        line: {
            width: 0,
            color: 'rgba(0,0,0,0)'
        }
    };

    const priceTraces = [
        {
            x: priceYears,
            y: priceYears.map(year => plantData.prices[year]?.mwh_price || null),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'MWh Price (DKK)',
            line: {
                color: '#FF4560',
                width: 2
            },
            yaxis: 'y2',
            xaxis: 'x2',
            showlegend: true
        },
        {
            x: priceYears,
            y: priceYears.map(year => plantData.prices[year]?.apartment_price || null),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Apartment Price (DKK)',
            line: {
                color: '#00E396',
                width: 2
            },
            yaxis: 'y2',
            xaxis: 'x2',
            showlegend: true
        },
        {
            x: priceYears,
            y: priceYears.map(year => plantData.prices[year]?.house_price || null),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'House Price (DKK)',
            line: {
                color: '#008FFB',
                width: 2
            },
            yaxis: 'y2',
            xaxis: 'x2',
            showlegend: true
        }
    ];

    const allTraces = [totalTrace, ...productionTraces, ...priceTraces];

    // Clean up any existing facts div
    const existingFactsDiv = document.getElementById('plant-facts');
    if (existingFactsDiv) {
        existingFactsDiv.remove();
    }

    // Update the facts section with capacity and area information
    if (plantData.idrift) {
        const factsDiv = document.createElement('div');
        factsDiv.id = 'plant-facts';
        factsDiv.innerHTML = `
            <h3>${plantData.name}</h3>
            <p>In operation since: ${new Date(plantData.idrift).toLocaleDateString('da-DK')}</p>
            ${plantData.elkapacitet_MW ? `<p>Electrical Capacity: ${plantData.elkapacitet_MW.toLocaleString('da-DK', {maximumFractionDigits: 2})} MW</p>` : ''}
            ${plantData.varmekapacitet_MW ? `<p>Heat Capacity: ${plantData.varmekapacitet_MW.toLocaleString('da-DK', {maximumFractionDigits: 2})} MW</p>` : ''}
            ${plantData.total_area_km2 ? `<p>Supply Area: ${plantData.total_area_km2.toLocaleString('da-DK', {maximumFractionDigits: 2})} km²</p>` : ''}
        `;
        // Insert facts div at the end of graph container
        graphContainer.appendChild(factsDiv);
    }

    // Initial render with event binding
    Plotly.newPlot(graphContainer, allTraces, layout).then(() => {
        graphContainer.on('plotly_relayout', function(eventdata) {
            console.log('Zoom event detected:', eventdata);

            // Check if we're zoomed to a single year
            if (eventdata['xaxis.range[0]'] && eventdata['xaxis.range[1]']) {
                const zoomRange = eventdata['xaxis.range[1]'] - eventdata['xaxis.range[0]'];
                console.log('Zoom range:', zoomRange);
                
                // If zoomed to roughly 1 year or less
                if (zoomRange <= 1.0) {  // Increased threshold to 1 year
                    const year = Math.round(eventdata['xaxis.range[0]']).toString();
                    console.log('Creating pie chart for year:', year);
                    
                    // Check if we have data for this year
                    if (!plantData.production[year]) {
                        console.log('No data available for year:', year);
                        return;
                    }

                    // Create reset button
                    createResetButton(graphContainer, () => {
                        // Switch back to original graph
                        Plotly.react(graphContainer, allTraces, layout).then(() => {
                            // Remove the reset button after resetting
                            const resetBtn = document.querySelector('.reset-zoom-btn');
                            if (resetBtn) resetBtn.remove();
                        });
                    });

                    // Create pie chart data for the selected year
                    const pieData = [{
                        values: graphConfig.attributes
                            .filter(attr => {
                                const mappedKeys = graphConfig.fuelTypes[attr];
                                let value = 0;
                                try {
                                    if (Array.isArray(mappedKeys)) {
                                        value = mappedKeys.reduce((sum, key) => 
                                            sum + (plantData.production[year]?.[key] || 0), 0);
                                    } else if (mappedKeys) {
                                        value = plantData.production[year]?.[mappedKeys] || 0;
                                    }
                                    const yearTotal = Object.values(plantData.production[year])
                                        .reduce((sum, val) => sum + (val || 0), 0);
                                    const percentage = (value / yearTotal) * 100;
                                    return percentage >= LEGEND_THRESHOLD_PERCENTAGE;
                                } catch (e) {
                                    console.log('Error calculating value for', attr, e);
                                    return false;
                                }
                            })
                            .map(attr => {
                                const mappedKeys = graphConfig.fuelTypes[attr];
                                if (Array.isArray(mappedKeys)) {
                                    return mappedKeys.reduce((sum, key) => 
                                        sum + (plantData.production[year]?.[key] || 0), 0);
                                }
                                return plantData.production[year]?.[mappedKeys] || 0;
                            }),
                        labels: graphConfig.attributes
                            .filter(attr => {
                                const mappedKeys = graphConfig.fuelTypes[attr];
                                let value = 0;
                                try {
                                    if (Array.isArray(mappedKeys)) {
                                        value = mappedKeys.reduce((sum, key) => 
                                            sum + (plantData.production[year]?.[key] || 0), 0);
                                    } else if (mappedKeys) {
                                        value = plantData.production[year]?.[mappedKeys] || 0;
                                    }
                                    const yearTotal = Object.values(plantData.production[year])
                                        .reduce((sum, val) => sum + (val || 0), 0);
                                    const percentage = (value / yearTotal) * 100;
                                    return percentage >= LEGEND_THRESHOLD_PERCENTAGE;
                                } catch (e) {
                                    console.log('Error calculating value for', attr, e);
                                    return false;
                                }
                            }),
                        type: 'pie',
                        hole: 0.4,
                        marker: {
                            colors: graphConfig.attributes
                                .filter(attr => {
                                    const mappedKeys = graphConfig.fuelTypes[attr];
                                    let value = 0;
                                    try {
                                        if (Array.isArray(mappedKeys)) {
                                            value = mappedKeys.reduce((sum, key) => 
                                                sum + (plantData.production[year]?.[key] || 0), 0);
                                        } else if (mappedKeys) {
                                            value = plantData.production[year]?.[mappedKeys] || 0;
                                        }
                                        const yearTotal = Object.values(plantData.production[year])
                                            .reduce((sum, val) => sum + (val || 0), 0);
                                        const percentage = (value / yearTotal) * 100;
                                        return percentage >= LEGEND_THRESHOLD_PERCENTAGE;
                                    } catch (e) {
                                        console.log('Error calculating value for', attr, e);
                                        return false;
                                    }
                                })
                                .map(attr => graphConfig.colors[attr])
                        },
                        hovertemplate: '%{label}: %{value:,.0f} TJ (%{percent:.1f}%)<extra></extra>'
                    }];

                    // Modify pie layout to maintain grid structure
                    const pieLayout = {
                        grid: layout.grid,  // Keep the original grid
                        height: layout.height,
                        showlegend: true,
                        legend: layout.legend,
                        width: graphContainer.clientWidth * 0.95,
                        autosize: false,
                        // Add specific subplot settings
                        annotations: [{
                            text: `Production Distribution ${year}`,
                            showarrow: false,
                            x: 0.5,
                            y: 1,
                            xref: 'paper',
                            yref: 'paper',
                            xanchor: 'center',
                            yanchor: 'bottom'
                        }]
                    };

                    // Create combined data with pie chart and price traces
                    const combinedData = [
                        {...pieData[0], domain: {row: 0, column: 0}},  // Add domain for pie chart
                        ...priceTraces  // Keep price traces
                    ];

                    // Update the plot with combined data
                    Plotly.react(graphContainer, combinedData, pieLayout).then(() => {
                        // Add double click handler for pie chart
                        graphContainer.on('plotly_doubleclick', function() {
                            Plotly.react(graphContainer, allTraces, layout).then(() => {
                                Plotly.relayout(graphContainer, {
                                    'xaxis.autorange': true,
                                    'yaxis.autorange': true,
                                    'xaxis2.autorange': true,
                                    'yaxis2.autorange': true
                                });
                            });
                        });
                    });
                } else {
                    // Remove reset button if we're zoomed out
                    const resetBtn = document.querySelector('.reset-zoom-btn');
                    if (resetBtn) resetBtn.remove();
                    
                    // Switch back to original graph
                    Plotly.react(graphContainer, allTraces, layout);
                }
            }
        });
    });
} 