import { Plant } from './classes/Plant.js';
import { initializeMap, loadMunicipalities, loadAreas } from './utils/javascript/map.js';
import { delay } from './utils/javascript/utils.js';
import { addPlantToSelection, removePlantFromSelection, updatePlantDisplay } from './utils/javascript/plantManagement.js';

// Create a tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("opacity", 0)
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("pointer-events", "none");

// Function to match plants with areas using the static dictionary
function matchPlantsWithAreas(plants, plantToAreaMap, areas) {
    const connections = [];
    for (const plant of plants) {
        const areaName = plantToAreaMap[plant.name];
        if (areaName) {
            const matchedArea = areas.find(area => area.properties.forsytekst === areaName);
            if (matchedArea) {
                plant.areaReference = matchedArea.properties.forsytekst;
                connections.push({ plant: plant.name, area: matchedArea.properties.forsytekst });
            }
        }
    }
    return connections;
}

// Load and display the map data
async function loadMapData() {
    const { svgMap, g, projection, path } = initializeMap();

    await loadMunicipalities(g, path);
    await loadAreas(g, path, tooltip);

    // Load and plot the facilities from the CSV file with a delay
    await delay(500); // Wait for 500 milliseconds

    const circlesGroup = g.append("g");

    d3.csv("data/addresses_with_coordinates.csv").then(function(data) {
        const circles = circlesGroup.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "circle") // Apply the circle class
            .attr("cx", d => projection([+d.longitude, +d.latitude])[0])
            .attr("cy", d => projection([+d.longitude, +d.latitude])[1])
            .attr("r", 3)
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`<strong>${d.name}</strong><br/>`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 5) + "px")
                       .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", function(event, d) {
                const plant = new Plant(d.name, d.address, d.latitude, d.longitude, d.metric1, d.metric2);
                if (event.ctrlKey) {
                    removePlantFromSelection(plant);
                } else {
                    addPlantToSelection(plant);
                }
            });
    });
}

// Call the function to load map data
loadMapData();