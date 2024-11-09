import { graphConfig } from '../config/graphConfig.js';
import { showToast } from './toast.js';

export function createOrUpdatePlotlyGraph(data, selectedForsyids) {
    const graphContainer = document.getElementById('graph-container');

    if (!selectedForsyids || selectedForsyids.length === 0) {
        console.error('No forsyid selected');
        if (graphContainer.data && graphContainer.data.length > 0) {
            Plotly.purge(graphContainer);
        }
        return;
    }

    // Filter out forsyids with no data
    const validForsyids = selectedForsyids.filter(forsyid => {
        const forsyidData = data[forsyid];
        return forsyidData && Object.keys(forsyidData.production).length > 0;
    });

    if (validForsyids.length === 0) {
        console.warn('No valid data found for selected plants');
        showToast("No data available for the selected plant(s)");
        Plotly.purge(graphContainer);
        return;
    }

    const traces = graphConfig.attributes.map(attr => {
        const x = [];
        const y = [];

        validForsyids.forEach(forsyid => {
            const forsyidData = data[forsyid];
            if (forsyidData) {
                x.push(forsyidData.name);
                const years = Object.keys(forsyidData.production);
                const value = years.reduce((sum, year) => sum + (forsyidData.production[year][attr] || 0), 0);
                y.push(value);
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
        title: 'Production for Selected Plants',
        xaxis: { title: 'Plants' },
        yaxis: { title: 'Production (GJ)' },
        barmode: 'stack'
    };

    Plotly.react(graphContainer, traces, layout);
} 