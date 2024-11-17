def merge_pnummer():
    # Read the original file with PNummer
    pnummer_dict = {}
    with open('data/prices/fjernvarmepriser_jan_2019.csv', 'r', encoding='utf-8') as f:
        next(f)  # Skip header
        for line in f:
            parts = line.strip().split(';')
            if len(parts) > 1:
                pnummer = parts[0]
                name = parts[1]
                pnummer_dict[name] = pnummer

    # Read and update the copy file
    lines = []
    with open('data/prices/fjernvarmepriser_jan_2019 copy.csv', 'r', encoding='utf-8') as f:
        header = next(f)
        lines.append("PNummer;" + header)  # Add PNummer to header
        
        for line in f:
            parts = line.strip().split(';')
            if len(parts) > 0:
                name = parts[0]
                pnummer = pnummer_dict.get(name, "0")  # Use "0" if no match found
                lines.append(f"{pnummer};{line}")

    # Write back to the copy file
    with open('data/prices/fjernvarmepriser_jan_2019 copy.csv', 'w', encoding='utf-8', newline='') as f:
        for line in lines:
            f.write(line)

merge_pnummer()
