// Load and display the map of Denmark
const widthMap = 800;
const heightMap = 500;

const svgMap = d3.select("#map")
    .append("svg")
    .attr("width", widthMap)
    .attr("height", heightMap);

const projection = d3.geoMercator()
    .center([10, 56])
    .scale(4000)
    .translate([widthMap / 2, heightMap / 2]);

const path = d3.geoPath().projection(projection);

d3.json("data/denmark.geojson").then(function(geojson) {
    svgMap.append("g")
        .selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#ccc")
        .attr("stroke", "#333");
});

const apiKey = 'e1337f0db4d14aeb8a69f6439fc005fc'; // OpenCage API key

async function geocodeAddress(address) {
    const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`);
    const data = await response.json();
    if (data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry;
        return { latitude: lat, longitude: lng };
    } else {
        throw new Error(`No results found for address: ${address}`);
    }
}

async function showCoordinates() {
    const address = document.getElementById('address').value;
    try {
        const coordinates = await geocodeAddress(address);
        document.getElementById('result').innerText = `Latitude: ${coordinates.latitude}, Longitude: ${coordinates.longitude}`;
        plotCoordinates(coordinates);
    } catch (error) {
        document.getElementById('result').innerText = error.message;
    }
}

function plotCoordinates(coordinates) {
    svgMap.append("circle")
        .attr("cx", projection([coordinates.longitude, coordinates.latitude])[0])
        .attr("cy", projection([coordinates.longitude, coordinates.latitude])[1])
        .attr("r", 5)
        .attr("fill", "red")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .append("title")
        .text(`Latitude: ${coordinates.latitude}, Longitude: ${coordinates.longitude}`);
}