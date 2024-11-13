import pandas as pd
import numpy as np

# File to clean
file_path = "data/prices/fjernvarmepriser_jan_2022.csv"

try:
    # Read the CSV with semicolon delimiter and treat all columns as strings
    df = pd.read_csv(
        file_path,
        sep=';',
        encoding='utf-8',
        dtype=str  # Read all columns as strings from the start
    )
    
    # Print rows where ID is 0 for review
    print("\nRows with ID 0 (will be assigned synthetic IDs):")
    print(df[df.iloc[:, 0] == 0])
    
    # Generate synthetic IDs starting with 9999
    synthetic_id_start = 99990000
    mask = df.iloc[:, 0] == 0
    df.loc[mask, df.columns[0]] = range(
        synthetic_id_start, 
        synthetic_id_start + len(df[mask])
    )
    
    # Remove dots from numeric columns and convert to integers
    numeric_columns = [3, 4, 5]  # Indices for MWhPris, apartment price, and house price
    for col in numeric_columns:
        df.iloc[:, col] = (df.iloc[:, col]
                          .str.replace('.', '')  # Remove dots
                          .astype(int))          # Convert to integer
    
    print("\nFirst few rows of processed data:")
    print(df.head())
    
    # Save to both JSON and CSV with semicolon delimiter
    df.to_json('data/prices/cleaned_fjernvarmepriser_jan_2022.json', orient='records')
    df.to_csv('data/prices/cleaned_fjernvarmepriser_jan_2022.csv', 
              sep=';',
              index=False,
              encoding='utf-8')
    
    print(f"\nProcessed {len(df)} rows, replaced {sum(mask)} zero IDs with synthetic IDs")

except Exception as e:
    print(f"Error processing file: {str(e)}")


