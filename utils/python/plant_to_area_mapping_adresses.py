import csv
import json
import requests
from geopy.distance import geodesic

# Your OpenCage API key
api_key = 'e1337f0db4d14aeb8a69f6439fc005fc'

# Function to get coordinates from OpenCage API
def get_coordinates(address):
    url = f'https://api.opencagedata.com/geocode/v1/json?q={address}&key={api_key}'
    response = requests.get(url)
    data = response.json()
    if data['results']:
        print(f"Coordinates found for '{address}'")
        return data['results'][0]['geometry']['lat'], data['results'][0]['geometry']['lng']
    return None, None

# Load existing plant-to-area mapping from JSON file
try:
    with open('data/plant_to_area_map.json', 'r', encoding='utf-8') as json_file:
        plants_checked = json.load(json_file)
except FileNotFoundError:
    print("Warning: 'plant_to_area_map.json' file not found. Continuing with an empty mapping.")
    plants_checked = {}



# Load plant data from CSV
plants_with_coords = []
with open('data/addresses_with_coordinates.csv', 'r', encoding='utf-8') as plants_file:
    reader = csv.DictReader(plants_file)
    for row in reader:
        plants_with_coords.append(row)  # Append the entire row

#remove plants that are already in the mapping
plants_to_check = [plant for plant in plants_with_coords if plant['name'] not in plants_checked]

print(f'Plants with coords: {len(plants_with_coords)}')
print(f'Plants checked: {len(plants_checked)}')
print(f'Plants to check: {len(plants_to_check)}')


# Load area data from GeoJSON
with open('maps/areas.geojson', 'r', encoding='utf-8') as areas_file:
    areas = json.load(areas_file)['features']

print(f'Areas: {len(areas)}')

#Create mapping with the 'forsytekst' and the coordinates from the api
#find unique 'forsytekst' in the areas

forsytekst = []
for area in areas:
    forsytekst.append(area['properties']['forsytekst'])

forsytekst = list(set(forsytekst)) 

print(f'Forsytekster: {len(forsytekst)}')

#Create a mapping with the 'forsytekst' and the 'forsyid'
forsytekst_id = {}
for area in areas:
    forsytekst_id[area['properties']['forsytekst']] = area['properties']['forsyid']


print(f'Forsytekst id"er": {len(forsytekst_id)}')

def create_coord_mapping():
    forsytekst_coords = {}
    # get the coordinates for each 'forsytekst' with the api and store each in a list along with the 'forsyid'
    checked = 0
    for tekst in forsytekst:
        checked += 1
        f_coords = get_coordinates(tekst)
        print(f'Requests to go: {len(forsytekst) - checked}')
        if f_coords[0]:
            forsytekst_coords[f_coords] = forsytekst_id[tekst]
            print(f'Updated forsytekst_coords: {forsytekst_coords}')

    print(f'Forsytekst coords: {forsytekst_coords}')

        # Convert tuple keys to strings
    mapping_str_keys = {str(k): v for k, v in forsytekst_coords.items()}

    # Save the mapping with string keys
    with open('data/forsytekst_coords_to_ids.json', 'w', encoding='utf-8') as json_file:
        json.dump(mapping_str_keys, json_file, ensure_ascii=False, indent=4)

def load_mapping_from_file():
    with open('data/forsytekst_coords_to_ids.json', 'r', encoding='utf-8') as json_file:
        forsytekst_coords = json.load(json_file)
    
    # Convert the string keys back to tuples
    forsytekst_coords = {tuple(map(float, k.strip('()').split(', '))): v for k, v in forsytekst_coords.items()}

    return forsytekst_coords

forsytekst_coords = load_mapping_from_file()

print(f'Forsytekst coords: {forsytekst_coords}')

plant_to_id_mapping = {}
#Now we do a nested loop looking for matches between the plants and the areas
for plant in plants_to_check:
    plant_coords = (plant['latitude'], plant['longitude'])
    for coords in forsytekst_coords:
        distance = geodesic(plant_coords, coords).meters
        if distance < 100:
            #if a match is found we pull the forsyid using the coords
            #for the area
            forsyid = forsytekst_coords[coords]
            plant_to_id_mapping[plant['name']] = forsyid
            print(f"Match found for '{plant['name']}' in area '{forsyid}'")
        if distance < 3000:
            print(f'Found potential match for {plant["name"]} and {forsytekst_coords[coords]}, with a distance of {distance} meters')
    
#Append the found mathces to the existing mapping in the json file
plants_checked.update(plant_to_id_mapping)

#Save the updated mapping to the json file
with open('data/plant_to_area_map_updated.json', 'w', encoding='utf-8') as json_file:
    json.dump(plants_checked, json_file, ensure_ascii=False, indent=4)


