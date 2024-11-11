import { graphConfig } from '../config/graphConfig.js';

const LEGEND_THRESHOLD_PERCENTAGE = 2;

export function createTwoPlantComparison(data, validForsyids) {
    const graphContainer = document.getElementById('graph-container');
    
    const layout = {
        grid: {
            rows: 2,
            columns: 2,
            pattern: 'independent',
            roworder: 'top to bottom',
            rowheight: [0.6, 0.4]
        },
        height: 600,
        autosize: true,
        showlegend: true,
        legend: {
            orientation: 'v',
            x: 1.1,
            y: 0.5,
            traceorder: 'grouped'
        },
        margin: {
            t: 30,
            b: 100,
            l: 80,
            r: 150
        },
        hovermode: 'x unified',
        hoverlabel: {
            namelength: -1
        },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        width: graphContainer.clientWidth * 0.95,
        autosize: false
    };

    const traces = [];
    
    // Create production traces for both plants
    validForsyids.forEach((forsyid, index) => {
        const paddedForsyid = forsyid.toString().padStart(8, '0');
        const plantData = data[paddedForsyid];
        const years = Object.keys(plantData.production).sort();
        
        // Add total trace for hover info
        traces.push({
            x: years,
            y: years.map(() => 0),
            type: 'scatter',
            mode: 'lines',
            name: ' ',
            hovertemplate: 'Total: %{customdata:,.0f} TJ<extra></extra>',
            customdata: years.map(year => 
                Object.values(plantData.production[year]).reduce((sum, val) => sum + (val || 0), 0)
            ),
            showlegend: false,
            visible: true,
            yaxis: `y${index + 1}`,
            xaxis: `x${index + 1}`,
            line: {
                width: 0,
                color: 'rgba(0,0,0,0)'
            }
        });

        // Add title for each plant
        layout[`xaxis${index + 1}`] = {
            title: 'Time (Year)',
            domain: index === 0 ? [0, 0.45] : [0.55, 1],
            row: 1,
            column: index + 1,
            dtick: 1,
            range: [2021, 2023],
            showgrid: true,
            gridwidth: 1,
            gridcolor: '#E4E4E4'
        };
        layout[`yaxis${index + 1}`] = {
            title: 'Production (TJ)',
            domain: [0.6, 1],
            row: 1,
            column: index + 1,
            matches: 'y',
            rangemode: 'tozero',
            showgrid: true,
            gridwidth: 1,
            gridcolor: '#E4E4E4'
        };
        
        // Add price axes
        layout[`xaxis${index + 3}`] = {
            title: 'Time (Year)',
            domain: index === 0 ? [0, 0.45] : [0.55, 1],
            row: 2,
            column: index + 1,
            range: [2019, 2024],
            dtick: 1,
            showgrid: true,
            gridwidth: 1,
            gridcolor: '#E4E4E4'
        };
        layout[`yaxis${index + 3}`] = {
            title: 'Price (DKK)',
            domain: [0, 0.4],
            row: 2,
            column: index + 1,
            matches: 'y3',
            rangemode: 'tozero',
            showgrid: true,
            gridwidth: 1,
            gridcolor: '#E4E4E4'
        };

        // Add title annotation
        layout.annotations = layout.annotations || [];
        layout.annotations.push({
            text: plantData.name,
            showarrow: false,
            x: index === 0 ? 0.225 : 0.775,
            y: 1.1,
            xref: 'paper',
            yref: 'paper'
        });

        // Add production traces
        graphConfig.attributes.forEach(attr => {
            const mappedKeys = graphConfig.fuelTypes[attr];
            const y = years.map(year => {
                if (Array.isArray(mappedKeys)) {
                    return mappedKeys.reduce((sum, key) => 
                        sum + (plantData.production[year]?.[key] || 0), 0);
                }
                return plantData.production[year]?.[mappedKeys] || 0;
            });

            // Calculate the percentage contribution
            const totalProduction = y.reduce((sum, val) => sum + val, 0);
            const totalAllProduction = years.reduce((sum, year) => {
                return sum + Object.values(plantData.production[year])
                    .reduce((s, val) => s + (val || 0), 0);
            }, 0);
            const contributionPercentage = (totalProduction / totalAllProduction) * 100;
            const meetsThreshold = contributionPercentage >= LEGEND_THRESHOLD_PERCENTAGE;

            // Create hover text with percentage
            const hoverText = years.map(year => {
                const yearValue = y[years.indexOf(year)];
                const yearTotal = Object.values(plantData.production[year])
                    .reduce((sum, val) => sum + (val || 0), 0);
                const yearPercentage = (yearValue / yearTotal) * 100;
                return `%{y:,.0f} TJ (${attr} - ${yearPercentage.toFixed(1)}%)`; 
            });

            traces.push({
                x: years,
                y: y,
                type: 'scatter',
                mode: 'lines',
                stackgroup: `plant${index + 1}`,
                name: attr,
                fill: 'tonexty',
                line: { width: 0.5, color: graphConfig.colors[attr] },
                fillcolor: graphConfig.colors[attr],
                xaxis: `x${index + 1}`,
                yaxis: `y${index + 1}`,
                showlegend: index === 0 && meetsThreshold,
                legendgroup: attr,
                hoverinfo: meetsThreshold ? 'name+y' : 'skip',
                hovertemplate: meetsThreshold ? hoverText : undefined,
                hoveron: meetsThreshold ? 'points+fills' : 'skip'
            });
        });

        // Add price traces
        ['mwh_price', 'apartment_price', 'house_price'].forEach((priceType, priceIndex) => {
            const priceColors = ['#FF4560', '#00E396', '#008FFB'];
            const priceNames = ['MWh Price', 'Apartment Price', 'House Price'];
            
            // Define full range of years for prices
            const fullYearRange = ['2019', '2020', '2021', '2022', '2023', '2024'];
            
            traces.push({
                x: fullYearRange,
                y: fullYearRange.map(year => plantData.prices[year]?.[priceType] || null),
                type: 'scatter',
                mode: 'lines+markers',
                name: priceNames[priceIndex],
                line: { color: priceColors[priceIndex], width: 2 },
                xaxis: `x${index + 3}`,
                yaxis: `y${index + 3}`,
                showlegend: index === 0,
                legendgroup: priceNames[priceIndex]
            });
        });
    });

    // Create and update the plot - simplified version without facts
    function updatePlot() {
        Plotly.react(graphContainer, traces, layout);
    }

    // Initial plot
    updatePlot();

    // Return empty cleanup function
    return () => {};
} 