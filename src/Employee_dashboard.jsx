import React, { useState, useEffect } from "react";
import "./Employee_dashboard.css";
import { 
  FaNewspaper, 
  FaSignOutAlt, 
  FaBars, 
  FaHome, 
  FaFlagCheckered, 
  FaStar, 
  FaCommentAlt, 
  FaProjectDiagram,
  FaCheck,
  FaFileWord
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./RatingPopup.css";
import "./UpdateFeed.css";
import "./ProjectManagerDashboard.css";

const EmployeeDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState({ todo: [], inProgress: [], done: [] });
  const [showUpdateFeed, setShowUpdateFeed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(0);
  const [employeeBadge, setEmployeeBadge] = useState(null);

  const navigate = useNavigate();

  const handleGenerateDocumentation = async () => {
    try {
      // Trigger the backend API to generate the documentation
      const response = await fetch("http://localhost:5000/api/generate-doc", { method: "POST" });
      if (response.ok) {
        // The backend has successfully generated the doc
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "DOCUMENTATION.docx"; // Default name of the generated doc
        link.click();
      } else {
        alert("Error generating the documentation.");
      }
    } catch (error) {
      console.error("❌ Error generating documentation:", error);
      alert("Failed to generate documentation. Please try again.");
    }
  };  
  

  // Fetch Kanban tasks from the API.
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

  // Cleanup API: Remove old tasks older than 3 minutes.
  const clearOldTasks = async () => {
    try {
      console.log("🧹 Cleaning old tasks...");
      await fetch("http://localhost:5000/api/kanban-clear-tasks", { method: "DELETE" });
      fetchTasks(); // Refresh the board
    } catch (error) {
      console.error("❌ Error clearing old tasks:", error);
    }
  };

  // Fetch tasks every 5 seconds.
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  // On component mount, fetch the badge assigned to this employee.
  useEffect(() => {
    const employee_email = localStorage.getItem("employee_email");
    console.log("Employee Email from localStorage:", employee_email);
    if (employee_email) {
      fetch(`http://localhost:5000/api/employee-badge?email=${encodeURIComponent(employee_email)}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch employee badge");
          return res.json();
        })
        .then((data) => {
          console.log("Employee badge data:", data);
          setEmployeeBadge(data.badge);
        })
        .catch((err) => {
          console.error("Error fetching employee badge:", err);
          setEmployeeBadge(null);
        });
    }
  }, []);
  
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

  // Submit the rating feedback.
  const handleSubmitRating = () => {
    alert("Feedback sent");
    setShowRatingPopup(false);
    setRating(0);
  };

  // Add a new Kanban task.
  const addTask = async () => {
    if (!taskInput.trim()) return alert("Please enter a task!");
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

  // Drag & Drop Handlers.
  const handleDragStart = (e, taskId, fromColumn) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("fromColumn", fromColumn);
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

  // Handle Check All button click.
  const handleCheckAll = async () => {
    const employee_email = localStorage.getItem("employee_email");
    if (!employee_email) {
      console.error("Employee email not found in localStorage");
      alert("Employee email not found. Please login again.");
      return;
    }
    try {
      console.log("📨 Calling AI Check All API...");
      const res = await fetch("http://localhost:5000/api/ai-check-all-new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_email }),
      });
      if (!res.ok) throw new Error("Failed to perform AI check");
      const data = await res.json();
      console.log("✅ AI Check All completed:", data);
      alert("AI Check Completed:\n" + data.output);
    } catch (error) {
      console.error("❌ Error in Check All:", error);
      alert("Failed to perform AI Check");
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
          <div className="menu-item" onClick={() => navigate("/home-employee")}>
            <FaHome className="icon" /> {!isCollapsed && <span>Home</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/mytasks")}>
            <FaProjectDiagram className="icon" /> {!isCollapsed && <span>My Projects</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/milestones")}>
            <FaFlagCheckered className="icon" /> {!isCollapsed && <span>My Milestones</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/feedback-employee")}>
            <FaCommentAlt className="icon" /> {!isCollapsed && <span>My Feedback</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/employee-rating")}>
            <FaStar className="icon" /> {!isCollapsed && <span>Employee Rating</span>}
          </div>
          <div className="menu-item" onClick={handleGenerateDocumentation}>
            <FaFileWord className="icon" /> {!isCollapsed && <span>Generate Documentation</span>}
          </div>

        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content ${isCollapsed ? "collapsed" : ""}`}>
        {/* Topbar */}
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
            <FaCheck
              className="checkall-icon"
              onClick={handleCheckAll}
              title="Check All"
            />
            <FaSignOutAlt
              className="logout-icon"
              onClick={handleLogout}
              title="Logout"
            />
            {/* Badge display with custom tooltip */}
            {employeeBadge ? (
              <div className="badge-wrapper" style={{ marginLeft: "10px" }}>
                <div className="employee-badge" style={{ cursor: "default" }}>
                  <span style={{ fontSize: "24px" }}>{employeeBadge.icon}</span>
                </div>
                <div className="badge-tooltip">{employeeBadge.name}</div>
              </div>
            ) : (
              <div className="employee-badge" style={{ marginLeft: "10px", fontSize:"12px", color:"#888" }}>
                No Badge Earned Yet
              </div>
            )}
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

        {/* Task Input */}
        <div className="task-input">
          <input
            type="text"
            placeholder="Enter new task..."
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
          />
          <button onClick={addTask}>Add Task</button>
        </div>

        {/* Kanban Board */}
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
                      {task.content}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
