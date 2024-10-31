# Load maps/filtered_areas.geojson and print the forsytekst and forsyid for the missing plants
import json

# Define the file path
geojson_filepath = "maps/filtered_areas.geojson"

# Load the GeoJSON file
with open(geojson_filepath, "r", encoding="utf-8") as file:
    geojson_data = json.load(file)

# Collect unique 'forsytekst' and 'forsyid' pairs
unique_forsy_pairs = set((feature['properties']['forsytekst'], feature['properties']['forsyid']) for feature in geojson_data['features'])

print("Missing Plants (forsytekst, forsyid):")
for forsytekst, forsyid in unique_forsy_pairs:
    print(f"forsytekst: {forsytekst}, forsyid: {forsyid}")