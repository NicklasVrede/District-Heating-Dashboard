import csv
import requests

# Your OpenCage API key
api_key = 'e1337f0db4d14aeb8a69f6439fc005fc'

def geocode_address(address):
    response = requests.get(f'https://api.opencagedata.com/geocode/v1/json?q={address}&key={api_key}')
    data = response.json()
    if data['results']:
        return {
            'latitude': data['results'][0]['geometry']['lat'],
            'longitude': data['results'][0]['geometry']['lng']
        }
    else:
        return None

# Read the CSV file
with open('addresses.csv', 'r', encoding='utf-8') as infile:
    reader = csv.DictReader(infile)
    facilities = [row for row in reader]

# Geocode each address and append the coordinates
for facility in facilities:
    full_address = facility['address']
    coordinates = geocode_address(full_address)
    if coordinates:
        facility['latitude'] = coordinates['latitude']
        facility['longitude'] = coordinates['longitude']
    else:
        facility['latitude'] = None
        facility['longitude'] = None

# Write the updated data to a new CSV file
with open('addresses_with_coordinates.csv', 'w', newline='', encoding='utf-8') as outfile:
    fieldnames = ['name', 'address', 'latitude', 'longitude']
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(facilities)

print('Geocoding complete. Results saved to addresses_with_coordinates.csv')