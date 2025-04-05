import sys
import json
import openai
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text, DateTime, Date
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.sql import func
import logging

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

Base = declarative_base()

# Database setup
DATABASE_URL = "mysql+pymysql://root:root@localhost/dbmanage"

# Disable SQLAlchemy logging to prevent unwanted output
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

engine = create_engine(DATABASE_URL, echo=False)
Session = sessionmaker(bind=engine)
session = Session()

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

def generate_tasks(project_id):
    try:
        # Fetch project description
        project = session.query(Project).filter_by(project_id=project_id).first()
        if not project:
            print(json.dumps({"error": "Project not found"}))
            return

        description = project.project_description

        prompt = f"""
You are an AI-powered project manager. Given a detailed project description, generate realistic tasks, subtasks, and milestones needed to complete the project.

### Rules for Task Generation:
- List tasks as categories (e.g., Backend, Frontend, Machine Learning, etc.).
- Each category must include at least 2-3 tasks.
- Each task must include at least 2-3 subtasks.
- Each subtask must be broken down into exactly 5 milestones.
- Milestones should represent small, clear steps towards completing a subtask.
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
                ]
            )
        except Exception as api_err:
            print(json.dumps({"error": f"OpenAI API error: {str(api_err)}"}))
            return

        response_content = response["choices"][0]["message"]["content"].strip()
        # NOTE: Remove any debug print that outputs extra text to stdout!
        # e.g., do not print debug_response here.

        try:
            data = json.loads(response_content)
        except json.JSONDecodeError as je:
            print(json.dumps({
                "error": "Invalid JSON response from OpenAI",
                "raw_response": response_content,
                "exception": str(je)
            }))
            return

        # Insert tasks, subtasks, and milestones into the database.
        for category in data.get("tasks", []):
            for task_data in category.get("tasks", []):
                task_name = task_data.get("task", "Unnamed Task")
                task = Task(name=task_name, project_id=project_id)
                session.add(task)
                session.commit()

                subtasks = task_data.get("subtasks")
                if not subtasks or len(subtasks) == 0:
                    # Fallback: create one default subtask with 5 default milestones
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
                                milestone = Milestone(name=milestone_data.get("name", "Unnamed Milestone"), subtask_id=subtask.id)
                                session.add(milestone)
                            session.commit()

        print(json.dumps({"message": "Tasks generated successfully"}))
    
    except Exception as e:
        session.rollback()
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Project ID is required"}))
    else:
        project_id = sys.argv[1]
        generate_tasks(project_id)
