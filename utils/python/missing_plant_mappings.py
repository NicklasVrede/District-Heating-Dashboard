import csv
import json

# Load plant data from CSV
plants = []
with open('data/addresses_with_coordinates.csv', 'r', encoding='utf-8') as plants_file:
    reader = csv.DictReader(plants_file)
    for row in reader:
        plants.append(row['name'])  # Append only the plant name

# Load existing plant-to-area mapping from JSON file
try:
    with open('data/plant_to_area_map.json', 'r', encoding='utf-8') as json_file:
        plant_to_area_map = json.load(json_file)
except FileNotFoundError:
    print("Warning: 'plant_to_area_map.json' file not found. Continuing with an empty mapping.")
    plant_to_area_map = {}

# Find and print missing mappings
missing_plants = [plant for plant in plants if plant not in plant_to_area_map]
if missing_plants:
    print("Missing plant mappings:")
    print(f"Number of missing plants: {len(missing_plants)}")
    for plant in missing_plants:
        print(plant)
else:
    print("All plants are mapped.")

