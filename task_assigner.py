from flask import Flask, request, jsonify
import json
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.sql import func
from datetime import datetime

# Load environment variables
load_dotenv()

# Flask app setup
app = Flask(__name__)

# Database setup
DATABASE_URL = "mysql+pymysql://root:root@localhost/dbmanage"
engine = create_engine(DATABASE_URL, echo=False)  # Disable SQL logging
Session = sessionmaker(bind=engine)
session = Session()

# Base class for models
Base = declarative_base()

class EmployeeDetails(Base):
    __tablename__ = "employee_details"
    employee_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False)
    domains = Column(Text, nullable=False)
    skills = Column(Text, nullable=False)


class ProjectAssignment(Base):
    __tablename__ = "project_assignment"
    employee_id = Column(Integer, ForeignKey("employee_details.employee_id"), primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"), primary_key=True)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    project_id = Column(Integer, nullable=False)  
    status = Column(Integer, default=0)
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())

class SubTask(Base):
    __tablename__ = "subtasks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)  

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    subtask_id = Column(Integer, ForeignKey('subtasks.id'), nullable=False)
    employee_id = Column(Integer, ForeignKey('employee_details.employee_id'), nullable=False)
    status = Column(Integer, default=0)
    createdAt = Column(DateTime, default=func.now())
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now())

# ✅ Get employees assigned to the project but without a subtask
def get_project_assigned_employees(project_id):
    assigned_employees = session.query(EmployeeDetails).join(ProjectAssignment).filter(
        ProjectAssignment.project_id == project_id,
        ~EmployeeDetails.employee_id.in_(
            session.query(Assignment.employee_id)  # Exclude those already assigned subtasks
        )
    ).all()
    return assigned_employees

# ✅ Get employees who are NOT assigned to any project & NOT working on a subtask
def get_unassigned_employees():
    unassigned_employees = session.query(EmployeeDetails).filter(
        ~EmployeeDetails.employee_id.in_(session.query(ProjectAssignment.employee_id)),  # Not assigned to any project
        ~EmployeeDetails.employee_id.in_(session.query(Assignment.employee_id))  # Not working on any subtask
    ).all()
    return unassigned_employees

# ✅ Get available subtasks in a project
def get_available_subtasks(project_id):
    subtasks = (
        session.query(SubTask)
        .join(Task, SubTask.task_id == Task.id)
        .filter(Task.project_id == project_id,
                ~SubTask.id.in_(session.query(Assignment.subtask_id)))  # Only unassigned subtasks
        .all()
    )
    return subtasks

# ✅ Match employee skills/domains with subtask name
def match_employee_to_subtask(employee, subtask):
    employee_skills = set(employee.skills.lower().split(',')) if employee.skills else set()
    employee_domains = set(employee.domains.lower().split(',')) if employee.domains else set()
    subtask_keywords = set(subtask.name.lower().split())  # Extract keywords from subtask name

    skill_match_count = len(employee_skills & subtask_keywords)  
    domain_match_count = len(employee_domains & subtask_keywords)  

    return skill_match_count + domain_match_count  # Higher means better match

def assign_employees_to_subtasks(project_id):
    # 1. Try to get employees assigned to the project (via project_assignment)
    #    who are not currently working on any subtasks (in assignments table).
    project_employees = session.query(EmployeeDetails).join(ProjectAssignment).filter(
        ProjectAssignment.project_id == project_id,
        ~EmployeeDetails.employee_id.in_(session.query(Assignment.employee_id))
    ).all()

    # 2. If no employees are assigned to this project or none are free, fetch all employees
    #    from employee_details who are not working on any subtasks.
    if not project_employees:
        project_employees = session.query(EmployeeDetails).filter(
            ~EmployeeDetails.employee_id.in_(session.query(Assignment.employee_id))
        ).all()

    # 3. If fewer than 3 are available, supplement with additional employees (not in assignments)
    if len(project_employees) < 3:
        additional_needed = 3 - len(project_employees)
        extra_employees = session.query(EmployeeDetails).filter(
            ~EmployeeDetails.employee_id.in_(session.query(Assignment.employee_id))
        ).all()
        # Exclude duplicates
        existing_ids = {emp.employee_id for emp in project_employees}
        for emp in extra_employees:
            if emp.employee_id not in existing_ids and additional_needed > 0:
                project_employees.append(emp)
                additional_needed -= 1

    available_employees = project_employees

    # 4. Get available (unassigned) subtasks for the project.
    subtasks = (
        session.query(SubTask)
        .join(Task, SubTask.task_id == Task.id)
        .filter(Task.project_id == project_id,
                ~SubTask.id.in_(session.query(Assignment.subtask_id)))
        .all()
    )

    if not available_employees:
        return {"error": "No available employees for assignment"}
    if not subtasks:
        return {"error": "No available subtasks for assignment"}

    assignments = []
    for subtask in subtasks:
        # Score available employees based on skill/domain match.
        employee_matches = [(e, match_employee_to_subtask(e, subtask)) for e in available_employees]
        employee_matches = sorted(employee_matches, key=lambda x: x[1], reverse=True)

        # Skip subtask if no employee has any matching skills.
        if not employee_matches or employee_matches[0][1] == 0:
            continue

        best_employee = employee_matches[0][0]
        available_employees.remove(best_employee)
        new_assignment = Assignment(subtask_id=subtask.id, employee_id=best_employee.employee_id)
        session.add(new_assignment)
        assignments.append({"subtask_id": subtask.id, "employee_id": best_employee.employee_id})

        if not available_employees:
            break

    session.commit()
    return {"message": "Tasks assigned successfully", "assignments": assignments}


# ✅ API Endpoint to assign subtasks dynamically
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
    print(json.dumps(result))  # ✅ Output only JSON
