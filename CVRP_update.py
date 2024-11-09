import csv
from playwright.sync_api import sync_playwright
import time
import re
import signal
import sys
import json

CONFIG_FILE = "scraper_config.json"

# Load configuration
def load_config():
    try:
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file '{file_path}' not found.")
        sys.exit(1)

# Save configuration
def save_config(config):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=4)

# Load initial configuration
config = load_config()
start_line = config["start_line"]
file_path = config["file_path"]
max_requests = config["max_requests"]

def get_pnumber(search_term: str) -> str:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=False)
        context = browser.new_context()
        context.set_default_timeout(10000)
        page = context.new_page()
        
        try:
            # Initial navigation
            page.goto("https://datacvr.virk.dk/")
            
            # Search for the company
            search_box = page.get_by_placeholder("Søg efter CVR-nr.,")
            search_box.click()
            search_box.fill(search_term)
            search_box.press("Enter")
            
            # Wait for search results with shorter timeout
            try:
                page.wait_for_load_state('networkidle', timeout=5000)
                company_link = page.get_by_text(f"{search_term.upper()}", exact=False).first
                company_link.click(timeout=5000)
            except:
                print(f"Company not found: {search_term}")
                return None
            
            # Click P-enheder button
            page.get_by_role("button", name="P-enheder", exact=True).click()
            
            # Get P-number using the exact regex pattern
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

# Read the CSV file and process each line
with open(file_path, mode='r', newline='', encoding='utf-8') as infile:
    reader = csv.reader(infile)
    lines = list(reader)

# Process lines starting from start_line
request_count = 0
try:
    # Check if we've already processed all lines
    if start_line > len(lines):
        print("No more plants to process. All lines have been completed.")
        sys.exit(0)
        
    for i in range(start_line - 1, len(lines)):
        if request_count >= max_requests:
            # Update start_line for next run
            config["start_line"] = i + 1
            save_config(config)
            print(f"Reached maximum requests ({max_requests}). Stopping for now.")
            break
        
        name = lines[i][0]
        pno = get_pnumber(name)
        
        if pno is not None and pno != '' and pno != 'None':
            lines[i].append(pno)
        else:
            lines[i].append('')
        
        request_count += 1
        print(f"Request {request_count}: Plant Name: {name}, CVRP: {pno}")
        time.sleep(1)

except KeyboardInterrupt:
    print("\nScript interrupted by user. Saving progress...")
    # Update start_line before exiting
    config["start_line"] = i + 1
    save_config(config)
finally:
    # Write the updated lines back to the CSV file
    with open(file_path, mode='w', newline='', encoding='utf-8') as outfile:
        writer = csv.writer(outfile)
        writer.writerows(lines)
    print(f"Progress saved. Script terminated at line {config['start_line']}")

def signal_handler(sig, frame):
    print("\nScript is being stopped gracefully...")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)