import pandas as pd
import csv

# File paths
input_csv_file_path1 = 'data/addresses_with_coordinates.csv'
input_csv_file_path2 = 'data/addresses.csv'
output_csv_file_path1 = 'data/addresses_with_coordinates_transformed.csv'
output_csv_file_path2 = 'data/addresses_transformed.csv'

# Function to transform names in a CSV file
def transform_csv(input_path, output_path):
    # Read the CSV file line by line
    with open(input_path, 'r', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        rows = []
        for line_number, row in enumerate(reader, start=1):
            try:
                # Transform the names to lowercase and capitalize the first letter of each word
                row[0] = row[0].title()
                rows.append(row)
            except Exception as e:
                print(f"Error processing line {line_number}: {row}")
                print(f"Error: {e}")

    # Save the updated rows to a new CSV file
    with open(output_path, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.writer(outfile)
        writer.writerows(rows)

    print(f'Transformed names have been saved to {output_path}')

# Transform the names in the first CSV file
transform_csv(input_csv_file_path1, output_csv_file_path1)

# Transform the names in the second CSV file
transform_csv(input_csv_file_path2, output_csv_file_path2)