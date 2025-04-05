import React, { useState, useEffect, useCallback } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend, getEmptyImage } from "react-dnd-html5-backend";
import { FaBars, FaHome, FaClipboardList, FaCommentAlt, FaFireAlt, FaProjectDiagram, FaUserCog, FaUsers, FaChartBar, FaTasks, FaLink } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./ProjectManagerDashboard.css";

// DnD item type.
const ItemType = { EMPLOYEE: "employee" };

// =========================
// Employee (Draggable)
// =========================
const Employee = ({ employee }) => {
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: ItemType.EMPLOYEE,
    item: { employee_id: employee.employee_id, email: employee.email },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  // Use empty image for preview so the original remains visible.
  React.useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return (
    <div
      ref={drag}
      className="employee-card"
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {employee.email}
    </div>
  );
};

// =========================
// EmployeeList (Drop Target)
// =========================
const EmployeeList = ({ employees, moveEmployeeBack }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemType.EMPLOYEE,
    drop: (employee) => moveEmployeeBack(employee),
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));

  return (
    <div
      ref={drop}
      className={`employee-list-container ${isOver ? "dropping" : ""}`}
    >
      <h3 className="employee-list-title">List of Employees</h3>
      {employees.length === 0 ? (
        <p className="no-employees">No available employees</p>
      ) : (
        employees.map((emp) => <Employee key={emp.employee_id} employee={emp} />)
      )}
    </div>
  );
};

// =========================
// ProjectContainer (Drop Target)
// =========================
const ProjectContainer = ({ project, employees, moveEmployee }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemType.EMPLOYEE,
    drop: (item) => moveEmployee(item, project.project_id),
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));

  return (
    <div
      ref={drop}
      className={`project-container ${isOver ? "dropping" : ""}`}
    >
      <strong className="project-title">{project.project_name}</strong>
      {employees.length === 0 ? (
        <p className="no-employees">No employees assigned</p>
      ) : (
        employees.map((emp) => <Employee key={emp.employee_id} employee={emp} />)
      )}
    </div>
  );
};

// =========================
// Main EmployeeAssignment
// =========================
const EmployeeAssignment = () => {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  // Fetch unassigned employees & all projects
  useEffect(() => {
    fetch("http://localhost:5000/api/employees/unassigned")
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.error("Error fetching employees:", err));

    fetch("http://localhost:5000/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch((err) => console.error("Error fetching projects:", err));
  }, []);

  // Move employee onto a project
  const moveEmployee = useCallback((employee, projectId) => {
    console.log("📢 Moving Employee:", employee, "to Project:", projectId);
  
    // 1. Remove them from unassigned employees (only if they are unassigned)
    setEmployees((prev) => prev.filter((emp) => emp.employee_id !== employee.employee_id));
  
    // 2. Add them to the new project, but don't remove them from their old project
    setAssignments((prev) => {
      const updated = { ...prev };
      const currentProjectEmployees = updated[projectId] || [];
  
      // Optional check: if you don’t want duplicates in the same project
      if (!currentProjectEmployees.some((e) => e.employee_id === employee.employee_id)) {
        currentProjectEmployees.push(employee);
      }
      updated[projectId] = currentProjectEmployees;
  
      return updated;
    });
  }, []);
  

  // Move employee back to the unassigned list
  const moveEmployeeBack = useCallback((employee) => {
    setEmployees((prev) => [...prev, employee]);
    setAssignments((prev) => {
      const updated = { ...prev };
      // remove from whichever project they were in
      Object.keys(updated).forEach((projectId) => {
        updated[projectId] = updated[projectId].filter(
          (emp) => emp.employee_id !== employee.employee_id
        );
      });
      return updated;
    });
  }, []);

  // Save assignments to the backend
  const handleFinish = () => {
    console.log("📢 Sending assignments:", assignments);
    if (!assignments || Object.keys(assignments).length === 0) {
      alert("No assignments to submit.");
      return;
    }
    const formattedAssignments = [];
    Object.entries(assignments).forEach(([projectId, empArray]) => {
      if (Array.isArray(empArray)) {
        empArray.forEach((employee) => {
          if (employee && employee.employee_id) {
            formattedAssignments.push({ employee_id: employee.employee_id, project_id: projectId });
          }
        });
      }
    });
    if (formattedAssignments.length === 0) {
      alert("No valid assignments to submit.");
      return;
    }
    fetch("http://localhost:5000/api/assign-employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignments: formattedAssignments }),
    })
      .then((res) => res.json())
      .then(() => alert("Assignments saved!"))
      .catch((err) => console.error("❌ Error saving assignments:", err));
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <button className="toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          <FaBars />
        </button>
        <div className="sidebar-menu">
          <div className="menu-item" onClick={() => navigate("/project_manager_dashboard")}>
            <FaHome className="icon" /> {!isCollapsed && <span>Home</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/addprojects")}>
          <FaProjectDiagram className="icon" /> {!isCollapsed && <span>Add Project</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/add-skills")}>
          <FaUserCog className="icon" /> {!isCollapsed && <span>Add Skills</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/teams")}>
          <FaClipboardList className="icon" /> {!isCollapsed && <span>Generate Tasks</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/progress")}>
          <FaChartBar className="icon" /> {!isCollapsed && <span>Progress</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/taskcard")}>
          <FaTasks className="icon" /> {!isCollapsed && <span>Task Card</span>}
          </div>
                        
          <div className="menu-item" onClick={() => navigate("/myteams")}>
          <FaUsers className="icon" /> {!isCollapsed && <span>Make Teams</span>}
          </div>
        <div className="menu-item" onClick={() => navigate("/feedback")}>
        <FaCommentAlt className="icon" /> {!isCollapsed && <span>Feed Back Deck</span>}
        </div>

        <div className="menu-item" onClick={() => navigate("/burnt-score")}>
        <FaFireAlt className="icon" /> {!isCollapsed && <span>Burnt Score</span>}
        </div>
      </div>
      </div>

      {/* Main Content */}
      <div className={`main-content ${isCollapsed ? "collapsed" : ""}`}>
        <div className="topbar">
          <h2></h2>
        </div>

        <DndProvider backend={HTML5Backend}>
          {/* Container for the DnD lists */}
          <div className="employee-assignment-container">
            <EmployeeList employees={employees} moveEmployeeBack={moveEmployeeBack} />
            <div className="project-grid">
              {projects.map((proj) => (
                <ProjectContainer
                  key={proj.project_id}
                  project={proj}
                  employees={assignments[proj.project_id] || []}
                  moveEmployee={moveEmployee}
                />
              ))}
            </div>
          </div>
          <button onClick={handleFinish} className="finish-btn">
            Finish
          </button>
        </DndProvider>
      </div>
    </div>
  );
};

export default EmployeeAssignment;
