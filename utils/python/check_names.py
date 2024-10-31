import csv
import json

# Load plant-to-area mapping from JSON file
with open('data/plant_to_area_map.json', 'r', encoding='utf-8') as json_file:
    plant_to_area_map = json.load(json_file)

# Load plant data from CSV
plants = []
with open('data/addresses.csv', 'r', encoding='utf-8') as plants_file:
    reader = csv.DictReader(plants_file)
    for row in reader:
        plants.append(row['name'])  # Append only the plant name

# Compare names
json_names = set(plant_to_area_map.keys())
csv_names = set(plants)

# Find names that are in JSON but not in CSV
names_in_json_not_in_csv = json_names - csv_names

# Find names that are in CSV but not in JSON
names_in_csv_not_in_json = csv_names - json_names

# Output results
print("Names in JSON but not in CSV:")
for name in names_in_json_not_in_csv:
    print(name)

print("\nNames in CSV but not in JSON:")
for name in names_in_csv_not_in_json:
    print(name)

# Write names in JSON but not in CSV to a new JSON file
with open('data/names_in_json_not_in_csv.json', 'w', encoding='utf-8') as output_file:
    json.dump(list(names_in_json_not_in_csv), output_file, ensure_ascii=False, indent=4)

print("\nNames in JSON but not in CSV have been written to 'data/names_in_json_not_in_csv.json'")