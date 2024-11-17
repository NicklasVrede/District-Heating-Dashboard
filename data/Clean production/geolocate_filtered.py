import pandas as pd
import geopandas as gpd
from opencage.geocoder import OpenCageGeocode
from shapely.geometry import Point
import json
import os
import warnings

# Suppress shapely warnings
warnings.filterwarnings('ignore', category=RuntimeWarning)

# Your OpenCage API key
api_key = "e1337f0db4d14aeb8a69f6439fc005fc"
geocoder = OpenCageGeocode(api_key)

# Load data
plant_df = pd.read_csv('data/Clean production/production_grouped_by_vaerk.csv')
areas = gpd.read_file('maps/areas.geojson')

print(f"Starting geocoding process for {len(plant_df)} entries...")

# Create cache dictionary to store previous results
cache = {}
try:
    with open('data/Clean production/geocoding_cache.json', 'r') as f:
        cache = json.load(f)
    print(f"Loaded {len(cache)} entries from cache")
except FileNotFoundError:
    print("No cache file found, starting fresh")
    cache = {}

# Create empty lists to store results
coordinates = []
forsyids = []

# Geocode each location and check for intersection
for index, row in plant_df.iterrows():
    postal_code = str(row['vaerk_postnr'])
    print(f"\nProcessing entry {index + 1}/{len(plant_df)} - Postal code: {postal_code}")
    
    if postal_code in cache:
        # Use cached results
        coordinates.append(Point(*cache[postal_code]['coordinates']) if cache[postal_code]['coordinates'] else None)
        forsyids.append(cache[postal_code]['forsyid'])
        print(f"✓ Found in cache - ForsyID: {cache[postal_code]['forsyid']}")
    else:
        try:
            print("Not in cache, geocoding...")
            # Create search query
            query = f"{postal_code}, Denmark"
            
            # Geocode the address
            results = geocoder.geocode(query)
            
            if results:
                # Get the first result
                lat = results[0]['geometry']['lat']
                lng = results[0]['geometry']['lng']
                print(f"✓ Geocoded successfully: {lat}, {lng}")
                
                # Create point geometry
                point = Point(lng, lat)
                
                # First check for direct intersection
                found_match = False
                for _, area in areas.iterrows():
                    if area.geometry.intersects(point):
                        forsyids.append(area['forsyid'])
                        coordinates.append(point)
                        # Cache the result
                        cache[postal_code] = {
                            'coordinates': [lng, lat],
                            'forsyid': area['forsyid']
                        }
                        print(f"✓ Found matching area - ForsyID: {area['forsyid']}")
                        found_match = True
                        break
                
                # If no direct intersection, check distance
                if not found_match:
                    min_distance = float('inf')
                    closest_forsyid = None
                    
                    for _, area in areas.iterrows():
                        distance = area.geometry.distance(point) * 111000  # Convert to meters (approx)
                        if distance < 500 and distance < min_distance:  # Within 500 meters
                            min_distance = distance
                            closest_forsyid = area['forsyid']
                    
                    if closest_forsyid:
                        forsyids.append(closest_forsyid)
                        coordinates.append(point)
                        cache[postal_code] = {
                            'coordinates': [lng, lat],
                            'forsyid': closest_forsyid
                        }
                        print(f"✓ Found nearby area within {min_distance:.0f} meters - ForsyID: {closest_forsyid}")
                    else:
                        # Only store None if both intersection and distance checks fail
                        forsyids.append(None)
                        coordinates.append(point)
                        cache[postal_code] = {
                            'coordinates': [lng, lat],
                            'forsyid': None
                        }
                        print(f"⚠ No matching area found within 500 meters - Adding None to cache for {postal_code}")
                        print(f"Cache entry created: {cache[postal_code]}")
            else:
                forsyids.append(None)
                coordinates.append(None)
                cache[postal_code] = {
                    'coordinates': None,
                    'forsyid': None
                }
                print("⚠ No geocoding results found")
                
        except Exception as e:
            print(f"❌ Error processing {postal_code}: {str(e)}")
            forsyids.append(None)
            coordinates.append(None)
            cache[postal_code] = {
                'coordinates': None,
                'forsyid': None
            }

# Debug prints
print(f"\nLength check before adding to dataframe:")
print(f"Number of rows in plant_df: {len(plant_df)}")
print(f"Length of coordinates list: {len(coordinates)}")
print(f"Length of forsyids list: {len(forsyids)}")

# Add new columns to the dataframe
plant_df['geometry'] = coordinates
plant_df['forsyid'] = forsyids

# Convert to GeoDataFrame
gdf = gpd.GeoDataFrame(plant_df, geometry='geometry')

# Debug prints before saving
print("\nColumns in dataframe before saving:")
print(plant_df.columns.tolist())

# Save to CSV (dropping only the geometry column)
output_df = plant_df.copy()
output_df = output_df.drop(columns=['geometry'])

# Verify data before saving
print("\nSample of data before saving:")
print(output_df[['vaerk_postnr', 'fv_net_navn', 'forsyid']].head())

# Reorder columns before saving
column_order = [
    'vaerk_id', 'forsyid', 'vrkanl_ny', 'vaerk_navn', 'aar', 'vaerk_postnr', 
    'vaerk_postdistrikt', 'vaerk_kommune', 'fv_net', 'fv_net_navn', 'selskab_id', 
    'cvr', 'selskab_navn', 'kvoteaktivitet', 'vrktypeid', 'vrktypenavn', 
    'anlaeg_navn', 'anlaegstype_navn', 'DB07', 'NR117', 'aktoer', 'idriftdato', 
    'skrotdato', 'indfyretkapacitet_MW', 'elkapacitet_MW', 'varmekapacitet_MW', 
    'brutto_TJ', 'varmeprod_TJ', 'varmelev_TJ', 'elprod_TJ', 'ellev_TJ', 
    'andel_varmelev', 'andel_el', 'andel_process', 'kul_TJ', 'fuelolie_TJ', 
    'spildolie_TJ', 'gasolie_TJ', 'raffinaderigas_TJ', 'lpg_TJ', 'naturgas_TJ', 
    'affald_TJ', 'biogas_TJ', 'halm_TJ', 'skovflis_TJ', 'trae- og biomasseaffald_TJ', 
    'traepiller_TJ', 'bio-olie_TJ', 'braendselsfrit_TJ', 'solenergi_TJ', 
    'vandkraft_TJ', 'elektricitet_TJ', 'omgivelsesvarme_TJ'
]

# Verify all columns exist and reorder
output_df = output_df.reindex(columns=column_order)

# Save with explicit encoding and index=False
output_df.to_csv('data/Clean production/filtered_geolocated.csv', 
                 index=False, 
                 encoding='utf-8')

# Verify the saved file
verification_df = pd.read_csv('data/Clean production/filtered_geolocated.csv')
print("\nVerification - first few columns in saved file:")
print(verification_df.columns[:5].tolist())

# Print summary
successful = sum(1 for x in forsyids if x is not None)
print(f"\nSummary:")
print(f"Total entries processed: {len(plant_df)}")
print(f"Successful matches: {successful}")
print(f"Failed matches: {len(plant_df) - successful}")

# After the loop, before saving cache
print("\nCache contents before saving:")
print(f"Total cache entries: {len(cache)}")
print("Sample of cache entries with None values:")
none_entries = {k: v for k, v in cache.items() if v['forsyid'] is None}
print(f"Number of None entries: {len(none_entries)}")
if none_entries:
    print("First few None entries:")
    for k, v in list(none_entries.items())[:3]:
        print(f"Postal code {k}: {v}")

# Save the updated cache
with open('data/Clean production/geocoding_cache.json', 'w') as f:
    json.dump(cache, f)

# Verify cache was saved correctly


