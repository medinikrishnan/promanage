import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FaBars, FaHome, FaFireAlt, FaCommentAlt, FaClipboardList, 
  FaSignOutAlt, FaStar, FaNewspaper, FaProjectDiagram, FaUserCog, 
  FaUsers, FaChartBar, FaTasks, FaClock, FaLink 
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./MakeTeams.css";
import "./ProjectManagerDashboard.css"; // Base styles for sidebar, topbar, etc.
import "./RatingPopup.css";   
import "./UpdateFeed.css";  

const MakeTeams = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [previewText, setPreviewText] = useState(""); // To hold preview JSON (editable)
  const [feedbackText, setFeedbackText] = useState(""); // Chat/feedback input for refining preview
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const [projectId, setProjectId] = useState("");
  const [projectDetails, setProjectDetails] = useState(null);

  const [showUpdateFeed, setShowUpdateFeed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(0);

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get("http://localhost:5000/projects");
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  // (Optional) fetch default project details (unchanged)
  useEffect(() => {
    fetch("http://localhost:5000/api/project_details/1")
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched Data:", data);
        setTasks(data.tasks ?? []);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Toggle Update Feed Popup (for updates)
  const handleToggleUpdateFeed = () => {
    setShowUpdateFeed((prev) => !prev);
  };

  // Toggle Rating Popup for "Rate Us"
  const handleToggleRatingPopup = () => {
    setShowRatingPopup((prev) => !prev);
  };

  // Logout handler: navigate to home page "/"
  const handleLogout = () => {
    navigate("/");
  };

  // Standard task-addition functions remain unchanged
  const addTask = () => {
    // This function may be used in other contexts
    // Not used directly for previewing AI-generated tasks
  };

  const handleProjectSelect = async (project) => {
    setSelectedProject(project);
    setIsLoading(true);

    try {
      // Instead of immediately generating tasks for DB, we call the preview endpoint.
      console.log(`Generating preview for project ID: ${project.project_id}`);
      const response = await axios.get("http://localhost:5000/api/generate-tasks-preview", {
        params: {
          project_id: project.project_id,
          feedback: feedbackText,
        },
        headers: { "Content-Type": "application/json" }
      });
      console.log("Preview Response:", response.data);
      // Assume response.data is a valid JSON object for tasks preview.
      setPreviewText(JSON.stringify(response.data, null, 2)); // Pretty-print for editing
    } catch (error) {
      console.error("Error generating preview:", error);
      setPreviewText("Error generating preview.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler to re-generate preview with updated feedback (chat-like)
  const handleRegeneratePreview = async () => {
    if (!selectedProject) {
      alert("Please select a project first.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/generate-tasks-preview", {
        params: {
          project_id: selectedProject.project_id,
          feedback: feedbackText,
        },
        headers: { "Content-Type": "application/json" }
      });
      console.log("Re-generated Preview Response:", response.data);
      setPreviewText(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error("Error regenerating preview:", error);
      setPreviewText("Error regenerating preview.");
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm tasks (commit to DB)
  const handleConfirmTasks = async () => {
    if (!selectedProject || !previewText) {
      alert("No preview data available.");
      return;
    }
    let tasksPreview;
    try {
      tasksPreview = JSON.parse(previewText);
    } catch (e) {
      alert("Preview JSON is invalid. Please correct it before confirming.");
      return;
    }
    try {
      const response = await axios.post("http://localhost:5000/api/confirm-tasks", {
        project_id: selectedProject.project_id,
        tasks: tasksPreview,
      }, { headers: { "Content-Type": "application/json" }});
      console.log("Task Confirmation Response:", response.data);
      alert(response.data.message || "Tasks confirmed successfully!");
      // Optionally, refresh tasks or project details here.
    } catch (error) {
      console.error("Error confirming tasks:", error);
      alert("Error confirming tasks. Please try again.");
    }
  };

  // (Unchanged) Handler to fetch project details by ID
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

        <div className="content-container">
          {/* -- Project List Section -- */}
          <div className="projects-list-container">
            <h2>Click to Generate Tasks Preview</h2>
            {projects.length === 0 ? (
              <p>No projects available.</p>
            ) : (
              <ul>
                {projects.map((project) => (
                  <li
                    key={project.project_id}
                    className={`project-item-card ${selectedProject && selectedProject.project_id === project.project_id ? "selected" : ""}`}
                    onClick={() => handleProjectSelect(project)}
                  >
                    <strong>{project.project_name}</strong> (ID: {project.project_id})
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Preview & Chat Section */}
          {selectedProject && (
            <div className="preview-chat-section">
              <h2>Tasks Preview for Project: {selectedProject.project_name}</h2>
              {isLoading && <p className="loading-message">Generating preview...</p>}
              
              <div className="feedback-input">
                <label htmlFor="feedback">Enter feedback to refine tasks (optional):</label>
                <textarea
                  id="feedback"
                  placeholder="Your feedback..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
                <button onClick={handleRegeneratePreview}>Regenerate Preview</button>
              </div>

              <div className="preview-editor">
                <label htmlFor="preview">Preview (editable):</label>
                <textarea
                  id="preview"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  rows={15}
                />
              </div>

              <button onClick={handleConfirmTasks} className="confirm-btn">
                Confirm Tasks
              </button>
            </div>
          )}

          {/* -- Form to Fetch Project Details by ID (unchanged) -- */}
          <div className="fetch-project-form">
            <h2>Fetch Project Details</h2>
            <input
              type="number"
              placeholder="Enter Project ID"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
            <button onClick={handleFetchProjectDetails} disabled={fetchingDetails}>
              {fetchingDetails ? "Fetching..." : "Fetch Details"}
            </button>
          </div>

          {/* -- Display Project Details (Tasks, Subtasks, Milestones) -- */}
          {projectDetails && projectDetails.tasks && (
            <div className="project-details">
              <h3>Project Tasks</h3>
              {projectDetails.tasks.length === 0 ? (
                <p>No tasks found.</p>
              ) : (
                <ul>
                  {projectDetails.tasks.map((task) => (
                    <li key={task.id} className="task">
                      <strong>Task: {task.name}</strong>
                      {task.subtasks && task.subtasks.length > 0 ? (
                        <ul className="subtasks">
                          {task.subtasks.map((subtask) => (
                            <li key={subtask.id} className="subtask">
                              ├── <strong>Subtask: {subtask.name}</strong>
                              {subtask.milestones && subtask.milestones.length > 0 ? (
                                <ul className="milestones">
                                  {subtask.milestones.map((milestone) => (
                                    <li key={milestone.id} className="milestone">
                                      ├── 🏆 <strong>Milestone: {milestone.name}</strong> -{" "}
                                      <em>Status: {milestone.status}</em>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p>No milestones for this subtask.</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No subtasks for this task.</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {isLoading && <p className="loading-message">Generating tasks...</p>}
        </div>
      </div>
    </div>
  );
};

export default MakeTeams;
