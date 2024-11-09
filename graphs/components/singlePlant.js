import { graphConfig } from '../config/graphConfig.js';
import { showToast } from './toast.js';

export function createSinglePlantGraph(data, forsyid, focus) {
    const graphContainer = document.getElementById('graph-container');
    const plantData = data[forsyid];
    
    if (!plantData) {
        console.error(`No data found for forsyid ${forsyid}`);
        showToast("No data available for the selected plant");
        Plotly.purge(graphContainer);
        return;
    }

    // Check if there's any production data
    if (!plantData.production || Object.keys(plantData.production).length === 0) {
        console.error(`No production data found for forsyid ${forsyid}`);
        showToast("No production data available for the selected plant");
        Plotly.purge(graphContainer);
        return;
    }

    const years = ['2020', '2021', '2022'];
    const traces = graphConfig.attributes.map(attr => ({
        x: years,
        y: years.map(year => plantData.production[year]?.[attr] || 0),
        type: 'scatter',
        mode: 'lines',
        stackgroup: 'one',
        name: attr,
        fill: 'tonexty',
        line: {
            width: 0.5,
            color: graphConfig.colors[attr]
        },
        fillcolor: graphConfig.colors[attr]
    }));

    const layout = {
        title: `Production Over Time - ${plantData.name}`,
        xaxis: {
            title: 'Time (Year)',
            showgrid: true,
            gridwidth: 1,
            gridcolor: '#E4E4E4'
        },
        yaxis: {
            title: 'Production (GJ)',
            showgrid: true,
            gridwidth: 1,
            gridcolor: '#E4E4E4',
            rangemode: 'tozero'
        },
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.2
        },
        hovermode: 'x unified',
        plot_bgcolor: 'white',
        paper_bgcolor: 'white'
    };

    Plotly.react(graphContainer, traces, layout);
} 