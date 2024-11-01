import pandas as pd
import json

# File paths
json_file_path = 'data/plant_to_area_map.json'
csv_file_path = 'data/plant_to_areas_map.csv'

# Read the JSON file with utf-8 encoding
with open(json_file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

# Check the structure of the JSON data and convert it to a DataFrame
if isinstance(data, list):
    # List of dictionaries
    df = pd.DataFrame(data)
elif isinstance(data, dict):
    # Dictionary of lists or dictionary of scalar values
    if all(isinstance(value, list) for value in data.values()):
        # Dictionary of lists
        df = pd.DataFrame(data)
    else:
        # Dictionary of scalar values
        df = pd.DataFrame(list(data.items()), columns=['name', 'area'])
else:
    raise ValueError("Unsupported JSON structure")

# Convert the DataFrame to a CSV file with utf-8 encoding
df.to_csv(csv_file_path, index=False, encoding='utf-8')

print(f'Converted {json_file_path} to {csv_file_path}')