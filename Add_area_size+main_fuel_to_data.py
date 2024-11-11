import geopandas as gpd
import pandas as pd
import json

# Load the data dictionary
with open('data/data_dict.json', 'r') as f:
    data_dict = json.load(f)

# Function to get main fuel type
def get_main_fuel_type(forsyid):
    if forsyid not in data_dict:
        return "unknown"
    
    # Get 2023 production data
    try:
        prod_2023 = data_dict[forsyid]['production']['2023']
        # Remove non-fuel entries
        fuel_data = {k: v for k, v in prod_2023.items() if v > 0}
        if not fuel_data:
            return "none"
        # Return the fuel with maximum production
        return max(fuel_data.items(), key=lambda x: x[1])[0]
    except (KeyError, ValueError):
        return "unknown"

# Load the plant GeoJSON file
plant_gdf = gpd.read_file('data/plants.geojson')

# Add main fuel type
plant_gdf['main_fuel'] = plant_gdf['forsyid'].apply(get_main_fuel_type)

# Load the GeoJSON file
areas_gdf = gpd.read_file('maps/areas.geojson')

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

# Merge the aggregated area data into the plant GeoDataFrame
plant_gdf = plant_gdf.merge(aggregated_areas, on='forsyid', how='left')

# Save the updated plant GeoDataFrame to a new GeoJSON file
plant_gdf.to_file('data/plants_with_area_and_fuel.geojson', driver='GeoJSON')

# Print the updated plant GeoDataFrame
print(plant_gdf)