import pandas as pd

def clean_name(name):
    """Clean company name for better matching"""
    if pd.isna(name):
        return ""
    # Convert to lowercase and remove common words/characters
    name = str(name).lower().strip()
    replacements = {
        'a/s': '', 'amba': '', 'a.m.b.a.': '', 'a.m.b.a': '', 'amba.': '',
        'i/s': '', 'aps': '', 'a/s.': '', 'varmeværk': 'varme', 
        'fjernvarmeværk': 'fjernvarme', 'kraftvarmeværk': 'varme',
        'varmeforsyning': 'varme', 'fjernvarmeforsyning': 'fjernvarme'
    }
    for old, new in replacements.items():
        name = name.replace(old, new)
    return ' '.join(name.split())

def get_first_word(name):
    """Get first word from cleaned name"""
    cleaned = clean_name(name)
    return cleaned.split()[0] if cleaned else ""

# Load the data with CVRP as string
addresses_df = pd.read_csv('data/addresses_with_coordinates.csv', dtype={'CVRP': str})
prices_df = pd.read_csv('data/prices/fjernvarmepriser_jan-2024.csv', sep=';', encoding='utf-8', dtype={'PNummer': str})

def clean_number(x):
    if pd.isna(x):
        return None
    return str(int(float(x))) if str(x).strip() != '' else None

# Clean existing CVRP numbers
addresses_df['CVRP'] = addresses_df['CVRP'].apply(clean_number)

# Create name mappings from prices file
price_name_to_cvrp = {}
price_firstword_to_cvrp = {}
for _, row in prices_df.iterrows():
    if pd.notna(row['Fjernvarmeforsyning']) and pd.notna(row['PNummer']):
        clean_company_name = clean_name(row['Fjernvarmeforsyning'])
        first_word = get_first_word(row['Fjernvarmeforsyning'])
        cvrp = clean_number(row['PNummer'])
        if clean_company_name:
            price_name_to_cvrp[clean_company_name] = cvrp
        if first_word:
            if first_word not in price_firstword_to_cvrp:
                price_firstword_to_cvrp[first_word] = []
            price_firstword_to_cvrp[first_word].append((clean_company_name, cvrp))

# Track changes
updates = []
not_found = []

# Process addresses without CVRP or with unmatched CVRP
for idx, row in addresses_df.iterrows():
    current_cvrp = row['CVRP']
    if current_cvrp not in set(prices_df['PNummer'].apply(clean_number)):
        clean_company_name = clean_name(row['name'])
        first_word = get_first_word(row['name'])
        
        # Try full name match first
        if clean_company_name in price_name_to_cvrp:
            new_cvrp = price_name_to_cvrp[clean_company_name]
            match_type = "full name"
        # Try first word match if full name fails
        elif first_word in price_firstword_to_cvrp:
            matches = price_firstword_to_cvrp[first_word]
            if len(matches) == 1:  # Only use if there's exactly one match
                new_cvrp = matches[0][1]
                match_type = "first word"
            else:
                new_cvrp = None
                match_type = None
        else:
            new_cvrp = None
            match_type = None
            
        if new_cvrp:
            old_value = current_cvrp
            addresses_df.at[idx, 'CVRP'] = new_cvrp
            updates.append({
                'name': row['name'],
                'old_cvrp': old_value,
                'new_cvrp': new_cvrp,
                'match_type': match_type
            })
        else:
            not_found.append({
                'name': row['name'],
                'current_cvrp': current_cvrp
            })

# Save updated addresses file
addresses_df.to_csv('data/addresses_with_coordinates.csv', index=False)

# Print results
print("Updates made:")
print("-" * 80)
for update in updates:
    print(f"Company: {update['name']}")
    print(f"Old CVRP: {update['old_cvrp']}")
    print(f"New CVRP: {update['new_cvrp']}")
    print(f"Match type: {update['match_type']}")
    print("-" * 80)

print("\nCompanies still without matches:")
print("-" * 80)
for company in not_found:
    print(f"Name: {company['name']}")
    print(f"Current CVRP: {company['current_cvrp']}")
    print("-" * 80)

print(f"\nStatistics:")
print(f"Total updates made: {len(updates)}")
print(f"Companies still without matches: {len(not_found)}") 