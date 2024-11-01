import pandas as pd
import json

# File paths
excel_file_path = 'data/data_om_fv.xlsx'
json_file_path = 'data/plant_to_area_map.json'
output_csv_file_path = 'data/unique_names.csv'

# Load the Excel file to inspect its structure
data_om_fv = pd.ExcelFile(excel_file_path)

# Load the '200pct metode' sheet into a DataFrame
df_200pct_metode = pd.read_excel(excel_file_path, sheet_name='200pct metode')

# Extract the names from the first column and drop NaN values
names_column_excel = df_200pct_metode.iloc[:, 0].dropna()

# Filter unique names to ensure there are three rows per name
unique_names_excel = sorted(names_column_excel.unique())

# Load the JSON file to get the mapping of names to forsyid
with open(json_file_path, 'r', encoding='utf-8') as file:
    plant_to_area_map = json.load(file)

# Extract unique names from the JSON file
unique_names_json = sorted(list(plant_to_area_map.keys()))

# Create a DataFrame with two columns: one for each file
df_combined = pd.DataFrame({
    'Unique Names from Excel': pd.Series(unique_names_excel),
    'Unique Names from JSON': pd.Series(unique_names_json)
})

# Save the DataFrame to a CSV file
df_combined.to_csv(output_csv_file_path, index=False, encoding='utf-8')

print(f'Sorted unique names have been saved to {output_csv_file_path}')