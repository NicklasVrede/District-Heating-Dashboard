import { graphConfig } from '../config/graphConfig.js';
import { showToast } from './toast.js';

export function createOrUpdatePlotlyGraph(data, selectedForsyids) {
    const graphContainer = document.getElementById('graph-container');
    
    if (!selectedForsyids || selectedForsyids.length === 0) {
        if (graphContainer.data && graphContainer.data.length > 0) {
            Plotly.purge(graphContainer);
        }
        return;
    }

    const validForsyids = selectedForsyids.filter(forsyid => {
        const paddedForsyid = forsyid.toString().padStart(8, '0');
        const forsyidData = data[paddedForsyid];
        return forsyidData && Object.keys(forsyidData.production).length > 0;
    });

    if (validForsyids.length === 0) {
        showToast("No data available for the selected plant(s)");
        Plotly.purge(graphContainer);
        return;
    }

    // Create bar chart for 3+ plants
    const years = ['2021', '2022', '2023'];
    const traces = graphConfig.attributes.map(attr => {
        const x = [];
        const y = [];
        const mappedKeys = graphConfig.fuelTypes[attr];

        validForsyids.forEach(forsyid => {
            const paddedForsyid = forsyid.toString().padStart(8, '0');
            const plantData = data[paddedForsyid];
            
            if (plantData) {
                x.push(plantData.name);
                
                const totalValue = years.reduce((sum, year) => {
                    if (Array.isArray(mappedKeys)) {
                        return sum + mappedKeys.reduce((keySum, key) => 
                            keySum + (plantData.production[year]?.[key] || 0), 0);
                    } else if (mappedKeys) {
                        return sum + (plantData.production[year]?.[mappedKeys] || 0);
                    }
                    return sum;
                }, 0);
                
                const averageValue = totalValue / years.length;
                y.push(averageValue);
            }
        });

        return {
            x: x,
            y: y,
            type: 'bar',
            name: attr,
            marker: { color: graphConfig.colors[attr] }
        };
    });

    const layout = {
        title: 'Average Production by Plant',
        xaxis: { 
            title: 'Plants',
            tickangle: -45
        },
        yaxis: { 
            title: 'Average Production (TJ)',
            rangemode: 'tozero'
        },
        barmode: 'stack',
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.2
        },
        margin: {
            b: 150
        }
    };
    
    Plotly.react(graphContainer, traces, layout);
} 