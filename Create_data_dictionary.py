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

# Group the data by 'forsyid' and 'År'
grouped_data = data_df.groupby(['forsyid', 'År']).agg(lambda x: x.mean() if x.dtype.kind in 'biufc' else x.mode()[0]).reset_index()

# Create the data dictionary for Plotly
data_dict = {}

# After loading the data, add this debug print
print("Available columns in the dataset:")
print(data_df.columns.tolist())


for forsyid, group in grouped_data.groupby('forsyid'):
    production_by_year = {}
    
    # Process each year's data
    for _, row in group.iterrows():
        year = row['År']
        
        # Get total heat delivery to network
        total_heat = row.get('Varme_Lev_til_net', 0)
        
        # Calculate shares
        chp_share = row.get('andel kraftvarme', 0)
        boiler_share = row.get('andel kedler', 0)
        other_share = row.get('andel andet', 0)
        
        year_data = {
            # All fuels (CHP + boiler)
            'Kul': round((chp_share * row.get(' kraftvarme - andel   Kul', 0) + 
                   boiler_share * row.get(' kedler - andel   Kul', 0)) * total_heat),
            'Olie': round((chp_share * row.get(' kraftvarme - andel   Olie', 0) + 
                    boiler_share * row.get(' kedler - andel   Olie', 0)) * total_heat),
            'Gas': round((chp_share * row.get(' kraftvarme - andel   Gas', 0) + 
                   boiler_share * row.get(' kedler - andel   Gas', 0)) * total_heat),
            'Affald (fossil)': round((chp_share * row.get(' kraftvarme - andel   Affald (fossil)', 0) + 
                               boiler_share * row.get(' kedler - andel   Affald (fossil)', 0)) * total_heat),
            'Halm': round((chp_share * row.get(' kraftvarme - andel   Halm', 0) + 
                    boiler_share * row.get(' kedler - andel   Halm', 0)) * total_heat),
            'Skovflis': round((chp_share * row.get(' kraftvarme - andel   Skovflis', 0) + 
                        boiler_share * row.get(' kedler - andel   Skovflis', 0)) * total_heat),
            'Brænde': round((chp_share * row.get(' kraftvarme - andel   Brænde', 0) + 
                      boiler_share * row.get(' kedler - andel   Brænde', 0)) * total_heat),
            'Træpiller': round((chp_share * row.get(' kraftvarme - andel   Træpiller', 0) + 
                         boiler_share * row.get(' kedler - andel   Træpiller', 0)) * total_heat),
            'Træaffald': round((chp_share * row.get(' kraftvarme - andel   Træaffald', 0) + 
                         boiler_share * row.get(' kedler - andel   Træaffald', 0)) * total_heat),
            'Affald (bio)': round((chp_share * row.get(' kraftvarme - andel   Affald (bio)', 0) + 
                            boiler_share * row.get(' kedler - andel   Affald (bio)', 0)) * total_heat),
            'Biobrændsler (bioolie)': round((chp_share * row.get(' kraftvarme - andel   Biobrændsler\r\n(bioolie)', 0) + 
                                      boiler_share * row.get(' kedler - andel   Biobrændsler\r\n(bioolie)', 0)) * total_heat),
            'Biogas': round((chp_share * row.get(' kraftvarme - andel   Biogas', 0) + 
                      boiler_share * row.get(' kedler - andel   Biogas', 0)) * total_heat),
            
            # Other shares
            'Overskudsvarme': round(other_share * row.get('Andet - andel overskudsvarme', 0) * total_heat),
            'Solvarme': round(other_share * row.get('Andet - andel solvarme', 0) * total_heat),
            'Varmepumper': round(other_share * row.get('Andet - andel varmepumper og elkedler', 0) * total_heat)
        }
        
        production_by_year[year] = year_data

    # Add the name and production data to the dictionary
    name = forsyid_to_name.get(forsyid, 'Unknown')
    data_dict[forsyid] = {
        'name': name,
        'production': production_by_year
    }

# Save the data dictionary as a JSON file with UTF-8 encoding
with open('data/data_dict.json', 'w', encoding='utf-8') as json_file:
    json.dump(data_dict, json_file, indent=4, ensure_ascii=False)


# Test the format:
# Print the information about forsyid "34203563"
forsyid_to_print = "17779710".zfill(8)
if forsyid_to_print in data_dict:
    print(f"\nInformation for forsyid {forsyid_to_print}:")
    pprint(data_dict[forsyid_to_print])
else:
    print(f"\nForsyid {forsyid_to_print} not found in the data.")