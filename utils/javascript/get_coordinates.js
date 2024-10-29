const apiKey = 'e1337f0db4d14aeb8a69f6439fc005fc'; // Your OpenCage API key

let areasGeoJSON; // Variable to store the areas GeoJSON data

// Load the areas GeoJSON data
d3.json("maps/areas.geojson").then(function(data) {
    areasGeoJSON = data;
});

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
    geocodeAddress(address)
        .then(coordinates => {
            showToast('Address found!', 'success');
            plotCoordinates(coordinates, address);
            zoomToCoordinates(coordinates);
        })
        .catch(error => {
            showToast(error.message, 'error');
        });
}

// Utility function to capitalize the first letter of each word and return the first two words
function capitalizeFirstLetters(str) {
    // Check if the text is "Fjernvarme under rekonstruktion"
    if (str === 'Fjernvarme under rekonstruktion') {
        return str;
    }

    return str.toLowerCase()
        .split(' ')
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Other code in get_coordinates.js

function plotCoordinates(coordinates, address) {
    const svgMap = d3.select("#map svg");
    const g = svgMap.select("g"); // Select the existing group element

    const projection = d3.geoMercator()
        .center([10, 56])
        .scale(4000)
        .translate([svgMap.attr("width") / 2, svgMap.attr("height") / 2]);

    const [x, y] = projection([coordinates.longitude, coordinates.latitude]);

    const tooltip = d3.select("#tooltip");

    // Check if the coordinates are within any area
    let plantInfo = 'No matching plant found.';
    areasGeoJSON.features.forEach(feature => {
        if (d3.geoContains(feature, [coordinates.longitude, coordinates.latitude])) {
            const forsytekst = capitalizeFirstLetters(feature.properties.forsytekst);
            plantInfo = `Belongs to: ${forsytekst}`;
        }
    });

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
                `${plantInfo}<br/>` +
                `<em>Ctrl+Click to remove</em>`
            )
                .style("left", (event.pageX + 5) + "px")
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
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0); // Hide the tooltip
            }
        });
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
        .scaleExtent([1, 30])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
            g.selectAll("circle")
                .attr("r", 3 / event.transform.k)
                .style("stroke-width", 0.5 / event.transform.k);
        });

    svgMap.call(zoom);

    const zoomLevel = 30; // Zoom level
    const transform = d3.zoomIdentity
        .translate(svgMap.attr("width") / 2 - x * zoomLevel, svgMap.attr("height") / 2 - y * zoomLevel)
        .scale(zoomLevel);

    svgMap.transition()
        .duration(1500)
        .call(zoom.transform, transform);
}

// Function to show toast notifications
function showToast(message, type) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    toastContainer.appendChild(toast);

    // Show the toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Hide the toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
}

// Function to fetch address suggestions
function autocompleteAddress() {
    const input = document.getElementById('address');
    const list = document.getElementById('autocomplete-list');
    const query = input.value;

    if (!query) {
        list.innerHTML = '';
        return;
    }

    fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=5&countrycode=dk`)
        .then(response => response.json())
        .then(data => {
            list.innerHTML = '';
            data.results.forEach(result => {
                const item = document.createElement('div');
                item.innerText = result.formatted;
                item.addEventListener('click', () => {
                    input.value = result.formatted;
                    list.innerHTML = '';
                });
                list.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error fetching address suggestions:', error);
        });
}