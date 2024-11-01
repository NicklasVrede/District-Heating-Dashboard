import pandas as pd

# File paths
input_csv_file_path = 'data/unique_names.csv'
output_excel_file_path = 'data/unique_names.xlsx'

# Read the CSV file into a DataFrame
df = pd.read_csv(input_csv_file_path)

# Save the DataFrame to an Excel file
df.to_excel(output_excel_file_path, index=False, engine='openpyxl')

print(f'Converted {input_csv_file_path} to {output_excel_file_path}')