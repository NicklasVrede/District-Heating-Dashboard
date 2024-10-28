const apiKey = 'e1337f0db4d14aeb8a69f6439fc005fc'; // Your OpenCage API key

function geocodeAddress(address) {
    return fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            if (data.results.length > 0) {
                const { lat, lng } = data.results[0].geometry;
                return { latitude: lat, longitude: lng };
            } else {
                throw new Error(`No results found for address: ${address}`);
            }
        });
}

function showCoordinates() {
    const address = document.getElementById('address').value;
    const resultElement = document.getElementById('result');
    geocodeAddress(address)
        .then(coordinates => {
            resultElement.innerText = `Address found!`;
            resultElement.style.color = 'green';
            plotCoordinates(coordinates, address);
            zoomToCoordinates(coordinates);
        })
        .catch(error => {
            resultElement.innerText = error.message;
            resultElement.style.color = 'red';
        });
}

function plotCoordinates(coordinates, address) {
    const svgMap = d3.select("#map svg");
    const g = svgMap.select("g"); // Select the existing group element

    const projection = d3.geoMercator()
        .center([10, 56])
        .scale(4000)
        .translate([svgMap.attr("width") / 2, svgMap.attr("height") / 2]);

    const [x, y] = projection([coordinates.longitude, coordinates.latitude]);

    const tooltip = d3.select("#tooltip");

    const circle = g.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 3)
        .attr("fill", "blue")
        .attr("stroke", "black")
        .style("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(
                `<strong>${address}</strong><br/>` +
                `<em>Ctrl+Click to remove</em>`
            )                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 5) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function(event) {
            // Remove the point if Ctrl key is pressed
            if (event.ctrlKey) {
                d3.select(this).remove();
            }
        })
        .append("title")
        .text(`Latitude: ${coordinates.latitude}, Longitude: ${coordinates.longitude}`);
}

function zoomToCoordinates(coordinates) {
    const svgMap = d3.select("#map svg");
    const g = svgMap.select("g"); // Select the existing group element

    const projection = d3.geoMercator()
        .center([10, 56])
        .scale(4000)
        .translate([svgMap.attr("width") / 2, svgMap.attr("height") / 2]);

    const [x, y] = projection([coordinates.longitude, coordinates.latitude]);

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
            g.selectAll("circle")
                .attr("r", 3 / event.transform.k)
                .style("stroke-width", 0.5 / event.transform.k);
        });

    svgMap.call(zoom);

    const transform = d3.zoomIdentity
        .translate(svgMap.attr("width") / 2 - x * 4, svgMap.attr("height") / 2 - y * 4)
        .scale(4);

    svgMap.transition()
        .duration(750)
        .call(zoom.transform, transform);
}