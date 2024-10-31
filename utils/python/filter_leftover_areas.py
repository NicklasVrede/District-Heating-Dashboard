import json

# Define file paths
filepath = "data/plant_to_area_map.json"
filepath_to_filter = "maps/filtered_areas.geojson"  # Existing filtered areas file

# Make a set of ids
used_ids = set()
with open(filepath, "r", encoding="utf-8") as file:
    data = json.load(file)
    for value in data.values():
        used_ids.add(value)

print(f"Used IDs: {used_ids}")

# Load the existing filtered GeoJSON file and filter out entries with used "forsyid"s
with open(filepath_to_filter, "r", encoding="utf-8") as file:
    geojson_data = json.load(file)

filtered_features = [feature for feature in geojson_data['features'] if feature['properties']['forsyid'] not in used_ids]

# Create a new GeoJSON structure with the filtered features
filtered_geojson = {
    "type": "FeatureCollection",
    "features": filtered_features
}

# Save the filtered GeoJSON back to the same file
with open(filepath_to_filter, "w", encoding="utf-8") as file:
    json.dump(filtered_geojson, file, ensure_ascii=False, indent=4)

print(f"Filtered GeoJSON saved to {filepath_to_filter}")