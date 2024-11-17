import pandas as pd
import os

# Load the addresses CSV
addresses_df = pd.read_csv('data/plants.csv')

# Load the prices CSV with semicolon separator
prices_df = pd.read_csv('data/prices/fjernvarmepriser_jan-2024.csv', 
                       sep=';', 
                       encoding='utf-8',
                       on_bad_lines='skip')

# Convert CVRP/PNummer to string and remove decimals
def clean_number(x):
    if pd.isna(x):
        return None
    return str(int(float(x)))  # Convert to float first in case it's already decimal

# Create sets of CVRP numbers
addresses_cvrp = set(addresses_df['CVRP'].dropna().apply(clean_number))
prices_cvrp = set(prices_df['PNummer'].dropna().apply(clean_number))

# Find matches and non-matches
matches = addresses_cvrp.intersection(prices_cvrp)
not_in_prices = addresses_cvrp - prices_cvrp

# Print matches with company names
print("Matches found:")
print("-" * 80)
for cvrp in sorted(matches):
    address_name = addresses_df[addresses_df['CVRP'].apply(lambda x: clean_number(x) if pd.notna(x) else None) == cvrp]['name'].iloc[0]
    price_name = prices_df[prices_df['PNummer'].apply(lambda x: clean_number(x) if pd.notna(x) else None) == cvrp]['Fjernvarmeforsyning'].iloc[0]
    print(f"CVRP: {cvrp}")
    print(f"Address name: {address_name}")
    print(f"Price name: {price_name}")
    print("-" * 80)

print("\nAddresses not found in prices file:")
print("-" * 80)
for cvrp in sorted(not_in_prices):
    name = addresses_df[addresses_df['CVRP'].apply(lambda x: clean_number(x) if pd.notna(x) else None) == cvrp]['name'].iloc[0]
    print(f"CVRP: {cvrp}")
    print(f"Name: {name}")
    print("-" * 80)

# Print statistics
print(f"\nStatistics:")
print(f"Total addresses with CVRP: {len(addresses_cvrp)}")
print(f"Total prices with CVRP: {len(prices_cvrp)}")
print(f"Matches found: {len(matches)}")
print(f"Addresses not in prices: {len(not_in_prices)}") 