import sys
import json
import openai
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text, DateTime, Date
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.sql import func
import logging
from flask import Flask, request, jsonify
import pandas as pd
import pickle

# Load environment variables and set OpenAI API key
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")  # Ensure your .env has OPENAI_API_KEY

# Set up logging to reduce verbosity from SQLAlchemy (optional)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

# Set up SQLAlchemy
Base = declarative_base()
DATABASE_URL = "mysql+pymysql://root:root@localhost/dbmanage"  # adjust as needed
engine = create_engine(DATABASE_URL, echo=False)
Session = sessionmaker(bind=engine)
session = Session()

# Define your models
class Task(Base):
    __tablename__ = 'tasks'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    project_id = Column(String, ForeignKey('projects.project_id'), nullable=False)
    status = Column(Integer, default=0)
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())

class Subtask(Base):
    __tablename__ = 'subtasks'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    task_id = Column(Integer, ForeignKey('tasks.id'), nullable=False)
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())

class Milestone(Base):
    __tablename__ = 'milestones'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    subtask_id = Column(Integer, ForeignKey('subtasks.id'), nullable=False)
    status = Column(Integer, default=0)
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())

class Project(Base):
    __tablename__ = 'projects'
    project_id = Column(Integer, primary_key=True, autoincrement=False)
    project_name = Column(String, nullable=False)
    project_description = Column(Text, nullable=False)
    deadline = Column(Date, nullable=True)

# ----------------------------
# Functions for Task Generation
# ----------------------------

def generate_tasks_preview(project_id, user_feedback=""):
    """
    Generates tasks (preview) by calling OpenAI API with your project description.
    Returns a JSON object (dictionary) containing the preview.
    """
    project = session.query(Project).filter_by(project_id=project_id).first()
    if not project:
        return {"error": "Project not found"}

    description = project.project_description
    feedback_str = f"\nUser Feedback: {user_feedback}" if user_feedback else ""

    prompt = f"""
You are an AI-powered project management assistant. Given a detailed project description{feedback_str}, generate realistic tasks, subtasks, and milestones needed to complete the project.

### Rules for Task Generation:
- List tasks as categories (e.g., Backend, Frontend, etc.).
- Each category must include at least 2-3 tasks.
- Each task must include at least 2-3 subtasks.
- Each subtask must be broken down into exactly 5 milestones.
- Milestones should represent small, clear steps toward completing a subtask.
- **IMPORTANT:** Every task must include a "subtasks" key, and every subtask must include a "milestones" key with exactly 5 milestones.
- Return only a valid JSON object matching the format below, with no additional text.

### Project Description:
{description}

### Expected JSON Output Format:
{{
  "tasks": [
    {{
      "category": "Backend Development",
      "tasks": [
        {{
          "task": "Develop API endpoints for authentication",
          "subtasks": [
            {{
              "name": "Design API architecture",
              "milestones": [
                {{ "name": "Define endpoints" }},
                {{ "name": "Outline request/response structure" }},
                {{ "name": "Document API specifications" }},
                {{ "name": "Review design with team" }},
                {{ "name": "Finalize architecture" }}
              ]
            }},
            {{
              "name": "Implement authentication logic",
              "milestones": [
                {{ "name": "Set up authentication middleware" }},
                {{ "name": "Integrate OAuth flow" }},
                {{ "name": "Implement session management" }},
                {{ "name": "Test authentication endpoints" }},
                {{ "name": "Deploy authentication service" }}
              ]
            }}
          ]
        }},
        {{
          "task": "Implement database schema",
          "subtasks": [
            {{
              "name": "Design database tables",
              "milestones": [
                {{ "name": "Define table structure" }},
                {{ "name": "Set up relationships" }},
                {{ "name": "Create indexes" }},
                {{ "name": "Write migration scripts" }},
                {{ "name": "Review schema design" }}
              ]
            }},
            {{
              "name": "Seed initial data",
              "milestones": [
                {{ "name": "Identify seed data" }},
                {{ "name": "Write seed scripts" }},
                {{ "name": "Validate data integrity" }},
                {{ "name": "Test seed process" }},
                {{ "name": "Deploy seed data" }}
              ]
            }}
          ]
        }}
      ]
    }}
  ]
}}
    """

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a project management assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=0  # deterministic output
        )
    except Exception as api_err:
        return {"error": f"OpenAI API error: {str(api_err)}"}

    response_content = response["choices"][0]["message"]["content"].strip()

    try:
        preview_data = json.loads(response_content)
    except json.JSONDecodeError as je:
        return {
            "error": "Invalid JSON response from OpenAI",
            "raw_response": response_content,
            "exception": str(je)
        }
    return preview_data

def confirm_tasks_in_db(tasks_preview, project_id):
    try:
        for category in tasks_preview.get("tasks", []):
            for task_data in category.get("tasks", []):
                task_name = task_data.get("task", "Unnamed Task")
                task = Task(name=task_name, project_id=project_id)
                session.add(task)
                session.commit()

                subtasks = task_data.get("subtasks")
                if not subtasks or len(subtasks) == 0:
                    default_subtask = Subtask(name="Default Subtask", task_id=task.id)
                    session.add(default_subtask)
                    session.commit()
                    default_milestones = [
                        Milestone(name="Default Milestone 1", subtask_id=default_subtask.id),
                        Milestone(name="Default Milestone 2", subtask_id=default_subtask.id),
                        Milestone(name="Default Milestone 3", subtask_id=default_subtask.id),
                        Milestone(name="Default Milestone 4", subtask_id=default_subtask.id),
                        Milestone(name="Default Milestone 5", subtask_id=default_subtask.id),
                    ]
                    session.add_all(default_milestones)
                    session.commit()
                else:
                    for subtask_data in subtasks:
                        milestones = subtask_data.get("milestones")
                        if not milestones or len(milestones) != 5:
                            subtask = Subtask(name=subtask_data.get("name", "Unnamed Subtask"), task_id=task.id)
                            session.add(subtask)
                            session.commit()
                            default_milestones = [
                                Milestone(name="Default Milestone 1", subtask_id=subtask.id),
                                Milestone(name="Default Milestone 2", subtask_id=subtask.id),
                                Milestone(name="Default Milestone 3", subtask_id=subtask.id),
                                Milestone(name="Default Milestone 4", subtask_id=subtask.id),
                                Milestone(name="Default Milestone 5", subtask_id=subtask.id),
                            ]
                            session.add_all(default_milestones)
                            session.commit()
                        else:
                            subtask = Subtask(name=subtask_data.get("name", "Unnamed Subtask"), task_id=task.id)
                            session.add(subtask)
                            session.commit()
                            for milestone_data in milestones:
                                milestone = Milestone(
                                    name=milestone_data.get("name", "Unnamed Milestone"),
                                    subtask_id=subtask.id
                                )
                                session.add(milestone)
                            session.commit()
        return {"message": "Tasks generated and saved successfully."}
    except Exception as e:
        session.rollback()
        return {"error": str(e)}

# ----------------------------
# Flask App & API Endpoints
# ----------------------------
app = Flask(__name__)

@app.route("/api/generate-tasks-preview", methods=["GET"])
def generate_tasks_preview_api():
    project_id = request.args.get("project_id")
    user_feedback = request.args.get("feedback", "")
    if not project_id:
        return jsonify({"error": "project_id is required"}), 400
    preview = generate_tasks_preview(project_id, user_feedback)
    return jsonify(preview)

@app.route("/api/confirm-tasks", methods=["POST"])
def confirm_tasks_api():
    data = request.get_json()
    project_id = data.get("project_id")
    tasks_preview = data.get("tasks")
    if not project_id or not tasks_preview:
        return jsonify({"error": "project_id and tasks are required"}), 400
    result = confirm_tasks_in_db(tasks_preview, project_id)
    return jsonify(result)

# ----------------------------
# Optional: A simple debugging endpoint to run prediction in the terminal
# ----------------------------
@app.route("/api/test-prediction", methods=["POST"])
def test_prediction():
    data = request.get_json()
    df = pd.DataFrame([data])
    # Assuming you want to use your trained model for prediction
    try:
        with open("employee_performance_model.pkl", "rb") as f:
            model = pickle.load(f)
    except Exception as e:
        return jsonify({"error": "Failed to load model", "exception": str(e)}), 500
    try:
        prediction = model.predict(df)[0]
        return jsonify({"prediction": float(prediction)})
    except Exception as e:
        return jsonify({"error": "Prediction error", "exception": str(e)}), 500

if __name__ == "__main__":
    # Run the Flask service on port 5002 (or any free port)
    app.run(host="0.0.0.0", port=5002, debug=True)
