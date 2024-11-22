import geopandas as gpd

# Read the municipalities GeoJSON
municipalities = gpd.read_file('maps/municipalities_with_forsyid.geojson')

# Calculate centroids
centroids = municipalities.copy()
centroids.geometry = municipalities.geometry.centroid

# Save to new GeoJSON file
centroids.to_file('maps/municipality_centroids.geojson', driver='GeoJSON')
