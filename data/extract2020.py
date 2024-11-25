import pandas as pd

file_path = "data/data_2020-2022.xlsx"

# Read the Excel file
df = pd.read_excel(file_path)

# Filter for year 2020
df_2020 = df[df['aar'] == 2020]

# Save 2020 data to CSV
df_2020.to_csv('data/data_2020.csv', index=False)

print("2020 data has been extracted and saved to 'data_2020.csv'")