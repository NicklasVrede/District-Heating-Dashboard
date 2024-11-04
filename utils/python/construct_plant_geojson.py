import csv
import json

# Read the CSV file with plant coordinates
with open('data/addresses_with_coordinates.csv', 'r', encoding='utf-8') as csvfile:
    csv_reader = csv.DictReader(csvfile)
    plants = {row['name']: row for row in csv_reader}

# Read the CSV file with plant to area mapping
with open('data/plant_to_areas_map.csv', 'r', encoding='utf-8') as csvfile:
    csv_reader = csv.DictReader(csvfile)
    plant_to_area_map = {row['name']: row['forsyid'] for row in csv_reader}

# Combine the data
for plant_name, forsyid in plant_to_area_map.items():
    if plant_name in plants:
        plants[plant_name]['forsyid'] = forsyid

# Create GeoJSON features
features = []
for plant in plants.values():
    if 'latitude' in plant and 'longitude' in plant and plant['latitude'] and plant['longitude'] and 'forsyid' in plant:
        feature = {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [float(plant['longitude']), float(plant['latitude'])]
            },
            'properties': {
                'forsyid': plant['forsyid'],
                'name': plant['name'],
                'address': plant['address']
            }
        }
        features.append(feature)

# Create GeoJSON structure
geojson = {
    'type': 'FeatureCollection',
    'features': features
}

# Write to GeoJSON file
with open('data/plants.geojson', 'w', encoding='utf-8') as geojsonfile:
    json.dump(geojson, geojsonfile, ensure_ascii=False, indent=4)

print('GeoJSON file created successfully.')