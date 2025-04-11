import sys
import os
import time
import openai
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

# -----------------------------
# Load environment variables and set OpenAI API key
# -----------------------------
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

def check_task_completion_with_gpt(file_path, domain, milestone_text):
    """
    Reads the code from the specified file and uses OpenAI's ChatCompletion
    to determine whether the milestone 'milestone_text' in the given 'domain' is completed.
    Returns True if the response is "YES", else False.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            code_content = f.read()
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return False

    prompt = f"""
You are an expert code reviewer specialized in {domain} development.

Given the following milestone in the {domain} domain: "{milestone_text}"

And examining the following file content:

{code_content}

Determine if this milestone is fully accomplished.
Just answer "YES" if it has been completed, or "NO" if it has not.
    """

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",  # or 'gpt-3.5-turbo'
            messages=[{"role": "user", "content": prompt}],
            temperature=0  # deterministic output
        )
    except Exception as api_err:
        print(f"Error calling OpenAI API: {api_err}")
        return False

    try:
        answer = response['choices'][0]['message']['content'].strip().upper()
        print("OpenAI API answer:", answer)
        return answer == "YES"
    except (KeyError, IndexError) as parse_err:
        print("Error parsing OpenAI response:", parse_err)
        return False

def mark_specific_milestone_completed(milestone_name):
    """
    Uses Selenium to:
      1. Log in to the dashboard at http://localhost:3000/login using hardcoded credentials.
      2. Navigate to "My Projects" then "My Milestones".
      3. Locate the specific milestone that contains milestone_name (case-insensitive) and click its associated "Complete" button.
    """
    try:
        chrome_options = Options()
        chrome_options.add_experimental_option("prefs", {
            "credentials_enable_service": False,
            "profile.password_manager_enabled": False
        })
        driver = webdriver.Chrome(options=chrome_options)
        wait = WebDriverWait(driver, 15)  # Wait up to 15 seconds for elements

        # --- Step 1: Log in ---
        login_url = "http://localhost:3000"  # Adjust if needed
        driver.get(login_url)

        email_field = wait.until(EC.presence_of_element_located((By.NAME, "email")))
        password_field = wait.until(EC.presence_of_element_located((By.NAME, "password")))
        email_field.clear()
        password_field.clear()
        email_field.send_keys("employee1@gmail.com")
        password_field.send_keys("employee1")

        # Locate the login button (using its type attribute; adjust if necessary)
        login_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']")))
        driver.execute_script("arguments[0].click();", login_button)

        # --- Step 2: Navigate to "My Projects" then "My Milestones" ---
        # Wait for the dashboard to load by waiting for the "My Projects" element.
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'my projects')]")))
        my_projects_item = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'my projects')]")))
        driver.execute_script("arguments[0].click();", my_projects_item)
        time.sleep(2)

        my_milestones_item = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'my milestones')]")))
        driver.execute_script("arguments[0].click();", my_milestones_item)
        time.sleep(6)

        # --- Step 3: Locate the specific milestone and click "Complete" ---
        # Adjust the XPath to search within <li> elements for the milestone text and then find the descendant button with class "complete-btn"
        milestone_container = wait.until(EC.presence_of_element_located((
            By.XPATH,
            f"//li[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{milestone_name.lower()}')]"
        )))
        complete_button = milestone_container.find_element(
            By.XPATH, ".//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'complete')]"
        )
        driver.execute_script("arguments[0].click();", complete_button)
        print(f"Marked milestone '{milestone_name}' as completed.")
        time.sleep(2)
    except Exception as e:
        print(f"Error marking milestone '{milestone_name}' as complete: {e}")
    finally:
        driver.quit()

def main():
    """
    Usage:
       python ai_agent.py <file_path> <domain> <milestone_text>
       
    Example:
       python ai_agent.py employee_form.html Database "define user schema"
    """
    if len(sys.argv) < 4:
        print("Usage: python ai_agent.py <file_path> <domain> <milestone_text>")
        sys.exit(1)

    file_path = sys.argv[1]
    domain = sys.argv[2]
    milestone_text = sys.argv[3]

    print("Checking milestone completion status...")
    if check_task_completion_with_gpt(file_path, domain, milestone_text):
        print(f"AI says milestone '{milestone_text}' is completed! Proceeding to mark it in the dashboard.")
        mark_specific_milestone_completed(milestone_text)
    else:
        print(f"AI says milestone '{milestone_text}' is NOT completed yet.")

if __name__ == "__main__":
    main()
