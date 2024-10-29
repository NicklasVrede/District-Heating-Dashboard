

// Load and display the map of Denmark
const widthMap = 800;
const heightMap = 500;

class Plant {
    constructor(name, address, latitude, longitude, metric1, metric2, areaReference = null) {
        this.name = name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.metric1 = metric1;
        this.metric2 = metric2;
        this.areaReference = areaReference; // Store reference to the matched area
    }
}

const selectedPlants = [];

function addPlantToSelection(plant) {
    selectedPlants.push(plant);
    updatePlantDisplay();
}

function removePlantFromSelection(plant) {
    const index = selectedPlants.findIndex(p => p.name === plant.name);
    if (index > -1) {
        selectedPlants.splice(index, 1);
    }
    updatePlantDisplay();
}

function updatePlantDisplay() {
    const display = document.getElementById('plant-display');
    display.innerHTML = ''; // Clear previous content

    selectedPlants.forEach(plant => {
        const plantDiv = document.createElement('div');
        plantDiv.className = 'plant-metrics';
        plantDiv.id = `plant-${plant.name.replace(/\s+/g, '-')}`; // Add an ID to the plant div
        plantDiv.innerHTML = `
            <h3>${plant.name}</h3>
            <p>Address: ${plant.address}</p>
            <p>Latitude: ${plant.latitude}</p>
            <p>Longitude: ${plant.longitude}</p>
            <p>Metric 1: ${plant.metric1}</p>
            <p>Metric 2: ${plant.metric2}</p>
            <p>Area Reference: ${plant.areaReference ? plant.areaReference : 'N/A'}</p>
        `;
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => removePlantFromSelection(plant));
        plantDiv.appendChild(removeButton);
        display.appendChild(plantDiv);
    });
}

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

// Define a delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
    // Define the SVG and group elements
    const svgMap = d3.select("#map")
        .append("svg")
        .attr("width", widthMap)
        .attr("height", heightMap);

    const g = svgMap.append("g");

    const projection = d3.geoMercator()
        .center([10, 56])
        .scale(4000)
        .translate([widthMap / 2, heightMap / 2]);

    const path = d3.geoPath().projection(projection);

    // Define the zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([1, 30]) // Set the zoom scale extent
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
            g.selectAll("circle")
                .attr("r", 3 / event.transform.k) // Adjust the radius based on the zoom level
                .style("stroke-width", 0.5 / event.transform.k); // Adjust the stroke width based on the zoom level
        });

    // Apply the zoom behavior to the SVG element
    svgMap.call(zoom);

    // Load and display the municipalities GeoJSON data
    await d3.json("maps/municipalities.geojson").then(function(geojson) {
        g.append("g")
            .selectAll("path")
            .data(geojson.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("class", "map-path"); // Apply the map-path class
    });

    // Load and display the areas GeoJSON data
    const areasGeoJSON = await d3.json("maps/areas.geojson");
    areasGroup = g.append("g")
        .attr("id", "areas-group")
        .selectAll("path")
        .data(areasGeoJSON.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", d => d.properties.forsytekst === 'Fjernvarme under rekonstruktion' ? 'area-path special-area' : 'area-path') // Apply a different class for special areas
        .attr("fill", "none")
        .attr("stroke", d => d.properties.forsytekst === 'Fjernvarme under rekonstruktion' ? 'red' : 'blue') // Change stroke color conditionally
        .attr("stroke-width", 1)
        .on("mouseover", function(event, d) {
            const transformedText = capitalizeFirstLetters(d.properties.forsytekst);
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<strong>${transformedText}</strong><br/>`)
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
        });

    // Load and plot the facilities from the CSV file with a delay
    await delay(500); // Wait for 500 milliseconds

    const circlesGroup = g.append("g");

    const plantsData = await d3.csv("data/addresses_with_coordinates.csv");
    const plants = plantsData.map(d => new Plant(d.name, d.address, d.latitude, d.longitude, d.metric1, d.metric2));

    // Load the static dictionary mapping plant names to area names
    const plantToAreaMap = await fetch('data/plant_to_area_map.json')
        .then(response => response.json())
        .catch(error => {
            console.error('Error loading plant_to_area_map.json:', error);
            return {};
        });

    // Match plants with areas
    const connections = matchPlantsWithAreas(plants, plantToAreaMap, areasGeoJSON.features);

    // Log all connections
    console.log('Connections:', connections);

    // Update plant instances with area references from the mapping
    plants.forEach(plant => {
        if (plantToAreaMap[plant.name]) {
            plant.areaReference = plantToAreaMap[plant.name];
        }
    });

    const circles = circlesGroup.selectAll("circle")
        .data(plants)
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
            if (event.ctrlKey) {
                removePlantFromSelection(d);
            } else {
                addPlantToSelection(d);
            }
        });
}

// Call the function to load map data
loadMapData();