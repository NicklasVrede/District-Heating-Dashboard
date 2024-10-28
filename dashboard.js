// Load and display the map of Denmark
const widthMap = 800;
const heightMap = 500;

class Plant {
    constructor(name, address, latitude, longitude, metric1, metric2) {
        this.name = name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.metric1 = metric1;
        this.metric2 = metric2;
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
        plantDiv.innerHTML = `
            <h3>${plant.name}</h3>
            <p>Address: ${plant.address}</p>
            <p>Latitude: ${plant.latitude}</p>
            <p>Longitude: ${plant.longitude}</p>
            <p>Metric 1: ${plant.metric1}</p>
            <p>Metric 2: ${plant.metric2}</p>
        `;
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => removePlantFromSelection(plant));
        plantDiv.appendChild(removeButton);
        display.appendChild(plantDiv);
    });
}

const svgMap = d3.select("#map")
    .append("svg")
    .attr("width", widthMap)
    .attr("height", heightMap);

// Create a group for the map elements
const g = svgMap.append("g");

const projection = d3.geoMercator()
    .center([10, 56])
    .scale(4000)
    .translate([widthMap / 2, heightMap / 2]);

const path = d3.geoPath().projection(projection);

d3.json("data/denmark.geojson").then(function(geojson) {
    g.append("g")
        .selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "map-path"); // Apply the map-path class
});

// Create a tooltip
const tooltip = d3.select("#tooltip");

// Load and plot the facilities from the CSV file
d3.csv("data/addresses_with_coordinates.csv").then(function(data) {
    const circles = g.append("g")
        .selectAll("circle")
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

    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([1, 8]) // Set the zoom scale extent
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
            g.selectAll("circle")
                .attr("r", 3 / event.transform.k) // Adjust the radius based on the zoom level
                .style("stroke-width", 0.5 / event.transform.k); // Adjust the stroke width based on the zoom level
        });

    svgMap.call(zoom);
});