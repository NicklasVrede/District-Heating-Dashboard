from playwright.sync_api import sync_playwright
import time
import re

def get_pnumber(search_term: str) -> str:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        try:
            # Initial navigation
            page.goto("https://datacvr.virk.dk/")
            
            # Handle cookie consent if it appears
            try:
                page.get_by_role("link", name="Accepter").click()
            except:
                pass
            
            # Search for the company
            search_box = page.get_by_placeholder("Søg efter CVR-nr.,")
            search_box.fill(search_term)
            search_box.press("Enter")
            
            # Wait for search results
            page.wait_for_load_state('networkidle')
            time.sleep(1)  # Add small delay to ensure results are visible
            
            # Click the company result
            page.get_by_text(f"{search_term.upper()}", exact=False).first.click()
            
            # Wait and click P-enheder button
            page.wait_for_load_state('networkidle')
            page.get_by_role("button", name="P-enheder", exact=True).click()
            
            # Wait for P-number to be visible and extract it
            page.wait_for_load_state('networkidle')
            time.sleep(1)  # Add small delay for content to load
            
            # Try to find P-number using different selectors
            try:
                # First attempt: Look for the number directly
                pnumber = page.locator("div").filter(has_text=re.compile(r"^\d{10}$")).first.text_content()
                return pnumber
            except:
                try:
                    # Second attempt: Look for any text containing P-number
                    content = page.content()
                    match = re.search(r'P-nummer[:\s]*(\d{10})', content)
                    if match:
                        return match.group(1)
                except:
                    return None
            
            return None
            
        finally:
            context.close()
            browser.close()

# Test the function
if __name__ == "__main__":
    company_name = "Borup Varmeværk"
    try:
        result = get_pnumber(company_name)
        print(f"P-number for {company_name}: {result}")
    except Exception as e:
        print(f"Error: {e}")