import os
import json
import sys

# -----------------------------------------
# 1. Define Your Project Tasks and Milestones
# -----------------------------------------
tasks = {
    "form_task": {
        "name": "User Form Task",
        "subtasks": {
            "create_form": {
                "name": "Create a form with required inputs",
                "milestones": {
                    "milestone1": {"description": "Create a form container", "completed": False},
                    "milestone2": {"description": "Include a name input field", "completed": False},
                    "milestone3": {"description": "Include an age input field", "completed": False},
                    "milestone4": {"description": "Include a phone number input field", "completed": False},
                    "milestone5": {"description": "Include a submit button", "completed": False},
                }
            }
        }
    }
}

# Set SIMULATE to False to use our local evaluation logic.
SIMULATE = False

# -----------------------------------------
# 2. Read Code from a Specific File
# -----------------------------------------
def read_file(file_path):
    """Reads and returns the content of the provided file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            code = f.read()
        return f"/* {file_path} */\n" + code + "\n\n"
    except Exception as e:
        print(f"[Error] Reading file {file_path}: {e}")
        return ""

# -----------------------------------------
# 3. Update Milestone
# -----------------------------------------
def update_milestone(task_id, subtask_id, milestone_id, status):
    """Update the milestone status in the tasks dictionary and write to tasks_status.json."""
    tasks[task_id]["subtasks"][subtask_id]["milestones"][milestone_id]["completed"] = status
    print(f"[Update] Milestone {milestone_id} updated to {status}.")
    try:
        with open("tasks_status.json", "w") as f:
            json.dump(tasks, f, indent=4)
        print("[Update] tasks_status.json file updated.")
    except Exception as e:
        print("[Error] Writing tasks_status.json:", e)

# -----------------------------------------
# 4. Evaluate Milestone Based on File Content
# -----------------------------------------
def evaluate_milestone(milestone_id, code):
    """Return 'Completed' or 'Not Completed' based on the content of code."""
    code_lower = code.lower()
    if milestone_id == "milestone1":
        # Check for a form container
        return "Completed" if "<form" in code_lower else "Not Completed"
    elif milestone_id == "milestone2":
        # Check for input field for username (you can also look for placeholder text)
        return "Completed" if ('name="username"' in code_lower or 'placeholder="your name"' in code_lower) else "Not Completed"
    elif milestone_id == "milestone3":
        # Check for input field for age
        return "Completed" if ('name="age"' in code_lower or 'placeholder="your age"' in code_lower) else "Not Completed"
    elif milestone_id == "milestone4":
        # Check for input field for phone number
        return "Completed" if ('name="phone"' in code_lower or 'placeholder="your phone"' in code_lower) else "Not Completed"
    elif milestone_id == "milestone5":
        # Check for a submit button (could be a button or input)
        return "Completed" if ('type="submit"' in code_lower) else "Not Completed"
    return "Not Completed"

# -----------------------------------------
# 5. Check Milestone Completion
# -----------------------------------------
def check_milestone_completion(task_id, subtask_id, milestone_id, file_path):
    milestone = tasks[task_id]["subtasks"][subtask_id]["milestones"][milestone_id]
    description = milestone["description"]
    
    # Read the contents of the specified file.
    code = read_file(file_path)
    
    prompt = (
        f"Analyze the following code and determine if the milestone '{description}' is completed.\n\n"
        f"Code:\n{code}\n\n"
        "Respond with 'Completed' or 'Not Completed'."
    )
    print(f"\n[Check] Prompt for {milestone_id} (truncated): {prompt[:200]}...")
    
    if SIMULATE:
        # In simulation mode, always return "Completed"
        ai_response = "Completed"
        print(f"[Simulated] AI response for {milestone_id}: {ai_response}")
    else:
        # Use our local evaluation function to analyze the file content.
        ai_response = evaluate_milestone(milestone_id, code)
        print(f"[Local Evaluation] AI response for {milestone_id}: {ai_response}")
    
    # Use exact comparison for evaluation.
    if ai_response.strip().lower() == "completed":
        update_milestone(task_id, subtask_id, milestone_id, True)
    else:
        print(f"[Status] Milestone {milestone_id} remains not completed.")
    
    print(f"[Done] Milestone check complete for {milestone_id}.")

# -----------------------------------------
# 6. Main Execution
# -----------------------------------------
if __name__ == "__main__":
    # Specify the path to your employee_form.html file.
    file_to_check = r"C:\Users\chand\OneDrive\Desktop\react pro\my-app\employee_form.html"
    task_id = "form_task"
    subtask_id = "create_form"

    print("[Agent] Starting milestone check...\n")

    # For each milestone, run the check.
    for milestone_id in tasks[task_id]["subtasks"][subtask_id]["milestones"]:
        check_milestone_completion(task_id, subtask_id, milestone_id, file_to_check)

    print("\n[Agent] All milestone checks complete. Exiting.")
    sys.exit(0)
