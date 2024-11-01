import json
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

# Load the GeoJSON data
with open('maps/areas.geojson', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Dictionary to hold merged geometries
merged_areas = {}

# Iterate over features and merge geometries with the same 'forsytekst'
for feature in data['features']:
    forsytekst = feature['properties']['forsytekst']
    geom = shape(feature['geometry']).buffer(0)  # Clean the geometry with buffer(0)
    
    if forsytekst in merged_areas:
        merged_areas[forsytekst] = unary_union([merged_areas[forsytekst], geom])
    else:
        merged_areas[forsytekst] = geom

# Create new features with merged geometries
merged_features = []
for forsytekst, geom in merged_areas.items():
    merged_features.append({
        'type': 'Feature',
        'properties': {'forsytekst': forsytekst},
        'geometry': mapping(geom)
    })

# Create a new GeoJSON object for the merged features
merged_geojson = {
    'type': 'FeatureCollection',
    'features': merged_features
}

# Save the merged GeoJSON to a new file
with open('maps/merged_areas.geojson', 'w', encoding='utf-8') as f:
    json.dump(merged_geojson, f, ensure_ascii=False, indent=4)

print(f"Merged areas saved to 'maps/merged_areas.geojson'")