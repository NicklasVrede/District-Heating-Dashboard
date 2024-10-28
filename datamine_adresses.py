from bs4 import BeautifulSoup
import csv

# Load the HTML file
with open('Liste over alle fjernvarmeselskaber i Danmark.html', 'r', encoding='utf-8') as file:
    html_content = file.read()

# Parse the HTML content
soup = BeautifulSoup(html_content, 'html.parser')

# Find all elements that contain the required information
entries = soup.select('div.card-body')

# Extract the title and the next two lines for each entry
facilities = []
for entry in entries:
    title_tag = entry.find('strong')
    if title_tag:
        title = title_tag.get_text(strip=True)
        lines = entry.find_all('br')
        if len(lines) >= 2:
            address = lines[0].next_sibling.strip()
            city = lines[1].next_sibling.strip()
            full_address = f"{address}, {city}, Denmark"
            facilities.append({
                'name': title,
                'address': full_address
            })

def print_facilities(facilities):
    for facility in facilities:
        print(facility)


# Save the extracted information to a CSV file
with open('addresses.csv', 'w', newline='', encoding='utf-8') as file:
    writer = csv.DictWriter(file, fieldnames=['name', 'address'])
    writer.writeheader()
    writer.writerows(facilities)