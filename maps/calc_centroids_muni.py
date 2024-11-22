import geopandas as gpd

# Read the municipalities GeoJSON
municipalities = gpd.read_file('maps/municipalities_with_forsyid.geojson')

# Project to ETRS89 / UTM zone 32N (EPSG:25832) for accurate calculations
municipalities_projected = municipalities.to_crs(epsg=25832)

# Dissolve geometries by LAU_1 code to merge separate areas of the same municipality
municipalities_dissolved = municipalities_projected.dissolve(by='lau_1', as_index=True)

# Calculate centroids using centroid property
centroids = municipalities_dissolved.copy()
centroids.geometry = municipalities_dissolved.geometry.centroid

# Project back to WGS84 (EPSG:4326) for web mapping
centroids = centroids.to_crs(epsg=4326)

# Save to new GeoJSON file
centroids.to_file('maps/municipality_centroids.geojson', driver='GeoJSON')
