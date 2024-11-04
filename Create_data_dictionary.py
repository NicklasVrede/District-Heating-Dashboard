import pandas as pd
from pprint import pprint
import json

# Load the data from the CSV file with UTF-8 encoding
data_df = pd.read_csv('data/data_om_fv_with_ids.csv', encoding='utf-8')

# Drop the 'names' column
data_df = data_df.drop(columns=['names'])

# Fill NA values in 'forsyid' with a placeholder (e.g., -1) or drop rows with NA values
data_df['forsyid'] = pd.to_numeric(data_df['forsyid'], errors='coerce').fillna(-1).astype(int)

# Drop rows where 'forsyid' is -1
data_df = data_df[data_df['forsyid'] != -1]

# Convert 'forsyid' to strings and pad with zeros to ensure 8 digits
data_df['forsyid'] = data_df['forsyid'].astype(str).str.zfill(8)

# Load the plant-to-area mapping to get the names
plant_to_areas_map_df = pd.read_csv('data/plant_to_areas_map.csv', encoding='utf-8')

# Create a dictionary to map forsyid to names
plant_to_areas_map_df['forsyid'] = plant_to_areas_map_df['forsyid'].astype(str).str.zfill(8)
forsyid_to_name = plant_to_areas_map_df.set_index('forsyid')['name'].to_dict()

# Group the data by 'forsyid' and 'År' and aggregate by mean for numeric columns
grouped_data = data_df.groupby(['forsyid', 'År']).agg(lambda x: x.mean() if x.dtype.kind in 'biufc' else x.mode()[0]).reset_index()

# Create the data dictionary for Plotly
data_dict = {}

for forsyid, group in grouped_data.groupby('forsyid'):
    # Organize the data points by year
    data_by_year = group.set_index('År').to_dict('index')
    # Add the name to the dictionary
    name = forsyid_to_name.get(forsyid, 'Unknown')
    data_dict[forsyid] = {
        'name': name,
        'data': data_by_year
    }

# Save the data dictionary as a JSON file with UTF-8 encoding
with open('data/data_dict.json', 'w', encoding='utf-8') as json_file:
    json.dump(data_dict, json_file, indent=4, ensure_ascii=False)

# Print all the forsyids in the dictionary
print("All forsyids in the dictionary:")
for forsyid in data_dict.keys():
    print(forsyid)

# Test the format:
# Print the information about forsyid "34203563"
forsyid_to_print = "34203563".zfill(8)
if forsyid_to_print in data_dict:
    print(f"\nInformation for forsyid {forsyid_to_print}:")
    pprint(data_dict[forsyid_to_print])
else:
    print(f"\nForsyid {forsyid_to_print} not found in the data.")