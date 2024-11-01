import shapefile
from shapely.geometry import shape, mapping
import geojson
import datetime

# Paths to your shapefile components
shp_path = "utils/områder/pdk_forsyningomraade_vedtaget_wfs.shp"
shx_path = "utils/områder/pdk_forsyningomraade_vedtaget_wfs.shx"
dbf_path = "utils/områder/pdk_forsyningomraade_vedtaget_wfs.dbf"
prj_path = "utils/områder/pdk_forsyningomraade_vedtaget_wfs.prj"

# Read the shapefile with the correct encoding
reader = shapefile.Reader(shp_path, encoding='latin1')  # Try 'latin1' or 'cp1252'

# Convert shapefile to GeoJSON
features = []
for sr in reader.shapeRecords():
    geom = sr.shape.__geo_interface__
    atr = dict(zip([field[0] for field in reader.fields[1:]], sr.record))
    
    # Convert date objects to strings
    for key, value in atr.items():
        if isinstance(value, datetime.date):
            atr[key] = value.isoformat()
    
    feature = geojson.Feature(geometry=geom, properties=atr)
    features.append(feature)

feature_collection = geojson.FeatureCollection(features)

# Save as GeoJSON file
with open('areas.geojson', 'w') as f:
    geojson.dump(feature_collection, f)

print('GeoJSON file saved as output.geojson')