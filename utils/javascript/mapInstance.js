// Create a map instance manager
let mapInstance = null;

export function setMapInstance(map) {
    mapInstance = map;
}

export function getMapInstance() {
    return mapInstance;
} 