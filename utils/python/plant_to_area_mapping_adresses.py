import csv
import json
import requests
from geopy.distance import geodesic

# Your OpenCage API key
api_key = 'e1337f0db4d14aeb8a69f6439fc005fc'

# Function to get coordinates from OpenCage API
def get_coordinates(address):
    print(f"Making API request for address: {address}")
    url = f'https://api.opencagedata.com/geocode/v1/json?q={address}&key={api_key}'
    response = requests.get(url)
    data = response.json()
    print(f"API response for address '{address}': {json.dumps(data, indent=2)}")  # Print the API response
    if data['results']:
        return data['results'][0]['geometry']['lat'], data['results'][0]['geometry']['lng']
    return None, None

# Load existing plant-to-area mapping from JSON file
try:
    with open('data/plant_to_area_map.json', 'r', encoding='utf-8') as json_file:
        plant_to_area_map = json.load(json_file)
except FileNotFoundError:
    print("Warning: 'plant_to_area_map.json' file not found. Continuing with an empty mapping.")
    plant_to_area_map = {}

# Load plant data from CSV
plants = []
with open('data/addresses_with_coordinates.csv', 'r', encoding='utf-8') as plants_file:
    reader = csv.DictReader(plants_file)
    for row in reader:
        plants.append(row)  # Append the entire row

print(f'Plants: {len(plants)}')

# Load area data from GeoJSON
with open('maps/areas.geojson', 'r', encoding='utf-8') as areas_file:
    areas = json.load(areas_file)['features']

# Create the mapping
for plant in plants:
    plant_name = plant['name']
    if plant_name in plant_to_area_map:
        continue  # Skip if the plant is already matched
    plant_coords = (float(plant['latitude']), float(plant['longitude']))
    for area in areas:
        area_name = area['properties']['forsytekst']
        area_coords = get_coordinates(area_name)
        if area_coords == (None, None):
            print(f'Found no coordinates for Area: {area_name}')
            continue  # Skip if coordinates couldn't be fetched
        distance = geodesic(plant_coords, area_coords).meters
        if distance < 1000:  # Adjust the distance threshold as needed
            plant_to_area_map[plant_name] = area_name
            print(f"Match found: Plant '{plant_name}' matched with Area '{area_name}'")
            break

# Save the updated mapping to a JSON file
with open('data/plant_to_area_map.json', 'w', encoding='utf-8') as json_file:
    json.dump(plant_to_area_map, json_file, ensure_ascii=False, indent=4)

print('Mapping created and saved to plant_to_area_map.json')