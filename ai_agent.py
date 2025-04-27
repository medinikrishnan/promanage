#!/usr/bin/env python3
import sys
import os
import glob
import json
import time

import openai
from openai.error import RateLimitError
from dotenv import load_dotenv

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

from colorama import init, Fore, Style
init(autoreset=True)

# -----------------------------
# Load environment variables
# -----------------------------
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

def get_last_n_files(dir_path, patterns, n=3):
    files = []
    for pat in patterns:
        files.extend(glob.glob(os.path.join(dir_path, pat)))
    return sorted(set(files), key=os.path.getmtime, reverse=True)[:n]

def check_milestones_from_text(aggregated_text, domain, model="gpt-4"):
    system_msg = {
        "role": "system",
        "content": (
            "You are a project-management assistant. You MUST return only a JSON object "
            "mapping each milestone text to \"YES\" or \"NO\". No additional text."
        )
    }
    user_msg = {
        "role": "user",
        "content": f"""
Below are the milestone names (one per line) for the {domain} domain.
Tell me for each one whether it is completed. Return strictly JSON:

{aggregated_text}

Example:
{{
  "Create Tables": "YES",
  "Define Indexes": "NO"
}}
"""
    }

    resp = openai.ChatCompletion.create(
        model=model,
        messages=[system_msg, user_msg],
        temperature=0
    )
    return resp.choices[0].message.content.strip()
def mark_specific_milestone_completed(milestone_name, employee_email):
    """
    Uses Selenium to log in, navigate to My Milestones in your React sidebar,
    and click the Complete button for the given milestone_name.
    """
    chrome_options = Options()
    chrome_options.add_argument("--remote-allow-origins=*")
    chrome_options.add_experimental_option("prefs", {
        "credentials_enable_service": False,
        "profile.password_manager_enabled": False
    })
    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 15)

    try:
        driver.maximize_window()

        # 1) Log in
        driver.get("http://localhost:3000")
        wait.until(EC.presence_of_element_located((By.NAME, "email"))).send_keys(employee_email)
        driver.find_element(By.NAME, "password").send_keys(employee_email.split('@')[0])
        driver.find_element(By.XPATH, "//button[@type='submit']").click()

        # 2) Click "My Milestones" in the sidebar
        milestones_btn = wait.until(EC.element_to_be_clickable((
            By.XPATH,
            "//span[normalize-space(text())='My Milestones']"
        )))
        driver.execute_script("arguments[0].click();", milestones_btn)
        time.sleep(2)  # let the page render

        # 3) Find the milestone and complete it
        items = driver.find_elements(By.XPATH, "//li")
        target = None
        for li in items:
            if milestone_name.lower() in li.text.lower():
                target = li
                break

        if not target:
            print(Fore.RED + Style.BRIGHT + f"[ERROR] Could not find milestone: {milestone_name}")
            return

        complete_btn = target.find_element(
            By.XPATH,
            ".//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), 'complete')]"
        )
        driver.execute_script("arguments[0].click();", complete_btn)
        print(Fore.GREEN + Style.BRIGHT + f"[DONE] '{milestone_name}' marked complete.")

    except Exception as e:
        print(Fore.RED + Style.BRIGHT + f"[ERROR] Selenium error for '{milestone_name}': {e}")
    finally:
        driver.quit()

def main():
    if len(sys.argv) != 4:
        print(Fore.RED + Style.BRIGHT + "Usage: python ai_agent.py <path_or_dir> <domain> <employee_email>")
        sys.exit(1)

    path_or_dir, domain, employee_email = sys.argv[1], sys.argv[2], sys.argv[3]

    if os.path.isdir(path_or_dir):
        dir_to_scan = path_or_dir
    elif os.path.isfile(path_or_dir):
        dir_to_scan = os.path.dirname(path_or_dir) or '.'
    else:
        print(Fore.RED + Style.BRIGHT + f"[ERROR] '{path_or_dir}' is not a valid path.")
        sys.exit(1)

    patterns = ["*.txt", "*.html", "*.js", "*.css", "*.py"]
    last_three = get_last_n_files(dir_to_scan, patterns, n=3)
    if not last_three:
        print(Fore.RED + Style.BRIGHT + f"[ERROR] No files matching {patterns} in {dir_to_scan}")
        sys.exit(1)

    print(Fore.CYAN + "Checking these files (newest first):")
    for fp in last_three:
        print(Fore.CYAN + " -", fp)

    all_milestones = []
    for fp in last_three:
        try:
            text = open(fp, 'r', encoding='utf-8', errors='ignore').read()
        except Exception as e:
            print(Fore.RED + Style.BRIGHT + f"[ERROR] reading {fp}: {e}")
            continue

        for line in text.splitlines():
            if "Milestone:" in line:
                name = line.split("Milestone:",1)[1].strip()
                if name:
                    all_milestones.append(name)

    if not all_milestones:
        print(Fore.YELLOW + "[INFO] No milestones found.")
        sys.exit(0)

    aggregated = "\n".join(all_milestones)
    try:
        raw = check_milestones_from_text(aggregated, domain, model="gpt-4")
    except RateLimitError:
        print(Fore.YELLOW + "[WARN] GPT-4 limit hit, retrying with gpt-3.5-turbo")
        raw = check_milestones_from_text(aggregated, domain, model="gpt-3.5-turbo")

    try:
        milestone_status = json.loads(raw)
    except Exception as e:
        print(Fore.RED + Style.BRIGHT + f"[ERROR] Could not parse JSON from AI: {e}")
        print(Fore.RED + "Raw AI response:", raw)
        sys.exit(1)

    not_done = []
    for ms, stat in milestone_status.items():
        if stat.strip().upper() == "YES":
            print(Fore.GREEN + Style.BRIGHT + "AI -> YES:", ms)
            mark_specific_milestone_completed(ms, employee_email)
        else:
            not_done.append(ms)

    if not_done:
        print(Fore.YELLOW + Style.BRIGHT + "\nMilestones NOT completed:")
        for m in not_done:
            print(Fore.YELLOW + " -", m)
    else:
        print(Fore.GREEN + Style.BRIGHT + "\nAll detected milestones were marked completed.")

if __name__ == "__main__":
    main()
