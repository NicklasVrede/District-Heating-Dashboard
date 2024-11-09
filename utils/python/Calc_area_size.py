import geopandas as gpd
import pandas as pd

# Todo, add to data instead of geojson.

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

# Load the plant GeoJSON file
plant_gdf = gpd.read_file('data/plants.geojson')

# Merge the aggregated area data into the plant GeoDataFrame
plant_gdf = plant_gdf.merge(aggregated_areas, on='forsyid', how='left')

# Save the updated plant GeoDataFrame to a new GeoJSON file
plant_gdf.to_file('data/plants_with_total_area.geojson', driver='GeoJSON')

# Print the updated plant GeoDataFrame
print(plant_gdf)