import csv
from playwright.sync_api import sync_playwright
import time
import re
import signal
import sys
import pandas as pd
import os

def get_pnumber(search_term: str) -> str:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=False,
            args=['--no-first-run', '--no-startup-window', '--window-position=2000,0']
        )
        context = browser.new_context()
        context.set_default_timeout(10000)
        page = context.new_page()
        
        try:
            page.goto("https://datacvr.virk.dk/")
            
            search_box = page.get_by_placeholder("Søg efter CVR-nr.,")
            search_box.click()
            search_box.fill(search_term)
            search_box.press("Enter")
            
            try:
                page.wait_for_load_state('networkidle', timeout=5000)
                company_link = page.get_by_text(f"{search_term.upper()}", exact=False).first
                company_link.click(timeout=5000)
            except:
                print(f"Company not found: {search_term}")
                return None
            
            page.get_by_role("button", name="P-enheder", exact=True).click()
            
            try:
                pnumber = page.locator("div").filter(has_text=re.compile(r"^\d{10}$")).first.text_content()
                return pnumber
            except:
                return None
            
        except Exception as e:
            print(f"Error processing {search_term}: {str(e)}")
            return None
        finally:
            context.close()
            browser.close()

# Read the unmatched companies CSV
input_file = "data/prices/unmatched_companies.csv"
output_file = "data/prices/company_pnumbers.csv"
results = []

try:
    df = pd.read_csv(input_file, sep=';')
    
    for i, row in df.iterrows():
        name = row['Company']
        pno = get_pnumber(name)
        
        results.append({
            'Company': name,
            'PNummer': pno if pno else None
        })
        
        print(f"Request {i+1}: Company Name: {name}, CVRP: {pno}")
        time.sleep(1)

except KeyboardInterrupt:
    print("\nScript interrupted by user. Saving current results...")
finally:
    # Save the results to a new file
    if results:
        results_df = pd.DataFrame(results)
        results_df.to_csv(output_file, sep=';', index=False)
        print(f"Results saved to {output_file}")

def signal_handler(sig, frame):
    print("\nScript is being stopped gracefully...")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)