import geopandas as gpd

# Load the GeoJSON file
areas_gdf = gpd.read_file('maps/areas.geojson')

# Save the GeoDataFrame back to a GeoJSON file
areas_gdf.to_file('maps/areas_saved.geojson', driver='GeoJSON')