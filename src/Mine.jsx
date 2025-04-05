import React, { useState, useEffect } from "react";
import { FaStar, FaBars, FaCommentAlt, FaHome, FaProjectDiagram, FaUserCog } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import "./Employee_dashboard.css";

const Mine = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // On mount, retrieve email from location state or localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem("employee_email");
    if (storedEmail) {
      setEmail(storedEmail);
    } else if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);  

  // Automatically fetch data when email is set
  useEffect(() => {
    if (email) {
      const fetchData = async () => {
        setError("");
        setData(null);
        try {
          console.log(`📨 Fetching data for email: ${email}`);
          const res = await fetch(`http://localhost:5000/api/employee-data?email=${encodeURIComponent(email)}`);
          if (!res.ok) {
            throw new Error("Failed to fetch data");
          }
          const result = await res.json();
          console.log("📌 API Response:", result);
          setData(result);
          if (result.employee_id) {
            setEmployeeId(result.employee_id);
          }
        } catch (err) {
          console.error("❌ Fetch Error:", err);
          setError("Could not fetch data for that email.");
        }
      };

      fetchData();
    }
  }, [email]);

  // Navigation functions
  const navigateToFeedback = () => {
    navigate("/feedback-employee", { state: { email } });
  };

  const navigateToEmployeeRating = () => {
    navigate("/employee-rating", { state: { email, employee_id: employeeId } });
  };

  const navigateToMilestones = () => {
    let milestonesData = [];
    if (data && data.projects && data.projects.length > 0) {
      milestonesData = data.projects
        .flatMap((project) => project.tasks)
        .flatMap((task) => task.subtasks)
        .map((subtask) => ({
          subtask_id: subtask.subtask_id,
          subtask_name: subtask.subtask_name,
          milestones: subtask.milestones,
          email: data.email, // Include email if needed
        }));
    } else {
      console.log("No projects data found, navigating with empty milestones");
    }
    console.log("🚀 Navigating to milestones with data:", milestonesData);
    navigate("/milestones", { state: { milestones: milestonesData, email } });
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
          <div className="menu-item" onClick={navigateToMilestones}>
            <FaUserCog className="icon" /> {!isCollapsed && <span>My Milestones</span>}
          </div>
          <div className="menu-item" onClick={navigateToFeedback}>
            <FaCommentAlt className="icon" /> {!isCollapsed && <span>My Feedback</span>}
          </div>
          <div className="menu-item" onClick={navigateToEmployeeRating}>
            <FaStar className="icon" /> {!isCollapsed && <span>Employee Rating</span>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content ${isCollapsed ? "collapsed" : ""}`}>
        <div className="topbar">
          <h2>My Tasks</h2>
        </div>

        <div className="content-container">
          {/* Optionally display the email */}
          <p>Logged in as: {email}</p>

          {/* Display API Error */}
          {error && <p className="error-message">{error}</p>}

          {/* Show Projects, Tasks, Subtasks, Milestones */}
          {data && data.projects && data.projects.length > 0 ? (
            <div className="projects-container">
              <h3>Your Projects</h3>
              <ul>
                {data.projects.map((project) => (
                  <li key={project.project_id} className="project-item">
                    <strong>Project:</strong> {project.project_name}
                    {project.tasks.length > 0 && (
                      <ul>
                        {project.tasks.map((task) => (
                          <li key={task.task_id}>
                            <strong>Task:</strong> {task.task_name}
                            {task.subtasks.length > 0 && (
                              <ul>
                                {task.subtasks.map((sub) => (
                                  <li key={sub.subtask_id}>
                                    <strong>Subtask:</strong> {sub.subtask_name}
                                    {sub.milestones.length > 0 && (
                                      <ul>
                                        {sub.milestones.map((mile) => (
                                          <li key={mile.milestone_id}>
                                            <strong>Milestone:</strong> {mile.milestone_name}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="no-projects">No projects found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mine;
