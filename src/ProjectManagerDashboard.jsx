import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend, getEmptyImage } from "react-dnd-html5-backend";
import {
  FaBars,
  FaBolt,
  FaCogs,
  FaHome,
  FaClipboardList,
  FaProjectDiagram,
  FaUserCog,
  FaUsers,
  FaChartBar,
  FaTasks,
  FaCommentAlt,
  FaFireAlt,
  FaNewspaper,
  FaStar,
  FaSignOutAlt,
  FaGamepad,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./ProjectManagerDashboard.css";
import "./RatingPopup.css";
import "./UpdateFeed.css";

const ItemType = { EMPLOYEE: "employee" };

// Draggable Employee Component
const Employee = ({ employee }) => {
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: ItemType.EMPLOYEE,
    item: { employee_id: employee.employee_id, email: employee.email },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return (
    <div
      ref={drag}
      className="employee-card"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {employee.email}
    </div>
  );
};

// EmployeeList (Drop Target)
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

// ProjectContainer (Drop Target)
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

const ProjectManagerDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUpdateFeed, setShowUpdateFeed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(0);
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState({ todo: [], inProgress: [], done: [] });
  const [projects, setProjects] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [projectId, setProjectId] = useState("");
  const [projectDetails, setProjectDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  
  const navigate = useNavigate();

  // Toggle Update Feed popup.
  const handleToggleUpdateFeed = () => {
    setShowUpdateFeed((prev) => !prev);
  };

  // Toggle Rating Popup.
  const handleToggleRatingPopup = () => {
    setShowRatingPopup((prev) => !prev);
  };

  // Logout handler.
  const handleLogout = () => {
    navigate("/");
  };

  
  // Submit the rating feedback (for the popup)
  const handleSubmitRating = () => {
    // In a real application, here you might send the rating to the backend.
    alert("Feedback sent");
    // Reset rating popup state
    setShowRatingPopup(false);
    setRating(0);
  };

  // Fetch tasks from the backend.
  const fetchTasks = async () => {
    try {
      console.log("📡 Fetching tasks from API...");
      const res = await fetch("http://localhost:5000/api/kanban-tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      console.log("✅ Fetched tasks:", data);
      setTasks(data);
    } catch (error) {
      console.error("❌ Error fetching tasks:", error);
    }
  };

  // Clear old tasks (older than 3 minutes) via backend.
  const clearOldTasks = async () => {
    try {
      console.log("🧹 Cleaning old tasks...");
      await fetch("http://localhost:5000/api/kanban-clear-tasks", { method: "DELETE" });
      fetchTasks();
    } catch (error) {
      console.error("❌ Error clearing old tasks:", error);
    }
  };

  // useEffect to fetch tasks every 5 seconds.
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  // useEffect to clear old tasks every 5 seconds.
  useEffect(() => {
    const cleanupInterval = setInterval(clearOldTasks, 5000);
    return () => clearInterval(cleanupInterval);
  }, []);

  // Add a new task by calling the backend API.
  const addTask = async () => {
    if (taskInput.trim() === "") return;
    try {
      console.log(`📨 Sending new task: ${taskInput}`);
      const res = await fetch("http://localhost:5000/api/kanban-add-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: taskInput }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to add task");
      console.log("✅ Task successfully added:", result);
      setTaskInput("");
      fetchTasks();
    } catch (error) {
      console.error("❌ Error adding task:", error);
      alert("Failed to add task. Please try again.");
    }
  };

  // Drag & Drop Handlers for tasks.
  const handleDragStart = (e, taskId, column) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("fromColumn", column);
  };

  const allowDrop = (e) => e.preventDefault();

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const fromColumn = e.dataTransfer.getData("fromColumn");
    if (!taskId || !fromColumn) return;
    try {
      await fetch("http://localhost:5000/api/kanban-update-task", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: targetColumn }),
      });
      console.log(`✅ Task ${taskId} moved from ${fromColumn} to ${targetColumn}`);
      fetchTasks();
    } catch (error) {
      console.error("❌ Error updating task:", error);
    }
  };

  // Fetch projects on mount.
  useEffect(() => {
    axios
      .get("http://localhost:5000/projects")
      .then((response) => setProjects(response.data))
      .catch((error) => console.error("Error fetching projects:", error));
  }, []);

  // Save assignments to the backend.
  const handleFinish = () => {
    console.log("Sending assignments:", assignments);
    if (!assignments || Object.keys(assignments).length === 0) {
      alert("No assignments to submit.");
      return;
    }
    const formattedAssignments = [];
    Object.entries(assignments).forEach(([projId, empArray]) => {
      if (Array.isArray(empArray)) {
        empArray.forEach((employee) => {
          if (employee && employee.employee_id) {
            formattedAssignments.push({
              employee_id: employee.employee_id,
              project_id: projId,
            });
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
      .catch((err) => console.error("Error saving assignments:", err));
  };

  // Fetch project details by ID.
  const handleFetchProjectDetails = async () => {
    if (!projectId) {
      alert("Please enter a valid Project ID");
      return;
    }
    setFetchingDetails(true);
    setProjectDetails(null);
    try {
      const response = await axios.get(`http://localhost:5000/api/project_details/${projectId}`);
      console.log("Project Details Response:", response.data);
      setProjectDetails(response.data);
    } catch (error) {
      console.error("Error fetching project details:", error);
      setProjectDetails(null);
    } finally {
      setFetchingDetails(false);
    }
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
          <div className="menu-item" onClick={() => navigate("/myteams")}>
            <FaUsers className="icon" /> {!isCollapsed && <span>Make Teams</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/feedback")}>
            <FaCommentAlt className="icon" /> {!isCollapsed && <span>Feed Back Deck</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/burnt-score")}>
            <FaFireAlt className="icon" /> {!isCollapsed && <span>Team Health</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/gamify")}>
          <FaGamepad className="icon" />{!isCollapsed && <span>Gamify</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/resource")}>
            <FaCogs className="icon" /> {!isCollapsed && <span>Resource Management</span>} {/* Added Resource Management Button */}
          </div>
          <div className="menu-item" onClick={() =>navigate(`/urgency`)}>
          <FaBolt className="icon" /> {!isCollapsed && <span>Change Managementt</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/guide")}>
          <FaBolt className="icon" /> {!isCollapsed && <span>Coalition</span>}
        </div>

        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content ${isCollapsed ? "collapsed" : ""}`}>
        {/* Topbar with dynamic left margin and width */}
        <div
          className="topbar"
          style={{
            left: isCollapsed ? "80px" : "250px",
            width: isCollapsed ? "calc(100% - 80px)" : "calc(100% - 250px)",
          }}
        >
          <h2 className="topbar-title"></h2>
          <div className="topbar-icons">
            <FaNewspaper
              className="update-icon"
              onClick={handleToggleUpdateFeed}
              title="Update Feed"
            />
            <FaStar
              className="rating-icon"
              onClick={handleToggleRatingPopup}
              title="Rate Us"
            />
            <FaSignOutAlt
              className="logout-icon"
              onClick={handleLogout}
              title="Logout"
            />
          </div>
          <h3>SwiftCollab</h3>
        </div>

        {/* Update Feed Popup */}
        {showUpdateFeed && (
          <div className="update-feed-overlay" onClick={handleToggleUpdateFeed}>
            <div className="update-feed-popup" onClick={(e) => e.stopPropagation()}>
              <div className="popup-content">
                <p><strong>Hi Swift Collaborator,</strong></p>
                <p>
                  We’re thrilled to have you on board as part of this exciting journey.
                  At SwiftCollab, we believe that great teamwork isn't just about task completion—it’s about synergy, shared vision, and mutual growth.
                </p>
                <p>
                  Our platform is designed to bring out the best in every collaborator.
                  Enjoy clear insights into your team’s progress, optimal task allocations, and unique recognition for every contribution.
                </p>
                <p>
                  Have questions? We’re here 24/7 for tutorials, webinars, and expert guidance.
                </p>
                <p><strong>Team SwiftCollab</strong></p>
              </div>
            </div>
          </div>
        )}

        {/* Rating Popup */}
        {showRatingPopup && (
          <div className="rating-popup" onClick={handleToggleRatingPopup}>
            <div className="rating-popup-content" onClick={(e) => e.stopPropagation()}>
              <h3>Rate Us</h3>
              <div className="stars-container">
                {[...Array(5)].map((_, idx) => {
                  const starValue = idx + 1;
                  return (
                    <FaStar
                      key={idx}
                      className={`star ${rating >= starValue ? "active" : ""}`}
                      onClick={() => setRating(starValue)}
                    />
                  );
                })}
              </div>
              <button className="send-feedback-btn" onClick={handleSubmitRating}>
                Send Feedback
              </button>
            </div>
          </div>
        )}

        {/* Kanban Board and Task Input */}
        <div className="kanban-container">
          <div className="task-input">
            <input
              type="text"
              placeholder="Enter new task..."
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
            />
            <button onClick={addTask}>Add Task</button>
          </div>

          <div className="board">
            {["todo", "inProgress", "done"].map((column) => (
              <div
                key={column}
                className="kanban-column"
                onDragOver={allowDrop}
                onDrop={(e) => handleDrop(e, column)}
              >
                <h2>
                  {column === "todo"
                    ? "To Do"
                    : column === "inProgress"
                    ? "In Progress"
                    : "Done"}
                </h2>
                <div className="dropzone">
                  {tasks[column].length === 0 ? (
                    <p className="empty-text">No Tasks</p>
                  ) : (
                    tasks[column].map((task) => (
                      <div
                        key={task.id}
                        className={`task ${column === "done" ? "done-task" : ""}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id, column)}
                      >
                        {column === "done" ? <s>{task.content}</s> : task.content}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectManagerDashboard;
