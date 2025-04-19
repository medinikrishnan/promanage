import sys
import json
import openai
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text, DateTime, Date
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.sql import func
import logging
from datetime import datetime

# Load environment variables and set OpenAI API key
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# Set up logging to reduce verbosity from SQLAlchemy (optional)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

# Set up SQLAlchemy base and database
Base = declarative_base()
DATABASE_URL = "mysql+pymysql://root:root@localhost/dbmanage"  # adjust if needed
engine = create_engine(DATABASE_URL, echo=False)
Session = sessionmaker(bind=engine)
session = Session()

# -------------------------
# Model Definitions
# -------------------------

# Employee Details Model
class EmployeeDetails(Base):
    __tablename__ = "employee_details"
    __table_args__ = {'extend_existing': True}
    employee_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False)
    domains = Column(Text, nullable=False)
    skills = Column(Text, nullable=False)

# Project Assignment Model (updated to include a foreign key on project_id)
class ProjectAssignment(Base):
    __tablename__ = "project_assignment"
    __table_args__ = {'extend_existing': True}
    employee_id = Column(Integer, ForeignKey("employee_details.employee_id"), primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"), primary_key=True)

# Task Model
class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    project_id = Column(Integer, nullable=False)
    status = Column(Integer, default=0)
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())

# SubTask Model
class SubTask(Base):
    __tablename__ = "subtasks"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)

# Assignment Model (assigning subtasks to employees)
class Assignment(Base):
    __tablename__ = "assignments"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, autoincrement=True)
    subtask_id = Column(Integer, ForeignKey('subtasks.id'), nullable=False)
    employee_id = Column(Integer, ForeignKey('employee_details.employee_id'), nullable=False)
    status = Column(Integer, default=0)
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())

# Milestone Model
class Milestone(Base):
    __tablename__ = "milestones"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    subtask_id = Column(Integer, ForeignKey("subtasks.id"), nullable=False)
    status = Column(Integer, default=0)
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())

# Project Model (defines the projects table)
class Project(Base):
    __tablename__ = "projects"
    project_id = Column(Integer, primary_key=True, autoincrement=True)
    project_name = Column(String, nullable=False)
    project_description = Column(Text)
    # Add any additional columns if needed

# ----------------------------
# Functions for Task Assignment
# ----------------------------

def get_project_assigned_employees(project_id):
    # Get employees assigned to the project but not working on a subtask
    assigned_employees = session.query(EmployeeDetails).join(ProjectAssignment).filter(
        ProjectAssignment.project_id == project_id,
        ~EmployeeDetails.employee_id.in_(
            session.query(Assignment.employee_id)
        )
    ).all()
    return assigned_employees

def get_unassigned_employees():
    unassigned_employees = session.query(EmployeeDetails).filter(
        ~EmployeeDetails.employee_id.in_(session.query(ProjectAssignment.employee_id)),
        ~EmployeeDetails.employee_id.in_(session.query(Assignment.employee_id))
    ).all()
    return unassigned_employees

def get_available_subtasks(project_id):
    subtasks = (
        session.query(SubTask)
        .join(Task, SubTask.task_id == Task.id)
        .filter(
            Task.project_id == project_id,
            ~SubTask.id.in_(session.query(Assignment.subtask_id))
        )
        .all()
    )
    return subtasks

def match_employee_to_subtask(employee, subtask):
    # Matching function based on intersection of employee skills/domains and subtask keywords
    employee_skills = set(employee.skills.lower().split(',')) if employee.skills else set()
    employee_domains = set(employee.domains.lower().split(',')) if employee.domains else set()
    subtask_keywords = set(subtask.name.lower().split())
    score = len(employee_skills & subtask_keywords) + len(employee_domains & subtask_keywords)
    return score

def assign_employees_to_subtasks(project_id):
    # 1. Get employees already assigned to the project and free (not working on any subtask)
    project_employees = session.query(EmployeeDetails).join(ProjectAssignment).filter(
        ProjectAssignment.project_id == project_id,
        ~EmployeeDetails.employee_id.in_(session.query(Assignment.employee_id))
    ).all()

    # 2. If fewer than 3 are available, supplement with unassigned employees.
    if len(project_employees) < 3:
        additional_needed = 3 - len(project_employees)
        extra_employees = get_unassigned_employees()
        project_employees.extend(extra_employees[:additional_needed])
    
    available_employees = project_employees

    # 3. Get available subtasks for the project.
    subtasks = get_available_subtasks(project_id)

    if not available_employees:
        return {"error": "No available employees for assignment"}
    if not subtasks:
        return {"error": "No available subtasks for assignment"}

    assignments = []
    # 4. For each available subtask, find the best-match employee.
    for subtask in subtasks:
        # Compute the match score based on skills and domains.
        employee_matches = [(e, match_employee_to_subtask(e, subtask)) for e in available_employees]
        employee_matches = sorted(employee_matches, key=lambda x: x[1], reverse=True)

        if not employee_matches or employee_matches[0][1] == 0:
            continue  # Skip if no employee meets the criteria

        best_employee = employee_matches[0][0]
        available_employees.remove(best_employee)
        
        # ---- Update the project_assignment table ----
        # Check if the employee is already assigned to this project.
        existing_pa = session.query(ProjectAssignment).filter_by(
            employee_id=best_employee.employee_id,
            project_id=project_id
        ).first()
        if not existing_pa:
            new_project_assignment = ProjectAssignment(
                employee_id=best_employee.employee_id,
                project_id=project_id
            )
            session.add(new_project_assignment)
        
        # Create the subtask assignment for the employee.
        new_assignment = Assignment(
            subtask_id=subtask.id,
            employee_id=best_employee.employee_id
        )
        session.add(new_assignment)
        assignments.append({
            "subtask_id": subtask.id,
            "employee_id": best_employee.employee_id
        })

        if not available_employees:
            break

    session.commit()
    return {"message": "Tasks assigned successfully", "assignments": assignments}

# ----------------------------
# API Endpoint to assign subtasks dynamically
# ----------------------------
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route("/assign_tasks", methods=["POST"])
def assign_tasks():
    try:
        data = request.get_json()
        project_id = data.get("project_id")
        if not project_id:
            return jsonify({"error": "Missing project_id"}), 400

        result = assign_employees_to_subtasks(int(project_id))
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        project_id = int(sys.argv[1])
    else:
        print(json.dumps({"error": "Missing project_id"}))
        sys.exit(1)
    result = assign_employees_to_subtasks(project_id)
    print(json.dumps(result))
