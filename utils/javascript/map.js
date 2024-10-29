import { capitalizeFirstLetters } from './utils.js';

export const widthMap = 800;
export const heightMap = 500;

export function initializeMap() {
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

    return { svgMap, g, projection, path };
}

export function loadMunicipalities(g, path) {
    return d3.json("maps/municipalities.geojson").then(function(geojson) {
        g.append("g")
            .selectAll("path")
            .data(geojson.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("class", "map-path"); // Apply the map-path class
    });
}

export function loadAreas(g, path, tooltip) {
    return d3.json("maps/areas.geojson").then(function(areasGeoJSON) {
        g.append("g")
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

        return areasGeoJSON;
    });
}