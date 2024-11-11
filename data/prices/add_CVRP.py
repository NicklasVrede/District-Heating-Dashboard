import pandas as pd
import os

def get_company_words(name):
    """Get first word and first two words from company name in lowercase"""
    if pd.isna(name):
        return "", ""
    words = str(name).strip().lower().split()
    first_word = words[0] if words else ""
    two_words = " ".join(words[:2]) if len(words) >= 2 else ""
    return first_word, two_words

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Load additional PNummer mappings from company_pnumbers.csv
additional_pnumbers = {}
additional_file = os.path.join(current_dir, 'company_pnumbers.csv')
if os.path.exists(additional_file):
    additional_df = pd.read_csv(additional_file, sep=';')
    for _, row in additional_df.iterrows():
        if pd.notna(row['PNummer']):  # Only add if PNummer exists
            additional_pnumbers[row['Company'].strip()] = int(row['PNummer'])

# Load 2021 prices as reference
reference_file = os.path.join(current_dir, 'fjernvarmepriser_jan_2021.csv')
reference_df = pd.read_csv(reference_file, sep=';', encoding='utf-8')

# Convert PNummer to integer in reference data
reference_df['PNummer'] = pd.to_numeric(reference_df['PNummer'], errors='coerce').fillna(0).astype(int)

# Create mappings using both one and two words
one_word_to_cvrp = {}
two_word_to_cvrp = {}

for _, row in reference_df.iterrows():
    if pd.notna(row['Fjernvarmeforsyning']):
        first_word, two_words = get_company_words(row['Fjernvarmeforsyning'])
        if first_word:
            one_word_to_cvrp[first_word] = int(row['PNummer'])
        if two_words:
            two_word_to_cvrp[two_words] = int(row['PNummer'])

# Files to process
files_to_process = [
    'fjernvarmepriser_jan_2019.csv',
]

# Keep track of unmatched companies
unmatched_companies = set()

for filename in files_to_process:
    print(f"Processing {filename}...")
    
    # Read the file
    df = pd.read_csv(os.path.join(current_dir, filename), sep=';', encoding='utf-8')
    
    # Remove any duplicate header rows
    df = df[df['Fjernvarmeforsyning'] != 'Fjernvarmeforsyning']
    
    # Add PNummer column if it doesn't exist
    if 'PNummer' not in df.columns:
        df['PNummer'] = None
    
    # Update PNummer where missing and collect unmatched
    for idx, row in df.iterrows():
        if pd.isna(row['Fjernvarmeforsyning']):
            continue
        
        first_word, two_words = get_company_words(row['Fjernvarmeforsyning'])
        
        # Try two-word match first, then one-word match
        if two_words in two_word_to_cvrp:
            df.at[idx, 'PNummer'] = int(two_word_to_cvrp[two_words])
        elif first_word in one_word_to_cvrp:
            df.at[idx, 'PNummer'] = int(one_word_to_cvrp[first_word])
        # Try exact match from additional file as last resort
        elif str(row['Fjernvarmeforsyning']).strip() in additional_pnumbers:
            df.at[idx, 'PNummer'] = int(additional_pnumbers[str(row['Fjernvarmeforsyning']).strip()])
        elif pd.notna(row['Fjernvarmeforsyning']):
            unmatched_companies.add(row['Fjernvarmeforsyning'])
    
    # Clean up empty rows
    df = df.dropna(how='all')  # Remove rows where all values are NaN
    df = df[df['Fjernvarmeforsyning'].notna()]  # Remove rows with no company name
    
    # Convert PNummer to integer
    df['PNummer'] = pd.to_numeric(df['PNummer'], errors='coerce').fillna(0).astype(int)
    
    # Reorder columns to put PNummer first
    cols = df.columns.tolist()
    cols = ['PNummer'] + [col for col in cols if col != 'PNummer']
    df = df[cols]
    
    # Save with integer format
    new_filename = os.path.join(current_dir, f"updated_{filename}")
    df.to_csv(new_filename, sep=';', index=False, encoding='utf-8', float_format='%.0f')
    
    # Print statistics
    total_rows = len(df)
    matched_rows = (df['PNummer'] > 0).sum()
    print(f"Matched {matched_rows} out of {total_rows} companies ({matched_rows/total_rows*100:.1f}%)")

# Save unmatched companies to CSV
if unmatched_companies:
    unmatched_df = pd.DataFrame({'Company': list(unmatched_companies)})
    unmatched_file = os.path.join(current_dir, "unmatched_companies.csv")
    unmatched_df.to_csv(unmatched_file, sep=';', index=False, encoding='utf-8')
    print(f"\nUnmatched companies saved to {unmatched_file}")
