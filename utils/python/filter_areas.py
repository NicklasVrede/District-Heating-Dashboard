import json

# Load the GeoJSON data
with open('maps/areas.geojson', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Define the filter list
filter_list = ["Hovedstadsregionens og Midt-Nords Naturgasselskab I/S under opløsning"]

# inaktive forsyningsselskaber - På vej.
inaktive_list = ["Assentoft Forsyning", "Rørup Fællesvarme", "Daugård Fællesvarme"]

# Filter the features
filtered_features = []
remaining_features = []

for feature in data['features']:
    if feature['properties']['vaerdi1203'] in ['Individuel naturgasforsyning', 'Anden']:
        filtered_features.append(feature)
    else:
        if feature['properties']['forsytekst'] in filter_list:
            feature['properties']['forsytekst'] = 'Fjernvarme under rekonstruktion' # Rename
        remaining_features.append(feature)

# Create a new GeoJSON object for the filtered features
filtered_geojson = {
    'type': 'FeatureCollection',
    'features': filtered_features
}

# Save the filtered GeoJSON to a new file
with open('maps/gas_and_other_areas.geojson', 'w', encoding='utf-8') as f:
    json.dump(filtered_geojson, f, ensure_ascii=False, indent=4)

# Create a new GeoJSON object for the remaining features
remaining_geojson = {
    'type': 'FeatureCollection',
    'features': remaining_features
}

# Save the remaining GeoJSON back to the original file
with open('maps/areas.geojson', 'w', encoding='utf-8') as f:
    json.dump(remaining_geojson, f, ensure_ascii=False, indent=4)

print(f"Filtered {len(filtered_features)} features and saved to 'maps/gas_and_other_areas.geojson'")
print(f"Remaining features saved back to 'maps/areas.geojson'")