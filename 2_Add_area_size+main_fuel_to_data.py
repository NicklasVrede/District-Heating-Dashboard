import geopandas as gpd
import pandas as pd
import json

# Load the data dictionary
with open('data/data_dict.json', 'r') as f:
    data_dict = json.load(f)

# Function to get main fuel type
def get_main_fuel_type(id_value):
    # Convert to 8-digit string by padding with zeros
    id_str = str(id_value).zfill(8)
    
    if id_str not in data_dict:
        print(f"ID {id_str} not found in data_dict")
        return "unknown"
    
    # Get 2023 production data
    try:
        prod_2023 = data_dict[id_str]['production']['2023']
        # Remove non-fuel entries and varmeprod/elprod
        fuel_data = {k: v for k, v in prod_2023.items() 
                    if v > 0 and k not in ['varmeprod', 'elprod']}
        
        if not fuel_data:
            return "none"
        # Return the fuel with maximum production
        return max(fuel_data.items(), key=lambda x: x[1])[0]
    except (KeyError, ValueError) as e:
        print(f"Error processing {id_str}: {str(e)}")
        return "unknown"

# Load the GeoJSON files
plant_gdf = gpd.read_file('data/plants.geojson')
areas_gdf = gpd.read_file('maps/areas.geojson')
municipalities_gdf = gpd.read_file('maps/municipalities_with_forsyid.geojson')

# Add main fuel type to plants
plant_gdf['main_fuel'] = plant_gdf['forsyid'].apply(get_main_fuel_type)

# Add main fuel type to municipalities by mapping lau_1 to forsyid
municipalities_gdf['forsyid'] = municipalities_gdf['lau_1']  # Create forsyid column from lau_1
municipalities_gdf['main_fuel'] = municipalities_gdf['forsyid'].apply(get_main_fuel_type)

# Project the GeoDataFrame to UTM (you may need to adjust the EPSG code based on your location)
areas_gdf = areas_gdf.to_crs(epsg=32633)  # Example: UTM zone 33N

# Calculate the area size for each feature in square meters
areas_gdf['area_size'] = areas_gdf.geometry.area

# Convert the area size to square kilometers
areas_gdf['area_size_km2'] = areas_gdf['area_size'] / 1_000_000

# Round the area size to 2 decimal places
areas_gdf['area_size_km2'] = areas_gdf['area_size_km2'].round(2)

# Aggregate the area sizes by 'forsyid'
aggregated_areas = areas_gdf.groupby('forsyid')['area_size_km2'].sum().reset_index()

# Rename the column to avoid conflicts
aggregated_areas = aggregated_areas.rename(columns={'area_size_km2': 'total_area_km2'})

# Drop the total_area_km2 column if it exists in plant_gdf
if 'total_area_km2' in plant_gdf.columns:
    plant_gdf = plant_gdf.drop(columns=['total_area_km2'])

# Merge the aggregated area data into the plant GeoDataFrame
plant_gdf = plant_gdf.merge(aggregated_areas, on='forsyid', how='left')

# Save the updated plant GeoDataFrame to a new GeoJSON file
plant_gdf.to_file('data/plants.geojson', driver='GeoJSON')
municipalities_gdf.to_file('maps/municipalities_with_forsyid.geojson', driver='GeoJSON')

print(f'Added main_fuel and area_size to plants.geojson and municipalities.geojson')