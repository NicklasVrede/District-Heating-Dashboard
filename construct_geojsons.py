import csv
import json
import geopandas as gpd

def load_municipalities(file_path):
    municipalities = gpd.read_file(file_path)
    print("Municipalities CRS:", municipalities.crs)
    return municipalities

def load_plants(file_path):
    with open(file_path, 'r', encoding='utf-8') as csvfile:
        csv_reader = csv.DictReader(csvfile)
        return {row['name']: row for row in csv_reader}

def create_plants_gdf(plants):
    plants_gdf = gpd.GeoDataFrame.from_dict(plants, orient='index')
    plants_gdf['geometry'] = gpd.points_from_xy(plants_gdf['longitude'].astype(float), plants_gdf['latitude'].astype(float))
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

def create_municipality_geojson(municipalities, municipality_forsyids):
    municipalities['forsyids'] = municipalities['lau_1'].map(lambda x: ', '.join(municipality_forsyids.get(x, [])))

    print("Available columns in municipalities:", municipalities.columns)

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
        feature = {
            'type': 'Feature',
            'geometry': row['geometry'].__geo_interface__,
            'properties': {
                **row.drop('geometry').to_dict(),
                'forsyids': row['forsyids'],
                'name': row['name']
            }
        }
        municipality_geojson['features'].append(feature)

    return municipality_geojson

def write_geojson(file_path, geojson_data):
    with open(file_path, 'w', encoding='utf-8') as geojsonfile:
        json.dump(geojson_data, geojsonfile, ensure_ascii=False, indent=4)
    print(f'GeoJSON file created successfully at {file_path}.')

def main():
    municipalities = load_municipalities('maps/municipalities.geojson')
    plants = load_plants('data/plants.csv')
    plants_gdf = create_plants_gdf(plants)
    plants_with_municipality = spatial_join(plants_gdf, municipalities)
    update_plants_with_municipality(plants, plants_with_municipality)
    municipality_forsyids = collect_forsyids(plants_with_municipality, plants)
    municipality_geojson = create_municipality_geojson(municipalities, municipality_forsyids)
    write_geojson('maps/municipalities_with_forsyid.geojson', municipality_geojson)

if __name__ == "__main__":
    main()

