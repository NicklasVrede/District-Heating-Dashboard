import urllib.request as request
import urllib.parse
import json
import contextlib
import csv

start_line = 11
file_path = "data/addresses_with_coordinates.csv"
max_requests = 50

def cvrapi_pno(name, country='dk'):
    encoded_name = urllib.parse.quote(name)
    url = f'http://cvrapi.dk/api?search={encoded_name}&country={country}'
    request_a = request.Request(
        url=url,
        headers={
            'User-Agent': 'FjernvarmeProjekt'
        }
    )
    with contextlib.closing(request.urlopen(request_a)) as response:
        data = json.loads(response.read())
        if 'productionunits' in data and len(data['productionunits']) > 0:
            return data['productionunits'][0]['pno']
        else:
            return None

# Read the CSV file and process each line starting from start_line
with open(file_path, mode='r', newline='', encoding='utf-8') as infile:
    reader = csv.reader(infile)
    lines = list(reader)

# Process lines starting from start_line
request_count = 0
for i in range(start_line - 1, len(lines)):
    if request_count >= max_requests:
        break
    name = lines[i][0]
    pno = cvrapi_pno(name)
    lines[i].append(pno)
    request_count += 1
    print(f"Request {request_count}: Plant Name: {name}, CVRP: {pno}")

# Write the updated lines back to the CSV file
with open(file_path, mode='w', newline='', encoding='utf-8') as outfile:
    writer = csv.writer(outfile)
    writer.writerows(lines)

# Test cvrapi_pno
print(cvrapi_pno("Allingåbro Varmeværk"))