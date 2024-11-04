import csv
import json

# Read the ids_to_merge.csv file
with open('data/ids_to_merge.csv', 'r', encoding='utf-8') as file:
    reader = csv.reader(file)
    ids_to_merge = [row for row in reader]

# Read the plant_to_areas_map.csv file
with open('data/plant_to_areas_map.csv', 'r', encoding='utf-8') as file:
    reader = csv.reader(file)
    plant_to_areas_map = [row for row in reader]

# Read the areas.geojson file
with open('maps/areas.geojson', 'r', encoding='utf-8') as file:
    areas_geojson = json.load(file)

# Read the plants.geojson file
with open('data/plants.geojson', 'r', encoding='utf-8') as file:
    plants_geojson = json.load(file)

# Function to replace IDs in a list of rows
def replace_ids(rows, old_ids, new_id):
    for row in rows:
        for i, value in enumerate(row):
            if value in old_ids:
                row[i] = new_id

# Function to replace IDs in a GeoJSON object
def replace_ids_geojson(geojson, old_ids, new_id):
    for feature in geojson['features']:
        if 'forsyid' in feature and feature['forsyid'] in old_ids:
            feature['forsyid'] = new_id
        for key, value in feature['properties'].items():
            if value in old_ids:
                feature['properties'][key] = new_id

# Merge the IDs
new_id_counter = 1
for ids in ids_to_merge:
    new_id = f"{new_id_counter:08d}"  # format to 8 digits
    old_ids = ids
    replace_ids(plant_to_areas_map, old_ids, new_id)
    replace_ids_geojson(areas_geojson, old_ids, new_id)
    replace_ids_geojson(plants_geojson, old_ids, new_id)
    new_id_counter += 1

# Write the updated plant_to_areas_map.csv file
with open('data/updated_plant_to_areas_map.csv', 'w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerows(plant_to_areas_map)

# Write the updated areas.geojson file
with open('maps/updated_areas.geojson', 'w', encoding='utf-8') as file:
    json.dump(areas_geojson, file, indent=2, ensure_ascii=False)

# Write the updated plants.geojson file
with open('data/updated_plants.geojson', 'w', encoding='utf-8') as file:
    json.dump(plants_geojson, file, indent=2, ensure_ascii=False)

print(f'Created updated_plant_to_areas_map.csv, updated_areas.geojson, and updated_plants.geojson files')