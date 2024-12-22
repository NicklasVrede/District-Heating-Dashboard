import csv
import json
import geopandas as gpd
import pandas as pd

def load_municipalities(file_path):
    municipalities = gpd.read_file(file_path)
    return municipalities

def load_plants(file_path):
    with open(file_path, 'r', encoding='utf-8') as csvfile:
        csv_reader = csv.DictReader(csvfile)
        plants = {row['name']: row for row in csv_reader}
    
    # Load production data to get fv_net
    with open('data/production_data_with_forsyid.csv', 'r', encoding='utf-8') as prodfile:
        prod_reader = csv.DictReader(prodfile)
        # Create a forsyid to fv_net mapping
        fv_net_map = {}
        for row in prod_reader:
            if 'forsyid' in row and 'fv_net' in row and row['fv_net']:  # Only if fv_net has a value
                fv_net_map[row['forsyid']] = row['fv_net']
    
    # Add fv_net to plants using forsyid
    for plant in plants.values():
        if 'forsyid' in plant:
            plant['fv_net'] = fv_net_map.get(plant['forsyid'], '')
    
    return plants

def load_areas(file_path):
    areas = gpd.read_file(file_path)
    return areas

def create_plants_gdf(plants):
    # Create geometry first
    geometry = gpd.points_from_xy(
        pd.Series([float(p['longitude']) for p in plants.values()]),
        pd.Series([float(p['latitude']) for p in plants.values()])
    )
    
    # Create GeoDataFrame with explicit geometry
    plants_gdf = gpd.GeoDataFrame.from_dict(
        plants, 
        orient='index',
        geometry=geometry
    )
    plants_gdf.set_crs(epsg=4326, inplace=True)
    plants_gdf['name'] = plants_gdf.index
    
    return plants_gdf

def spatial_join(plants_gdf, municipalities):
    plants_gdf = plants_gdf.to_crs(municipalities.crs)
    return gpd.sjoin(plants_gdf, municipalities, how='left', predicate='within')

def update_plants_with_municipality(plants, plants_with_municipality):
    for index, row in plants_with_municipality.iterrows():
        if 'lau_1' in row:
            plants[row['name']]['municipality_id'] = row['lau_1']

def collect_forsyids(plants_with_municipality, plants):
    municipality_forsyids = {}
    for index, row in plants_with_municipality.iterrows():
        if 'lau_1' in row:
            municipality_id = row['lau_1']
            forsyid = plants[row['name']]['forsyid']
            if municipality_id not in municipality_forsyids:
                municipality_forsyids[municipality_id] = []
            municipality_forsyids[municipality_id].append(forsyid)
    return municipality_forsyids

def load_population_data(file_path):
    population_dict = {}
    with open(file_path, 'r', encoding='utf-8') as csvfile:
        csv_reader = csv.DictReader(csvfile)
        for row in csv_reader:
            if row['TID'] == '2024M01':  # Only get 2024 data
                population_dict[row['OMRÅDE']] = int(row['INDHOLD'])
    return population_dict

def create_municipality_geojson(municipalities, municipality_forsyids):
    # Load population data
    population_data = load_population_data('data/population_data.csv')
    
    municipalities['forsyids'] = municipalities['lau_1'].map(lambda x: ', '.join(municipality_forsyids.get(x, [])) or '')

    if 'label_dk' in municipalities.columns:
        municipalities['name'] = municipalities['label_dk']
    else:
        raise KeyError("'label_dk' column not found in municipalities GeoDataFrame.")

    municipalities['lau_1'] = municipalities['lau_1'].astype(str).str.zfill(8)
    
    municipality_geojson = {
        'type': 'FeatureCollection',
        'crs': {
            'type': 'name',
            'properties': {
                'name': 'urn:ogc:def:crs:OGC:1.3:CRS84'
            }
        },
        'features': []
    }

    for _, row in municipalities.iterrows():
        # Get population for this municipality
        population = population_data.get(row['name'], 0)  # Default to 0 if not found
        
        feature = {
            'type': 'Feature',
            'geometry': row['geometry'].__geo_interface__,
            'properties': {
                'lau_1': row['lau_1'],
                'forsyids': row['forsyids'],
                'name': row['name'],
                'population': population
            }
        }
        municipality_geojson['features'].append(feature)

    return municipality_geojson

def write_geojson(file_path, geojson_data):
    with open(file_path, 'w', encoding='utf-8') as geojsonfile:
        json.dump(geojson_data, geojsonfile, ensure_ascii=False, indent=4)
    print(f'GeoJSON file created successfully at {file_path}.')

def create_plants_geojson(plants):
    features = []
    for plant in plants.values():
        if 'latitude' in plant and 'longitude' in plant and plant['latitude'] and plant['longitude'] and 'forsyid' in plant:
            # Convert fv_net to string without decimals
            fv_net = plant.get('fv_net', '')
            if fv_net:
                try:
                    fv_net = str(int(float(fv_net)))  # Convert "190.0" to "190"
                except ValueError:
                    fv_net = ''  # Keep empty if conversion fails
            
            feature = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [float(plant['longitude']), float(plant['latitude'])]
                },
                'properties': {
                    'forsyid': plant['forsyid'],
                    'name': plant['name'],
                    'address': plant['address'],
                    'fv_net': fv_net,
                    'CVRP': plant.get('CVRP', '')
                }
            }
            features.append(feature)

    return {
        'type': 'FeatureCollection',
        'features': features
    }

def add_fv_net_to_areas(areas, plants):
    # Create a forsyid to fv_net mapping from plants, excluding '0' values
    forsyid_to_fv_net = {}
    for plant in plants.values():
        if 'forsyid' in plant and plant.get('fv_net'):
            try:
                # Convert to float first, then to int to handle "152.0" properly
                fv_net = int(float(plant['fv_net']))  # This will convert "152.0" to 152
                if fv_net != 0:  # Only add non-zero values
                    forsyid_to_fv_net[plant['forsyid']] = str(fv_net)  # Convert 152 to "152"
            except ValueError:
                continue  # Skip if conversion fails
    
    # Add fv_net to areas based on forsyid
    areas['fv_net'] = areas['forsyid'].map(lambda x: forsyid_to_fv_net.get(x, ''))
    
    # Double-check that all values are properly formatted
    areas['fv_net'] = areas['fv_net'].apply(lambda x: str(int(float(x))) if x and x != '0' else '')
    
    return areas

def main():
    # Load all required data
    municipalities = load_municipalities('maps/municipalities.geojson')
    plants = load_plants('data/plants.csv')
    areas = load_areas('maps/areas.geojson')  # Load areas
    
    # Add fv_net to areas
    areas = add_fv_net_to_areas(areas, plants)
    
    # Save updated areas
    areas.to_file('maps/areas.geojson', driver='GeoJSON')
    
    # Create and save plants GeoJSON
    plants_geojson = create_plants_geojson(plants)
    write_geojson('data/plants.geojson', plants_geojson)
    
    # Continue with municipalities processing
    plants_gdf = create_plants_gdf(plants)
    plants_with_municipality = spatial_join(plants_gdf, municipalities)
    update_plants_with_municipality(plants, plants_with_municipality)
    municipality_forsyids = collect_forsyids(plants_with_municipality, plants)
    municipality_geojson = create_municipality_geojson(municipalities, municipality_forsyids)
    write_geojson('maps/municipalities_with_forsyid.geojson', municipality_geojson)

if __name__ == "__main__":
    main()

