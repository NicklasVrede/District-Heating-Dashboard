import csv
import json

# Function to get the first word of a string in lowercase
def get_first_word_lowercase(text):
    words = text.lower().split()
    return words[0] if words else ""

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
    plant_name_key = get_first_word_lowercase(plant_name)
    for area in areas:
        area_name = area['properties']['forsytekst']
        area_id = area['properties']['forsyid']  # Get the forsyid
        area_name_key = get_first_word_lowercase(area_name)
        if plant_name_key == area_name_key:
            # Prompt user for confirmation
            print(f"\nPotential match found:\n  Plant: '{plant_name}'\n  Area: '{area_name}'")
            confirmation = input("Confirm match? (y/n): ").strip().lower()
            if confirmation == 'y':
                plant_to_area_map[plant_name] = area_id  # Store the forsyid instead of forsytekst
                print(f"Match confirmed: Plant '{plant_name}' matched with Area '{area_name}' (ID: {area_id})")
            else:
                print(f"Match rejected: Plant '{plant_name}' not matched with Area '{area_name}'")
            break

# Save the updated mapping to a JSON file
with open('data/plant_to_area_map.json', 'w', encoding='utf-8') as json_file:
    json.dump(plant_to_area_map, json_file, ensure_ascii=False, indent=4)

print('\nMapping created and saved to plant_to_area_map.json')