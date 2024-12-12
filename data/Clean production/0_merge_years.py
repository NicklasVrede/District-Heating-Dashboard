"""
Merges production data from 2000-2020 and 2021-2023.
Loads from 2000-2020.csv and 2021-2023.csv, saves to production_no_merge.csv
"""

import pandas as pd

filepath = "data/Clean production/2000-2020.csv"
filepath2 = "data/Clean production/2021-2023.csv"

df = pd.read_csv(filepath, low_memory=False)
df2 = pd.read_csv(filepath2, low_memory=False)

df = pd.concat([df, df2], ignore_index=True)

df.to_csv("data/Clean production/production_no_merge.csv", index=False)
